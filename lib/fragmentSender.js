import Raven from 'raven';

import { subscriptions } from '../handler/payloadSubscribe';
import { quickReply, buttonPostback, buttonUrl } from './facebook';
import { pushPrometheus, promMetrics } from './metrics';
import payloadFaq from '../handler/payloadFaq';
import request from 'request-promise-native';
import urls from './urls';

const MEDIA = 'media';
const TEXT = 'text';

const sleep = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const countUpBubble = (subType) => {
    if (!subType) {
        return undefined;
    } else if (subType.includes('Bubble')) {
        return subType.replace(/^\d+/, (match) => Number(match) + 1);
    }
    return subType;
};

export default async (
    chat,
    fragments,
    payload,
    initialMessage = '',
    initialMedia = null,
    sendOptions = undefined
) => {
    const messages = [];

    if (initialMedia) {
        messages.push({ type: MEDIA, content: initialMedia.processed });
    }

    if (initialMessage) {
        messages.push({ type: TEXT, content: initialMessage });
    }

    let button = null;
    if (typeof fragments !== 'undefined' && fragments) {
        fragments.forEach((fragment) => {
            if (fragment.question) {
                button = fragment;
                return;
            }

            if (fragment.attachment) {
                messages.push({ type: MEDIA, content: fragment.attachment.processed });
            }

            if (fragment.text) {
                messages.push({ type: TEXT, content: fragment.text });
            }
        });
    }

    const quizButtons = [];
    const quickReplies = [];
    let buttonNext = null;
    let buttonLink = null;
    let buttonAudio = null;

    if (button) {
        buttonNext = quickReply(
            button.question, {
                action: 'fragment_next',
                fragment: button.id,
                push: payload.push,
                timing: payload.timing,
                report: payload.report,
                type: payload.type,
                quiz: !!payload.quiz,
                link: payload.link,
                preview: payload.preview,
                track: {
                    category: payload.track.category,
                    event: payload.track.event,
                    label: payload.track.label,
                    subType: countUpBubble(payload.track.subType),
                    publicationDate: payload.track.publicationDate,
                },
            });
        quickReplies.push(buttonNext);
    }

    if (payload.audio) {
        buttonAudio = buttonPostback(
            'Jetzt anhören 🎧',
            {
                action: 'report_audio',
                audioUrl: payload.audio,
                push: payload.push,
                timing: payload.timing,
                report: payload.report,
                type: payload.type,
                quiz: !!payload.quiz,
                link: payload.link,
                before: payload.before,
                preview: payload.preview,
                track: {
                    category: payload.track.category,
                    event: payload.track.event,
                    label: payload.track.label,
                    subType: 'Audio',
                    publicationDate: payload.track.publicationDate,
                },
            }
        );
    }

    if (payload.type === 'push') {
        try {
            const params = {
                uri: urls.push(payload.push),
                json: true,
            };
            // Authorize so we can access unpublished items
            if (payload.preview) {
                params.headers = { Authorization: 'Token ' + process.env.CMS_API_TOKEN };
            }
            const push = await request(params);

            const nextReportIndex = push.reports.findIndex((r) => r.id === payload.report) + 1;
            const currentReportIndex = push.reports.findIndex((r) => r.id === payload.report);

            if (!('before' in payload)) {
                if (nextReportIndex > 0 && nextReportIndex < push.reports.length) {
                    quickReplies.push(
                        quickReply(
                            'Nächstes Thema',
                            {
                                action: 'report_start',
                                push: payload.push,
                                timing: payload.timing,
                                report: push.reports[nextReportIndex].id,
                                type: payload.type,
                                preview: payload.preview,
                                track: {
                                    category: payload.track.category,
                                    event: push.reports[nextReportIndex].type === 'last' ?
                                        'Letzte Meldung' :
                                        `${nextReportIndex + 1}.Meldung`,
                                    label: push.reports[nextReportIndex].subtype ?
                                        `${push.reports[nextReportIndex].subtype.title}: ${
                                            push.reports[nextReportIndex].headline
                                        }` :
                                        push.reports[nextReportIndex].headline,
                                    subType: '1.Bubble-Alle',
                                    publicationDate: push.reports[nextReportIndex].published_date,
                                },
                            })
                    );
                } else {
                    quickReplies.push(
                        quickReply(
                            '👋 Und Tschüss',
                            {
                                action: 'push_outro',
                                push: payload.push,
                                timing: payload.timing,
                                preview: payload.preview,
                                track: {
                                    category: payload.track.category,
                                    event: 'Outro',
                                    label: push.link_name ?
                                        `Zum Schluss: ${push.link_name}` :
                                        `Und Tschüss`,
                                    subType: '1.Bubble-Alle',
                                },
                            })
                    );
                }
                if (!buttonNext && payload.quiz) {
                    await makeQuizButtons(quizButtons, push, currentReportIndex, payload, null);
                } else if (!buttonNext && payload.link) {
                    buttonLink = buttonUrl('Mehr 🌍', payload.link);
                }
            } else {
                const readReports = payload.before;
                readReports.push(payload.report);
                if (buttonNext) {
                    const buttonNextPayload = JSON.parse(buttonNext.payload);
                    buttonNextPayload.before = readReports;
                    buttonNext.payload = JSON.stringify(buttonNextPayload);
                } else if (!buttonNext && payload.quiz) {
                    await makeQuizButtons(
                        quizButtons, push, currentReportIndex, payload, readReports);
                } else if (!buttonNext && payload.link) {
                    buttonLink = buttonUrl('Mehr 🌍', payload.link);
                }

                const openReports = [];
                for (const r of push.reports) {
                    if (!readReports.includes(r.id)) {
                        openReports.push(r);
                    }
                }
                if (openReports.length > 0) {
                    const next = openReports.map((r) => {
                        let quickReplyText;
                        if (r.type === 'last') {
                            quickReplyText = `${r.subtype.emoji} ${r.subtype.title}`;
                        } else if (r.short_headline) {
                            quickReplyText = `➡ ${r.short_headline}`;
                        } else {
                            quickReplyText = `➡ ${r.headline}`;
                        }
                        return quickReply(quickReplyText,
                            {
                                action: 'report_start',
                                push: payload.push,
                                timing: payload.timing,
                                report: r.id,
                                type: payload.type,
                                before: readReports,
                                preview: payload.preview,
                                track: {
                                    category: payload.track.category,
                                    event: r.type === 'last' ? 'Letzte Meldung' :
                                        `${push.reports.indexOf(r)+1}.Meldung`,
                                    label: r.subtype ?
                                        `${r.subtype.title}: ${r.headline}` :
                                        r.headline,
                                    subType: `1.Bubble-Quick`,
                                    publicationDate: r.published_date,
                                },
                            },
                        );
                    });
                    quickReplies.push(...next);
                }

                const outroTitle = push.link ? '🏁 Zum Schluss' : '👋 Und Tschüss';
                quickReplies.push(
                    quickReply(
                        outroTitle,
                        {
                            action: 'push_outro',
                            push: payload.push,
                            timing: payload.timing,
                            preview: payload.preview,
                            track: {
                                category: payload.track.category,
                                event: 'Outro',
                                label: push.link_name ?
                                    `Zum Schluss: ${push.link_name}` :
                                    `Und Tschüss`,
                                subType: '1.Bubble-Quick',
                            },
                        })
                );
            }
            const buttons = [ buttonAudio ].concat(quizButtons)
                .concat([ buttonLink ]).filter((e) => !!e).slice(0, 3);

            await sendFragment(chat, messages, quickReplies, buttons, sendOptions);

            promMetrics.activity_push.inc({
                timing: push.timing,
                pushId: push.id,
                reportId: payload.report,
                reportIndex: nextReportIndex - 1,
                isFirstFragment: payload.action === 'report_start',
                isLastFragment: !button,
            });

            pushPrometheus(); // intentionally not waiting for promise!
        } catch (e) {
            console.error('Sending push/fragment failed:', e);
            Raven.captureException(e);
        }
    } else {
        try {
            if (!buttonNext && payload.quiz) {
                const params = {
                    uri: urls.quizByReport(payload.report),
                    json: true,
                };
                // Authorize so we can access unpublished items
                if (payload.preview) {
                    params.headers = { Authorization: 'Token ' + process.env.CMS_API_TOKEN };
                }
                const quiz = await request(params);
                for (const option of quiz) {
                    quizButtons.push(
                        buttonPostback(
                            option.quiz_option,
                            {
                                action: 'quiz_response',
                                option: option.id,
                                report: payload.report,
                                type: 'report',
                                preview: payload.preview,
                                track: {
                                    category: payload.track.category,
                                    event: payload.track.event,
                                    label: payload.track.label,
                                    subType: `QuizOption: ${option.quiz_option}`,
                                    publicationDate: payload.track.publicationDate,
                                },
                            }));
                }
            } else if (!buttonNext && payload.link) {
                buttonLink = buttonUrl('Mehr 🌍', payload.link);
            }

            const buttons = [ buttonAudio ].concat(quizButtons)
                .concat([ buttonLink ]).filter((e) => !!e).slice(0, 3);

            await sendFragment(chat, messages, quickReplies, buttons, sendOptions);
            if (payload.slug === 'onboarding' && quickReplies.length === 0) {
                await subscriptions(chat);
                await sleep(300); // Facebook does not display correct order, thus we wait
                const payload = { action: 'faq', slug: 'onboarding2' };
                await payloadFaq(chat, payload);
            }
        } catch (e) {
            console.log('Sending fragment failed.');
            Raven.captureException(e);
        }
    }
};

const makeQuizButtons = async (buttons, push, reportIndex, payloadBefore, readReports) => {
    const params = {
        uri: urls.quizByReport(push.reports[reportIndex].id),
        json: true,
    };
    // Authorize so we can access unpublished items
    if (payloadBefore.preview) {
        params.headers = { Authorization: 'Token ' + process.env.CMS_API_TOKEN };
    }
    const quiz = await request(params);
    for (const option of quiz) {
        const payload = {
            action: 'quiz_response',
            option: option.id,
            push: push.id,
            timing: push.timing,
            report: push.reports[reportIndex].id,
            type: payloadBefore.type,
            preview: payloadBefore.preview,
            track: {
                category: payloadBefore.track.category,
                event: payloadBefore.track.event,
                label: payloadBefore.track.label,
                subType: `QuizOption: ${option.quiz_option}`,
                publicationDate: payloadBefore.track.publicationDate,
            },
        };
        if (readReports) {
            payload.before = readReports;
        }
        buttons.push(
            buttonPostback(
                option.quiz_option,
                payload));
    }
};

const sendFragment = async (chat, messages, quickReplies, buttons, options) => {
    const errors = [];

    const sendNext = async () => {
        if (messages.length === 0) {
            if (errors.length === 0) {
                return;
            } else {
                // throw first error
                throw errors[0].error;
            }
        }

        const message = messages.shift();
        if (message.type === TEXT && messages.length > 0) {
            try {
                await chat.sendText(message.content, null, options);
            } catch (e) {
                console.error('Error in FragmentSender(text):', e);
                errors.push({ message: 'Sending text failed', error: e });
            }
        } else if (message.type === TEXT) {
            try {
                if (buttons.length) {
                    await chat.sendButtons(message.content, buttons, quickReplies, options);
                } else {
                    await chat.sendText(message.content, quickReplies, options);
                }
            } catch (e) {
                console.error('Error in FragmentSender:', e);
                errors.push({ message: 'Sending last text failed', error: e });
            }
        } else if (message.type === MEDIA) {
            try {
                await chat.sendAttachment(message.content, null, options);
            } catch (e) {
                console.error('Error in FragmentSender:', e);
                errors.push({ message: 'Sending media failed', error: e });
                await chat.sendText('Das kann ich leider nicht finden 🙁 ' +
                    'Und dabei habe ich wirklich überall gesucht 🕵');
            }
        }

        return sendNext();
    };

    return sendNext();
};

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

export default async (chat, fragments, payload, initialMessage = '', initialMedia = null) => {
    const messages = [];

    if (initialMedia) {
        messages.push({ type: MEDIA, content: initialMedia });
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

            if (fragment.media) {
                messages.push({ type: MEDIA, content: fragment.media });
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
                report: payload.report,
                type: payload.type,
                quiz: !!payload.quiz,
                link: payload.link,
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
                report: payload.report,
                type: payload.type,
                quiz: !!payload.quiz,
                link: payload.link,
                before: payload.before,
            }
        );
    }

    if (payload.type === 'push') {
        try {
            const push = await request({
                uri: urls.push(payload.push),
                json: true,
            });

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
                                report: push.reports[nextReportIndex].id,
                                type: payload.type,
                            })
                    );
                } else {
                    quickReplies.push(
                        quickReply(
                            'Reicht jetzt',
                            {
                                action: 'push_outro',
                                push: payload.push,
                            })
                    );
                }
                if (!buttonNext && payload.quiz) {
                    await makeQuizButtons(quizButtons, push, currentReportIndex, payload.type);
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
                        quizButtons, push, currentReportIndex, payload.type, readReports);
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
                    const next = openReports.map((r) =>
                        quickReply(r.short_headline ? '➡ ' + r.short_headline : '➡ ' + r.headline,
                            {
                                action: 'report_start',
                                push: payload.push,
                                report: r.id,
                                type: payload.type,
                                before: readReports,
                            },
                        )
                    );
                    quickReplies.push(...next);
                }

                quickReplies.push(
                    quickReply(
                        'Reicht jetzt',
                        {
                            action: 'push_outro',
                            push: payload.push,
                        })
                );
            }
            const buttons = [ buttonAudio ].concat(quizButtons)
                .concat([ buttonLink ]).filter((e) => !!e).slice(0, 3);

            await sendFragment(chat, messages, quickReplies, buttons);

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
            console.error('Error loading push:', e);
            return chat.sendText('Das kann ich leider nicht finden 🙁 ' +
                'Und dabei habe ich wirklich überall gesucht 🕵');
        }
    } else {
        try {
            if (!buttonNext && payload.quiz) {
                const quiz = await request({
                    uri: urls.quizByReport(payload.report),
                    json: true,
                });
                for (const option of quiz) {
                    quizButtons.push(
                        buttonPostback(
                            option.quiz_option,
                            {
                                action: 'quiz_response',
                                option: option.id,
                                report: payload.report,
                                type: 'report',
                            }));
                }
            } else if (!buttonNext && payload.link) {
                buttonLink = buttonUrl('Mehr 🌍', payload.link);
            }

            const buttons = [ buttonAudio ].concat(quizButtons)
                .concat([ buttonLink ]).filter((e) => !!e).slice(0, 3);

            await sendFragment(chat, messages, quickReplies, buttons);
            if (payload.slug === 'onboarding' && quickReplies.length === 0) {
                await subscriptions(chat);
                await sleep(300); // Facebook does not display correct order, thus we wait
                const payload = { action: 'faq', slug: 'onboarding2' };
                return payloadFaq(chat, payload);
            }
        } catch (e) {
            console.log('Sending fragment failed.');
            throw e;
        }
    }
};

const makeQuizButtons = async (buttons, push, reportIndex, type, readReports) => {
    const quiz = await request({
        uri: urls.quizByReport(push.reports[reportIndex].id),
        json: true,
    });

    for (const option of quiz) {
        const payload = {
            action: 'quiz_response',
            option: option.id,
            push: push.id,
            report: push.reports[reportIndex].id,
            type,
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

const sendFragment = async (chat, messages, quickReplies, buttons) => {
    const errors = [];

    const sendNext = async () => {
        if (messages.length === 0) {
            if (errors.length === 0) {
                return;
            } else {
                throw Error(errors.map((e) => e.message).join('\n'));
            }
        }

        const message = messages.shift();
        if (message.type === TEXT && messages.length > 1) {
            try {
                await chat.sendText(message.content);
            } catch (e) {
                console.error('Error in FragmentSender(text):', e);
                errors.push({ message: 'Sending text failed', error: e });
            }
        } else if (message.type === TEXT) {
            try {
                if (buttons.length) {
                    await chat.sendButtons(message.content, buttons, quickReplies);
                } else {
                    await chat.sendText(message.content, quickReplies);
                }
            } catch (e) {
                console.error('Error in FragmentSender:', e);
                errors.push({ message: 'Sending last text failed', error: e });
            }
        } else if (message.type === MEDIA) {
            try {
                await chat.sendAttachment(message.content);
            } catch (e) {
                console.error('Error in FragmentSender:', e);
                errors.push({ message: 'Sending media failed', error: e });
            }
        }

        return sendNext();
    };

    return sendNext();
};

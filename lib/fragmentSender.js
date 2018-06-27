import { subscriptions } from '../handler/payloadSubscribe';
import { quickReply } from './facebook';
import { pushPrometheus, promMetrics } from './metrics';
import request from 'request-promise-native';
import urls from './urls';

const MEDIA = 'media';
const TEXT = 'text';

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

    const quickReplies = [];
    let buttonNext = null;
    if (button) {
        buttonNext = quickReply(
            button.question, {
                action: 'fragment_next',
                fragment: button.id,
                push: payload.push,
                report: payload.report,
                type: payload.type,
            });
        quickReplies.push(buttonNext);
    }

    if (payload.type === 'push') {
        try {
            const push = await request({
                uri: urls.push(payload.push),
                json: true,
            });

            const nextReportIndex = push.reports.findIndex((r) => r.id === payload.report) + 1;

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
            } else {
                const readReports = payload.before;
                readReports.push(payload.report);
                if (buttonNext) {
                    const buttonNextPayload = JSON.parse(buttonNext.payload);
                    buttonNextPayload.before = readReports;
                    buttonNext.payload = JSON.stringify(buttonNextPayload);
                }
                const openReports = [];
                for (const r of push.reports) {
                    if (!readReports.includes(r.id)) {
                        openReports.push(r);
                    }
                }
                if (openReports.length > 0) {
                    const next = openReports.map((r) =>
                        quickReply(r.headline,
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

            sendFragment(chat, messages, quickReplies);

            promMetrics.activity_push.inc({
                timing: push.timing,
                pushId: push.id,
                reportId: payload.report,
                reportIndex: nextReportIndex -1,
                isFirstFragment: payload.action === 'report_start',
                isLastFragment: !button,
            });

            try {
                return pushPrometheus();
            } catch (err) {
                return console.error('Sending metrics failed:', err);
            }
        } catch (e) {
            console.error('Error loading push:', e);
            return chat.sendText('Das kann ich leider nicht finden 🙁 ' +
                'Und dabei habe ich wirklich überall gesucht 🕵');
        }
    } else {
        try {
            await sendFragment(chat, messages, quickReplies);
            if (payload.slug === 'onboarding' && quickReplies.length === 0) {
                return subscriptions(chat);
            }
        } catch (e) {
            console.log('Sending fragment failed.');
            throw e;
        }
    }
};

const sendFragment = async (chat, messages, quickReplies) => {
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
                errors.push({ message: 'Sending text failed', error: e });
            }
        } else if (message.type === TEXT) {
            try {
                await chat.sendText(message.content, quickReplies);
            } catch (e) {
                errors.push({ message: 'Sending last text failed', error: e });
            }
        } else if (message.type === MEDIA) {
            try {
                await chat.sendAttachment(message.content);
            } catch (e) {
                errors.push({ message: 'Sending media failed', error: e });
            }
        }

        return sendNext();
    };

    return sendNext();
};

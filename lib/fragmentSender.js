const { subscriptions } = require('../handler/payloadSubscribe');
const { quickReply } = require('./facebook');
const { reportCloudWatch } = require('./metrics');

const request = require('request-promise-native');
const urls = require('./urls');

const MEDIA = 'media';
const TEXT = 'text';

module.exports = function(chat, fragments, payload, initialMessage = "", initialMedia = null) {
    const messages = [];

    if (initialMedia) {
        messages.push({type: MEDIA, content: initialMedia});
    }

    if (initialMessage) {
        messages.push({type: TEXT, content: initialMessage});
    }

    let button = null;
    if (typeof fragments !== 'undefined' && fragments) {
        fragments.forEach(fragment => {
            if (fragment.question) {
                button = fragment;
                return;
            }

            if (fragment.media) {
                messages.push({type: MEDIA, content: fragment.media});
            }

            if (fragment.text) {
                messages.push({type: TEXT, content: fragment.text});
            }
        });
    }

    const quickReplies = [];
    if (button) {
        quickReplies.push(
            quickReply(
                button.question,
                {
                    action: 'fragment_next',
                    fragment: button.id,
                    push: payload.push,
                    report: payload.report,
                    type: payload.type,
                })
        );
    }

    if (payload.type === 'push') {
        return request({
            uri: urls.push(payload.push),
            json: true,
        }).then(push => {
            const nextReportIndex = push.reports.findIndex(r => r.id === payload.report) + 1;
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
                        "Reicht jetzt",
                        {
                            action: 'push_outro',
                            push: payload.push,
                        })
                )
            }

            reportCloudWatch('Informant/Activity', 'PushInteraction', {
                timing: push.timing,
                pushId: push.id,
                reportId: payload.report,
                reportIndex: nextReportIndex - 1,
                isFirstFragment: payload.action === 'reportStart',
                isLastFragment: !button,
            });

            return sendFragment(chat, messages, quickReplies);

        }).catch(error => {
            console.log('Error loading push:', error);
            return chat.sendText('Das kann ich leider nicht finden 🙁 ' +
                'Und dabei habe ich wirklich überall gesucht 🕵');
        })
    } else {
        return sendFragment(chat, messages, quickReplies).then(() => {
            if (payload.slug == 'onboarding' && quickReplies.length == 0) {
                return subscriptions(chat);
            }
        }).catch(error => {
            console.log('Sending fragment failed.', error);
        });
    }
};

const sendFragment = function (chat, messages, quickReplies) {
    return new Promise((resolve, reject) => {
        const errors = [];

        const sendNext = () => {

            if (messages.length === 0) {
                if (errors.length === 0) {
                    resolve();
                } else {
                    reject(errors);
                }
                return;
            }

            const message = messages.shift();

            if (message.type === TEXT && messages.length > 1) {
                return chat.sendText(message.content).then(() => {
                    return sendNext();
                }).catch((error) => {
                    errors.push({message: "Sending text failed", error: error});
                    return sendNext();
                });
            } else if (message.type === TEXT) {
                return chat.sendText(message.content, quickReplies).then(() => {
                    return sendNext();
                }).catch((error) => {
                    errors.push({message: "Sending last text failed", error: error});
                    return sendNext();
                });
            } else if (message.type === MEDIA) {
                return chat.sendAttachment(message.content).then(() => {
                    return sendNext();
                }).catch((error) => {
                    errors.push({message: "Sending media failed", error: error});
                    return sendNext();
                });
            }

        };
        return sendNext();
    });
};

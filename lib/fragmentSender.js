const { subscriptions } = require ('../handler/payload_subscribe');
const { quickReply } = require('./facebook');

const request = require('request-promise-native');
const urls = require('./urls');

const MEDIA = 'media';
const TEXT = 'text';

module.exports = function(chat, fragments, payload, initialMessage = "", initialMedia = null) {
    const messages = [];

    if (initialMedia) {
        messages.push({type: MEDIA, content: initialMedia});
    }

    if(initialMessage) {
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

    const quick_replies = [];
    if (button) {
        quick_replies.push(
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
        request({
            uri: urls.push(payload.push),
            json: true,
        }).then(push => {
            const next_report_index = push.reports.findIndex(r => r.id === payload.report) + 1;
            if (next_report_index > 0 && next_report_index < push.reports.length) {
                quick_replies.push(
                    quickReply(
                        'Nächstes Thema', 
                        {
                            action: 'report_start',
                            push: payload.push,
                            report: push.reports[next_report_index].id,
                            type: payload.type,
                        })
                );
            } else {
                quick_replies.push(
                    quickReply(
                        "Reicht jetzt", 
                        {
                            action: 'pushOutro',
                            push: payload.push,
                        })
                )
            }

            send_fragment(chat, messages, quick_replies);
        }).catch(error => {
            console.log('Error loading push:', error);
            chat.sendText('Das kann ich leider nicht finden 🙁 Und dabei habe ich wirklich überall gesucht 🕵');
        })
    } else {
        send_fragment(chat, messages, quick_replies).then(() => {
            if (payload.slug == 'onboarding' && quick_replies.length == 0) {
                subscriptions(chat);
            }
        }).catch(error => {
            console.log('Sending fragment failed.', error);
        });
    }
}

const send_fragment = function (chat, messages, quick_replies) {
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
                chat.sendText(message.content).then(() => {
                    sendNext();
                }).catch((error) => {
                    errors.push({message: "Sending text failed", error: error});
                    sendNext();
                });
            } else if (message.type === TEXT) {
                chat.sendText(message.content, quick_replies).then(() => {
                    sendNext();
                }).catch((error) => {
                    errors.push({message: "Sending last text failed", error: error});
                    sendNext();
                });
            } else if (message.type === MEDIA) {
                chat.sendAttachment(message.content).then(() => {
                    sendNext();
                }).catch((error) => {
                    errors.push({message: "Sending media failed", error: error});
                    sendNext();
                });
            }

        };
        sendNext();
    });
};

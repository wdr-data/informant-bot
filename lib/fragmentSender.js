const { subscriptions } = require ('../handler/payload_subscribe');
const { quickReply } = require('./facebook');

const request = require('request');
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
        request(urls.push(payload.push), (error, res, body) => {
            const push = JSON.parse(body);
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
        })
    } else {
        send_fragment(chat, messages, quick_replies);

        const sendSubs = () => {
            if (payload.slug == 'onboarding') {
                subscriptions(chat);
            }
        }
        sendSubs();
    }
}

const send_fragment = (chat, messages, quick_replies) => {
    console.log('messages: ', messages);
    console.log('quick_replies: ', quick_replies);

    const sendNext = () => {
        if (messages.length > (quick_replies.length > 0 ? 1 : 0)){
            const message = messages.shift();

            if (message.type === TEXT) {
                chat.sendText(message.content).then(() => {
                    sendNext();
                }).catch((error) => {
                    console.log("Sending text failed", error);
                    sendNext();
                });
            } else if (message.type === MEDIA) {
                chat.sendAttachment(message.content).then(() => {
                    sendNext();
                }).catch((error) => {
                    console.log("Sending media failed", error);
                    sendNext();
                });
            }
            return;
        }

        chat.sendText(messages.shift().content, quick_replies);
    };
    sendNext();
};

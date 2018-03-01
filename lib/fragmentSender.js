const { quickReply } = require('./facebook');

const request = require('request');
const urls = require('./urls');

module.exports = function(chat, fragments, payload, initialMessage = "", media = null) {
    const messages = [];
    if(initialMessage) {
        messages.push(initialMessage);
    }

    const images = [];
    if (media) {
        images.push(media);
    }

    let button = null;
    if (typeof fragments !== 'undefined' && fragments) {
        fragments.forEach(fragment => {
            if (fragment.question) {
                button = fragment;
                return;
            }

            messages.push(fragment.text);
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

    if (payload.type == 'push') {
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

            send_fragment(chat, messages, media, quick_replies);
        })
    } else {
        send_fragment(chat, messages, media, quick_replies);
    }
}

const send_fragment = (chat, messages, media, quick_replies) => {
    console.log('messages: ', messages);
    console.log('quick_replies: ', quick_replies);

    const delay = (ms = 100) => setTimeout(() => {
        if (messages.length > (quick_replies.length > 0 ? 1 : 0)){
            if (media) {
                chat.sendAttachment(media);
            }
            chat.sendText(messages.shift());
            delay();
            return;
        }
        if (media) {
            chat.sendAttachment(media);
        }
        chat.sendText(messages.shift(), quick_replies);
    }, ms);
    delay(0);
};

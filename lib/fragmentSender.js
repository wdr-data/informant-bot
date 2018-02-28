const { quickReply } = require('./facebook');

const request = require('request');
const urls = require('./urls');

module.exports = function(chat, fragments, payload, initialMessage = "") {
    const messages = [];
    if(initialMessage) {
        messages.push(initialMessage);
    }

    let button = null;
    fragments.forEach(fragment => {
        if (fragment.question) {
            button = fragment;
            return;
        }

        messages.push(fragment.text);
    });

    const quick_replies = [];
    if (button) {
        quick_replies.push(
            quickReply(
                button.question,
                {
                    action: 'fragment_next',
                    push: payload.push,
                    report: payload.report,
                    fragment: button.id,
                })
        );
    }

    request(urls.push(payload.push), (error, res, body) => {
        const push = JSON.parse(body);
        const next_report_index = push.reports.findIndex(r => r.id === payload.report) + 1;
        if (next_report_index > 0 && next_report_index < push.reports.length) {
            quick_replies.push(
                quickReply(
                    "Nächstes Thema", 
                    {
                        action: 'report_start',
                        push: payload.push,
                        report: push.reports[next_report_index].id,
                    })
            )
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

        console.log('messages:', messages);
        console.log('quick_replies', quick_replies);

        const delay = (ms = 100) => setTimeout(() => {
            if (messages.length > (quick_replies.length > 0 ? 1 : 0)){
                chat.sendText(messages.shift());
                delay();
                return;
            }
            chat.sendText(messages.shift(), quick_replies);
        }, ms);
        delay(0);
    });
};

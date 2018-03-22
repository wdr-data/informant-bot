const request = require('request');
const urls = require('../lib/urls');
const fragmentSender = require('../lib/fragmentSender');

const fragmentNext = (chat, payload) => {
    let url = null;
    if (payload.type === 'push') {
        url = `${urls.reportFragment(payload.fragment)}?withNext=yes`;
    } else if (payload.type === 'faq') {
        url = `${urls.faqFragment(payload.fragment)}?withNext=yes`;
    }

    if (url) {
        request(url, (error, res, body) => {
            let fragment = JSON.parse(body);
            if (fragment.isArray) {
                fragment = fragment[0];
            }

            fragmentSender(chat, fragment.next_fragments, payload, fragment.text, fragment.media);
        });
    }
};

module.exports = fragmentNext;

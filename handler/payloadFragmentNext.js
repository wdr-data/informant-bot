const request = require('request');
const urls = require('../lib/urls');
const fragmentSender = require('../lib/fragmentSender');

const fragmentNext = async (chat, payload) => {
    let url = null;
    if (payload.type === 'push' || payload.type === 'report') {
        url = `${urls.reportFragment(payload.fragment)}?withNext=yes`;
    } else if (payload.type === 'faq') {
        url = `${urls.faqFragment(payload.fragment)}?withNext=yes`;
    }

    if (url) {
        let fragment = await request({ uri: url, json: true });
        if (fragment.isArray) {
            fragment = fragment[0];
        }

        return fragmentSender(
            chat, fragment.next_fragments, payload, fragment.text, fragment.media);
    }
};

module.exports = fragmentNext;

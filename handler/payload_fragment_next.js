const request = require('request');
const urls = require('../lib/urls');
const fragmentSender = require('../lib/fragmentSender');

const fragment_next = (chat, payload) => {
    request(`${urls.reportFragment(payload.fragment)}?withNext=yes`, (error, res, body) => {
        const fragment = JSON.parse(body);

        fragmentSender(chat, fragment.next_fragments, payload, fragment.text);
    });
};

module.exports = fragment_next;

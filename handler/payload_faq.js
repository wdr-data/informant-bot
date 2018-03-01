const request = require('request');
const urls = require('../lib/urls');
const fragmentSender = require('../lib/fragmentSender');

const faq_start = (chat, payload) => {
    const url = `${urls.faqBySlug(payload.slug)}`;

    request(url, (error, res, body) => {
        const faq = JSON.parse(body);
        
        if (typeof faq[0] == 'undefined') {
            chat.sendText(`Dazu habe ich noch keine Info...🤔`);
            return;
        }

        payload.type = payload.action;
        fragmentSender(chat, faq[0].next_fragments, payload, faq[0].text);
    })
};

module.exports = faq_start;

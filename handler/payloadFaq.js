const request = require('request-promise-native');
const urls = require('../lib/urls');
const fragmentSender = require('../lib/fragmentSender');

const faqStart = (chat, payload) => {
    const url = `${urls.faqBySlug(payload.slug)}`;

    return request({ uri: url, json: true }).then( (faq) => {
        if (faq[0] === undefined) {
            chat.sendText(`Dazu habe ich noch keine Info...🤔`);
            return;
        }

        payload.type = payload.action;
        return fragmentSender(chat, faq[0].next_fragments, payload, faq[0].text, faq[0].media);
    });
};

module.exports = faqStart;

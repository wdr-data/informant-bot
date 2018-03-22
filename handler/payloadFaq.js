import request from 'request-promise-native';
import urls from '../lib/urls';
import fragmentSender from '../lib/fragmentSender';

export function payloadFaq(chat, payload) {
    const url = `${urls.faqBySlug(payload.slug)}`;

    return request({ uri: url, json: true }).then( (faq) => {
        if (faq[0] === undefined) {
            chat.sendText(`Dazu habe ich noch keine Info...🤔`);
            return;
        }

        payload.type = payload.action;
        return fragmentSender(chat, faq[0].next_fragments, payload, faq[0].text, faq[0].media);
    });
}

export default payloadFaq;

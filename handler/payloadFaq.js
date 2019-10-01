import request from 'request-promise-native';
import urls from '../lib/urls';
import fragmentSender from '../lib/fragmentSender';

export const FAQ_PREFIX = 'informant';

export default async function(chat, payload) {
    const url = `${urls.faqBySlug(`${FAQ_PREFIX}-${payload.slug}`)}`;

    const faq = await request({ uri: url, json: true });

    if (faq[0] === undefined) {
        return chat.sendText(`Dazu habe ich noch keine Info...🤔`);
    }

    payload.type = payload.action;
    return fragmentSender(chat, faq[0].next_fragments, payload, faq[0].text, faq[0].media);
}

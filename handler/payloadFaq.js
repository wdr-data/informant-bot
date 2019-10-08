import request from 'request-promise-native';
import urls from '../lib/urls';
import fragmentSender from '../lib/fragmentSender';

export const FAQ_PREFIX = 'wdraktuell';

export const getFaq = async function(slug, full = false) {
    const urlgen = full ? urls.fullFaqBySlug : urls.faqBySlug;
    const url = urlgen(`${FAQ_PREFIX}-${slug}`);
    const faqs = await request({ uri: url, json: true });

    if (faqs.length === 0) {
        throw new Error(`Could not find FAQ with slug ${slug}`);
    }

    return faqs[0];
};

export default async function(chat, payload) {
    let faq;
    try {
        faq = await getFaq(payload.slug);
    } catch (e) {
        return chat.sendText(`Dazu habe ich noch keine Info...🤔`);
    }

    payload.type = payload.action;
    return fragmentSender(chat, faq.next_fragments, payload, faq.text, faq.media);
}

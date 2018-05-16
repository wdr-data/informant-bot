import payloadFaq from './payloadFaq';

export default function(slug) {
    const payload = { action: 'faq', slug };
    return function(chat) {
        payloadFaq(chat, payload);
    };
}

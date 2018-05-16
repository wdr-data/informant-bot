import payloadFaq from './payloadFaq';

export default function(slug) {
    const payload = { action: 'faq', slug };
    return (chat) => payloadFaq(chat, payload);
}

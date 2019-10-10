import payloadFaq from './payloadFaq';

export default async function(chat) {
    return payloadFaq(chat, { slug: 'share' });
}

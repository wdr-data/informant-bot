import payloadFaq from './payloadFaq';

export default async (chat, payload) => {
    return payloadFaq(chat, { slug: 'contact'} )
};

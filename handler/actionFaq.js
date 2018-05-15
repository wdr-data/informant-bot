import payloadFaq from './payloadFaq';

export function dataProtection(chat) {
    const payload = { action: 'faq', slug:  'datenschutz' };
    payloadFaq(chat, payload);
    return;
}

export function imprint(chat) {
    const payload = { action: 'faq', slug:  'impressum' };
    payloadFaq(chat, payload);
    return;
}

export function howTo(chat) {
    const payload = { action: 'faq', slug:  'how_to' };
    payloadFaq(chat, payload);
    return;
}

export function about(chat) {
    const payload = { action: 'faq', slug:  'about' };
    payloadFaq(chat, payload);
    return;
}

export function onboarding(chat) {
    const payload = { action: 'faq', slug:  'onboarding' };
    payloadFaq(chat, payload);
    return;
};

export default about;

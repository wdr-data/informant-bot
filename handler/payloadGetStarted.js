import payloadFaq, { getFaq } from './payloadFaq';
import { buttonPostback } from '../lib/facebook';

export default async (chat, payload) => {
    if (payload.ref && await getFaq(payload.ref)) {
        await payloadFaq(chat, { action: 'faq', slug: payload.ref });
    } else {
        await payloadFaq(chat, { action: 'faq', slug: 'greeting_default' });
    }

    const onboarding = await getFaq('onboarding');
    const buttons = [
        buttonPostback(
            '☕ Morgens & 🌙Abends',
            {
                action: 'subscribe',
                subscription: 'morning_and_evening',
            }),
        buttonPostback(
            '☕ Nur Morgens',
            {
                action: 'subscribe',
                subscription: 'morning',
            }),
        buttonPostback(
            '🌙 Nur Abends',
            {
                action: 'subscribe',
                subscription: 'evening',
            }),
    ];

    return chat.sendFullNewsBaseWithButtons(onboarding, buttons);
};

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
            'Morgens ☕ & Abends 🌙',
            {
                action: 'subscribe',
                subscription: 'morning_and_evening',
                replyFaq: 'onboarding_breaking',
                nextStep: 'onboarding_breaking',
            }),
        buttonPostback(
            'Nur Morgens ☕',
            {
                action: 'subscribe',
                subscription: 'morning',
                replyFaq: 'onboarding_breaking',
                nextStep: 'onboarding_breaking',
            }),
        buttonPostback(
            'Nur Abends 🌙',
            {
                action: 'subscribe',
                subscription: 'evening',
                replyFaq: 'onboarding_breaking',
                nextStep: 'onboarding_breaking',
            }),
    ];

    return chat.sendFullNewsBaseWithButtons(onboarding, buttons);
};

export async function onboardingBreaking(chat, payload) {
    const onboardingBreaking = await getFaq(payload.replyFaq);

    const buttons = [
        buttonPostback(
            'Eilmeldungen 🚨',
            {
                action: 'subscribe',
                subscription: 'breaking',
                replyFaq: 'onboarding_analytics',
                nextStep: 'onboarding_analytics',
            }),
        buttonPostback(
            'Nein, Danke',
            {
                action: 'analyticsChoose',
                replyFaq: 'onboarding_analytics',
                nextStep: 'onboarding_analytics',
            }),
    ];

    chat.sendFullNewsBaseWithButtons(onboardingBreaking, buttons);
}

export async function onboardingDataPolicy(chat, payload) {
    chat.sendText('hilfe ist unterwegs');
}

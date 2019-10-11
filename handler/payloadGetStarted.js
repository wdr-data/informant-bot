import { getFaq } from './payloadFaq';
import { buttonPostback } from '../lib/facebook';

export default async (chat, payload) => {
    let greeting;
    if (payload.ref) {
        try {
            greeting = await getFaq(payload.ref, true);
        } catch (e) {
            console.error(`FAQ for referral ${payload.ref} not found!`);
            console.error(e);
            greeting = await getFaq('greeting_default', true);
        }
    } else {
        greeting = await getFaq('greeting_default', true);
    }

    await chat.sendFullNewsBase(greeting);

    const onboarding = await getFaq('onboarding', true);
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
    const onboardingBreaking = await getFaq(payload.replyFaq, true);

    const buttons = [
        buttonPostback(
            'Ja, Eilmeldungen 🚨',
            {
                action: 'subscribe',
                subscription: 'breaking',
                replyFaq: 'onboarding_analytics',
                nextStep: 'onboarding_analytics',
            }),
        buttonPostback(
            'Nein, Danke.',
            {
                action: 'analyticsChoose',
                replyFaq: 'onboarding_analytics',
                nextStep: 'onboarding_analytics',
            }),
    ];

    chat.sendFullNewsBaseWithButtons(onboardingBreaking, buttons);
}

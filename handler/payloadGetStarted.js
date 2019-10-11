import { getFaq } from './payloadFaq';
import { buttonPostback } from '../lib/facebook';

export default async (chat, payload) => {
    let greeting;
    let referral;
    if (payload.ref) {
        try {
            greeting = await getFaq(payload.ref, true);
            referral = payload.ref;
        } catch (e) {
            console.error(`FAQ for referral ${payload.ref} not found!`);
            console.error(e);
            greeting = await getFaq('greeting_default', true);
            referral = 'greeting_default';
        }
    } else {
        greeting = await getFaq('greeting_default', true);
        referral = 'greeting_default';
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
                evening: true,
                morning: true,
                referral,
            }),
        buttonPostback(
            'Nur Morgens ☕',
            {
                action: 'subscribe',
                subscription: 'morning',
                replyFaq: 'onboarding_breaking',
                nextStep: 'onboarding_breaking',
                morning: true,
                referral,
            }),
        buttonPostback(
            'Nur Abends 🌙',
            {
                action: 'subscribe',
                subscription: 'evening',
                replyFaq: 'onboarding_breaking',
                nextStep: 'onboarding_breaking',
                evening: true,
                referral,
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
                morning: payload.morning,
                evening: payload.evening,
                referral: payload.referral,
                breaking: true,
            }),
        buttonPostback(
            'Nein, Danke.',
            {
                action: 'analyticsChoose',
                replyFaq: 'onboarding_analytics',
                nextStep: 'onboarding_analytics',
                morning: payload.morning,
                evening: payload.evening,
                referral: payload.referral,
            }),
    ];

    chat.sendFullNewsBaseWithButtons(onboardingBreaking, buttons);
}

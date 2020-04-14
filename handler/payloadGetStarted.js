import { getFaq } from './payloadFaq';
import { buttonPostback } from '../lib/facebook';

export default async (chat, payload) => {
    let greeting;
    let referral;
    if (payload.ref) {
        try {
            greeting = await getFaq(`greeting_${payload.ref}`, true);
            referral = payload.ref;
        } catch (e) {
            console.error(`FAQ for referral ${payload.ref} not found!`);
            console.error(e);
            greeting = await getFaq('greeting_default', true);
            referral = payload.ref;
        }
    } else {
        greeting = await getFaq('greeting_default', true);
        referral = 'default';
    }

    await chat.sendFullNewsBase(greeting);

    const onboarding = await getFaq('onboarding_when', true);
    const buttons = [
        buttonPostback(
            'Morgens ☕ & Abends 🌙',
            {
                action: 'subscribe',
                subscription: 'morning_and_evening',
                replyFaq: 'onboarding_morning_evening',
                nextStep: 'onboarding_breaking',
                evening: true,
                morning: true,
                category: 'Onboarding',
                referral,
            }),
        buttonPostback(
            'Nur Morgens ☕',
            {
                action: 'subscribe',
                subscription: 'morning',
                replyFaq: 'onboarding_morning',
                nextStep: 'onboarding_breaking',
                morning: true,
                category: 'Onboarding',
                referral,
            }),
        buttonPostback(
            'Nur Abends 🌙',
            {
                action: 'subscribe',
                subscription: 'evening',
                replyFaq: 'onboarding_evening',
                nextStep: 'onboarding_breaking',
                evening: true,
                category: 'Onboarding',
                referral,
            }),
    ];

    return chat.sendFullNewsBaseWithButtons(onboarding, buttons);
};

export async function onboardingBreaking(chat, payload) {
    const faq = await getFaq(payload.replyFaq, true);
    await chat.sendFullNewsBase(faq);

    const onboardingBreaking = await getFaq('onboarding_breaking', true);

    const buttons = [
        buttonPostback(
            'Ja, gerne 🚨',
            {
                action: 'subscribe',
                subscription: 'breaking',
                replyFaq: 'onboarding_breaking_yes',
                nextStep: 'onboarding_analytics',
                morning: payload.morning,
                evening: payload.evening,
                referral: payload.referral,
                category: 'Onboarding',
                breaking: true,
            }),
        buttonPostback(
            'Nein, danke.',
            {
                action: 'analyticsChoose',
                replyFaq: 'onboarding_breaking_no',
                nextStep: 'onboarding_analytics',
                morning: payload.morning,
                evening: payload.evening,
                cateogory: 'Onboarding',
                referral: payload.referral,
            }),
    ];

    chat.sendFullNewsBaseWithButtons(onboardingBreaking, buttons);
}

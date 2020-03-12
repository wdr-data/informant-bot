import { buttonPostback } from '../lib/facebook';
import DynamoDbCrud from '../lib/dynamodbCrud';

import { getFaq } from './payloadFaq';
import actionCurrentNews from './actionCurrentNews';

export async function accept(chat, payload) {
    const tracking = new DynamoDbCrud(process.env.DYNAMODB_TRACKING, 'psid');

    try {
        await tracking.create(chat.psid, { enabled: true });
    } catch (e) {
        await tracking.update(chat.psid, 'enabled', true);
    }

    await chat.loadSettings();

    if (chat.trackingEnabled) {
        if (payload.morning) {
            await chat.track({
                category: 'Onboarding',
                event: 'Einstellungen',
                label: 'Morgen-Push',
                subType: 'Anmelden',
                actionSwitch: 'on',
            });
        }
        if (payload.evening) {
            await chat.track({
                category: 'Onboarding',
                event: 'Einstellungen',
                label: 'Abend-Push',
                subType: 'Anmelden',
                actionSwitch: 'on',
            });
        }
        if (payload.breaking) {
            await chat.track({
                category: 'Onboarding',
                event: 'Einstellungen',
                label: 'Eilmeldungen',
                subType: 'Anmelden',
                actionSwitch: 'on',
            });
        }
        if (payload.referral) {
            await chat.track({
                category: 'Onboarding',
                event: 'Referral',
                label: payload.referral,
            });
        }
    }

    let faq = 'thanks_analytics';
    if (payload.lastStep === 'onboarding_analytics') {
        faq = 'onboarding_analytics_accepted';
    }

    const thanksAnalytics = await getFaq(faq, true);
    await chat.sendFullNewsBase(thanksAnalytics);
}

export async function decline(chat, payload) {
    const tracking = new DynamoDbCrud(process.env.DYNAMODB_TRACKING, 'psid');

    try {
        await tracking.create(chat.psid, { enabled: false });
    } catch (e) {
        await tracking.update(chat.psid, 'enabled', false);
    }

    let faq = 'no_analytics';
    if (payload.lastStep === 'onboarding_analytics') {
        faq = 'onboarding_analytics_declined';
    }

    const noAnalytics = await getFaq(faq, true);
    await chat.sendFullNewsBase(noAnalytics);

    if (payload.nextStep === 'show_news') {
        return actionCurrentNews(chat);
    }
}

export async function choose(chat, payload) {
    if (payload.replyFaq) {
        await chat.sendFullNewsBase(await getFaq(payload.replyFaq, true));
    }

    let faq = 'choose_analytics';
    let nextStep = undefined;
    let lastStep = undefined;
    let category = 'Menüpunkt';

    if (payload.nextStep === 'onboarding_analytics') {
        faq = 'onboarding_analytics';
        lastStep = payload.nextStep;
        nextStep = payload.nextStep;
        category = 'Onboarding';
    }

    const chooseAnalyics = await getFaq(faq, true);

    const buttons = [
        buttonPostback(
            'Ja, ist okay',
            {
                action: 'analyticsAccept',
                nextStep,
                lastStep,
                track: {
                    category,
                    event: 'Einstellungen',
                    label: 'Tracking',
                    subType: 'Aktiviert',
                    actionSwitch: 'on',
                },
                morning: payload.morning,
                evening: payload.evening,
                breaking: payload.breaking,
                referral: payload.referral,

            },
        ),
        buttonPostback(
            'Nein, für mich nicht',
            {
                action: 'analyticsDecline',
                nextStep,
                lastStep,
                track: {
                    category,
                    event: 'Einstellungen',
                    label: 'Tracking',
                    subType: 'Deaktiviert',
                    actionSwitch: 'off',
                },
                morning: payload.morning,
                evening: payload.evening,
                breaking: payload.breaking,
                referral: payload.referral,
            },
        ),
        buttonPostback(
            'Datenschutz',
            {
                action: 'analyticsPolicy',
                nextStep,
                lastStep,
                track: {
                    category,
                    event: 'Messenger-Menü',
                    label: 'Datenschutz',
                },
                morning: payload.morning,
                evening: payload.evening,
                breaking: payload.breaking,
                referral: payload.referral,
            },
        ),
    ];

    return chat.sendFullNewsBaseWithButtons(chooseAnalyics, buttons);
}

export async function policy(chat, payload) {
    if (payload.lastStep === 'onboarding_analytics') {
        payload['nextStep'] = payload.lastStep;
    }

    const dataPolicyFull = await getFaq('analytics_policy_full', true);
    await chat.sendFullNewsBase(dataPolicyFull);

    return choose(chat, payload);
}

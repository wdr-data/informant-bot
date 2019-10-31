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
            await chat.track.event(
                payload.category,
                'subscribed',
                'morning'
            ).send();
        }
        if (payload.evening) {
            await chat.track.event(
                payload.category,
                'subscribed',
                'evening'
            ).send();
        }
        if (payload.breaking) {
            await chat.track.event(
                payload.category,
                'subscribed',
                'breaking'
            ).send();
        }
        if (payload.referral) {
            await chat.track.event(
                payload.category,
                'referral',
                payload.referral
            ).send();
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
    if (chat.trackingEnabled) {
        await chat.track.event('Analytics', 'Denied', chat.language).send();
    }

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
    let category = 'payload';
    let event = 'analytics';

    if (payload.nextStep === 'onboarding_analytics') {
        faq = 'onboarding_analytics';
        lastStep = payload.nextStep;
        nextStep = payload.nextStep;
        category = 'onboarding';
        event = 'analytics';
    }

    const chooseAnalyics = await getFaq(faq, true);

    const buttons = [
        buttonPostback(
            'Ja, ich stimme zu',
            {
                action: 'analyticsAccept',
                nextStep,
                lastStep,
                category,
                event,
                label: 'allowed',
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
                category,
                event,
                label: 'denied',
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
                category,
                event,
                label: 'Datenschutz (Teil 2)',
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
    let nextStep = undefined;
    let lastStep = undefined;
    let category = 'payload';
    let event = 'analytics';

    if (chat.trackingEnabled) {
        await chat.track.event('Analytics', 'Asked for Data Policy', chat.language).send();
    }

    if (payload.nextStep === 'onboarding_analytics') {
        lastStep = payload.nextStep;
        nextStep = payload.nextStep;
        category = 'onboarding',
        event = 'analytics';
    }

    if (payload.lastStep === 'onboarding_analytics') {
        payload['nextStep'] = payload.lastStep;
    }

    const dataPolicy = await getFaq('analytics_policy', true);

    const buttons = [
        buttonPostback(
            'Ja, ist okay',
            {
                action: 'analyticsAccept',
                nextStep,
                lastStep,
                category,
                event,
                label: 'allowed',
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
                category,
                event,
                label: 'denied',
                morning: payload.morning,
                evening: payload.evening,
                breaking: payload.breaking,
                referral: payload.referral,
            },
        ),
        buttonPostback(
            'Alles lesen',
            {
                action: 'analyticsPolicyFull',
                nextStep,
                lastStep,
                category,
                event,
                label: 'Datenschutz (Vollständig)',
                morning: payload.morning,
                evening: payload.evening,
                breaking: payload.breaking,
                referral: payload.referral,
            },
        ),
    ];

    await chat.sendFullNewsBaseWithButtons(dataPolicy, buttons);
}

export async function policyFull(chat, payload) {
    if (chat.trackingEnabled) {
        await chat.track.event('Analytics', 'Read Data Policy', chat.language).send();
    }

    if (payload.lastStep === 'onboarding_analytics') {
        payload['nextStep'] = payload.lastStep;
    }

    const dataPolicyFull = await getFaq('analytics_policy_full', true);
    await chat.sendFullNewsBase(dataPolicyFull);

    return choose(chat, payload);
}

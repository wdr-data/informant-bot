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

    await chat.track.event('Analytics', 'Allowed', chat.language).send();


    let faq = 'thanks_analytics';
    if (payload.lastStep === 'onboarding_analytics') {
        faq = 'onboarding_thanks_analytics';
    }

    const thanksAnalytics = await getFaq(faq, true);
    await chat.sendFullNewsBase(thanksAnalytics);

    if (payload.nextStep === 'show_news') {
        return actionCurrentNews(chat);
    }
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
        faq = 'onboarding_no_analytics';
    }

    const noAnalytics = await getFaq(faq, true);
    await chat.sendFullNewsBase(noAnalytics);

    if (payload.nextStep === 'show_news') {
        return actionCurrentNews(chat);
    }
}

export async function choose(chat, payload) {
    let faq = 'choose_analytics';
    let nextStep = undefined;
    let lastStep = undefined;

    if (payload.nextStep === 'onboarding_analytics') {
        lastStep = payload.nextStep;
        nextStep = 'show_news_not';
    }
    if (payload.replyFaq) {
        faq = payload.replyFaq;
    }
    const chooseAnalyics = await getFaq(faq, true);

    const buttons = [
        buttonPostback(
            'Ja, ich stimme zu',
            {
                action: 'analyticsAccept',
                nextStep,
                lastStep,
            },
        ),
        buttonPostback(
            'Nein, für mich nicht',
            {
                action: 'analyticsDecline',
                nextStep,
                lastStep,
            },
        ),
        buttonPostback(
            'Datenschutz',
            {
                action: 'analyticsPolicy',
                nextStep,
                lastStep,
            },
        ),
    ];

    return chat.sendFullNewsBaseWithButtons(chooseAnalyics, buttons);
}

export async function policy(chat, payload) {
    if (chat.trackingEnabled) {
        await chat.track.event('Analytics', 'Read Data Policy', chat.language).send();
    }

    if (payload.lastStep === 'onboarding_analytics') {
        payload['nextStep'] = payload.lastStep;
    }

    const dataPolicy = await getFaq('data_policy', true);
    await chat.sendFullNewsBase(dataPolicy);

    return choose(chat, payload);
}

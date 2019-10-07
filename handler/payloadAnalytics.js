import { buttonPostback } from '../lib/facebook';
import DynamoDbCrud from '../lib/dynamodbCrud';

import { getFaq } from './payloadFaq';

export async function accept(chat) {
    const tracking = new DynamoDbCrud(process.env.DYNAMODB_TRACKING, 'psid');

    try {
        await tracking.create(chat.psid, { enabled: true });
    } catch (e) {
        await tracking.update(chat.psid, 'enabled', true);
    }

    const thanksAnalytics = await getFaq('thanks_analytics');

    await chat.loadSettings();

    await chat.track.event('Analytics', 'Allowed', chat.language).send();

    return chat.sendFullNewsBase(thanksAnalytics);
}

export async function decline(chat) {
    if (chat.trackingEnabled) {
        await chat.track.event('Analytics', 'Denied', chat.language).send();
    }

    const tracking = new DynamoDbCrud(process.env.DYNAMODB_TRACKING, 'psid');

    try {
        await tracking.create(chat.psid, { enabled: false });
    } catch (e) {
        await tracking.update(chat.psid, 'enabled', false);
    }

    const noAnalytics = await getFaq('no_analytics');
    return chat.sendFullNewsBase(noAnalytics);
}

export async function choose(chat) {
    const chooseAnalyics = await getFaq('choose_analytics');

    const buttons = [
        buttonPostback(
            'Ja, ich stimme zu',
            { action: 'analyticsAccept' },
        ),
        buttonPostback(
            'Ohne Analytics',
            { action: 'analyticsDecline' },
        ),
        buttonPostback(
            'Datenschutz',
            { action: 'analyticsPolicy' },
        ),
    ];

    return chat.sendFullNewsBaseWithButtons(chooseAnalyics, buttons);
}

export async function policy(chat) {
    const dataPolicy = await getFaq('data_policy');

    if (chat.trackingEnabled) {
        await chat.track.event('Analytics', 'Read Data Policy', chat.language).send();
    }

    await chat.sendFullNewsBase(dataPolicy);

    return choose(chat);
}

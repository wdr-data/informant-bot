import { buttonPostback } from '../lib/facebook';
import DynamoDbCrud from '../lib/dynamodbCrud';

import { getFaq } from './payloadFaq';

export async function accept(chat) {
    const tracking = new DynamoDbCrud(process.env.DYNAMODB_TRACKING);

    try {
        await tracking.create(chat.psid, { enabled: true });
    } catch (e) {
        await tracking.update(chat.psid, 'enabled', true);
    }

    const thanksAnalytics = await getFaq('thanksAnalytics');

    await chat.loadSettings();

    await chat.track.event('Analytics', 'Allowed', chat.language).send();

    return chat.sendFragments(thanksAnalytics.fragments);
}

export async function decline(chat) {
    if (chat.trackingEnabled) {
        await chat.track.event('Analytics', 'Denied', chat.language).send();
    }

    const tracking = new DynamoDbCrud(process.env.DYNAMODB_TRACKING);

    try {
        await tracking.create(chat.psid, { enabled: false });
    } catch (e) {
        await tracking.update(chat.psid, 'enabled', false);
    }

    const noAnalytics = await getFaq('noAnalytics');
    return chat.sendFragments(noAnalytics.fragments);
}

export async function choose(chat) {
    const chooseAnalyics = await getFaq('chooseAnalytics');

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

    return chat.sendFragmentsWithButtons(chooseAnalyics.fragments, buttons);
}

export async function policy(chat) {
    const dataPolicy = await getFaq('dataPolicy');

    if (chat.trackingEnabled) {
        await chat.track.event('Analytics', 'Read Data Policy', chat.language).send();
    }

    await chat.sendFragments(dataPolicy.fragments);

    return choose(chat);
}

import ddb from '../lib/dynamodb';
import subscriptions from '../lib/subscriptions';
import DynamoDbCrud from '../lib/dynamodbCrud';
import { Chat, buttonPostback } from '../lib/facebook';
import { getFaq } from '../handler/payloadFaq';

function getSubs(start = null, limit = 25) {
    const params = {
        Limit: limit,
        TableName: process.env.DYNAMODB_SUBSCRIPTIONS,
    };

    if (start) {
        params.ExclusiveStartKey = start;
    }
    return new Promise((resolve, reject) => {
        ddb.scan(params, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve({ subs: data.Items, last: data.LastEvaluatedKey });
        });
    });
}

export const updateBreakingSubscriptions = async (event) => {
    let count = 0;
    let start;
    do {
        const { subs, last } = await getSubs(start);
        start = last;

        if (!subs || !subs.length) {
            break;
        }

        await Promise.all(
            subs.filter(
                (sub) => sub.breaking === undefined
            ).map(
                (sub) => {
                    count += 1;
                    console.log(`${sub.psid}: ${sub.morning || sub.evening}`);
                    return subscriptions.update(sub.psid, 'breaking', sub.morning || sub.evening);
                }
            )
        );
    } while (start);

    return `Done. Updated ${count} subscriptions.`;
};

function scanTracking(start = null, limit = 25) {
    const params = {
        Limit: limit,
        TableName: process.env.DYNAMODB_TRACKING,
    };

    if (start) {
        params.ExclusiveStartKey = start;
    }
    return new Promise((resolve, reject) => {
        ddb.scan(params, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve({ subs: data.Items, last: data.LastEvaluatedKey });
        });
    });
}

async function choose(chat, faq) {
    let category = 'Webtrekk-Consent';

    const buttons = [
        buttonPostback(
            'Ja, ist okay',
            {
                action: 'analyticsAccept',
                track: {
                    category,
                    event: 'Einstellungen',
                    label: 'Tracking',
                    subType: 'Aktiviert',
                    actionSwitch: 'on',
                },
            },
        ),
        buttonPostback(
            'Nein, für mich nicht',
            {
                action: 'analyticsDecline',
                track: {
                    category,
                    event: 'Einstellungen',
                    label: 'Tracking',
                    subType: 'Deaktiviert',
                    actionSwitch: 'off',
                },
            },
        ),
        buttonPostback(
            'Datenschutz',
            {
                action: 'analyticsPolicy',
                track: {
                    category,
                    event: 'Messenger-Menü',
                    label: 'Datenschutz (kurz)',
                },
            },
        ),
    ];

    return chat.sendFullNewsBaseWithButtons(faq, buttons);
}

export const getWebtrekkConsent = async (event) => {
    const trackingItems = [];

    // Scan table
    let start;
    do {
        const { subs: items, last } = await scanTracking(start);
        start = last;

        if (!items || !items.length) {
            break;
        }

        trackingItems.push(...items);
    } while (start);
    console.log(`Scanned table, found ${trackingItems.length} items...`);

    // Clear table
    const tracking = new DynamoDbCrud(process.env.DYNAMODB_TRACKING, 'psid');
    for (const item of trackingItems) {
        await tracking.remove(item.psid);
    }
    console.log('Cleared table.');

    // Message users
    const faq = await getFaq('webtrekk', true);
    const failed = [];
    for (const item of trackingItems.filter((item) => item.enabled)) {
        try {
            const chat = new Chat({ sender: { id: item.psid } });
            await choose(chat, faq);
        } catch (e) {
            console.log(`Failed to send to user with id ${item.psid}`, e);
            failed.push(item.psid);
        }
    }
    console.log(`Notified users. Failed for ${failed.length} PSIDs:`);
    console.log(failed);

    return `Done.`;
};

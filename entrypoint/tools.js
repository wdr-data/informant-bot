import ddb from '../lib/dynamodb';
import subscriptions from '../lib/subscriptions';
import { Chat, buttonPostback } from '../lib/facebook';
import { getFaq } from '../handler/payloadFaq';
import { sleep } from '../lib/utils';

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

function splitArray(input, spacing) {
    const output = [];

    for (let i = 0; i < input.length; i += spacing) {
        output[output.length] = input.slice(i, i + spacing);
    }

    return output;
}

function scanTracking(start = null, limit = 25, old = false) {
    const params = {
        Limit: limit,
    };
    if (old) {
        params.TableName = process.env.DYNAMODB_TRACKING + '-old';
    } else {
        params.TableName = process.env.DYNAMODB_TRACKING;
    }

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

    return chat.sendFullNewsBaseWithButtons(
        faq,
        buttons,
        null,
        {
            timeout: 20000,
            extra: {
                'messaging_type': 'MESSAGE_TAG',
                tag: 'NON_PROMOTIONAL_SUBSCRIPTION',
            },
        },
    );
}

export const getWebtrekkConsent = async (event) => {
    const trackingItemsOld = [];

    // Scan table
    let start;
    do {
        const { subs: items, last } = await scanTracking(start, 25, true);
        start = last;

        if (!items || !items.length) {
            break;
        }

        trackingItemsOld.push(...items);
    } while (start);
    console.log(`Scanned old table, found ${trackingItemsOld.length} items...`);

    // Scan table
    const trackingItemsNew = [];
    start = undefined;
    do {
        const { subs: items, last } = await scanTracking(start);
        start = last;

        if (!items || !items.length) {
            break;
        }

        trackingItemsNew.push(...items);
    } while (start);
    console.log(`Scanned new table, found ${trackingItemsNew.length} items...`);

    // Filter table
    const newPsids = trackingItemsNew.map((item) => item.psid);
    const trackingItems = trackingItemsOld.filter(
        (item) => item.enabled && !newPsids.includes(item.psid)
    );
    console.log(`Found ${trackingItems.length} targets.`);
    console.log(trackingItems);

    // Message users
    const faq = await getFaq('webtrekk', true);
    const failed = [];
    for (const chunk of splitArray(trackingItems, 10)) {
        await Promise.all(chunk.map(async (item) => {
            try {
                const chat = new Chat({ sender: { id: item.psid } });
                await choose(chat, faq);
            } catch (e) {
                console.log(`Failed to send to user with id ${item.psid}`, e);
                failed.push(item.psid);
            }
        }));
        await sleep(1000);
    }
    console.log(`Notified users. Failed for ${failed.length} PSIDs:`);
    console.log(failed);

    return `Done.`;
};

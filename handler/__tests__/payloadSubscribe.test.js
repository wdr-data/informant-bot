const { Expect } = require('../../lib/testing');
const facebook = require('../../lib/facebook');
const payloadSubscribe = require('../payloadSubscribe');

const tableName = process.env.DYNAMODB_SUBSCRIPTIONS;

describe('payloadSubscribe.subscribe', () => {
    // dynamodb: c3a20f370fae4beafdde6af472ff8bf63da9ef9b
    it('replies with the correct text', () => {
        const chat = new facebook.Chat({ sender: { id: '1' } });
        return payloadSubscribe.subscribe(chat, { subscription: 'morning' }).then(() => {
            new Expect(chat)
                .text(`Ich schick dir ab jetzt die Nachrichten, wie du sie bestellt hast. ` +
        `Wenn du die letzte Ausgabe sehen willst, schreib einfach "Leg los"`);
        });
    });

    it('adds a subscription to dynamodb', () => {
        const chat = new facebook.Chat({ sender: { id: '1' } });
        return payloadSubscribe.subscribe(chat, { subscription: 'breaking' }).then(() => {
            new Expect().dynamoPut({
                TableName: tableName,
                Item: {
                    psid: '1',
                    morning: 0,
                    evening: 0,
                    breaking: 1,
                },
                ConditionExpression: 'attribute_not_exists(#idName)',
                ExpressionAttributeNames: {
                    '#idName': 'psid',
                },
            });
        });
    });
});

describe('payloadSubscribe.unsubscribe', () => {
    it('replies with the correct text', async () => {
        const chat = new facebook.Chat({ sender: { id: '1' } });
        await payloadSubscribe.unsubscribe(chat, { subscription: 'morning' });
        new Expect(chat)
            .text(`Schade. Deine Entscheidung. Ich bin hier, wenn Du mich brauchst.`);
    });

    it('removes the subscription from dynamodb', async () => {
        const chat = new facebook.Chat({ sender: { id: '1' } });
        await payloadSubscribe.unsubscribe(chat, { subscription: 'morning' });
        new Expect().dynamoUpdate({
            // 81ae49055beca345b054d6cbf447fa27ac0d47ff
            TableName: tableName,
            Key: {
                psid: '1',
            },
            UpdateExpression: 'SET #key = :value',
            ExpressionAttributeNames: {
                '#key': 'morning',
            },
            ExpressionAttributeValues: {
                ':value': 0,
            },
            ReturnValues: 'ALL_NEW',
        }).dynamoDelete({
            TableName: tableName,
            Key: {
                psid: '1',
            },
        });
    });
});

describe('payload_subscribe.subscriptions', () => {
    it('returns list with current subscriptions to user', async () => {
        const chat = new facebook.Chat({ sender: { id: '2' } });
        await payloadSubscribe.subscriptions(chat);
        new Expect(chat)
            .genericTemplate([
                facebook.genericElement(
                    '❌ Alles',
                    'Deine Infos morgens, abends und bei Eilmeldungen.',
                    facebook.buttonPostback(
                        'Anmelden',
                        {
                            action: 'subscribe',
                            subscription: 'all',
                        }
                    )
                ),
                facebook.genericElement(
                    '✔ Deine Infos am Morgen',
                    'Um 7.30 Uhr gibt\'s Dein erstes Update.',
                    facebook.buttonPostback(
                        'Abmelden',
                        {
                            action: 'unsubscribe',
                            subscription: 'morning',
                        }
                    )
                ),
                facebook.genericElement(
                    '❌ Deine Infos am Abend',
                    'Um 18.30 Uhr kriegst Du das, was am Tag wichtig war.',
                    facebook.buttonPostback(
                        'Anmelden',
                        {
                            action: 'subscribe',
                            subscription: 'evening',
                        }
                    )
                ),
                facebook.genericElement(
                    '❌ Eilmeldungen',
                    'Bei großen Sachen sag ich dir auch zwischendurch Bescheid.',
                    facebook.buttonPostback(
                        'Anmelden',
                        {
                            action: 'subscribe',
                            subscription: 'breaking',
                        }
                    )
                ),
            ]
            );
    });
});

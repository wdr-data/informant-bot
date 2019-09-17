import { buttonPostback, listElement } from '../lib/facebook';
import libSubscriptions from '../lib/subscriptions';

const getHasLabel = async function(chat) {
    const labels = await chat.getLabels();
    return function(labelName) {
        return labels.indexOf(labelName) !== -1;
    };
};

const disableSubscription = async function(psid, timing) {
    try {
        const sub = await libSubscriptions.update(psid, timing, false);
        console.log(`Disabled subscription ${timing} in dynamoDB for ${psid}`);
        if (!sub.morning && !sub.evening) {
            await libSubscriptions.remove(psid);
            console.log(`Deleted User in dynamoDB with psid ${psid}`);
        }
    } catch (error) {
        console.log(`Updating user from dynamoDB failed: ${error}`);
    }
};

const enableSubscription = async function(psid, timing) {
    const item = {
        morning: timing === 'morning',
        evening: timing === 'evening',
    };
    try {
        await libSubscriptions.create(psid, item);
        console.log(`Created in dynamoDB ${psid} with ${timing}`);
    } catch (error) {
        console.log('Creating user in dynamoDB failed: ', error);
        try {
            await libSubscriptions.update(psid, timing, true);
            console.log(`Enabled subscription ${timing} in dynamoDB for ${psid}`);
        } catch (error) {
            console.log('Updating user in dynamoDB failed: ', error);
        }
    }
};

export const subscriptions = async function(chat) {
    const hasLabel = await getHasLabel(chat);

    const elements = [];

    elements.push(listElement(
        (hasLabel('push-morning') && hasLabel('push-evening') ? '✔' : '❌') + ' Beides',
        'Deine Infos morgens und abends.',
        buttonPostback(
            !(hasLabel('push-morning') &&
             hasLabel('push-evening')) ? 'Anmelden' : 'Abmelden',
            {
                action: !(hasLabel('push-morning') && hasLabel('push-evening'))
                    ? 'subscribe'
                    : 'unsubscribe',
                subscription: 'all',
            }
        )
    ));

    elements.push(listElement(
        (hasLabel('push-morning') ? '✔' : '❌') + ' Deine Infos am Morgen',
        'Um 7.30 Uhr gibt\'s Dein erstes Update.',
        buttonPostback(
            !hasLabel('push-morning') ? 'Anmelden' : 'Abmelden',
            {
                action: !hasLabel('push-morning') ? 'subscribe' : 'unsubscribe',
                subscription: 'morning',
            }
        )
    ));

    elements.push(listElement(
        (hasLabel('push-evening') ? '✔' : '❌') + ' Deine Infos am Abend',
        'Um 18.30 Uhr kriegst Du das, was am Tag wichtig war.',
        buttonPostback(
            !hasLabel('push-evening') ? 'Anmelden' : 'Abmelden',
            {
                action: !hasLabel('push-evening') ? 'subscribe' : 'unsubscribe',
                subscription: 'evening',
            }
        )
    ));

    return chat.sendList(elements);
};

export const subscribe = function(chat, payload) {
    const promises = [ chat.addLabel('push-breaking') ];
    if (payload.subscription === 'morning' || payload.subscription === 'all') {
        promises.push(
            chat.addLabel('push-morning'),
            enableSubscription(chat.event.sender.id, 'morning'));
    }
    if (payload.subscription === 'evening' || payload.subscription === 'all') {
        promises.push(
            chat.addLabel('push-evening'),
            enableSubscription(chat.event.sender.id, 'evening'));
    }
    return Promise.all(promises.concat(
        chat.sendText(`Ich schick dir ab jetzt die Nachrichten, wie du sie bestellt hast. ` +
            `Wenn du die letzte Ausgabe sehen willst, schreib einfach "Leg los"`)));
};

export const unsubscribe = async function(chat, payload) {
    const hasLabel = await getHasLabel(chat);
    const promises = [];
    if (payload.subscription === 'morning' || payload.subscription === 'all') {
        promises.push(
            chat.removeLabel('push-morning'),
            disableSubscription(chat.event.sender.id, 'morning'));
    }
    if (payload.subscription === 'evening' || payload.subscription === 'all') {
        promises.push(
            chat.removeLabel('push-evening'),
            disableSubscription(chat.event.sender.id, 'evening'));
    }
    if (
        payload.subscription === 'all' ||
        !hasLabel('push-' + (payload.subscription === 'morning' ? 'evening' : 'morning'))
    ) {
        promises.push(
            chat.removeLabel('push-breaking'));
    }
    return Promise.all(promises.concat(
        chat.sendText(`Schade. Deine Entscheidung. Ich bin hier, wenn Du mich brauchst.`)));
};

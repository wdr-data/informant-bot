import { buttonPostback, genericElement } from '../lib/facebook';
import libSubscriptions from '../lib/subscriptions';

export const disableSubscription = async function(psid, timing) {
    try {
        const sub = await libSubscriptions.update(psid, timing, false);
        console.log(`Disabled subscription ${timing} in dynamoDB for ${psid}`);
        if (!sub.morning && !sub.evening && !sub.breaking) {
            await libSubscriptions.remove(psid);
            console.log(`Deleted User in dynamoDB with psid ${psid}`);
        }
    } catch (error) {
        console.log(`Updating user from dynamoDB failed: ${error}`);
    }
};

export const enableSubscription = async function(psid, timing) {
    const item = {
        morning: timing === 'morning',
        evening: timing === 'evening',
        breaking: timing === 'breaking',
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
    const sub = await libSubscriptions.load(chat.psid)
        || { psid: chat.psid, morning: false, evening: false };

    const elements = [];

    const subbedAll = sub.morning && sub.evening && sub.breaking;

    elements.push(
        genericElement(
            (subbedAll ? '✔' : '❌') + ' Alles',
            'Deine Infos morgens, abends und bei Eilmeldungen.',
            buttonPostback(!subbedAll ? 'Anmelden' : 'Abmelden', {
                action: !subbedAll ? 'subscribe' : 'unsubscribe',
                subscription: 'all',
            })
        )
    );

    elements.push(
        genericElement(
            (sub.morning ? '✔' : '❌') + ' Deine Infos am Morgen ☕',
            "Gegen 7.30 Uhr (9.00 Uhr Sa/So) gibt's Dein erstes Update.",
            buttonPostback(!sub.morning ? 'Anmelden' : 'Abmelden', {
                action: !sub.morning ? 'subscribe' : 'unsubscribe',
                subscription: 'morning',
            })
        )
    );

    elements.push(
        genericElement(
            (sub.evening ? '✔' : '❌') + ' Deine Infos am Abend 🌙',
            'Gegen 18.30 Uhr kriegst Du das, was am Tag wichtig war.',
            buttonPostback(!sub.evening ? 'Anmelden' : 'Abmelden', {
                action: !sub.evening ? 'subscribe' : 'unsubscribe',
                subscription: 'evening',
            })
        )
    );

    elements.push(
        genericElement(
            (sub.breaking ? '✔' : '❌') + ' Eilmeldungen 🚨',
            'Bei großen Sachen sag ich dir auch zwischendurch Bescheid.',
            buttonPostback(!sub.breaking ? 'Anmelden' : 'Abmelden', {
                action: !sub.breaking ? 'subscribe' : 'unsubscribe',
                subscription: 'breaking',
            })
        )
    );

    elements.push(
        genericElement(
            (chat.trackingEnabled ? '✔' : '❌') + ' Analytics 📊',
            'Erlaube uns deine Interaktion mit dem Service anonymisiert auszuwerten.',
            buttonPostback(!chat.trackingEnabled ? 'Einschalten' : 'Ausschalten', {
                action: !chat.trackingEnabled ? 'analyticsAccept' : 'analyticsDecline',
            })
        )
    );

    return chat.sendGenericTemplate(elements);
};

export const subscribe = function(chat, payload) {
    const promises = [];
    if (payload.subscription === 'morning' || payload.subscription === 'all') {
        promises.push(enableSubscription(chat.event.sender.id, 'morning'));
    }
    if (payload.subscription === 'evening' || payload.subscription === 'all') {
        promises.push(enableSubscription(chat.event.sender.id, 'evening'));
    }
    if (payload.subscription === 'morning_and_evening') {
        promises.push(enableSubscription(chat.event.sender.id, 'morning'));
        promises.push(enableSubscription(chat.event.sender.id, 'evening'));
    }
    if (payload.subscription === 'breaking' || payload.subscription === 'all') {
        promises.push(enableSubscription(chat.event.sender.id, 'breaking'));
    }
    return Promise.all(
        promises.concat(
            chat.sendText(
                `Ich schick dir ab jetzt die Nachrichten, wie du sie bestellt hast. ` +
                `Wenn du die letzte Ausgabe sehen willst, schreib einfach "Leg los"`
            )
        )
    );
};

export const unsubscribe = async function(chat, payload) {
    const promises = [];
    if (payload.subscription === 'morning' || payload.subscription === 'all') {
        promises.push(disableSubscription(chat.event.sender.id, 'morning'));
    }
    if (payload.subscription === 'evening' || payload.subscription === 'all') {
        promises.push(disableSubscription(chat.event.sender.id, 'evening'));
    }
    if (payload.subscription === 'breaking' || payload.subscription === 'all') {
        promises.push(disableSubscription(chat.event.sender.id, 'breaking'));
    }
    return Promise.all(
        promises.concat(chat.sendText(
            `Schade. Deine Entscheidung. Ich bin hier, wenn Du mich brauchst.`
        ))
    );
};

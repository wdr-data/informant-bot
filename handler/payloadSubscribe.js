import DynamoDbCrud from '../lib/dynamodbCrud';
import { onboardingBreaking } from './payloadGetStarted';
import { choose as analyticsChoose } from './payloadAnalytics';
import { getFaq, payloadFaq } from './payloadFaq';
import { buttonPostback, genericElement, buttonUrl } from '../lib/facebook';
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
            (subbedAll ? '✔' : '❌') + ' Alle Infos',
            'Deine Infos morgens, abends und bei Eilmeldungen.',
            buttonPostback(!subbedAll ? 'Anmelden' : 'Abmelden', {
                action: !subbedAll ? 'subscribe' : 'unsubscribe',
                subscription: 'all',
                track: {
                    category: 'Menüpunkt',
                    event: 'Einstellungen',
                    label: 'Alle Infos',
                    subType: !subbedAll ? 'Anmelden' : 'Abmelden',
                    actionSwitch: !subbedAll ? 'on' : 'off',
                },
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
                track: {
                    category: 'Menüpunkt',
                    event: 'Einstellungen',
                    label: 'Morgen-Push',
                    subType: !sub.morning ? 'Anmelden' : 'Abmelden',
                    actionSwitch: !sub.morning ? 'on' : 'off',
                },
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
                track: {
                    category: 'Menüpunkt',
                    event: 'Einstellungen',
                    label: 'Abend-Push',
                    subType: !sub.evening ? 'Anmelden' : 'Abmelden',
                    actionSwitch: !sub.evening ? 'on' : 'off',
                },
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
                track: {
                    category: 'Menüpunkt',
                    event: 'Einstellungen',
                    label: 'Eilmeldungen',
                    subType: !sub.breaking ? 'Anmelden' : 'Abmelden',
                    actionSwitch: !sub.breaking ? 'on' : 'off',
                },
            })
        )
    );

    elements.push(
        genericElement(
            (chat.trackingEnabled ? '✔' : '❌') + ' Analytics 📊',
            'Erlaube uns deine Interaktion mit dem Service anonymisiert auszuwerten.',
            buttonPostback(!chat.trackingEnabled ? 'Einschalten' : 'Ausschalten', {
                action: !chat.trackingEnabled ? 'analyticsAccept' : 'analyticsDecline',
                track: {
                    category: 'Menüpunkt',
                    event: 'Einstellungen',
                    label: 'Tracking',
                    subType: !chat.trackingEnabled ? 'Aktiviert' : 'Deaktiviert',
                    actionSwitch: !chat.trackingEnabled ? 'on' : 'off',
                },
            })
        )
    );

    return chat.sendGenericTemplate(elements);
};

export async function subscribe(chat, payload) {
    if (payload.subscription === 'morning' || payload.subscription === 'all') {
        await enableSubscription(chat.event.sender.id, 'morning');
    }
    if (payload.subscription === 'evening' || payload.subscription === 'all') {
        await enableSubscription(chat.event.sender.id, 'evening');
    }
    if (payload.subscription === 'morning_and_evening') {
        await enableSubscription(chat.event.sender.id, 'morning');
        await enableSubscription(chat.event.sender.id, 'evening');
    }
    if (payload.subscription === 'breaking' || payload.subscription === 'all') {
        await enableSubscription(chat.event.sender.id, 'breaking');
    }
    switch (payload.nextStep) {
    case 'onboarding_breaking':
        await onboardingBreaking(chat, payload);
        break;
    case 'onboarding_analytics':
        await analyticsChoose(chat, payload);
    }
    return payloadFaq(chat, { slug: 'subscribed' });
}

export async function unsubscribe(chat, payload) {
    if (payload.subscription === 'morning' || payload.subscription === 'all') {
        await disableSubscription(chat.event.sender.id, 'morning');
    }
    if (payload.subscription === 'evening' || payload.subscription === 'all') {
        await disableSubscription(chat.event.sender.id, 'evening');
    }
    if (payload.subscription === 'breaking' || payload.subscription === 'all') {
        await disableSubscription(chat.event.sender.id, 'breaking');
    }

    if (chat.surveyMode) {
        return payloadFaq(chat, { slug: 'unsubscribed' });
    }
    return startSurvey(chat);
}

export async function startSurvey(chat) {
    const unsubscribedSurvey = await getFaq('unsubscribed-survey', true);
    const surveyLinkButton = buttonUrl('🔗 Ja, klar', process.env.SURVEY_URL);
    const buttonNoRelaxed = buttonPostback(
        'Nein, Danke',
        {
            action: 'faq',
            slug: 'survey-declined',
            track: {
                category: 'Menüpunkt',
                event: 'Einstellungen',
                label: 'Umfrage',
                subType: 'abgelehnt',
            },
        });
    const buttonNoStressed = buttonPostback(
        'Bleib mir bloß weg!',
        {
            action: 'faq',
            slug: 'survey-declined',
            track: {
                category: 'Menüpunkt',
                event: 'Einstellungen',
                label: 'Umfrage',
                subType: 'hart abgelehnt',
            },
        });

    const userStates = new DynamoDbCrud(process.env.DYNAMODB_USERSTATES, 'psid');
    try {
        await userStates.create(chat.psid, { 'surveyTime': Math.floor( Date.now()/1000 ) } );
        console.log('Enable survey mode.');
    } catch (e) {
        await userStates.update(chat.psid, 'surveyTime', Math.floor( Date.now()/1000 ) );
        console.log('Update survey mode');
    }

    return chat.sendButtons(
        unsubscribedSurvey.text,
        [
            surveyLinkButton,
            buttonNoRelaxed,
            buttonNoStressed,
        ],
    );
}

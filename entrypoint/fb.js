import { Chat, guessAttachmentType } from '../lib/facebook';
import { getAttachmentId } from '../lib/facebookAttachments';
import dialogflow from 'dialogflow';
import handler from '../handler';
import Raven from 'raven';
import RavenLambdaWrapper from 'serverless-sentry-lib';
import { contact, feedbackMode, contactWithLink } from '../handler/actionContact';


export const verify = RavenLambdaWrapper.handler(Raven, (event, context, callback) => {
    const params = event.queryStringParameters || {};

    const token = params['hub.verify_token'];
    const challenge = params['hub.challenge'];
    const mode = params['hub.mode'];

    if (mode && token && challenge &&
        mode === 'subscribe' &&
        token === process.env.FB_VERIFYTOKEN
    ) {
        callback(null, {
            statusCode: 200,
            body: challenge,
        });
        return;
    }

    callback(null, {
        statusCode: 400,
        body: 'Parameter missing',
    });
});


// wraps the function handler with extensive error handling
export const message = async (event, context, callback) => {
    let chat = null;
    try {
        const payload = JSON.parse(event.body);

        callback(null, {
            statusCode: 200,
            body: 'works',
        });

        console.log(JSON.stringify(payload, null, 2));

        const msgEvent = payload.entry[0].messaging[0];
        chat = new Chat(msgEvent);
        await chat.loadSettings();

        await handleMessage(event, context, chat, msgEvent);
    } catch (error) {
        console.error('ERROR:', error);
        Raven.captureException(error);

        try {
            if (chat) {
                await chat.sendText('🐞 Da ist was schief gelaufen. ' +
                    'Die Crew ist bereits im Maschinenraum und sucht nach dem Bug!');
            }
        } catch (e) {
            console.error('Reporting error to user failed with:', e);
        }
    }
};

const handleMessage = async (event, context, chat, msgEvent) => {
    let replyPayload;
    if (msgEvent.postback) {
        replyPayload = JSON.parse(msgEvent.postback.payload);
        if (msgEvent.postback.referral) {
            replyPayload['ref'] = msgEvent.postback.referral.ref;
        }
    }

    if ('message' in msgEvent && 'quick_reply' in msgEvent.message) {
        try {
            replyPayload = JSON.parse(msgEvent.message.quick_reply.payload);
        } catch (e) {
            console.error('Parsing of quick reply payload failed:',
                msgEvent.message.quick_reply.payload);
            replyPayload = null;
        }
    }

    if (replyPayload) {
        if (replyPayload.action in handler.payloads) {
            if (replyPayload.track && !replyPayload.preview) {
                chat.track(replyPayload.track);
            }
            return handler.payloads[replyPayload.action](chat, replyPayload);
        }
        return chat.sendText('🐞 Da ist was schief gelaufen. ' +
            'Die Crew ist bereits im Maschinenraum und sucht nach dem Bug!');
    }

    // Someone clicked a referral link but had already started the bot
    if ('referral' in msgEvent && !('message' in msgEvent)) {
        if (msgEvent.referral.ref === 'psid') {
            return chat.sendText(`Deine Page-Specific ID ist \`${chat.psid}\``);
        }
        return;
    }

    let text = '#dontknowwhatthisis';
    if ('text' in msgEvent.message) {
        text = msgEvent.message.text;
    } else if (
        'attachments' in msgEvent.message && msgEvent.message.attachments[0].type === 'image'
    ) {
        if ('sticker_id' in msgEvent.message && msgEvent.message.sticker_id === 369239263222822) {
            text = '#thumbsup';
        } else {
            text = '#cannothandlepicture';
        }
    } else if (
        'attachments' in msgEvent.message && msgEvent.message.attachments[0].type === 'audio'
    ) {
        text = '#thisisanaudio';
    } else if (
        'attachments' in msgEvent.message && msgEvent.message.attachments[0].type === 'fallback'
    ) {
        return contactWithLink(chat);
    } else if (
        'attachments' in msgEvent.message && msgEvent.message.attachments[0].type === 'template'
    ) {
        text = '#lookslikecommercial';
    }

    if (chat.feedbackMode) {
        chat.track({
            category: 'Unterhaltung',
            event: 'Feedback-Modus',
            label: '60 Min Zeitfenster',
        });
        return feedbackMode(chat);
    }
    if (text.length > 70) {
        chat.track({
            category: 'Unterhaltung',
            event: 'Feedback-Modus',
            label: '70 Zeichen',
        });
        return contact(chat);
    }

    switch (text) {
    case '#psid':
        return chat.sendText(`Deine Page-Specific ID ist \`${chat.psid}\``);
    case '#ich':
        return chat.sendText(`Deine Facebook-ID ist \`${chat.psid}\``);
    case '#uuid':
        return chat.sendText(`Deine UUID ist \`${chat.uuid}\``);
    }

    const sessionClient = new dialogflow.SessionsClient({
        /* eslint-disable */
        credentials: require('../.df_id.json') || {},
        /* eslint-enable */
    });
    const sessionPath = sessionClient.sessionPath(process.env.DF_PROJECTID, chat.uuid);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text.slice(0, 255),
                languageCode: 'de-DE',
            },
        },
    };

    const responses = await sessionClient.detectIntent(request);
    console.log('Detected intent');
    const result = responses[0].queryResult;
    console.log(`  Query: ${result.queryText}`);
    console.log(`  Response: ${result.fulfillmentText}`);
    if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
        console.log(`  Parameters: ${JSON.stringify(result.parameters)}`);
        console.log(`  Action: ${result.action}`);
        if (result.action in handler.actions) {
            chat.dialogflowResponse = result.fulfillmentText;
            chat.track({
                category: 'Unterhaltung',
                event: 'Dialogflow',
                label: result.intent.displayName,
                subType: result.action,
            });
            return handler.actions[result.action](chat, result.parameters['fields']);
        }
        chat.track({
            category: 'Unterhaltung',
            event: 'Dialogflow',
            label: result.intent.displayName,
        });
        return chat.sendText(result.fulfillmentText);
    }

    console.log('No intent matched.');
    return chat.sendText(`Da bin ich jetzt überfragt. Kannst Du das anders formulieren?`);
};

export const attachment = RavenLambdaWrapper.handler(Raven, async (event) => {
    const payload = JSON.parse(event.body);
    const url = payload.url;

    const id = await getAttachmentId(url, guessAttachmentType(url));
    return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: id }),
    };
});

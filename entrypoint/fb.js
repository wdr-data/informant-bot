import { Chat, sendBroadcastButtons, guessAttachmentType } from '../lib/facebook';
import { getAttachmentId } from '../lib/facebookAttachments';
import dialogflow from 'dialogflow';
import handler from '../handler';
import getTiming from '../lib/timing';
import { assemblePush, getLatestPush, markSent } from '../lib/pushData';
import Raven from 'raven';
import RavenLambdaWrapper from 'serverless-sentry-lib';


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

export const message = RavenLambdaWrapper.handler(Raven, async (event, context, callback) => {
    const payload = JSON.parse(event.body);

    callback(null, {
        statusCode: 200,
        body: 'works',
    });

    console.log(JSON.stringify(payload, null, 2));

    const msgEvent = payload.entry[0].messaging[0];
    const psid = msgEvent.sender.id;

    const chat = new Chat(msgEvent);

    let replyPayload;
    if (msgEvent.postback) {
        replyPayload = JSON.parse(msgEvent.postback.payload);
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
            handler.payloads[replyPayload.action](chat, replyPayload);
        } else {
            chat.sendText(`Da ist was schief gelaufen.`);
        }
        return;
    }

    let text = '#dontknowwhatthisis';
    if ('text' in msgEvent.message) {
        text = msgEvent.message.text.slice(0, 255);
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
    }

    const sessionClient = new dialogflow.SessionsClient({
        /* eslint-disable */
        credentials: require('../.df_id.json') || {},
        /* eslint-enable */
    });
    const sessionPath = sessionClient.sessionPath(process.env.DF_PROJECTID, psid);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text,
                languageCode: 'de-DE',
            },
        },
    };

    try {
        const responses = await sessionClient.detectIntent(request);
        console.log('Detected intent');
        const result = responses[0].queryResult;
        console.log(`  Query: ${result.queryText}`);
        console.log(`  Response: ${result.fulfillmentText}`);
        if (result.intent) {
            console.log(`  Intent: ${result.intent.displayName}`);
            console.log(`  Action: ${result.action}`);
            if (result.action in handler.actions) {
                handler.actions[result.action](chat, result.parameters['fields']);
            } else {
                return chat.sendText(result.fulfillmentText);
            }
        } else {
            console.log(`  No intent matched.`);
            return chat.sendText(`Da bin ich jetzt überfragt. Kannst Du das anders formulieren?`);
        }
    } catch (e) {
        console.error('ERROR:', e);
        return chat.sendText('Da ist was schief gelaufen.');
    }
});

export const push = RavenLambdaWrapper.handler(Raven, async (event, context, callback) => {
    let timing;
    try {
        timing = getTiming(event);
    } catch (e) {
        callback(null, {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: e.message }),
        });
        return;
    }

    try {
        const push = await getLatestPush(timing, { delivered: 0 });
        const { intro, buttons, quickReplies } = assemblePush(push);
        const message = await sendBroadcastButtons(
            intro, buttons, quickReplies, 'push-' + timing
        );
        await markSent(push.id).catch(() => {});
        console.log('Successfully sent push: ', message);
        callback(null, {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Successfully sent push: ' + message,
            }),
        });
    } catch (e) {
        console.error('Sending push failed: ', e.message);
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: e.message }),
        });
    }
});

export const attachment = RavenLambdaWrapper.handler(Raven, async (event, context, callback) => {
    const payload = JSON.parse(event.body);
    const url = payload.url;

    try {
        const id = await getAttachmentId(url, guessAttachmentType(url));
        callback(null, {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: id }),
        });
    } catch (e) {
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: e.message }),
        });
    }
});

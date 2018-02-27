const facebook = require('../lib/facebook');
const dialogflow = require('dialogflow');
const handler = require('../handler');

module.exports.verify = (event, context, callback) => {
  const params = event.queryStringParameters || {};

  const token = params['hub.verify_token'];
  const challenge = params['hub.challenge'];
  const mode = params['hub.mode'];

  console.log("ENV", process.env);

  if ((mode && token && challenge) &&
      (mode === 'subscribe') &&
      (token === process.env.FB_VERIFYTOKEN)
     ) {
    callback(null, {
      statusCode: 200,
      body: challenge,
    });
    return;
  }

  callback(null, {
    statusCode: 400,
    body: 'Parameter missing'
  });
};

module.exports.message = (event, context, callback) => {
  const payload = JSON.parse(event.body);
  console.log(payload);
  callback(null, {
    statusCode: 200,
    body: 'works',
  });
  const msgEvent = payload.entry[0].messaging[0];
  const psid = msgEvent.sender.id;
  console.log(psid);

  const chat = new facebook.Chat(msgEvent);

  let replyPayload;
  if (msgEvent.postback) {
    replyPayload = JSON.parse(msgEvent.postback.payload);
  }

  if ('message' in msgEvent && 'quick_reply' in msgEvent.message) {
    try {
      replyPayload = JSON.parse(msgEvent.message.quick_reply.payload);
    } catch(e) {
      console.error("Parsing of quick reply payload failed:", msgEvent.message.quick_reply.payload);
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

  const text = msgEvent.message.text;

  const sessionClient = new dialogflow.SessionsClient({
    keyFilename: '.df_id.json'
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

  sessionClient
  .detectIntent(request)
  .then(responses => {
    console.log('Detected intent');
    const result = responses[0].queryResult;
    console.log(`  Query: ${result.queryText}`);
    console.log(`  Response: ${result.fulfillmentText}`);
    if (result.intent) {
      console.log(`  Intent: ${result.intent.displayName}`);
      console.log(`  Action: ${result.action}`);
      if (result.action in handler.actions) {
          handler.actions[result.action](chat);
      } else {
        chat.sendText(result.fulfillmentText);
      }
    } else {
      console.log(`  No intent matched.`);
      chat.sendText(`Da bin ich jetzt überfragt. Kannst Du das anders formulieren?`)
    }
  })
  .catch(err => {
    console.error('ERROR:', err);
    chat.sendText('Da ist was schief gelaufen.');
  });
};

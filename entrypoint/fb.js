const facebook = require('../lib/facebook');
const { getAttachmentId } = require('../lib/facebookAttachments');
const dialogflow = require('dialogflow');
const handler = require('../handler');
const getTiming = require('../lib/timing');
const { assemblePush, getLatestPush, markSent } = require('../lib/pushData');


module.exports.verify = (event, context, callback) => {
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
    body: 'Parameter missing'
  });
};

module.exports.message = (event, context, callback) => {
  const payload = JSON.parse(event.body);

  callback(null, {
    statusCode: 200,
    body: 'works',
  });

  console.log(JSON.stringify(payload, null, 2));

  const msgEvent = payload.entry[0].messaging[0];
  const psid = msgEvent.sender.id;

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

module.exports.push = (event, context, callback) => {
  let timing;
  try {
    timing = getTiming(event);
  } catch(e) {
    callback(null, {
      statusCode: 400,
      body: JSON.stringify({success: false, message: e.message}),
    });
    return;
  }

  getLatestPush(timing, { delivered: 0 })
    .then(push => {
      const { intro, button } = assemblePush(push);
      return Promise.all([
          facebook.sendBroadcastButtons(intro, [button], 'push-' + timing),
          Promise.resolve(push)
      ]);
    })
    .then(([message, push]) =>  {
        markSent(push.id).catch(() => {});
        console.log("Successfully sent push: ", message);
        callback(null, {
            statusCode: 200,
            body: JSON.stringify({success: true, message: "Successfully sent push: " + message}),
        });
    })
    .catch(error => {
      console.log("Sending push failed: ", JSON.stringify(error, null, 2));
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({success: false, message: error.message}),
      });
    });
};

module.exports.attachment = (event, context, callback) => {
  const payload = JSON.parse(event.body);
  const url = payload.url;

  getAttachmentId(url, facebook.guessAttachmentType(url)).then(id => {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({success: true, message: id}),
    });
  }).catch(error => {
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({success: false, message: error}),
    });
  });
};

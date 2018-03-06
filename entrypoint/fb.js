const facebook = require('../lib/facebook');
const { getAttachmentId } = require('../lib/facebookAttachments');
const dialogflow = require('dialogflow');
const handler = require('../handler');
const request = require('request-promise-native');
const moment = require('moment-timezone');
const { pushes } = require('../lib/urls');


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

module.exports.push = (event, context, callback = console.log) => {
  let timing = null;

  if ('timing' in event) {
    timing = event.timing;

    // Confirm that this is the cron job for the current DST state
    const currentHour = moment.tz('Europe/Berlin').hour();
    if (timing === 'morning' && currentHour !== 7 ||
        timing === 'evening' && currentHour !== 18) {
      console.log("Wrong cron job for current local time");
      return;
    }
  } else if (event.queryStringParameters && 'timing' in event.queryStringParameters) {
    timing = event.queryStringParameters.timing;
  } else {
    callback(null, {
      statusCode: 400,
      body: JSON.stringify({success: false, message: "Missing parameter 'timing'"}),
    });
    return;
  }

  const today = new Date();
  const isoDate = today.toISOString().split('T')[0];

  request.get({uri: pushes, json: true, qs: {timing: timing, pub_date: isoDate, limit: 1}}).then(data => {
    console.log(data);

    if (data.results.length === 0) {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({success: false, message: "No Push found"}),
      });
      return;
    }

    const push = data.results[0];

    const introHeadlines = push.intro.concat("\n").concat(push.reports.map(r => "➡ ".concat(r.headline)).join('\n'));
    const firstReport = push.reports[0];
    const button = facebook.buttonPostback(
      'Leg los',
      {
        action: 'report_start',
        push: push.id,
        report: firstReport.id,
        type: 'push',
      });
    facebook.sendBroadcastButtons(introHeadlines, [button], 'push-' + timing).then(message => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({success: true, message: "Successfully sent push: " + message}),
      })
    }).catch(message => {
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({success: false, message: "Sending push failed: " + message}),
      })
    });
  }).catch(error => {
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({success: false, message: "Querying push failed: " + error}),
    })
  })
};

module.exports.attachment = (event, context, callback) => {
  const payload = JSON.parse(event.body);
  console.log(payload);
  const url = payload.url;

  getAttachmentId(url, null).then(id => {
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
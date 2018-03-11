const facebook = require('../lib/facebook');
const { getAttachmentId } = require('../lib/facebookAttachments');
const dialogflow = require('dialogflow');
const handler = require('../handler');
const request = require('request-promise-native');
const moment = require('moment-timezone');
const urls = require('../lib/urls');


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
  let timing = null;

  if ('timing' in event) {
    timing = event.timing;

    // Confirm that this is the cron job for the current DST state
    const currentTime = moment.tz('Europe/Berlin');

    const currentDay = currentTime.isoWeekday();  // 1 = Monday, 7 = Sunday

    let expectedTime = null;

    if (timing === 'morning' && 1 <= currentDay <= 5) {
      expectedTime = moment(currentTime).hour(7).minute(30);
    } else if (timing === 'morning' && 6 <= currentDay <= 7) {
      expectedTime = moment(currentTime).hour(9).minute(0);
    } else if (timing === 'evening') {
      expectedTime = moment(currentTime).hour(18).minute(30);
    }

    console.log('Current time: ', currentTime);
    console.log('Expected time:', expectedTime);

    if (expectedTime &&
        !currentTime.isBetween(moment(expectedTime).subtract(5, 'minutes'),
                               moment(expectedTime).add(5, 'minutes'))
    ) {
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

  request.get({uri: urls.pushes, json: true, qs: {timing: timing, pub_date: isoDate, limit: 1}}).then(data => {
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
      request.patch({
        uri: urls.push(push.id),
        json: true,
        body: {delivered: true},
        headers: {Authorization: 'Token ' + process.env.CMS_API_TOKEN}
      }).then(response => {
        console.log(`Updated push ${push.id} to delivered`, response);
      }).catch(error => {
        console.log(`Failed to update push ${push.id} to delivered`, error);
      });

      console.log("Successfully sent push: ", message);
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({success: true, message: "Successfully sent push: " + message}),
      })
    }).catch(message => {
      console.log("Sending push failed: ", JSON.stringify(message, null, 2));
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({success: false, message: "Sending push failed: " + message}),
      })
    });
  }).catch(error => {
    console.log("Querying push failed: ", JSON.stringify(error, null, 2));
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

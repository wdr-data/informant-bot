const fbLibInit = require('../lib/facebook');
const fbLib = fbLibInit();
const dialogflow = require('dialogflow');

module.exports.verify = (event, context, callback) => {
  const params = event.queryStringParameters || {};

  const token = params['hub.verify_token'];
  const challenge = params['hub.challenge'];
  const mode = params['hub.mode'];

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

  const text = payload.entry[0].messaging[0].message.text;
  const psid = payload.entry[0].messaging[0].sender.id;
  
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
      if (result.action === 'current_time') {
          current_time(psid);
      } else {
        fbLib.sendTextMessage(psid, result.fulfillmentText);
      }
    } else {
      console.log(`  No intent matched.`);
      fbLib.sendTextMessage(psid, `Da bin ich jetzt überfragt. Kannst Du das anders formulieren?`)
    }
  })
  .catch(err => {
    console.error('ERROR:', err);
    fbLib.sendTextMessage(psid, `Da ist was schief gelaufen.`)
  });
  console.log(text);
  console.log(psid);
}

const current_time = (psid) => {
    const currentdate = new Date();
    const time = currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds();
    fbLib.sendTextMessage(psid, `Die exakte Uhrzeit lautet: ${time}`)
}
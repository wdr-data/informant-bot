const fbLibInit = require('../lib/facebook');
const fbLib = fbLibInit();

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
  fbLib.sendTextMessage(psid, `Und Du so zu mir: ${text}` )
  console.log(text);
  console.log(psid);
}
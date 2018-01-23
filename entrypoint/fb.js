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
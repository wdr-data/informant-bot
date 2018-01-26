const Messenger = require('fb-messenger');

module.exports = function () {
  return new Messenger(process.env.FB_PAGETOKEN);
};

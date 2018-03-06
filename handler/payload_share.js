const { buttonShare } = require('../lib/facebook');

module.exports = function (chat) {
  chat.sendButtons('Jetzt den 1Live Informaten testen 😎', [buttonShare()])
};
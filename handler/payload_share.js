const { buttonShare, buttonUrl, genericElement } = require('../lib/facebook');

module.exports = function (chat) {
  const text = 'Teile den Informanten mit deinen Freunden!';
  const title = 'Jetzt den 1LIVE Informanten testen 😎';
  const subtitle = 'Erhalte 1LIVE News im Facebook Messenger';

  const callToAction = 'Jetzt Kontakt aufnehmen';
  const informantUrl = 'https://www.m.me/1LIVE.Informant';

  const sharedContent = [genericElement(title, subtitle, null, [buttonUrl(callToAction, informantUrl)])];
  chat.sendButtons(text, [buttonShare(sharedContent)]);
};
const { buttonPostback, listElement } = require('../lib/facebook');
const subscriptions = require('../lib/subscriptions');

const getHasLabel = function(chat) {
  return chat.getLabels().then(
    (labels) => (labelName) => labels.indexOf(labelName) !== -1
  );
};

const disableSubscription = function(psid, timing) {
  return subscriptions.update(psid, timing, false).then((sub) => {
    console.log(`Disabled subscription ${timing} in dynamoDB for ${psid}`);

    if (!sub.morning && !sub.evening) {
      return subscriptions.remove(psid).then(() => {
        console.log(`Deleted User in dynamoDB with psid ${psid}`);
      }).catch((error) => {
        console.log(`Deleting user from dynamoDB failed: ${error}`);
      });
    }
  }).catch((error) => {
    console.log(`Updating user from dynamoDB failed: ${error}`);
  });
};

const enableSubscription = function(psid, timing) {
  const item = {
    morning: timing === 'morning',
    evening: timing === 'evening',
  };

  return subscriptions.create(psid, item).then(() => {
    console.log(`Created in dynamoDB ${psid} with ${timing}`);
  }).catch((error) => {
    console.log('Creating user in dynamoDB failed: ' + error);

    return subscriptions.update(psid, timing, true).then(() => {
      console.log(`Enabled subscription ${timing} in dynamoDB for ${psid}`);
    }).catch((error) => {
      console.log('Updating user in dynamoDB failed: ' + error);
    });
  });
};

module.exports.subscriptions = function(chat) {
  return Promise.all([
    chat.sendText('Meine Infos kannst du ein oder zweimal am Tag haben: ' +
      'Morgens, abends oder beides. Und ich melde mich, wenn etwas wirklich Wichtiges passiert.'),

    getHasLabel(chat).then(
      function(hasLabel) {
        const elements = [];

        elements.push(listElement(
          (hasLabel('push-morning') && hasLabel('push-evening') ? '✔' : '❌') + ' Beides',
          'Deine Infos morgens und abends.',
          buttonPostback(
            !(hasLabel('push-morning') && hasLabel('push-evening')) ? 'Anmelden' : 'Abmelden',
            {
              action: !(hasLabel('push-morning') && hasLabel('push-evening'))
                ? 'subscribe'
                : 'unsubscribe',
              subscription: 'all',
            }
          )
        ));

        elements.push(listElement(
          (hasLabel('push-morning') ? '✔' : '❌') + ' Deine Infos am Morgen',
          'Um 7.30 Uhr gibt\'s Dein erstes Update.',
          buttonPostback(
            !hasLabel('push-morning') ? 'Anmelden' : 'Abmelden',
            {
              action: !hasLabel('push-morning') ? 'subscribe' : 'unsubscribe',
              subscription: 'morning',
            }
          )
        ));

        elements.push(listElement(
          (hasLabel('push-evening') ? '✔' : '❌') + ' Deine Infos am Abend',
          'Um 18.30 Uhr kriegst Du das, was am Tag wichtig war.',
          buttonPostback(
            !hasLabel('push-evening') ? 'Anmelden' : 'Abmelden',
            {
              action: !hasLabel('push-evening') ? 'subscribe' : 'unsubscribe',
              subscription: 'evening',
            }
          )
        ));

        return chat.sendList(elements);
      }
  ),
]);
};

module.exports.subscribe = function(chat, payload) {
  const promises = [ chat.addLabel('push-breaking') ];
  if (payload.subscription === 'morning' || payload.subscription === 'all') {
    promises.push(
      chat.addLabel('push-morning'),
      enableSubscription(chat.event.sender.id, 'morning'));
  }
  if (payload.subscription === 'evening' || payload.subscription === 'all') {
    promises.push(
      chat.addLabel('push-evening'),
      enableSubscription(chat.event.sender.id, 'evening'));
  }
  return Promise.all(promises.concat(
    chat.sendText(`Ich schick dir ab jetzt die Nachrichten, wie du sie bestellt hast. ` +
      `Wenn du die letzte Ausgabe sehen willst, schreib einfach "Leg los"`)));
};

module.exports.unsubscribe = function(chat, payload) {
  return getHasLabel(chat).then(
    function(hasLabel) {
      const promises = [];
      if (payload.subscription === 'morning' || payload.subscription === 'all') {
        promises.push(
          chat.removeLabel('push-morning'),
          disableSubscription(chat.event.sender.id, 'morning'));
      }
      if (payload.subscription === 'evening' || payload.subscription === 'all') {
        promises.push(
          chat.removeLabel('push-evening'),
          disableSubscription(chat.event.sender.id, 'evening'));
      }
      if (
        payload.subscription === 'all' ||
        !hasLabel('push-' + (payload.subscription === 'morning' ? 'evening' : 'morning'))
      ) {
        promises.push(
          chat.removeLabel('push-breaking'));
      }
      return Promise.all(promises.concat(
        chat.sendText(`Schade. Deine Entscheidung. Ich bin hier, wenn Du mich brauchst.`)));
    }
  );
};

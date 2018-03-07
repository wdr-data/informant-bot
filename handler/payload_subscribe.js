const { buttonPostback, listElement } = require('../lib/facebook');

const getHasLabel = function (chat) {
    return chat.getLabels().then(
        labels => labelName => labels.indexOf(labelName) !== -1
    )
}

module.exports.subscriptions = function (chat) {
    chat.sendText("Meine Infos kannst du ein oder zweimal am Tag haben: Morgens, abends oder beides. Und ich melde mich, wenn etwas wirklich Wichtiges passiert.");

    getHasLabel(chat).then(
        function (hasLabel) {
            const elements = [];

            elements.push(listElement(
                ((hasLabel('push-morning') && hasLabel('push-evening')) ? '✔' : '❌') + ' Beides',
                'Deine Infos morgens und abends.',
                buttonPostback(
                    !(hasLabel('push-morning') && hasLabel('push-evening')) ? 'Anmelden' : 'Abmelden',
                    {
                        action: !(hasLabel('push-morning') && hasLabel('push-evening')) ? 'subscribe' : 'unsubscribe',
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

            console.log('elements: ', elements);
            chat.sendList(elements);
        }
    )
};

module.exports.subscribe = function (chat, payload) {
    chat.addLabel('push-breaking');
    if (payload.subscription == 'morning' || payload.subscription == 'all') {
        chat.addLabel('push-morning');
    }
    if (payload.subscription == 'evening' || payload.subscription == 'all') {
        chat.addLabel('push-evening');
    }
    chat.sendText(`Ich schick dir ab jetzt die Nachrichten, wie du sie bestellt hast. ` +
      `Wenn du die letzte Ausgabe sehen willst, schreib einfach "Leg los"`);
}

module.exports.unsubscribe = function (chat, payload) {
    getHasLabel(chat).then (
        function (hasLabel) {
            if (payload.subscription == 'morning' || payload.subscription == 'all') {
                chat.removeLabel('push-morning');
            }
            if (payload.subscription == 'evening' || payload.subscription == 'all') {
                chat.removeLabel('push-evening');
            }
            if (
                payload.subscription == 'all' ||
                !hasLabel('push-' + (payload.subscription == 'morning' ? 'evening' : 'morning'))
            ) {
                chat.removeLabel('push-breaking');
            }

            chat.sendText(`Schade. Deine Entscheidung. Ich bin hier, wenn Du mich brauchst.`);
        }
    )
}

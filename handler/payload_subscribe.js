const { buttonPostback, listElement } = require('../lib/facebook');
const request = require('request');
const urls = require('../lib/urls');

module.exports.subscriptions = function (chat, payload) {
    chat.sendText("Wenn du magst, bringe ich dich zwei Mal am Tag auf den neuesten Stand. Hier kannst du die Benachrichtigungen aktivieren und deaktivieren:");

    chat.getLabels().then(
        function (labels) {
            const hasLabel = labelName => labels.indexOf(labelName) !== -1;
            const elements = [];
            elements.push(listElement(
                'Deine Infos am Morgen',
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
                'Deine Infos am Abend',
                'Um 18.30 Uhr kriegst Du das, was am Tag wichtig war.',
                buttonPostback(
                    !hasLabel('push-evening') ? 'Anmelden' : 'Abmelden',
                    {
                        action: !hasLabel('push-evening') ? 'subscribe' : 'unsubscribe',
                        subscription: 'evening',
                    }
                )
            ));

            elements.push(listElement(
                'Beides',
                'Deine Infos morgens und abends.',
                buttonPostback(
                    !(hasLabel('push-morning') && hasLabel('push-evening')) ? 'Anmelden' : 'Abmelden',
                    {
                        action: !(hasLabel('push-morning') && hasLabel('push-evening')) ? 'subscribe' : 'unsubscribe',
                        subscription: 'all',
                    }
                )
            ));

            console.log('elements: ', elements);
            chat.sendList(elements);
        }
    )
};

module.exports.subscribe = function (chat, payload) {
    if (payload.subscription == 'morning' || payload.subscription == 'all') {
        chat.addLabel('push-morning');
    }
    if (payload.subscription == 'evening' || payload.subscription == 'all') {
        chat.addLabel('push-evening');
    }
    chat.sendText(`👍🏼 Bis später!`);
}

module.exports.unsubscribe = function (chat, payload) {
    if (payload.subscription == 'morning' || payload.subscription == 'all') {
        chat.removeLabel('push-morning');
    }
    if (payload.subscription == 'evening' || payload.subscription == 'all') {
        chat.removeLabel('push-evening');
    }
    chat.sendText(`Schade. Deine Entscheidung. Ich bin hier, wenn Du mich brauchst.`);
}

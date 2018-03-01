const { buttonPostback, listElement } = require('../lib/facebook');
const request = require('request');
const urls = require('../lib/urls');

module.exports = function (chat, payload) {
    if (payload.subscription) {
        subscriptionChange(chat, payload);
        return;
    }

    chat.sendText("Wenn du magst, bringe ich dich zwei Mal am Tag auf den neuesten Stand. Hier kannst du die Benachrichtigungen aktivieren und deaktivieren:");

    const elements = [];
    elements.push(listElement(
        'Dein Update am Morgen',
        'Gegen 7:30 Uhr gibt\'s die ersten Infos.',
        buttonPostback(
            'Anmelden',
            {
                action: 'subscribe',
                subscription: 'morning',
            }
        )
    ));

    elements.push(listElement(
        'Dein Update am Abend',
        'Um 18:30 Uhr kommt alles was am Tag interessant war.',
        buttonPostback(
            'Anmelden',
            {
                action: 'subscribe',
                subscription: 'evening',
            }
        )
    ));

    elements.push(listElement(
        'Immer Up-to-date',
        'Ich informiere dich um 7:30 Uhr und um 18:30 Uhr.',
        buttonPostback(
            'Anmelden',
            {
                action: 'subscribe',
                subscription: 'all',
            }
        )
    ));

    console.log('elements: ', elements);
    chat.sendList(elements);
};

function subscriptionChange (chat, payload) {
    let time = '';
    if (payload.subscription == 'morning') {
        time = '7:30 Uhr';
    } else if (payload.subscription == 'evening') {
        time = '18:30 Uhr';
    } else {
        time = '7:30 Uhr und um 18:30 Uhr';
    }
    chat.sendText(`Alles klar! Täglich um ${time} gibt es dein Update.`);
}

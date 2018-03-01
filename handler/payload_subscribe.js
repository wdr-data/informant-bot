const { buttonPostback, listElement } = require('../lib/facebook');
const request = require('request');
const urls = require('../lib/urls');

const subscribe = fbLib => (psid, payload) => {
    fbLib.sendTextMessage(psid, "Wenn du magst, bringe ich dich zwei Mal am Tag auf den neuesten Stand. Hier kannst du die Benachrichtigungen aktivieren und deaktivieren:")
    const button = {
        type: 'postback',
        title: 'beides',
        payload: JSON.stringify({
            action: 'subscribe',
            subscriptions: 'all',
        }),
    };
    const elements = [
        {
          action: 'subscribe',
          subscriptions: 'all',
        });
    console.log('button: ', button);

    const elements = [];
    elements.push(listElement(
        'Dein Update am morgen',
        'So, gegen 7:30Uhr gibt\'s die ersten Infos'
    ));

    elements.push(listElement(
        'Abends sind die News noch besser!',
        '18:30Uhr ist ok? Kannste haben!',
    ));

    console.log('elements: ', elements);
    chat.sendList(elements, button);
};

module.exports = subscribe;

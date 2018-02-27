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
            title: "Dein Update am morgen",
            subtitle: "So, gegen 7:30Uhr gibt's die ersten Infos",
        },
        {
            title: "Abends sind die News noch besser!",
            subtitle: "18:30Uhr ist ok? Kannste haben!",
        },
      ];
    fbLib.sendListMessage(psid, elements, button);
};

module.exports = subscribe;

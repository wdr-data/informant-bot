const request = require('request');
const urls = require('../lib/urls');

const pushOutro = (chat, payload) => {
    request(`${urls.push(payload.push)}`, (error, res, body) => {
        const push = JSON.parse(body);

        if (push.media) {
            chat.sendText(push.outro).then(() => {
                chat.sendAttachment(push.media);
            }).catch(error => {
                console.log('Sending outro text failed', error)
            });
            return;
        }

        chat.sendText(push.outro);
    });
};

module.exports = pushOutro;

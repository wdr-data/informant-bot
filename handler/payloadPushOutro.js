const request = require('request');
const urls = require('../lib/urls');

const pushOutro = (chat, payload) => {
    request(`${urls.push(payload.push)}`, (error, res, body) => {
        const push = JSON.parse(body);

        chat.sendText(push.outro);
    });
};

module.exports = pushOutro;

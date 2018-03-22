const moment = require('moment-timezone');

const currentTime = chat => {
    const time = moment.tz('Europe/Berlin').format('HH:mm:ss');
    return chat.sendText(`Die exakte Uhrzeit lautet: ${time}`);
};

module.exports = currentTime;

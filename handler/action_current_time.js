const moment = require('moment-timezone');

const current_time = chat => {
    const time = moment.tz('Europe/Berlin').format('H:m:s');
    chat.sendText(`Die exakte Uhrzeit lautet: ${time}`)
};

module.exports = current_time;

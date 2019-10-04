import moment from 'moment-timezone';

export default (chat) => {
    if (chat.trackingEnabled) {
        await chat.track.event('Testing', 'Zeit').send();
    }

    const time = moment.tz('Europe/Berlin').format('HH:mm:ss');
    return chat.sendText(`Die exakte Uhrzeit lautet: ${time}`);
};

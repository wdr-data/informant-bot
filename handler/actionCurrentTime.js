import moment from 'moment-timezone';

export default async (chat) => {
    const time = moment.tz('Europe/Berlin').format('HH:mm:ss');
    return chat.sendText(`Die exakte Uhrzeit lautet: ${time}`);
};

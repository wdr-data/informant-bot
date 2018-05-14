import request from 'request-promise-native';
import urls from '../lib/urls';

const pushOutro = async (chat, payload) => {
    const push = await request({ uri: `${urls.push(payload.push)}`, json: true });

    if (push.media) {
        await chat.sendText(push.outro);
        return chat.sendAttachment(push.media);
    }

    return chat.sendText(push.outro);
};

module.exports = pushOutro;

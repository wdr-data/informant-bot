import request from 'request-promise-native';
import urls from '../lib/urls';
import { assemblePush } from '../lib/pushData';


export default async (chat, payload) => {
    const data = await request({
        uri: urls.pushes,
        json: true,
        qs: {
            limit: 1,
            'delivered_fb': 'sent',
        },
    });

    const push = data.results[0];
    const {
        messageText,
        buttons,
        quickReplies,
    } = assemblePush(push);

    return chat.sendButtons(messageText, buttons, quickReplies);
};

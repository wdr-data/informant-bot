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
            'published': 1,
        },
    });

    const push = data.results[0];
    const {
        messageText,
        quickReplies,
    } = await assemblePush(push);

    if (push.attachment) {
        await chat.sendAttachment(push.attachment.processed);
    }
    return chat.sendText(messageText, quickReplies);
};

import request from 'request-promise-native';
import urls from '../lib/urls';

export default async (chat, payload) => {
    const params = {
        uri: `${urls.push(payload.push)}`,
        json: true,
    };
    // Authorize so we can access unpublished items
    if (payload.preview) {
        params.headers = { Authorization: 'Token ' + process.env.CMS_API_TOKEN };
    }
    const push = await request(params);

    await chat.sendText(push.outro);

    if (push.attachment) {
        return chat.sendAttachment(push.attachment.processed);
    }
};

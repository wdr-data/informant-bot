import request from 'request-promise-native';
import urls from '../lib/urls';
import fragmentSender from '../lib/fragmentSender';

export default async (chat, payload) => {
    await chat.sendAttachment(payload.audioUrl);

    if (payload.type === 'push' || payload.type === 'report') {
        const params = {
            uri: `${urls.report(payload.report)}?withFragments=1`,
            json: true,
        };
        // Authorize so we can access unpublished items
        if (payload.preview) {
            params.headers = { Authorization: 'Token ' + process.env.CMS_API_TOKEN };
        }
        const report = await request(params);
        const text = 'Du hörst *' + report.headline + '* 🎧';

        return fragmentSender(chat, report.next_fragments, payload, text);
    }
};

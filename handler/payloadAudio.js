import request from 'request-promise-native';
import urls from '../lib/urls';
import fragmentSender from '../lib/fragmentSender';

export default async (chat, payload) => {
    await chat.sendAttachment(payload.audioUrl);

    if (payload.type === 'push' || payload.type === 'report') {
        const report = await request({
            uri: `${urls.report(payload.report)}?withFragments=1`,
            json: true,
        });
        const text = 'Du hörst *' + report.headline + '* 🎧';

        return fragmentSender(chat, report.nextFragments, payload, text);
    }
};

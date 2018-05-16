import request from 'request-promise-native';
import urls from '../lib/urls';
import fragmentSender from '../lib/fragmentSender';

export default async (chat, payload) => {
    const report = await request({
        uri: `${urls.report(payload.report)}?withFragments=1`,
        json: true,
    });

    return fragmentSender(chat, report.next_fragments, payload, report.text, report.media);
};

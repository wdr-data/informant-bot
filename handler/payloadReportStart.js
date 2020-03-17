import request from 'request-promise-native';
import urls from '../lib/urls';
import fragmentSender from '../lib/fragmentSender';
import { trackLink, regexSlug } from '../lib/utils';

export default async (chat, payload) => {
    const params = {
        uri: `${urls.report(payload.report)}?withFragments=1`,
        json: true,
    };
    // Authorize so we can access unpublished items
    if (payload.preview) {
        params.headers = { Authorization: 'Token ' + process.env.CMS_API_TOKEN };
    }
    const report = await request(params);

    if (report.is_quiz) {
        payload.quiz = true;
    }
    if (report.link) {
        let campaignType = 'themen_feature';
        switch (payload.timing) {
        case 'morning':
            campaignType = 'morgen_push';
            break;
        case 'evening':
            campaignType = 'abend_push';
        }
        payload.link = trackLink(
            report.link, {
                campaignType,
                campaignName: regexSlug(report.headline),
                campaignId: report.id,
            }
        );
    }

    if (report.audio) {
        payload.audio = report.audio;
    }

    return fragmentSender(chat, report.next_fragments, payload, report.text, report.attachment);
};

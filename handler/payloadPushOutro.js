import request from 'request-promise-native';
import urls from '../lib/urls';
import { buttonUrl } from '../lib/facebook';
import { trackLink, regexSlug } from '../lib/utils';

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

    if (push.attachment) {
        await chat.sendAttachment(push.attachment.processed);
    }
    if (push.link) {
        return chat.sendButtons(
            push.outro, [
                buttonUrl( `🔗 ${push.link_name}`, trackLink(
                    push.link, {
                        campaignType: 'push_outro',
                        campaignName: regexSlug(push.link_name),
                        campaignId: push.id,
                    }),
                ),
            ]);
    }
    return chat.sendText(push.outro);
};

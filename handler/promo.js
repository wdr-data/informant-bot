import request from 'request-promise-native';

import urls from '../lib/urls';
import { buttonUrl } from '../lib/facebook';
import { buildQuickReplies } from '../lib/pushData';


export const handlePromo = async (chat, payload) => {
    const params = {
        uri: `${urls.push(payload.push)}`,
        json: true,
    };
    // Authorize so we can access unpublished items
    if (payload.preview) {
        params.headers = { Authorization: 'Token ' + process.env.CMS_API_TOKEN };
    }
    const push = await request(params);

    const promo = push.promos.filter((promo) => promo.id === payload.promo)[0];

    if (!promo) {
        return chat.sendText('Dieser Content ist nicht mehr verfügbar.');
    }

    const { attachment, text, link, link_name: linkName } = promo;

    const quickReplies = await buildQuickReplies(
        push,
        payload.seen,
        payload.preview,
        payload.promo,
    );

    if (promo.attachment) {
        await chat.sendAttachment(attachment.processed);
    }

    if (link) {
        const linkButtonText = `🔗 ${linkName || 'Mehr'}`;
        const linkButton = buttonUrl(linkButtonText, link);
        return chat.sendButtons(text, [ linkButton ], quickReplies);
    } else {
        return chat.sendText(text, quickReplies);
    }
};

import request from 'request-promise-native';
import moment from 'moment';
import 'moment-timezone';

import urls from '../lib/urls';
import { trackLink } from '../lib/utils';
import { buttonUrl } from '../lib/facebook';
import { buildQuickReplies } from '../lib/pushData';


export const handlePodcast = async (
    chat,
    payload,
    options = { show: '0630_by_WDR_aktuell_WDR_Online' }
) => {
    const response = await request({
        uri: urls.documentsByShow(1, 1, options.show),
        json: true,
    });
    const episode = response.data[0];

    const teaserText = episode.teaserText.join('\n').slice(0, 800);
    const date = moment(
        episode.broadcastTime
    ).tz('Europe/Berlin').format('DD.MM.YY');

    let quickReplies = [];
    if (payload.push) {
        const params = {
            uri: `${urls.push(payload.push)}`,
            json: true,
        };
        // Authorize so we can access unpublished items
        if (payload.preview) {
            params.headers = { Authorization: 'Token ' + process.env.CMS_API_TOKEN };
        }
        const push = await request(params);
        quickReplies = await buildQuickReplies(push, payload.seen, payload.preview, 'podcast');
    }


    const buttonPicker = [];
    if (options.show === '0630_by_WDR_aktuell_WDR_Online') {
        buttonPicker.push(buttonUrl(
            `Podcast 0630 hören`,
            trackLink('https://www1.wdr.de/0630', {
                campaignType: 'podcast-feature',
                campaignName: `0630-button`,
                campaignId: '',
            })
        ));
    }

    const messageText = `${episode.title} vom ${date}\n\n${teaserText}`.slice(0, 630) + '...';

    return chat.sendButtons(messageText, buttonPicker, quickReplies);
};

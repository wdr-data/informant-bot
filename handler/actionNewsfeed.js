import request from 'request-promise-native';
import moment from 'moment';
import 'moment-timezone';

import { buttonUrl, genericElement } from '../lib/facebook';
import urls from '../lib/urls';
import { trackLink } from '../lib/utils';


const imageVariants = [ 'ARDFotogalerie', 'gseapremiumxl', 'TeaserAufmacher' ];

const getNews = async (options) => {
    let response;
    if (options.tag) {
        response = await request({
            uri: urls.newsfeedByTopicCategories(1, 10, options.tag),
            json: true,
        });
    } else {
        response = await request({
            uri: urls.curatedNewsFeed(1, 10),
            json: true,
        });
    }

    return createElements(response);
};

const createElements = async (response) => {
    const elements = [];

    for (const item of response.data) {
        let content = item;
        if (item.teaser) {
            content = item.teaser;
        }

        const headline = content.schlagzeile;
        const teaserText = content.teaserText
            .map((text) => ` • ${text}`)
            .join('\n');
        const lastUpdate = moment(
            content.redaktionellerStand * 1000
        )
            .tz('Europe/Berlin')
            .format('DD.MM.YY, HH:mm');
        const shareLink = content.shareLink;

        // Get image url
        let imageUrl = 'https://www1.wdr.de/nachrichten/wdr-aktuell-icon-facebook-mesenger-100~_v-gseapremiumxl.jpg';

        const mediaItems = Object.values(content.containsMedia).sort(
            (a, b) => a.index - b.index
        );
        const firstImageItem = mediaItems.find((e) => e.mediaType === 'image');

        if (firstImageItem) {
            const imageUrlTemplate = firstImageItem.url;

            const imageCandidates = imageVariants.map((variant) =>
                imageUrlTemplate.replace('%%FORMAT%%', variant)
            );

            const statuses = await Promise.allSettled(
                imageCandidates.map((url) => request.head(url))
            );
            imageUrl = imageCandidates.find(
                (candidate, i) => statuses[i].status === 'fulfilled'
            ) || imageUrl;
        }

        const linkButton = buttonUrl(`🔗 Lesen`, trackLink(
            shareLink, {
                campaignType: 'button',
                campaignName: 'newsfeed',
                campaignId: 'bot',
            }),
        );

        const defaultAction = {
            type: 'web_url',
            url: trackLink(
                shareLink, {
                    campaignType: 'karte',
                    campaignName: 'newsfeed',
                    campaignId: 'bot',
                }),
        };

        const element = genericElement(
            headline,
            `${lastUpdate}\n${teaserText}`,
            linkButton,
            imageUrl,
            defaultAction
        );

        console.log(JSON.stringify(element, null, 2));

        elements.push(element);
    }

    return { elements };
};

export const newsfeedStart = async (chat, payload, options = {}) => {
    const { elements } = await getNews(options);
    return chat.sendGenericTemplate(elements);
};

import request from 'request-promise-native';
import moment from 'moment';
import 'moment-timezone';

import { buttonUrl, genericElement } from '../lib/facebook';
import urls from '../lib/urls';
import { trackLink } from '../lib/utils';


const imageVariants = [ 'ARDFotogalerie', 'gseapremiumxl', 'TeaserAufmacher' ];

const getNews = async (options = { tag: 'Coronavirus' }) => {
    const { tag } = options;
    const response = await request({
        uri: urls.newsfeedByTopicCategories(1, 10, tag),
        json: true,
    });

    const elements = [];

    for (const item of response.data) {
        const headline = item.teaser.schlagzeile;
        const teaserText = item.teaser.teaserText
            .map((text) => ` • ${text}`)
            .join('\n');
        const lastUpdate = moment(
            item.teaser.redaktionellerStand * 1000
        )
            .tz('Europe/Berlin')
            .format('DD.MM.YY, HH:mm');
        const shareLink = item.teaser.shareLink;

        // Get image url
        let imageUrl = 'https://www1.wdr.de/nachrichten/wdr-aktuell-app-icon-100~_v-TeaserAufmacher.jpg';

        const mediaItems = Object.values(item.teaser.containsMedia).sort(
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

export const newsfeedStart = async (chat) => {
    const { elements } = await getNews();
    return chat.sendGenericTemplate(elements);
};

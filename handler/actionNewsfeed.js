import request from 'request-promise-native';
import moment from 'moment';
import 'moment-timezone';

import { buttonUrl, genericElement } from '../lib/facebook';
import urls from '../lib/urls';

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
        const mediaItems = Object.values(item.teaser.containsMedia).sort(
            (a, b) => a.index - b.index
        );
        const imageUrlTemplate = mediaItems.find((e) => e.mediaType === 'image')
            .url;

        const imageCandidates = imageVariants.map((variant) =>
            imageUrlTemplate.replace('%%FORMAT%%', variant)
        );

        const statuses = await Promise.allSettled(
            imageCandidates.map((url) => request.head(url))
        );
        const imageUrl = imageCandidates.find(
            (candidate, i) => statuses[i].status === 'fulfilled'
        );

        const linkButton = buttonUrl(`🔗 Lesen`, shareLink);

        const defaultAction = {
            type: 'web_url',
            url: shareLink,
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

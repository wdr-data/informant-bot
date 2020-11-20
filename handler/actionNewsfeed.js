import request from 'request-promise-native';
import moment from 'moment';
import 'moment-timezone';

import { buttonUrl, genericElement } from '../lib/facebook';
import urls from '../lib/urls';
import { trackLink } from '../lib/utils';
import { byAGS } from '../data/locationMappings';


const imageVariants = [ 'ARDFotogalerie', 'gseapremiumxl', 'TeaserAufmacher' ];

export const handleLocationRegions = async (chat, payload) => {
    const location = byAGS[payload.ags];
    return newsfeedStart(
        chat,
        payload,
        {
            tag: location.sophoraDistrictTag,
            location: location,
        }
    );
};

export const handleSophoraTag = async (chat, payload) => {
    if (payload.sophoraTag.stringValue) {
        const tag = payload.sophoraTag.stringValue;
        return newsfeedStart(chat, payload, { tag } );
    }
    return newsfeedStart(chat, payload, { tag: 'Schlagzeilen' });
};

const getNews = async (options = { tag: 'Schlagzeilen' }) => {
    if (options.tag === undefined) {
        options.tag = 'Schlagzeilen';
    }
    let response;
    if (options.tag === 'Schlagzeilen') {
        response = await request({
            uri: urls.curatedNewsFeed(1, 10),
            json: true,
        });
    } else {
        response = await request({
            uri: urls.newsfeedByTopicCategories(1, 10, options.tag),
            json: true,
        });
    }

    return createElements(response, options.tag);
};

const createElements = async (response, tag) => {
    const elements = [];

    for (const item of response.data) {
        let content = item;
        if (item.teaser) {
            content = item.teaser;
        }

        const headline = content.schlagzeile ? content.schlagzeile : content.title;
        let teaserText = '';
        if (content.teaserText) {
            if (content.teaserText.length > 1) {
                teaserText = content.teaserText
                    .map((text) => ` • ${text}`)
                    .join('\n');
            } else {
                teaserText = content.teaserText[0];
            }
        }
        const lastUpdate = moment(
            content.redaktionellerStand * 1000
        )
            .tz('Europe/Berlin')
            .format('DD.MM.YY, HH:mm');
        const shareLink = content.shareLink;

        // Get image url
        let imageUrl = 'https://images.informant.einslive.de/ef6b7695-479d-4ab8-a616-ddd61cf5f47d.png';

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
                campaignType: `${tag}-newsfeed`,
                campaignName: headline,
                campaignId: 'bot',
            }),
        );

        const defaultAction = {
            type: 'web_url',
            url: trackLink(
                shareLink, {
                    campaignType: `${tag}-newsfeed`,
                    campaignName: headline,
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

export const newsfeedStart = async (chat, payload, options = { tag: 'Schlagzeilen' }) => {
    const { elements } = await getNews(options);

    let introText = `Hier unser aktuellen Nachrichten zum Thema "${options.tag}":`;
    if ('location' in options) {
        introText = `Das ist gerade in der Region ${options.location.district} wichtig:`;
    } else if (options.tag === 'Schlagzeilen') {
        introText = 'Hier die neuesten Meldungen von WDR aktuell:';
    }

    await chat.sendText(introText);
    return chat.sendGenericTemplate(elements);
};

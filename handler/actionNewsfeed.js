import request from 'request-promise-native';
import { buttonUrl, genericElement } from '../lib/facebook';

import urls from '../lib/urls';

const getNews = async (index, options={ tag: 'Coronavirus' }) => {
    const { tag } = options;
    const response = await request({
        uri: urls.newsfeedByTopicCategories(index, 10, tag),
        json: true,
    });
    const headline = response.data[0].teaser.schlagzeile;
    const teaserText = response.data[0].teaser.teaserText.map((text) => `➡️ ${text}`).join('\n');
    const imageUrl = Object.values(response.data[0].teaser.containsMedia)
        .find((e) => e.index===1).url.replace('%%FORMAT%%', 'gseapremiumxl');

    const text = `<b>${escapeHTML(headline)}</b>\n\n${escapeHTML(teaserText)}`;

    const linkButton = Markup.urlButton(`🔗 Lesen`, response.data[0].teaser.shareLink);

    const navButtons = [];

    if (index > 1 ) {
        navButtons.push(
            Markup.callbackButton(
                '⬅️',
                actionData('newsfeed', {
                    next: index - 1,
                    tag,
                })
            ),
        );
    }

    if (index < response.numFound) {
        navButtons.push(
            Markup.callbackButton(
                '➡️',
                actionData('newsfeed', {
                    next: index + 1,
                    tag,
                })
            ));
    }
    const extra = Markup.inlineKeyboard([ [ linkButton ], navButtons ]).extra();
    extra.caption = text;
    extra['parse_mode'] = 'HTML';

    return { text, imageUrl, extra };
};

export const handleNewsfeedStart = async (ctx) => {
    const { imageUrl, extra } = await getNews(1);
    return ctx.replyWithPhoto(imageUrl, extra);
};

export const handleNewsfeedPage = async (ctx) => {
    const { imageUrl, extra } = await getNews(ctx.data.next);
    const media ={ type: 'photo', media: imageUrl, caption: extra.caption, 'parse_mode': 'HTML' };
    return ctx.editMessageMedia(media, extra);
};

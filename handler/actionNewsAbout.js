import request from 'request-promise-native';
import moment from 'moment-timezone';

import urls from '../lib/urls';
import { buttonPostback, genericElement } from '../lib/facebook';

export const newsAbout = async (chat, payload) => {
    const baseParams = {
        withFragments: 1,
        limit: 10,
    };

    let qs;

    try {
        qs = { ...baseParams, ...await searchId(payload) };
    } catch (e) {
        return chat.sendText(`Dazu habe ich leider keine Info...🤔`);
    }

    const resultPage = await request({
        uri: urls.reports,
        json: true,
        qs,
    });

    if (resultPage.length === 0) {
        return chat.sendText(`Dazu habe ich leider keine Info...🤔`);
    }

    const elements = [];
    resultPage.results.forEach((r) => {
        const buttons = [];
        const reportDate = moment(r.created)
            .tz('Europe/Berlin')
            .format('DD.MM.YYYY');
        if (r.audio) {
            buttons.push(
                buttonPostback(
                    'Jetzt anhören 🎧',
                    {
                        action: 'report_audio',
                        audioUrl: r.audio,
                        track: {
                            category: 'Feature',
                            event: r.type === 'last' ? `Letzte Meldung` :
                                r.type === 'breaking' ? 'Breaking Meldung' : 'Reguläre Meldung',
                            label: r.subtype ? `${r.subtype.title}: ${r.headline}` : r.headline,
                            subType: 'Audio',
                        },
                    }

                ));
        }
        buttons.push(
            buttonPostback('Lesen 📰',
                {
                    action: 'report_start',
                    report: r.id,
                    type: 'report',
                    track: {
                        category: 'Feature',
                        event: 'Meldung nach Tag/Genre',
                        label: r.subtype ? `${r.subtype.title}: ${r.headline}` : r.headline,
                        subType: '1.Bubble',
                        publicationDate: r.published_date,
                    },
                }));

        elements.push(
            genericElement(
                `${reportDate} - ${r.headline}`,
                r.text,
                buttons
            )
        );
    });

    if (payload.tags.stringValue) {
        await chat.track({
            category: 'Feature',
            event: 'Meldung nach Tag/Genre',
            label: 'Tag',
            subType: payload.tags.stringValue,
        });
    }
    if (payload.genres.stringValue) {
        await chat.track({
            category: 'Feature',
            event: 'Meldung nach Tag/Genre',
            label: 'Genre',
            subType: payload.genres.stringValue,
        });
    }

    return chat.sendGenericTemplate(elements.slice(0, 10));
};

export const searchId = async (payload) => {
    /* Resolves a tag or genre from dialogflow-result string to ID, with priority to genres */
    const searchParameter = [ 'genres', 'tags' ];
    const map = {
        genres: 'genres',
        tags: 'tags',
    };

    for (const key of searchParameter) {
        if (payload[key].stringValue === '') {
            continue;
        }

        const data = await request({
            uri: urls[key](payload[key].stringValue),
            json: true,
        });

        if (data.length === 0) {
            continue;
        }
        return {
            [map[key]]: data[0].id,
        };
    }

    throw Error();
};

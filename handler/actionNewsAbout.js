import request from 'request-promise-native';
import moment from 'moment-timezone';
import urls from '../lib/urls';

import { buttonPostback, genericElement } from '../lib/facebook';

export const newsAbout = async (chat, payload) => {
    let id;

    try {
        id = await searchId(payload);
    } catch (e) {
        return chat.sendText(`Dazu habe ich leider keine Info...🤔`);
    }

    const report = await request({
        uri: urls.reports,
        json: true,
        qs: id,
    });

    if (report.length === 0) {
        return chat.sendText(`Dazu habe ich leider keine Info...🤔`);
    }

    const elements = [];
    report.forEach((r) => {
        const reportDate = moment(r.created)
            .tz('Europe/Berlin')
            .format('DD.MM.YYYY');
        elements.push(
            genericElement(
                `${reportDate} - ${r.headline}`,
                r.text,
                buttonPostback('Lesen 📰', {
                    action: 'report_start',
                    report: r.id,
                    type: 'report',
                })
            )
        );
    });
    return chat.sendGenericTemplate(elements.slice(0, 10));
};

export const searchId = async (payload) => {
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

import request from 'request-promise-native';
import moment from 'moment-timezone';
import urls from './urls';
import * as facebook from './facebook';

export async function getLatestPush(timing, filters = {}) {
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];

    let data;

    try {
        data = await request.get({
            uri: urls.pushes,
            json: true,
            qs: Object.assign({ timing: timing, 'pub_date': isoDate, limit: 1 }, filters),
        });
    } catch (e) {
        console.log('Querying push failed: ', JSON.stringify(e, null, 2));
        throw new Error(`Querying push failed: ${e.message}`);
    }

    if (!('results' in data && data.results.length > 0)) {
        throw new Error('No Push found');
    }
    return data.results[0];
}

export function assemblePush(push) {
    const intro = [ push.intro ].concat(push.reports.map((r) => `➡ ${r.headline}`)).join('\n');
    const firstReport = push.reports[0];

    const buttonAll = facebook.buttonPostback(
        'Alle Infos',
        {
            action: 'report_start',
            push: push.id,
            report: firstReport.id,
            type: 'push',
        });
    const buttonAudio = facebook.buttonPostback(
        'Aktuelle Infos 🎧',
        {
            action: 'current_audio',
        });
    const buttons = [ buttonAll, buttonAudio ];

    let quickReplies = null;
    if ( push.reports.length > 1 ) {
        quickReplies = push.reports.map((r) =>
            facebook.quickReply(r.short_headline ? '➡ ' + r.short_headline : '➡ ' + r.headline,
                {
                    action: 'report_start',
                    push: push.id,
                    report: r.id,
                    type: 'push',
                    before: [],
                },
            ));
    }

    return {
        intro,
        buttons,
        quickReplies,
    };
}

export async function markSent(id) {
    const now = moment.tz('Europe/Berlin').format();

    try {
        const response = await request.patch({
            uri: urls.push(id),
            json: true,
            body: { delivered: true, 'delivered_date': now },
            headers: { Authorization: 'Token ' + process.env.CMS_API_TOKEN },
        });
        console.log(`Updated push ${id} to delivered`, response);
    } catch (e) {
        console.log(`Failed to update push ${id} to delivered`, e.message);
        throw e;
    }
}

export default {
    getLatestPush,
    assemblePush,
    markSent,
};

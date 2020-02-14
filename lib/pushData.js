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

export function assemblePush(push, preview=false) {
    const headlines = push.reports
        .filter((r) => r.type === 'regular')
        .map((r) => `➡ ${r.headline}`)
        .join('\n');

    const lastHeadline = push.reports
        .filter((r) => r.type === 'last')
        .map((r) => `Zum Schluss:\n🙈 ${r.headline}`)[0];

    const parts = [push.intro, headlines, lastHeadline].filter((p) => !!p);

    const messageText = parts.join('\n\n');

    const firstReport = push.reports[0];

    const buttonAll = facebook.buttonPostback(
        'Alle Infos',
        {
            action: 'report_start',
            push: push.id,
            report: firstReport.id,
            type: 'push',
            preview,
            category: `push-classic-${push.timing}-${push.pub_date}`,
            event: `report-${firstReport.headline}`,
            label: 'intro',
        });
    const buttonAudio = facebook.buttonPostback(
        'Aktuelle Infos 🎧',
        {
            action: 'current_audio',
            category: `push-${push.timing}-${push.pub_date}`,
            event: 'current audio',
            label: 'wdr aktuell',
        });
    const buttons = [ buttonAll, buttonAudio ];

    let quickReplies = null;
    if (push.reports.length > 1) {
        quickReplies = push.reports.map((r) =>
            facebook.quickReply(r.short_headline ? '➡ ' + r.short_headline : '➡ ' + r.headline,
                {
                    action: 'report_start',
                    push: push.id,
                    report: r.id,
                    type: 'push',
                    before: [],
                    preview,
                    category: `push-${push.timing}-${push.pub_date}`,
                    event: `report-${r.headline}`,
                    label: 'intro',
                },
            ));
    }

    return {
        messageText,
        buttons,
        quickReplies,
    };
}

export async function markSending(id, type = 'push') {
    const uri = urls[type](id);

    try {
        const response = await request.patch({
            uri,
            json: true,
            body: { 'delivered_fb': 'sending' },
            headers: { Authorization: 'Token ' + process.env.CMS_API_TOKEN },
        });
        console.log(`Updated ${type} ${id} to 'sending'`, response);
    } catch (e) {
        console.log(`Failed to update ${type} ${id} to 'sending'`, e.message);
    }
}

export async function markSent(id, type = 'push') {
    const now = moment.tz('Europe/Berlin').format();

    let uri;
    const body = { 'delivered_fb': 'sent' };
    if (type === 'push') {
        uri = urls.push(id);
        body['delivered_date_fb'] = now;
    } else if (type === 'report') {
        uri = urls.report(id);
    }

    try {
        const response = await request.patch({
            uri,
            json: true,
            body,
            headers: { Authorization: 'Token ' + process.env.CMS_API_TOKEN },
        });
        console.log(`Updated ${type} ${id} to 'sent'`, response);
    } catch (e) {
        console.log(`Failed to update ${type} ${id} to 'sent'`, e.message);
        throw e;
    }
}

export default {
    getLatestPush,
    assemblePush,
    markSent,
};

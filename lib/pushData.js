import request from 'request-promise-native';
import moment from 'moment-timezone';
import urls from './urls';
import * as facebook from './facebook';
import { trackLink, regexSlug } from '../lib/utils';

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
        .map((r) => `${r.subtype.emoji} ${r.subtype.title}: ${r.headline}`)[0];

    const parts = [ push.intro, headlines, lastHeadline ].filter((p) => !!p);

    const messageText = parts.join('\n\n');

    const firstReport = push.reports[0];

    const buttonAll = facebook.buttonPostback(
        'Alle Infos',
        {
            action: 'report_start',
            push: push.id,
            timing: push.timing,
            report: firstReport.id,
            type: 'push',
            preview,
            track: {
                category: push.timing === 'morning' ?
                    `Morgen-Push-${push.id}` :
                    `Abend-Push-${push.id}`,
                event: '1.Meldung',
                label: firstReport.subtype ?
                    `${firstReport.subtype.title}: ${firstReport.headline}`:
                    firstReport.headline,
                subType: `1.Bubble-Alle (${firstReport.question_count + 1})`,
                publicationDate: firstReport.published_date,
            },
        });

    const buttonAudio = facebook.buttonPostback(
        'Radionachrichten 📻',
        {
            action: 'current_audio',
            track: {
                category: push.timing === 'morning' ?
                    `Morgen-Push-${push.id}` :
                    `Abend-Push-${push.id}`,
                event: 'Hörfunknachrichten',
                label: 'WDR aktuell',
                subType: 'Audio',
                publicationDate: push.pub_date,
            },
        });

    const buttonPodcast = facebook.buttonUrl(
        'Morgen-Podcast 0630',
        trackLink(
            'https://www1.wdr.de/0630', {
                campaignType: push.timing === 'morning' ?
                    `morgen push` :
                    `abend push`,
                campaignName: `0630 button`,
                campaignId: '',
            })
    );

    const buttons = [ buttonPodcast, buttonAudio, buttonAll ];

    let quickReplies = null;
    if (push.reports.length > 1) {
        quickReplies = push.reports.map((r, cnt) => {
            let quickReplyText;
            if (r.type === 'last') {
                quickReplyText = `${r.subtype.emoji} ${r.subtype.title}`;
            } else if (r.short_headline) {
                quickReplyText = `➡ ${r.short_headline}`;
            } else {
                quickReplyText = `➡ ${r.headline}`;
            }
            return facebook.quickReply(quickReplyText,
                {
                    action: 'report_start',
                    push: push.id,
                    timing: push.timing,
                    report: r.id,
                    type: 'push',
                    before: [],
                    preview,
                    track: {
                        category: push.timing === 'morning' ?
                            `Morgen-Push-${push.id}` :
                            `Abend-Push-${push.id}`,
                        event: r.type === 'last' ? 'Letzte Meldung' : `${cnt+1}.Meldung`,
                        label: r.subtype ? `${r.subtype.title}: ${r.headline}` : r.headline,
                        subType: `1.Bubble-Quick (${r.question_count + 1})`,
                        publicationDate: r.published_date,
                    },
                },
            );
        });
    }

    return {
        messageText,
        buttons,
        quickReplies,
    };
}

export function assembleReport(report, preview=false) {
    const typeMapping = {
        morning: 'Morgen',
        evening: 'Abend',
        breaking: 'Breaking',
        notification: 'Benachrichtigungs',
    };

    const payload = {
        action: 'report_start',
        report: report.id,
        type: 'report',
        preview: preview,
        track: {
            category: `Report-Push-${report.id}`,
            event: `${typeMapping[report.type]} Meldung`,
            label: report.subtype ?
                `${report.subtype.title}: ${report.headline}` :
                report.headline,
            subType: `1.Bubble (${report.question_count + 1})`,
            publicationDate: report.published_date,
        },
    };

    if (report.is_quiz) {
        payload.quiz = true;
    }
    if (report.link) {
        payload.link = trackLink(
            report.link, {
                campaignType: `${typeMapping[report.type].toLowerCase()}_push`,
                campaignName: regexSlug(report.headline),
                campaignId: report.id,
            });
    }
    if (report.audio) {
        payload.audio = report.audio;
    }

    if (!report.attachment && report.type === 'breaking') {
        report.attachment= {
            processed: 'https://images.informant.einslive.de/TG_Eilmeldung_7-2b2154a9-3616-4eff-930d-1f4d789dd072.png',
            title: 'Eilmeldung',
        };
    }

    const unsubscribeNote = 'Um Eilmeldungen abzubestellen, schreibe "Stop".';
    let messageText;
    if (report.type === 'breaking') {
        messageText = `🚨 ${report.headline}\n\n${report.text}\n\n${unsubscribeNote}`;
    } else if (report.type === 'evening') {
        messageText = `➡️ ${report.headline}\n\n${report.text}`;
    } else if (report.type === 'notification') {
        messageText = `ℹ ${report.headline}\n\n${report.text}`;
    } else {
        messageText = report.text;
    }

    if ([ 'breaking', 'notification' ].includes(report.type)) {
        payload.nextAsButton = true;
    }

    return { messageText, payload };
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

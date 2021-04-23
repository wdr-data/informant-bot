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

export async function buildQuickReplies(push, seen, preview, lastSeen = undefined) {
    // Update list of 'seen' items
    if (lastSeen !== undefined && !seen.includes(lastSeen)) {
        seen = seen.concat([ lastSeen ]);
    }

    const quickReplies = [];

    // Promos
    const promoQuickReplies = push.promos.filter((promo) => !seen.includes(promo.id)).map(
        (promo) => facebook.quickReply(
            `✨ ${promo.short_headline}`,
            {
                action: 'promo',
                push: push.id,
                promo: promo.id,
                seen,
                preview,
                track: {
                    category: push.timing === 'morning' ?
                        `Morgen-Push-${push.id}` :
                        `Abend-Push-${push.id}`,
                    event: 'Promo',
                    label: promo.short_headline,
                    publicationDate: push.pub_date,
                },
            }
        ),
    );
    quickReplies.push(...promoQuickReplies);

    // Check, if podcast is from today
    const show = '0630_by_WDR_aktuell_WDR_Online';
    const response = await request({
        uri: urls.documentsByShow(1, 1, show),
        json: true,
    });
    const podcast = response.data[0];

    if (
        !seen.includes('podcast')
        && moment.now() - moment(podcast.broadcastTime).tz('Europe/Berlin') < 24*60*60*1000
    ) {
        quickReplies.push(
            facebook.quickReply(
                'Morgen-Podcast 0630',
                {
                    action: 'podcast',
                    push: push.id,
                    seen,
                    preview,
                    track: {
                        category: push.timing === 'morning' ?
                            `Morgen-Push-${push.id}` :
                            `Abend-Push-${push.id}`,
                        event: 'Podcast',
                        label: '0630',
                        publicationDate: push.pub_date,
                    },
                },
            ),
        );
    }

    return quickReplies;
}

export async function assemblePush(push, preview=false) {
    const regularBodies = push.teasers.map(
        (teaser) => {
            const headline = teaser.headline;
            const text = teaser.text;
            const link = teaser.link ? `\n🔗 ${teaser.link}` : '';
            return `➡ ${headline}\n\n${text}${link}`;
        });

    const bodies = regularBodies.join('\n\n');
    const messageText = `${push.intro}\n\n${bodies}\n\n👋 ${push.outro}`;

    const quickReplies = await buildQuickReplies(push, [], preview);

    return {
        messageText,
        quickReplies,
    };
}

export function assembleReport(report, preview=false) {
    const typeMapping = {
        regular: 'Reguläre',
        morning: 'Morgen',
        evening: 'Abend',
        breaking: 'Breaking',
        last: 'Letzte',
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

    let messageText;
    if (report.type === 'breaking') {
        messageText = `${report.headline}\n\n${report.text}`;
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
    buildQuickReplies,
    assemblePush,
    markSent,
};

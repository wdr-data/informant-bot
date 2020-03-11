import { buttonPostback, quickReply } from '../lib/facebook';
import request from 'request-promise-native';
import urls from '../lib/urls';


export default async (chat, payload) => {
    const data = await request({
        uri: urls.pushes,
        json: true,
        qs: {
            limit: 1,
            'delivered_fb': 'sent',
        },
    });

    const push = data.results[0];

    const headlines = push.reports
        .filter((r) => r.type === 'regular')
        .map((r) => `➡ ${r.headline}`)
        .join('\n');

    const lastHeadline = push.reports
        .filter((r) => r.type === 'last')
        .map((r) => `🙈 Zum Schluss: ${r.headline}`)[0];

    const parts = [ push.intro, headlines, lastHeadline ].filter((p) => !!p);

    const messageText = parts.join('\n\n');

    const firstReport = push.reports[0];
    const buttonAll = buttonPostback(
        'Alle Infos',
        {
            action: 'report_start',
            push: push.id,
            timing: push.timing,
            report: firstReport.id,
            type: 'push',
            track: {
                category: push.timing === 'morning' ? 'Morgen-Push-Klassik' : 'Abend-Push-Klassik',
                event: `Meldung`,
                label: firstReport.headline,
                publicationDate: push.pub_date,
                subType: '1.Bubble',
            },
        });
    const buttonAudio = buttonPostback(
        'Aktuelle Infos 🎧',
        {
            action: 'current_audio',
            track: {
                category: push.timing === 'morning' ? 'Morgen-Push' : 'Abend-Push',
                event: 'Hörfunknachrichten',
                label: 'WDR Aktuell',
                subType: 'Audio',
            },
        });
    const quickReplies = push.reports.map((r) =>
        quickReply(r.short_headline ? '➡ ' + r.short_headline : '➡ ' + r.headline,
            {
                action: 'report_start',
                push: push.id,
                timing: push.timing,
                report: r.id,
                type: 'push',
                before: [],
                track: {
                    category: push.timing === 'morning' ? 'Morgen-Push' : 'Abend-Push',
                    event: `Meldung`,
                    label: r.headline,
                    subType: '1.Bubble',
                    publicationDate: r.publicationDate,
                },
            },
        ));

    return chat.sendButtons(messageText, [ buttonAll, buttonAudio ], quickReplies);
};

import { buttonPostback, quickReply } from '../lib/facebook';
import request from 'request-promise-native';
import urls from '../lib/urls';


export default async (chat, payload) => {
    const data = await request({
        uri: urls.pushes,
        json: true,
        qs: {
            limit: 1,
            delivered: true,
        },
    });

    const push = data.results[0];

    const introHeadlines = push.intro.concat('\n')
        .concat(push.reports.map((r) => '➡ '.concat(r.headline)).join('\n'));
    const firstReport = push.reports[0];
    const button = buttonPostback(
        'Alle Infos',
        {
            action: 'report_start',
            push: push.id,
            report: firstReport.id,
            type: 'push',
        });
    const payloads = push.reports.map((r) =>
        quickReply(r.headline,
            {
                action: 'report_start',
                push: push.id,
                report: r.id,
                type: 'push',
                before: [],
            },
        ));

    return chat.sendButtons(introHeadlines, [ button ], payloads);
};

import { buttonPostback, listElement } from '../lib/facebook';
import fragmentSender from '../lib/fragmentSender';
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
    const report = push.reports;

    if (payload.intro !== false) {
        await chat.sendText(push.intro);
    }

    if (report.length === 1) {
        const data = {
            type: 'report',
            report: report.id,
        };
        await chat.sendText(report[0].headline);
        return fragmentSender(
            chat,
            report[0].next_fragments,
            data,
            report[0].text,
            report[0].media
        );
    }

    return sendList(chat, push);
};

const sendList = function(chat, push) {
    const report = push.reports;
    const elements = report.map((r) =>
        listElement(r.headline, null,
            buttonPostback(
                'Lesen 📰',
                {
                    action: 'report_start',
                    push: push.id,
                    report: r.id,
                    type: 'push',
                }),
            /\.(jpg|png|gif|jpeg)$/.test(r.media) ? r.media : null,
        )
    );

    return chat.sendList(
        elements.slice(0, 4),
        buttonPostback(
            'Reicht jetzt',
            {
                action: 'push_outro',
                push: push.id,
            })
    );
};

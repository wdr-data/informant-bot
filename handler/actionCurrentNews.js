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

    if (payload.intro !== false) {
        await chat.sendText(push.intro);
    }

    return sendList(chat, push);
};

const sendList = function(chat, push) {
    const elements = [];
    const report = push.reports;
    report.forEach((r) => {
        elements.push(listElement(r.headline, null, buttonPostback(
            'Lesen 📰',
            {
                action: 'report_start',
                push: push.id,
                report: r.id,
                type: 'push',
            }), r.media
        ));
    });

    return chat.sendList(
        elements.slice(0, 4),
        buttonPostback(
            'Reich jetzt',
            {
                action: 'push_outro',
                push: push.id,
            })
    );
};

module.exports = currentNews;

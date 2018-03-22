const { buttonPostback } = require('../lib/facebook');
const request = require('request-promise-native');
const urls = require('../lib/urls');


const currentNews = (chat) => {
    return request({
        uri: urls.pushes,
        json: true,
        qs: {
            limit: 1,
            delivered: true,
        },
    }).then((data) => {
        const push = data.results[0];

        const introHeadlines = push.intro.concat('\n')
            .concat(push.reports.map((r) => '➡ '.concat(r.headline)).join('\n'));
        const firstReport = push.reports[0];
        const button = buttonPostback(
            'Leg los',
            {
                action: 'report_start',
                push: push.id,
                report: firstReport.id,
                type: 'push',
            });
        return chat.sendButtons(introHeadlines, [ button ]);
    });
};

module.exports = currentNews;

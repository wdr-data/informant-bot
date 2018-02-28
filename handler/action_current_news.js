const { buttonPostback } = require('../lib/facebook');
const request = require('request');

const url = `${process.env.CMS_API_URL}pushes/?limit=1`;

const current_news = chat => {
  request(url, (error, res, body) => {
    const data = JSON.parse(body);
    console.log(data);

    const push = data.results[0];
    chat.sendText(push.intro);

    const introHeadlines = push.intro.concat("\n").concat(push.reports.map(r => "➡ ".concat(r.headline)).join('\n'));
    const firstReport = push.reports[0];
    const button = buttonPostback(
      'Leg los',
      {
        action: 'report_start',
        push: push.id,
        report: firstReport.id,
      });
    chat.sendButtons(introHeadlines, [button]);
  })
};

module.exports = current_news;

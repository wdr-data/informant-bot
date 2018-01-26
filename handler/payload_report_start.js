const request = require('request');
const urls = require('../lib/urls');
const fragmentSender = require('../lib/fragmentSender');

const report_start = fbLib => (psid, payload) => {
    request(`${urls.report(payload.report)}?withFragments=1`, (error, res, body) => {
        const report = JSON.parse(body);

        fragmentSender(psid, report.next_fragments, payload, report.text);
    })
};

module.exports = report_start;

const request = require('request');
const urls = require('../lib/urls');
const fragmentSender = require('../lib/fragmentSender');

const reportStart = async (chat, payload) => {
    const report = await request({
        uri: `${urls.report(payload.report)}?withFragments=1`,
        json: true,
    });

    return fragmentSender(chat, report.next_fragments, payload, report.text, report.media);
};

module.exports = reportStart;

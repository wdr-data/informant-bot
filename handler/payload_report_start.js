const request = require('request');

const url = id => `${process.env.CMS_API_URL}reports/${id}/?withFragments=1`;

const report_start = fbLib => (psid, payload) => {
    request(url(payload.report), (error, res, body) => {

        const report = JSON.parse(body);
        console.log(report);

        fbLib.sendTextMessage(psid, report.text);

    })
};

module.exports = report_start;

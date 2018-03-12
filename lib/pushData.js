const request = require('request-promise-native');
const urls = require('./urls');
const facebook = require('./facebook');

function getLatestPush(timing) {
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];

    return request.get({uri: urls.pushes, json: true, qs: {timing: timing, pub_date: isoDate, limit: 1, delivered: 0}})
        .catch(e => {
            console.log("Querying push failed: ", JSON.stringify(e, null, 2));
            throw new Error(`Querying push failed: ${e.message}`);
        })
        .then(data => {
            if (!('results' in data && data.results.length > 0)) {
                throw new Error("No Push found");
            }
            return data.results[0];
        });
}

function assemblePush(push) {
    const intro = [push.intro].concat(push.reports.map(r => `➡ ${r.headline}`)).join('\n');
    const firstReport = push.reports[0];
    const button = facebook.buttonPostback(
        'Leg los',
        {
            action: 'report_start',
            push: push.id,
            report: firstReport.id,
            type: 'push',
        });

    return {
        intro,
        button,
    }
}

function markSent(id) {
    return request.patch({
        uri: urls.push(id),
        json: true,
        body: {delivered: true},
        headers: {Authorization: 'Token ' + process.env.CMS_API_TOKEN}
    }).then(response => {
        console.log(`Updated push ${id} to delivered`, response);
    }).catch(error => {
        console.log(`Failed to update push ${id} to delivered`, error);
        throw error;
    });
}

module.exports = {
    getLatestPush,
    assemblePush,
    markSent,
};

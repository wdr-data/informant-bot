const ddb = require('../lib/dynamodb');
const { Gauge, register } = require('prom-client');
const Raven = require('raven');
const RavenLambdaWrapper = require('serverless-sentry-lib');

const subs = new Gauge({
    name: 'subscriptions',
    help: 'Subscriptions to the news pushes',
    labelNames: [ 'type' ],
});

function collectSubscriberMetrics(timing) {
    const params = {
        TableName: process.env.DYNAMODB_SUBSCRIPTIONS,
        Select: 'COUNT',
    };
    let label = timing;
    if (timing === 'morning' || timing === 'evening') {
        params.FilterExpression = `${timing} = :p`;
        params.ExpressionAttributeValues = { ':p': 1 };
    } else if (timing === 'both') {
        params.FilterExpression = 'morning = :p AND evening = :p';
        params.ExpressionAttributeValues = { ':p': 1 };
    } else {
        label = 'any';
    }
    return new Promise((resolve, reject) => {
        ddb.scan(params, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    })
        .then((data) => {
            subs.set({ type: label }, data.Count);
        });
}

module.exports.prometheus = RavenLambdaWrapper.handler(Raven, async (event, context, callback) => {

    try {
        const metrics = [
            collectSubscriberMetrics(),
            collectSubscriberMetrics('morning'),
            collectSubscriberMetrics('evening'),
            collectSubscriberMetrics('both'),
        ];

        for (const metric of metrics) {
            await metric;
        }

        callback(null, {
            statusCode: 200,
            headers: { 'Content-Type': register.contentType },
            body: register.metrics(),
        });
    } catch (e) {
        callback(e.message);
    }
});

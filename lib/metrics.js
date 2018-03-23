const AWS = require('aws-sdk');
const { Counter, register } = require('prom-client');
const request = require('request-promise-native');

const cloudwatch = new AWS.CloudWatch({
    region: 'eu-central-1',
});

register.setDefaultLabels({
    'functionName': process.env.AWS_LAMBDA_FUNCTION_NAME,
});

const promMetrics = {
    'activity_push': new Counter({
        name: 'activity_push',
        help: 'User activity on push fragments',
        labelNames: [
            'timing',
            'pushId',
            'reportId',
            'reportIndex',
            'isFirstFragment',
            'isLastFragment',
        ],
    }),
};

function reportCloudWatch(namespace, name, dimensions, value = 1) {
    const params = {
        MetricData: [
            {
                MetricName: name,
                Dimensions: Object.keys(dimensions)
                    .map((key) => ({ Name: key, Value: String(dimensions[key]) }))
                    .concat({ Name: 'FunctionName', Value: process.env.AWS_LAMBDA_FUNCTION_NAME }),
                Value: Number(value),
            },
        ],
        Namespace: namespace,
    };
    return cloudwatch.putMetricData(params).send(console.log);
}

async function pushPrometheus() {
    const metrics = register.metrics();
    await request.post({
        url: process.env.PROM_PUSH_TARGET,
        body: metrics,
        auth: {
            'user': 'api',
            'pass': process.env.PROM_PUSH_API_KEY,
        },
    });
    Object.keys(promMetrics).forEach((key) => {
        promMetrics[key].reset();
    });
}

module.exports = {
    reportCloudWatch,
    pushPrometheus,
    promMetrics,
};

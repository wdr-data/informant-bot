import AWS from 'aws-sdk';
import { Counter, register } from 'prom-client';
import request from 'request-promise-native';

const cloudwatch = new AWS.CloudWatch({
    region: 'eu-central-1',
});

register.setDefaultLabels({
    'functionName': process.env.AWS_LAMBDA_FUNCTION_NAME,
});

export const promMetrics = {
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

export function reportCloudWatch(namespace, name, dimensions, value = 1) {
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

export async function pushPrometheus() {
    if (!process.env.PROM_PUSH_TARGET) {
        return;
    }

    const metrics = register.metrics();
    try {
        await request.post({
            url: process.env.PROM_PUSH_TARGET,
            body: metrics,
            auth: {
                'user': 'api',
                'pass': process.env.PROM_PUSH_API_KEY,
            },
            timeout: 2000,
        });
        Object.keys(promMetrics).forEach((key) => {
            promMetrics[key].reset();
        });
    } catch (error) {
        // fail silently
        console.error('Sending metrics to pushgateway failed:', error);
    }
}

export default {
    reportCloudWatch,
    pushPrometheus,
    promMetrics,
};

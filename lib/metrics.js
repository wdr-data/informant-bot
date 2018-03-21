const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch({
    region: 'eu-central-1',
});

function reportCloudWatch(namespace, name, dimensions, value = 1) {
    const params = {
        MetricData: [{
            MetricName: name,
            Dimensions: Object.keys(dimensions)
                .map(key => ({ Name: key, Value: String(dimensions[key]) }))
                .concat({ Name: 'FunctionName', Value: process.env.AWS_LAMBDA_FUNCTION_NAME }),
            Value: Number(value),
        }],
        Namespace: namespace,
    };
    return cloudwatch.putMetricData(params).send(console.log);
}

module.exports = {
    reportCloudWatch,
};

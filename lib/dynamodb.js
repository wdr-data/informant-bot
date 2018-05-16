import AWS from 'aws-sdk';

export default new AWS.DynamoDB.DocumentClient({
    region: 'eu-central-1',
});

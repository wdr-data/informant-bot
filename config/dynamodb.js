const fs = require('fs');
const yaml = require('js-yaml');

const tableProps = {
    "attachments": {
        AttributeDefinitions: [{
            AttributeName: 'url',
            AttributeType: 'S',
        }],
        KeySchema: [{
            AttributeName: 'url',
            KeyType: 'HASH',
        }],
    },
};

const loadConfig = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('./serverless.yml', (err, buf) => {
            if (err) {
                return reject(err);
            }
            resolve(yaml.safeLoad(buf.toString()));
        });
    });
};

const tableNames = stage => {
    return loadConfig().then(config => Object.keys(tableProps).reduce((acc, name) => {
        acc[name] = `${config.service}-${stage}-${name}`;
        return acc;
    }, {}))
};

const tableConfig = stage => {
    return tableNames(stage).then(tables => Object.keys(tables).reduce((acc, name) => {
        acc[`DynamodbTable${name}`] = {
            Type: 'AWS::DynamoDB::Table',
            DeletionPolicy: 'Retain',
            Properties: Object.assign({
                TableName: tables[name],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 1,
                },
            }, tableProps[name]),
        };
        return acc;
    }, {}));
};

const tableEnv = stage => {
    return tableNames(stage).then(tables => Object.keys(tables).reduce((acc, name) => {
        acc[`DYNAMODB_${name.toUpperCase()}`] = tables[name];
        return acc;
    }, {}));
};

module.exports = {
    tableSpec: tableProps,
    tableNames,
    tableConfig,
    tableEnv,
};

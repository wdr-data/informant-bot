const { loadConfig } = require('./util');

const tableProps = {
    'users': {
        AttributeDefinitions: [
            {
                AttributeName: 'psid',
                AttributeType: 'S',
            },
            {
                AttributeName: 'uuid',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'psid',
                KeyType: 'HASH',
            },

        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'uuid_to_psid',
                KeySchema: [
                    {
                        AttributeName: 'uuid',
                        KeyType: 'HASH',
                    },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 3,
                    WriteCapacityUnits: 3,
                },
            },
        ],
    },
    'attachments': {
        AttributeDefinitions: [
            {
                AttributeName: 'url',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'url',
                KeyType: 'HASH',
            },
        ],
    },
    'subscriptions': {
        AttributeDefinitions: [
            {
                AttributeName: 'psid',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'psid',
                KeyType: 'HASH',
            },
        ],
    },
    'audios': {
        AttributeDefinitions: [
            {
                AttributeName: 'url',
                AttributeType: 'S',
            },
            {
                AttributeName: 'time',
                AttributeType: 'N',
            },
            {
                AttributeName: 'date',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'url',
                KeyType: 'HASH',
            },
            {
                AttributeName: 'time',
                KeyType: 'RANGE',
            },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'dateIndex',
                KeySchema: [
                    {
                        AttributeName: 'date',
                        KeyType: 'HASH',
                    },
                    {
                        AttributeName: 'time',
                        KeyType: 'RANGE',
                    },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 1,
                },
            },
        ],
    },
    'tracking': {
        AttributeDefinitions: [
            {
                AttributeName: 'psid',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'psid',
                KeyType: 'HASH',
            },
        ],
    },
    'userStates': {
        AttributeDefinitions: [
            {
                AttributeName: 'psid',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'psid',
                KeyType: 'HASH',
            },
        ],
    },
};

const tableNames = (stage) => {
    return loadConfig().then((config) => Object.keys(tableProps).reduce((acc, name) => {
        acc[name] = `${config.service}-${stage}-${name}`;
        return acc;
    }, {}));
};

const tableConfig = (stage) => {
    return tableNames(stage).then((tables) => Object.keys(tables).reduce((acc, name) => {
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

const tableEnv = (stage) => {
    return tableNames(stage).then((tables) => Object.keys(tables).reduce((acc, name) => {
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

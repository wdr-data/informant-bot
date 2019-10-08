import ddb from './dynamodb';

export default class DynamoDbCrud {
    constructor(tableName, idName) {
        this.tableName = tableName;
        this.idName = idName;
    }

    async create(id, item = {}) {
        return ddb.put({
            TableName: this.tableName,
            Item: Object.assign(item, { [this.idName]: id }),
            ConditionExpression: `attribute_not_exists(#idName)`,
            ExpressionAttributeNames: {
                '#idName': this.idName,
            },
        }).promise();
    }

    async load(id) {
        const res = await ddb.get({
            TableName: this.tableName,
            Key: {
                [this.idName]: id,
            },
        }).promise();

        return res.Item;
    }

    async update(id, key, value) {
        const res = await ddb.update({
            TableName: this.tableName,
            Key: {
                [this.idName]: id,
            },
            UpdateExpression: 'SET #key = :value',
            ExpressionAttributeNames: {
                '#key': key,
            },
            ExpressionAttributeValues: {
                ':value': value,
            },
            ReturnValues: 'ALL_NEW',
        }).promise();

        return res.Attributes;
    }

    async inc(id, key) {
        const res = await ddb.update({
            TableName: this.tableName,
            Key: {
                [this.idName]: id,
            },
            UpdateExpression: 'SET #key = #key + :value',
            ExpressionAttributeNames: {
                '#key': key,
            },
            ExpressionAttributeValues: {
                ':value': 1,
            },
            ReturnValues: 'ALL_NEW',
        }).promise();

        return res.Attributes;
    }

    async remove(id) {
        return ddb.delete({
            TableName: this.tableName,
            Key: {
                [this.idName]: id,
            },
        }).promise();
    }
}

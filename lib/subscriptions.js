import ddb from './dynamodb';

const tableName = process.env.DYNAMODB_SUBSCRIPTIONS;

export function create(psid, item = {}) {
    if (item.morning !== undefined) {
        item.morning = item.morning ? 1 : 0;
    }

    if (item.evening !== undefined) {
        item.evening = item.evening ? 1 : 0;
    }

    return new Promise((resolve, reject) => ddb.put({
        TableName: tableName,
        Item: Object.assign(item, { psid }),
        ConditionExpression: 'attribute_not_exists(psid)',
    }, (err) => {
        if (err) {
            return reject(err);
        }
        resolve();
    }));
}

export function load(psid) {
    return new Promise((resolve, reject) => ddb.get({
        TableName: tableName,
        Key: {
            psid: psid,
        },
        ProjectionExpression: '',
    }, (err, res) => {
        if (err) {
            return reject(err);
        }

        resolve({
            psid: res.Attributes.psid,
            morning: !!res.Attributes.morning,
            evening: !!res.Attributes.evening,
        });
    }));
}

export function update(psid, timing, status) {
    return new Promise((resolve, reject) => ddb.update({
        TableName: tableName,
        Key: {
            psid: psid,
        },
        UpdateExpression: 'SET #timing = :status',
        ExpressionAttributeNames: {
            '#timing': timing,
        },
        ExpressionAttributeValues: {
            ':status': status ? 1 : 0,
        },
        ReturnValues: 'ALL_NEW',
    }, (err, res) => {
        if (err) {
            return reject(err);
        }
        resolve({
            psid: res.Attributes.psid,
            morning: !!res.Attributes.morning,
            evening: !!res.Attributes.evening,
        });
    }));
}

export function remove(psid) {
    return new Promise((resolve, reject) => ddb.delete({
        TableName: tableName,
        Key: {
            psid: psid,
        },
    }, (err) => {
        if (err) {
            return reject(err);
        }
        resolve();
    }));
}

export default {
    create,
    load,
    update,
    remove,
};

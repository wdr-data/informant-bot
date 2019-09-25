import ddb from './dynamodb';

const tableName = process.env.DYNAMODB_SUBSCRIPTIONS;

export async function create(psid, item = {}) {
    if (item.morning !== undefined) {
        item.morning = item.morning ? 1 : 0;
    }

    if (item.evening !== undefined) {
        item.evening = item.evening ? 1 : 0;
    }

    if (item.breaking !== undefined) {
        item.breaking = item.breaking ? 1 : 0;
    }

    return ddb.put({
        TableName: tableName,
        Item: Object.assign(item, { psid }),
        ConditionExpression: 'attribute_not_exists(psid)',
    }).promise();
}

export async function load(psid) {
    const res = await ddb.get({
        TableName: tableName,
        Key: {
            psid,
        },
    }).promise();

    if (!res.Item) {
        return undefined;
    }

    return {
        psid: res.Item.psid,
        morning: !!res.Item.morning,
        evening: !!res.Item.evening,
        breaking: !!res.Item.breaking,
    };
}

export async function update(psid, timing, status) {
    const res = await ddb.update({
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
    }).promise();

    return {
        psid: res.Attributes.psid,
        morning: !!res.Attributes.morning,
        evening: !!res.Attributes.evening,
        breaking: !!res.Attributes.breaking,
    };
}

export async function remove(psid) {
    return ddb.delete({
        TableName: tableName,
        Key: {
            psid: psid,
        },
    }).promise();
}

export default {
    create,
    load,
    update,
    remove,
};

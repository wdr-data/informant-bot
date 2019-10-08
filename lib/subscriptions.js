import DynamoDbCrud from './dynamodbCrud';

const tableName = process.env.DYNAMODB_SUBSCRIPTIONS;

const ddbCrud = new DynamoDbCrud(tableName, 'psid');

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

    return ddbCrud.create(psid, item);
}

export async function load(psid) {
    const item = await ddbCrud.load(psid);

    if (!item) {
        return undefined;
    }

    return {
        psid: item.psid,
        morning: !!item.morning,
        evening: !!item.evening,
        breaking: !!item.breaking,
    };
}

export async function update(psid, timing, status) {
    const item = await ddbCrud.update(psid, timing, status ? 1 : 0);

    return {
        psid: item.psid,
        morning: !!item.morning,
        evening: !!item.evening,
        breaking: !!item.breaking,
    };
}

export async function remove(psid) {
    return ddbCrud.remove(psid);
}

export default {
    create,
    load,
    update,
    remove,
};

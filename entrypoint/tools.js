import ddb from '../lib/dynamodb';
import subscriptions from '../lib/subscriptions';

function getSubs(start = null, limit = 25) {
    const params = {
        Limit: limit,
        TableName: process.env.DYNAMODB_SUBSCRIPTIONS,
    };

    if (start) {
        params.ExclusiveStartKey = start;
    }
    return new Promise((resolve, reject) => {
        ddb.scan(params, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve({ subs: data.Items, last: data.LastEvaluatedKey });
        });
    });
}

export const updateBreakingSubscriptions = async (event) => {
    let start;
    do {
        const { subs, last } = await getSubs(start);
        start = last;

        if (!subs || !subs.length) {
            break;
        }

        await Promise.all(
            subs.filter(
                (sub) => sub.breaking === undefined
            ).map(
                (sub) => {
                    console.log(`${sub.psid}: ${sub.morning || sub.evening}`);
                    return subscriptions.update(sub.psid, 'breaking', sub.morning || sub.evening);
                }
            )
        );
    } while (start);

    return 'Done.';
};

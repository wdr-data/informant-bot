import dynamoDb from '../lib/dynamodb';
const tableName = process.env.DYNAMODB_AUDIOS;


export default async (chat, payload) => {
    let item;
    try {
        item = await newestItem();
    } catch (e) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        item = await newestItem(yesterday);
    }

    await chat.sendText(`Deine ` + item.title + `.`);
    return chat.sendAttachment(item.url);
};

function newestItem(date = null) {
    if (date === null) {
        date = new Date();
    }

    const newestParam = {
        TableName: tableName,
        IndexName: 'dateIndex',
        KeyConditionExpression: '#dateattr = :date',
        ExpressionAttributeNames: {
            '#dateattr': 'date',
        },
        ExpressionAttributeValues: {
            ':date': date.toISOString().split('T')[0],
        },
        ScanIndexForward: false,
        Limit: 1,
    };

    return new Promise((resolve, reject) => {
        dynamoDb.query(newestParam, (err, result) => {
            // handle potential errors
            if (err) {
                reject(err);
                return;
            }

            // create a response
            if (result.Items && result.Items.length > 0) {
                resolve(result.Items[0]);
            } else {
                reject('No audio file found');
            }
        });
    });
}

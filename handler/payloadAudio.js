import dynamoDb from '../lib/dynamodb';
const tableName = process.env.DYNAMODB_AUDIOS;


export default async (chat, payload) => {
    const newestParam = {
        TableName: tableName,
        IndexName: 'dateIndex',
        KeyConditionExpression: '#dateattr = :date',
        ExpressionAttributeNames: {
            '#dateattr': 'date',
        },
        ExpressionAttributeValues: {
            ':date': new Date().toISOString().split('T')[0],
        },
        ScanIndexForward: false,
        Limit: 1,
    };

    const newestItem = await new Promise((resolve, reject) => {
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
    await chat.sendText(`Deine ` + newestItem.title + `.`);
    return chat.sendAttachment(newestItem.url);
};

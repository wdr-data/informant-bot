import { guessAttachmentType } from './facebook';
import request from 'request-promise-native';

import dynamoDb from './dynamodb';
const tableName = process.env.DYNAMODB_ATTACHMENTS;

export const getAttachmentId = async function(url, type) {
    console.log(`Uploading file at "${url}" with type "${type}"`);

    try {
        const id = await new Promise((resolve, reject) => {
            const callParam = {
                TableName: tableName,
                Key: {
                    url: url,
                },
            };

            dynamoDb.get(callParam, (err, result) => {
                // handle potential errors
                if (err) {
                    reject(err);
                    return;
                }

                // create a response
                if (result.Item && 'attachment_id' in result.Item) {
                    resolve(result.Item.attachment_id);
                } else {
                    reject('Not found!');
                }
            });
        });
        console.log(`Got ID from DB: ${id}`);

        return id;
    } catch (e) {
        console.log(`Uploading file...`);

        const id = await uploadAttachment(url, type);

        console.log(`Uploaded and resolved to id: ${id}`);

        const putParam = {
            TableName: tableName,
            Item: {
                url,
                'attachment_id': id,
            },
        };

        return new Promise((resolve, reject) => {
            dynamoDb.put(putParam, (err) => {
                // handle potential errors
                if (err) {
                    reject(err);
                    return;
                }

                resolve(id);
            });
        });
    }
};

const uploadAttachment = async function(url, type = null) {
    const payload = {
        'message': {
            'attachment': {
                'type': type !== null ? type : guessAttachmentType(url),
                'payload': {
                    'url': url,
                    'is_reusable': true,
                },
            },
        },
    };

    const result = await request.post({
        uri: 'https://graph.facebook.com/v6.0/me/message_attachments',
        json: true,
        qs: {
            'access_token': process.env.FB_PAGETOKEN,
        },
        body: payload,
        timeout: 25000,
    });

    return result['attachment_id'];
};

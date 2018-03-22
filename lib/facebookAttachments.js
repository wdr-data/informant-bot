const { guessAttachmentType } = require('./facebook');
const request = require('request-promise-native');

const dynamoDb = require('./dynamodb');
const tableName = process.env.DYNAMODB_ATTACHMENTS;

module.exports.getAttachmentId = function (url, type) {
    return new Promise((resolve, reject) => {
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
                reject("Not found!");
            }
        });
    })
        .catch(() => uploadAttachment(url, type))
        .then(id => {
            const putParam = {
                TableName: tableName,
                Item: {
                    url,
                    'attachment_id': id,
                },
            };

            return new Promise((resolve, reject) => {
                dynamoDb.put(putParam, err => {
                    // handle potential errors
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(id);
                });
            });
        });
};

const uploadAttachment = function (url, type = null) {
    const payload = {
        "message": {
            "attachment": {
                "type": type !== null ? type : guessAttachmentType(url),
                "payload": {
                    "url": url,
                    "is_reusable": true,
                },
            },
        },
    };

    return request.post({
        uri: "https://graph.facebook.com/v2.6/me/message_attachments",
        json: true,
        qs: {
            'access_token': process.env.FB_PAGETOKEN,
        },
        body: payload,
        timeout: 25000,
    }).then(response => response['attachment_id']);
};

import Raven from 'raven';
import RavenLambdaWrapper from 'serverless-sentry-lib';
import request from 'request-promise-native';
import { load } from 'cheerio';
import { getAttachmentId } from '../lib/facebookAttachments';
import dynamoDb from '../lib/dynamodb';
const tableName = process.env.DYNAMODB_AUDIOS;

export const scrape = RavenLambdaWrapper.handler(Raven, async (event, context, callback) => {
    try {
        const audioResponse = await request({
            uri: process.env.INFOS_AUDIO_URL,
        });
        const $ = load(audioResponse, { xmlMode: true });
        const url = $('rss > channel > item').first().find('enclosure')[0].attribs.url;
        const title = $('rss > channel > item').first().find('title').text();
        const existsParam = {
            TableName: tableName,
            KeyConditionExpression: '#urlattr = :url',
            ExpressionAttributeNames: {
                '#urlattr': 'url',
            },
            ExpressionAttributeValues: {
                ':url': url,
            },
        };

        const exists = await new Promise((resolve, reject) => {
            dynamoDb.query(existsParam, (err, result) => {
                // handle potential errors
                if (err) {
                    reject(err);
                    return;
                }

                // create a response
                if (result.Items && result.Items.length > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });

        if (exists) {
            return callback(null, {
                statusCode: 200,
                body: 'Audio already parsed',
            });
        }

        await getAttachmentId(url);

        const putParam = {
            TableName: tableName,
            Item: {
                url,
                time: Math.floor(new Date()),
                date: new Date().toISOString().split('T')[0],
                title,
            },
        };

        await new Promise((resolve, reject) => {
            dynamoDb.put(putParam, (err) => {
                // handle potential errors
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        return callback(null, {
            statusCode: 200,
            body: 'Audio parsed successfully: ' + url,
        });
    } catch (e) {
        console.error(e);
        callback(null, {
            statusCode: 500,
            body: e.message,
        });
        throw e;
    }
});

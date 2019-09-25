import request from 'request-promise-native';
import Raven from 'raven';
import RavenLambdaWrapper from 'serverless-sentry-lib';
import * as aws from 'aws-sdk';

import getTiming from '../lib/timing';
import urls from '../lib/urls';
import fragmentSender from '../lib/fragmentSender';
import { assemblePush, getLatestPush, markSent } from '../lib/pushData';
import { Chat } from '../lib/facebook';
import ddb from '../lib/dynamodb';
import subscriptions from '../lib/subscriptions';

export const proxy = RavenLambdaWrapper.handler(Raven, async (event) => {
    const params = {
        stateMachineArn: process.env.statemachine_arn,
        input: typeof event === 'string' ? event : JSON.stringify(event),
    };

    const stepfunctions = new aws.StepFunctions();

    await stepfunctions.startExecution(params).promise();
    console.log('started execution of step function');
    return {
        statusCode: 200,
        body: 'OK',
    };
});

export const fetch = RavenLambdaWrapper.handler(Raven, async (event) => {
    console.log(JSON.stringify(event, null, 2));

    if (event.report) {
        try {
            const report = await request({
                uri: `${urls.report(event.report)}?withFragments=1`,
                json: true,
            });
            console.log('Starting to send report with id:', report.id);
            return {
                state: 'nextChunk',
                timing: 'breaking',
                type: 'report',
                data: report,
            };
        } catch (error) {
            console.log('Sending report failed: ', JSON.stringify(error, null, 2));
            throw error;
        }
    }

    // check if timing is right
    let timing;
    try {
        timing = getTiming(event);
    } catch (e) {
        console.log(e);
        return { state: 'finished' };
    }

    try {
        const push = await getLatestPush(timing, { delivered: 0 });
        console.log('Starting to send push with id:', push.id);
        return {
            state: 'nextChunk',
            timing,
            type: 'push',
            data: push,
        };
    } catch (error) {
        console.log('Sending push failed: ', JSON.stringify(error, null, 2));
        throw error;
    }
});

const handlePushFailed = async (chat, error) => {
    console.error(error);

    if (error.error.code === 'ETIMEDOUT') {
        console.error('Request timed out!');
        Raven.captureException(error);
        return;
    } else if (error.statusCode !== 400) {
        console.error('Not a bad request!');
        Raven.captureException(error);
        return;
    }

    // Handle FB error codes
    const resp = error.error.error; // Yes, this is real

    // 551: This person isn't available right now.
    // 100 / 2018001: No matching user found
    if (resp.code === 551 || resp.code === 100 && resp['error_subcode'] === 2018001) {
        console.log(`Deleting user ${chat.psid} due to code ${resp.code}`);
        return subscriptions.remove(chat.psid);
    } else {
        console.error(`Unknown error code ${resp.code}!`);
        Raven.captureException(error);
    }
};

export const send = RavenLambdaWrapper.handler(Raven, async (event) => {
    console.log('attempting to push chunk for push', event.push.id);


    try {
        const { users, last } = await getUsers(event.timing, event.start);

        if (users.length === 0) {
            return {
                state: 'finished',
                id: event.data.id,
                type: event.type,
            };
        }

        if (event.type === 'report') {
            const report = event.data;
            const payload = {
                action: 'report_start',
                report: report.id,
                type: 'report',
            };

            if (report.is_quiz) {
                payload.quiz = true;
            }
            if (report.link) {
                payload.link = report.link;
            }
            if (report.audio) {
                payload.audio = report.audio;
            }

            await Promise.all(users.map((user) => {
                const chat = new Chat({ sender: { id: user.psid } });
                return fragmentSender(
                    chat, report.next_fragments, payload, `🚨 ${report.text}`, report.media
                ).catch((err) => Raven.captureException(err));
            }));
        } else if (event.type === 'push') {
            const { intro, buttons, quickReplies } = assemblePush(event.data);
            await Promise.all(users.map((user) => {
                const chat = new Chat({ sender: { id: user.psid } });
                return chat.sendButtons(
                    intro,
                    buttons,
                    quickReplies,
                    { timeout: 20000, messagingType: 'NON_PROMOTIONAL_SUBSCRIPTION' }
                ).catch((err) => handlePushFailed(chat, err));
            }));
        }
        console.log(`${event.type} sent to ${users.length} users`);

        // LastEvaluatedKey is empty, scan is finished
        if (!last) {
            return {
                state: 'finished',
                id: event.data.id,
                type: event.type,
            };
        }

        return {
            state: 'nextChunk',
            timing: event.timing,
            type: event.type,
            data: event.data,
            start: last,
        };
    } catch (err) {
        console.error('Sending failed:', err);
        throw err;
    }
});

export function getUsers(timing, start = null, limit = 50) {
    const params = {
        Limit: limit,
        TableName: process.env.DYNAMODB_SUBSCRIPTIONS,
    };
    if (timing === 'morning' || timing === 'evening') {
        params.FilterExpression = `${timing} = :p`;
        params.ExpressionAttributeValues = { ':p': 1 };
    }
    if (start) {
        params.ExclusiveStartKey = start;
    }
    return new Promise((resolve, reject) => {
        ddb.scan(params, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve({ users: data.Items, last: data.LastEvaluatedKey });
        });
    });
}

export const finish = RavenLambdaWrapper.handler(Raven, function(event, context, callback) {
    console.log(`Sending of ${event.type} finished:`, event);

    if (!event.id) {
        return callback(null, {});
    }

    markSent(event.id, event.type)
        .then(() => callback(null, {}))
        .catch((err) => callback(err, {}));
});

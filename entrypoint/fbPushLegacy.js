import getTiming from '../lib/timing';
import { assemblePush, getLatestPush, markSent } from '../lib/pushData';
import { Chat } from '../lib/facebook';
import ddb from '../lib/dynamodb';
import Raven from 'raven';
import RavenLambdaWrapper from 'serverless-sentry-lib';
import * as aws from 'aws-sdk';

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

    // check if timing is right
    let timing;
    try {
        timing = getTiming(event);
    } catch (e) {
        throw e;
    }

    try {
        const push = await getLatestPush(timing, { delivered: 0 });
        console.log('Starting to send push with id:', push.id);
        return {
            state: 'nextChunk',
            timing,
            push,
        };
    } catch (error) {
        console.log('Sending push failed: ', JSON.stringify(error, null, 2));
        throw error;
    }
});

export const send = RavenLambdaWrapper.handler(Raven, async (event) => {
    console.log('attempting to push chunk for push', event.push.id);

    const { intro, buttons, quickReplies } = assemblePush(event.push);

    try {
        const { users, last } = await getUsers(event.timing, event.start);

        if (users.length === 0) {
            const exit = new Error('No more users');
            exit.name = 'users-empty';
            throw exit;
        }

        await Promise.all(users.map((user) => {
            const chat = new Chat({ sender: { id: user.psid } });
            return chat.sendButtons(intro, buttons, quickReplies).catch(console.error);
        }));

        console.log(`Push sent to ${users.length} users`);
        return {
            state: 'nextChunk',
            timing: event.timing,
            push: event.push,
            start: last,
        };
    } catch (err) {
        if (err.name === 'users-empty') {
            return {
                state: 'finished',
                id: event.push.id,
            };
        }
        console.error('Sending failed:', err);
        throw err;
    }
});

export function getUsers(timing, start = null, limit = 100) {
    const params = {
        Limit: limit,
        TableName: process.env.DYNAMODB_SUBSCRIPTIONS,
    };
    if (timing === 'morning' || timing === 'evening') {
        params.FilterExpression = `${timing} = :p`;
        params.ExpressionAttributeValues = { ':p': 1 };
    }
    if (start) {
        params.ExclusiveStartKey = { 'psid': start };
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
    console.log('Sending of push finished:', event);
    markSent(event.id)
        .then(() => callback(null, {}))
        .catch((err) => callback(err, {}));
});

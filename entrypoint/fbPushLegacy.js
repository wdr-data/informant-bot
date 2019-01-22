import getTiming from '../lib/timing';
import { assemblePush, getLatestPush, markSent } from '../lib/pushData';
import { Chat } from '../lib/facebook';
import ddb from '../lib/dynamodb';
import Raven from 'raven';
import RavenLambdaWrapper from 'serverless-sentry-lib';
import * as aws from 'aws-sdk';


export const proxy = (event, context, callback) => {
    const params = {
        stateMachineArn: process.env.statemachine_arn,
        input: JSON.stringify(event),
    };

    const stepfunctions = new aws.StepFunctions();
    stepfunctions.startExecution(params, function(err, data) {
        if (err) {
            console.log('err while executing step function:', err);
        } else {
            console.log('started execution of step function');
        }
    });
};


export const fetch = RavenLambdaWrapper.handler(Raven, function(event, context, callback) {
    console.log(JSON.stringify(event, null, 2));

    // check if timing is right
    let timing;
    try {
        timing = getTiming(event);
    } catch (e) {
        callback(e);
        return;
    }

    getLatestPush(timing, { delivered: 0 })
        .then((push) => {
            console.log('Starting to send push with id:', push.id);
            callback(null, {
                state: 'nextChunk',
                timing,
                push,
            });
        })
        .catch((error) => {
            console.log('Sending push failed: ', JSON.stringify(error, null, 2));
            callback(error);
        });
});

export const send = RavenLambdaWrapper.handler(Raven, function(event, context, callback) {
    console.log('attempting to push chunk for push', event.push.id);

    const { intro, buttons, quickReplies } = assemblePush(event.push);

    let count = 0;
    let lastUser;
    getUsers(event.timing, event.start)
        .then((users) => {
            if (users.length === 0) {
                const exit = new Error('No more users');
                exit.name = 'users-empty';
                throw exit;
            }
            count = users.length;
            lastUser = users[users.length-1];
            return users;
        })
        .then((users) => Promise.all(users.map((user) => {
            const chat = new Chat({ sender: { id: user.psid } });
            return chat.sendButtons(intro, buttons, quickReplies).catch(console.error);
        })))
        .then(() => {
            console.log(`Push sent to ${count} users`);
            callback(null, {
                state: 'nextChunk',
                timing: event.timing,
                push: event.push,
                start: lastUser.psid,
            });
        })
        .catch((err) => {
            if (err.name === 'users-empty') {
                return callback(null, {
                    state: 'finished',
                    id: event.push.id,
                });
            }
            console.error('Sending failed:', err);
            throw err;
        });
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
            resolve(data.Items);
        });
    });
}

export const finish = RavenLambdaWrapper.handler(Raven, function(event, context, callback) {
    console.log('Sending of push finished:', event);
    markSent(event.id)
        .then(() => callback(null, {}))
        .catch((err) => callback(err, {}));
});

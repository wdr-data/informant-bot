const getTiming = require('../lib/timing');
const { assemblePush, getLatestPush, markSent } = require('../lib/pushData');
const facebook = require('../lib/facebook');
const ddb = require('../lib/dynamodb');


module.exports.fetch = function(event, context, callback) {
    console.log(JSON.stringify(event, null, 2));

    // check if timing is right
    let timing;
    try {
        timing = getTiming(event);
    } catch(e) {
        callback(e);
        return;
    }

    getLatestPush(timing, { delivered: 0 })
        .then(push => {
            console.log("Starting to send push with id:", push.id);
            callback(null, {
                state: "nextChunk",
                timing,
                push,
            });
        })
        .catch(error => {
            console.log("Sending push failed: ", JSON.stringify(error, null, 2));
            callback(error);
        });
};

module.exports.send = function(event, context, callback) {
    console.log("attempting to push chunk for push", event.push.id);

    const { intro, button } = assemblePush(event.push);

    let count = 0;
    let lastUser;
    getUsers(event.timing, event.start)
        .then(users => {
            console.log(users);
            if(users.length === 0) {
                const exit = new Error("No more users");
                exit.name = 'users-empty';
                throw exit;
            }
            count = users.length;
            lastUser = users[users.length-1];
            return users;
        })
        .then(users => Promise.all(users.map(user => {
            const chat = new facebook.Chat({sender: {id: user.psid}});
            return chat.sendButtons(intro, [button]).catch(console.error);
        })))
        .then(() => {
            console.log(`Push sent to ${count} users`);
            callback(null, {
                state: "nextChunk",
                timing: event.timing,
                push: event.push,
                start: lastUser.psid,
            });
        })
        .catch(err => {
            if (err.name === 'users-empty') {
                return callback(null, {
                    state: "finished",
                    id: event.push.id,
                });
            }
            console.error("Sending failed:", err);
            throw err;
        });
};

function getUsers(timing, start = null, limit = 100) {
    const params = {
        Limit: limit,
        TableName: process.env.DYNAMODB_SUBSCRIPTIONS,
    };
    if (timing === 'morning' || timing === 'evening') {
        params.FilterExpression = `${timing} = :p`;
        params.ExpressionAttributeValues = {":p": 1};
    }
    if(start) {
        params.ExclusiveStartKey = {"psid": start};
    }
    return new Promise((resolve, reject) => {
        ddb.scan(params, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data.Items);
        })
    });
}
module.exports.getUsers = getUsers;

module.exports.finish = function(event, context, callback) {
    console.log("Sending of push finished:", event);
    markSent(event.id)
        .then(() => callback(null, {}))
        .catch(err => callback(err, {}));
};

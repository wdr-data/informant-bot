const fs = require('mz/fs');
const pako = require('pako');
const AWS = require('aws-sdk');
const fb = require('./lib/facebook');

const ddb = new AWS.DynamoDB.DocumentClient({
    region: 'eu-central-1',
});
const TABLE_NAME = 'tim-bot-prod-subscriptions';

const baseDir = "/Users/marcus/tmp/tim-bot-logs/e41f8376-f9ed-4797-b3e1-40eb785fc5a5";

const psid_collection = new Set();

const findUsers = async function() {
    const folders = await fs.readdir(baseDir);
    for(const folder of folders) {
        if(folder.startsWith('.')) {
            continue;
        }

        const packed = await fs.readFile(`${baseDir}/${folder}/000000.gz`);
        const content = pako.inflate(packed, { to: 'string' });
        const events = content.split("\n\n").forEach(ev => {
            const parts = ev.split("\t");
            const timestamp = parts[0].substr(0, 24);
            console.error(`Searching at ${timestamp}...`);

            const special = parts[0].substr(25).split(' ');
            if(special.length > 1) {
                return;
            }

            const msg = parts[2];

            try {
                const pl = JSON.parse(msg);
                if(!('recipient' in pl && 'id' in pl.recipient)) {
                    return;
                }
                console.error(`Found psid: ${pl.recipient.id}`);
                psid_collection.add(pl.recipient.id);
            } catch(e) {
                return;
            }
        });
    }

    const stream = fs.createWriteStream('psid.list');
    for(psid of psid_collection) {
        stream.write(`${psid}\n`);
    }
    stream.end();
};

const storeUser = async function(psid, item = {}) {
    return new Promise((resolve, reject) => ddb.put({
        TableName: TABLE_NAME,
        Item: Object.assign(item, { psid }),
    }, err => {
        if(err) {
            return reject(err);
        }
        resolve();
    }));
};

const updateUser = async function(psid, item = none, status = 0) {
    return new Promise((resolve, reject) => ddb.update({
        TableName: TABLE_NAME,
        Key: {
            psid: psid
        },
        UpdateExpression: "set #item = :status",
        ExpressionAttributeNames:{
            "#item":item
        },
        ExpressionAttributeValues:{
            ":status":status
        },
        ReturnValues:"ALL_NEW",
    }, (err, res) => {
        if(err) {
            return reject(err);
        }
        return res;
    }));
};

const deleteUser = async function(psid) {
    return new Promise((resolve, reject) => ddb.delete({
        TableName: TABLE_NAME,
        Key: {
            psid: psid
        },
    }, err => {
        if(err) {
            return reject(err);
        }
        resolve();
    }));
};

const persistUsers = async function() {
    const psids = (await fs.readFile('psid.list', 'utf-8')).split("\n").slice(99);
    let i = 0;
    for(psid of psids) {
        i++;
        const chat = new fb.Chat({ sender: { id: psid } });

        let labels = [];
        try {
            labels = await chat.getLabels();
        } catch(e) {
            console.error(e);
            continue;
        }

        if (labels.length === 0) {
            continue;
        }

        const item = {
            morning: (labels.indexOf('push-morning') !== -1) ? 1 : 0,
            evening: (labels.indexOf('push-evening') !== -1) ? 1 : 0,
        };

        await storeUser(psid, item);

        if (i % 10 === 0 || i === psids.length-1) {
            console.error(`PROGRESS: ${i/psids.length*100}%`);
        }
    }
};

module.exports = {
    findUsers,
    storeUser,
    updateUser,
    deleteUser,
    persistUsers,
};

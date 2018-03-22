const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const request = require('request-promise-native');
const S3 = require('aws-sdk/clients/s3');

const requiredEnv = [
    'FB_PAGETOKEN',
    'FB_VERIFYTOKEN',
    'DF_PROJECTID',
    'CMS_API_URL',
    'CMS_API_TOKEN',
];

const loadConfig = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('./serverless.yml', (err, buf) => {
            if (err) {
                return reject(err);
            }
            resolve(yaml.safeLoad(buf.toString()));
        });
    });
};

const loadS3 = (filename, json = false) => {
    const branch = process.env.TRAVIS_BRANCH || process.env.BRANCH;
    const s3client = new S3({ region: 'eu-central-1' });
    const s3path = `${branch}/${filename}`;
    const uri = s3client.getSignedUrl('getObject', {
        Bucket: 'wdr-tim-bot-env',
        Key: s3path,
    });
    return request({ uri, json })
        .catch((err) => {
            throw new Error(`Fetching env from S3 (${s3path}) failed with: ` +
                `${err.name === 'StatusCodeError' ? err.statusCode : err.message}`);
        });
};

let envCache = null;
const fetchEnv = () => {
    if (envCache) {
        return Promise.resolve(envCache);
    }

    if ('CI' in process.env) {
        return loadS3('env.json', true)
            .then((env) => {
                envCache = env;
                return env;
            });
    }

    const dotenvPath = path.resolve(__dirname, '../.env.yml');
    const environment = {};
    if (fs.existsSync(dotenvPath)) {
        Object.assign(environment, yaml.safeLoad(fs.readFileSync(dotenvPath, 'utf8')));
    }

    requiredEnv.forEach((key) => {
        if (key in process.env) {
            environment[key] = process.env[key];
        }
    });

    envCache = environment;
    return Promise.resolve(environment);
};

const getStage = () => {
    return fetchEnv().then((env) => process.env.SLS_STAGE || env['DEPLOY_ALIAS'] || 'dev');
};

module.exports = {
    fetchEnv: fetchEnv,
    loadConfig,
    loadS3: loadS3,
    getStage,
    requiredEnv: requiredEnv,
};

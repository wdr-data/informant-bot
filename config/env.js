const yaml = require('js-yaml');
const fs   = require('fs');
const path = require('path');
const S3 = require('aws-sdk/clients/s3');
const request = require('request-promise-native');
const { tableConfig, tableEnv } = require('./dynamodb');

const required_env = [
    'FB_PAGETOKEN',
    'FB_VERIFYTOKEN',
    'DF_PROJECTID',
    'CMS_API_URL',
    'CMS_API_TOKEN',
];

const load_s3 = (filename, json = false) => {
    const branch = process.env.TRAVIS_BRANCH || process.env.BRANCH;
    const s3client = new S3({ region: 'eu-central-1' });
    const s3path = `${branch}/${filename}`;
    const uri = s3client.getSignedUrl('getObject', {
        Bucket: 'wdr-tim-bot-env',
        Key: s3path,
    });
    return request({ uri, json })
        .catch(err => {
            throw new Error(`Fetching env from S3 (${s3path}) failed with: ` +
                            `${err.name === 'StatusCodeError' ? err.statusCode : err.message}`);
        });
};
module.exports.load_s3 = load_s3;

let env_cache = null;
const fetch_env = () => {
    if (env_cache) {
        return Promise.resolve(env_cache);
    }

    if ('CI' in process.env){
        return load_s3('env.json', true)
            .then(env => {
                env_cache = env;
                return env;
            });
    }

    const dotenv_path = path.resolve(__dirname, "../.env.yml");
    const environment = {};
    if(fs.existsSync(dotenv_path)) {
        Object.assign(environment, yaml.safeLoad(fs.readFileSync(dotenv_path, 'utf8')));
    }

    required_env.forEach(key => {
        if(key in process.env) {
            environment[key] = process.env[key];
        }
    });

    env_cache = environment;
    return Promise.resolve(environment);
};
module.exports.env = () => {
    let env_cache;
    return fetch_env()
        .then(env => {
            const missing_env = required_env.filter(name => !(name in env));
            if (missing_env.length > 0) {
                throw new Error(`Missing environment variables: ${missing_env.join(', ')}`);
            }
            env_cache = env;
            return getStage();
        })
        .then(tableEnv)
        .then(tableEnv => Object.assign(env_cache, tableEnv));
};

const getStage = () => {
    return fetch_env().then(env => process.env.SLS_STAGE || env['DEPLOY_ALIAS'] || 'dev');
};
module.exports.stage = getStage;

module.exports.enableDomain = () => fetch_env().then(env => 'DEPLOY_ALIAS' in env || 'SLS_STAGE' in process.env);

module.exports.resources = () => getStage().then(tableConfig);

const yaml = require('js-yaml');
const fs   = require('fs');
const path = require('path');
const request = require('request-promise-native');
const S3 = require('aws-sdk/clients/s3');

const required_env = [
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

const getStage = () => {
    return fetch_env().then(env => process.env.SLS_STAGE || env['DEPLOY_ALIAS'] || 'dev');
};

module.exports = {
    fetch_env,
    loadConfig,
    load_s3,
    getStage,
    required_env,
};

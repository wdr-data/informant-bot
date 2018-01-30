const yaml = require('js-yaml');
const fs   = require('fs');
const path = require('path');
const S3 = require('aws-sdk/clients/s3');
const request = require('request-promise-native');

const required_env = [
    'FB_PAGETOKEN',
    'FB_VERIFYTOKEN',
    'DF_PROJECTID',
    'CMS_API_URL',
];

const load_s3 = (filename, json = false) => {
    const branch = process.env.BRANCH;
    const s3client = new S3({ region:'eu-central-1' });
    const uri = s3client.getSignedUrl('getObject', {
        Bucket: 'wdr-tim-bot-env',
        Key: `${branch}/${filename}`,
    });
    return request({ uri, json })
        .catch(err => {
            throw new Error(`Fetching env from S3 failed with: ` +
                            `${err.name === 'StatusCodeError' ? err.statusCode : err.message}`);
        });
};
module.exports.load_s3 = load_s3;

const fetch_env = () => {
    if ('CI' in process.env){
        return load_s3('env.json', true)
            .then(env => {
                const missing_env = required_env.filter(name => !(name in env));
                if (missing_env.length > 0) {
                    throw new Error(`Missing environment variables: ${missing_env.join(', ')}`);
                }
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
            return;
        }

        if(!(key in environment)) {
            throw new Error(`Environment Variable "${key}" must be declared.`);
        }
    });

    return environment;
};
module.exports.env = fetch_env;

module.exports.stage = () => {
    return process.env.SLS_STAGE || fetch_env()['DEPLOY_ALIAS'] || 'dev';
};

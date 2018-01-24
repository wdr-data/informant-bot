const yaml = require('js-yaml');
const fs   = require('fs');
const path = require('path');

const required_env = [
    'FB_PAGETOKEN',
    'FB_VERIFYTOKEN',
    'DF_PROJECTID',
];

const fetch_env = () => {
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

module.exports.stage = () => {
    return process.env.SLS_STAGE || fetch_env()['DEPLOY_ALIAS'] || 'dev';
};
module.exports.env = fetch_env;

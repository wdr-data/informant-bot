const { tableEnv } = require('./dynamodb');
const { fetch_env, getStage, required_env } = require('./util');
const resources = require('./resources');

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

module.exports.stage = getStage;

module.exports.enableDomain = () => fetch_env().then(env => 'DEPLOY_ALIAS' in env || 'SLS_STAGE' in process.env);

module.exports.resources = () => getStage().then(tableConfig);

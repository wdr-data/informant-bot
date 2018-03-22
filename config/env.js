const { tableEnv } = require('./dynamodb');
const { fetchEnv, getStage, requiredEnv } = require('./util');
const resources = require('./resources');

module.exports.env = () => {
    let envCache;
    return fetchEnv()
        .then((env) => {
            const missingEnv = requiredEnv.filter((name) => !(name in env));
            if (missingEnv.length > 0) {
                throw new Error(`Missing environment variables: ${missingEnv.join(', ')}`);
            }
            envCache = env;
            return getStage();
        })
        .then(tableEnv)
        .then((tableEnv) => Object.assign(envCache, tableEnv));
};

module.exports.stage = getStage;

module.exports.enableDomain = () => fetchEnv()
    .then((env) => 'DEPLOY_ALIAS' in env || 'SLS_STAGE' in process.env);

module.exports.resources = resources;

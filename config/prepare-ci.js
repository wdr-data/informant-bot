#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { loadS3 } = require('./util');

const dfServiceAccount = () => {
    const saveFile = (content) => fs.writeFile(
        path.resolve(__dirname, '../.df_id.json'),
        content,
        { encoding: 'UTF-8' },
        () => console.log('DF Service Account written.')
    );

    if ('CI' in process.env) {
        return loadS3('df_id.json').then(saveFile);
    }

    if (!('DF_SERVICE_ACCOUNT' in process.env)) {
        throw new Error('DF Service Account JSON is missing!');
    }
    saveFile(process.env.DF_SERVICE_ACCOUNT);
};

const prepare = function() {
    dfServiceAccount();
};

module.exports = prepare;

if (require.main === module) {
    prepare();
}

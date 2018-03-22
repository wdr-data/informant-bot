#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { load_s3 } = require('./util');

const df_service_account = () => {
    const save_file = content => fs.writeFile(
        path.resolve(__dirname, '../.df_id.json'),
        content,
        { encoding: 'UTF-8' },
        () => console.log("DF Service Account written.")
    );

    if ('CI' in process.env){
        return load_s3('df_id.json').then(save_file);
    }

    if (!('DF_SERVICE_ACCOUNT' in process.env)) {
        throw new Error("DF Service Account JSON is missing!");
    }
    save_file(process.env.DF_SERVICE_ACCOUNT);
};

const prepare = function() {
    df_service_account();
};

module.exports = prepare;

if (require.main === module) {
    prepare();
}

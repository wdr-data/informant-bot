#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const df_service_account = () => {
    if(!('DF_SERVICE_ACCOUNT' in process.env)) {
        throw new Error("DF Service Account JSON is missing!");
    }

    const content = process.env.DF_SERVICE_ACCOUNT;
    const filePath = path.resolve(__dirname, '../.df_id.json');
    fs.writeFile(filePath, content, { encoding: 'UTF-8' }, () => console.log("DF Service Account written."));
};

const prepare = function() {
    df_service_account();
};

module.exports = prepare;

if (require.main === module) {
    prepare();
}

/* eslint-disable node/no-unpublished-require */
const slsw          = require('serverless-webpack');

module.exports = {
    entry: slsw.lib.entries,
    mode: 'production',
    target: 'node',
    // Generate sourcemaps for proper error messages
    devtool: 'source-map',
    externals:[
        'memcpy',
        'grpc',
        'aws-sdk',
    ],
    performance: {
        hints: "error",
        maxEntrypointSize: 50000000,
        maxAssetSize: 50000000,
    },
    // Run babel on all .js files and skip those in node_modules
    module: {
/*        rules: [{
            test: /\.js$/,
            loader: 'babel-loader',
            include: __dirname,
            exclude: /node_modules/,
        }]*/
    },
};

/* eslint-disable node/no-unpublished-require */
/* eslint-disable import/no-commonjs */
const slsw = require('serverless-webpack');
const webpack = require('webpack');

module.exports = {
    entry: slsw.lib.entries,
    mode: 'production',
    target: 'node',
    // Generate sourcemaps for proper error messages
    devtool: 'source-map',
    externals: [
        'memcpy',
        'dialogflow',
        'aws-sdk',
    ],
    performance: {
        hints: 'error',
        maxEntrypointSize: 50000000,
        maxAssetSize: 50000000,
    },
    // Run babel on all .js files and skip those in node_modules
    module: {
        rules: [ { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' } ],
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: 'require("source-map-support").install();',
            raw: true,
            entryOnly: false,
        }),
    ],
};

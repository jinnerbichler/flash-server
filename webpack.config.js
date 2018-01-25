//webpack.config.js
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

// ------------------------------------------------------------------
//                    Create Plugins
// ------------------------------------------------------------------
const extractPlugin = new ExtractTextPlugin({
    filename: 'main.css'
});
const copyFilesPlugin = new CopyWebpackPlugin([
    {
        from: './frontend/index.ejs',
    },
    {
        from: './frontend/img/',
        to: 'img'
    }
]);

module.exports = {
    entry: './frontend/index.js',
    output: {
        path: path.join(__dirname, 'public'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                // ------------------------------------------------------------------
                //                    Load React Components
                // ------------------------------------------------------------------
                test: /\.(js|jsx)$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'react']
                }
            },
            {
                // ------------------------------------------------------------------
                //                    Load SCSS Styles
                // ------------------------------------------------------------------
                test: /\.(scss|css)$/,
                use: extractPlugin.extract({
                    use: ['css-loader', 'sass-loader']
                })
            }
        ]
    },
    plugins: [
        extractPlugin,
        copyFilesPlugin
    ]
};

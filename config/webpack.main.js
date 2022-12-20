const path = require('path');
const webpack = require('webpack');
const { dependencies } = require('../package.json');
const ElectronDevWebpackPlugin = require('electron-dev-webpack-plugin');
const isDevMode = process.env.NODE_ENV === 'development';
let plugins = [new webpack.DefinePlugin({})]
if(process.env.NODE_ENV === 'development') plugins.push(new ElectronDevWebpackPlugin())

module.exports = {
    // 配置开发模式
    mode: process.env.NODE_ENV,
    entry: {
        // 配置入口文件
        main: path.join(__dirname, '../src/main/main.js')
    },
    // 配置出口文件
    output: {
        path: path.join(__dirname, '../app/'),
        libraryTarget: 'commonjs2',
        filename: '[name].js'
    },
    // 监听文件改变
    watch: isDevMode,
    optimization: {
        minimize: true,
    },
    module: {
        rules: [{
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /node_modules/
        }, {
            test: /\.node$/,
            loader: 'node-loader'
        }]
    },
    externals: [
        ...Object.keys(dependencies || {})
    ],
    node: {
        __dirname: isDevMode,
        __filename: isDevMode
    },
    plugins,
    target: 'electron-main'
}
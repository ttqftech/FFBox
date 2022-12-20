const path = require('path');
// const webpack = require('webpack');
const { NormalModuleReplacementPlugin } = require('webpack');
const isDevMode = process.env.NODE_ENV === 'development';

console.log('webpack 配置读取', process.env.NODE_ENV, path.join(__dirname, '../'));
module.exports = {
	// 整个配置文件的根目录。配置后，entry 和 resolve.alias 就不需要 path.join 获得绝对路径了
	context: path.join(__dirname, '../'),
	// 配置开发模式
	mode: process.env.NODE_ENV,
	// 配置入口文件
	entry: './src/backend/index.ts',
	// 配置出口文件
	output: {
		path: path.join(__dirname, '../app/backend'),
		// libraryTarget: 'commonjs2',
		filename: 'index.js'
	},
	resolve: {
		// 引入文件时可以省略文件后缀名
		extensions: ['.ts', '.js'],
		// 路径别名
		alias: {
			"@common": "/src/common",
			"@backend": "/src/backend",
			"@renderer": "/src/renderer/src",
			"@main": "/src/main",
			'ws': '/node_modules/ws/index.js', // https://github.com/websockets/ws/issues/1538
		},
		// mainFields: ['main', 'browser'],
	},
	// 监听文件改变
	watch: isDevMode && false,
	devtool: 'source-map',
	optimization: {
		minimize: false,
	},
	module: {
		rules: [{
			test: /\.tsx?$/,
			use: 'ts-loader',
			exclude: /node_modules/,
		}]
	},
	externals: [
		'bufferutil', 'utf-8-validate', // https://github.com/websockets/ws/issues/1126 解决 ws 在 webpack 上的 warning
	],
	// node: {
	// 	__dirname: isDevMode,
	// 	__filename: isDevMode
	// },
	plugins: [
		new NormalModuleReplacementPlugin(/^hexoid$/, require.resolve('hexoid/dist/index.js')),
	],
	target: 'node',
}

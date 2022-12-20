const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const isDevMode = process.env.NODE_ENV === 'development';
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

module.exports = {
    // 配置打包模式为开发模式
    mode: process.env.NODE_ENV,
    // 打包入口文件
    entry: {
        app: path.join(__dirname, '../src/renderer/index.js')
    },
    // 打包出口文件
    output: {
        // 输出目录
        path: path.join(__dirname, '../app/'),
        // 公共路径前缀
        publicPath: isDevMode ? '/' : '',
        // 输出文件名
        filename: 'js/[name].[contenthash].js',
        // 配置按需加载文件
        chunkFilename: 'js/[name].bundle.js'
    },
    module: {
        rules: [{    // 添加解析 .vue文件loader
            test: /\.vue$/,
            loader: 'vue-loader'
        }, {        // 添加解析 .css文件loader
            test: /\.css(\?.*)?$/,
            use: [    // loader 顺序不能乱
                'vue-style-loader',
                'style-loader',
                'css-loader'
            ]
        }, { // 配置sass语法支持，并且使用的是缩进格式
            test: /\.s[ac]ss$/,
            use: [
                ...(
                    isDevMode
                    ? ['vue-style-loader', 'style-loader']
                    : [MiniCssExtractPlugin.loader]
                ),
                'css-loader',
                {
                    loader: 'sass-loader',
                    options: {
                        sassOptions: {
                            indentedSyntax: true // 如需使用花括号嵌套模式则设置为false
                        }
                    }
                }
            ]
        }, { // 配置Babel将ES6+ 转换为ES5
            test: /\.js(\?.*)?$/,
            exclude: file => ( // 排除node_modules文件夹
                /node_modules/.test(file) &&
                !/\.vue\.js/.test(file)
            ),
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env'],
                    plugins: ['@babel/plugin-transform-runtime']
                }
            }
        }, { // 配置图片文件加载
            test: /\.(png|jpe?g|gif|tif?f|bmp|webp|svg)(\?.*)?$/,
            use: {
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    esModule: false
                }
            }
        }, { // 配置字体文件加载
            test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
            use: {
                loader: 'file-loader',
                options: {
                    esModule: false,
                    limit: 10000
                }
            }
        }, { // 处理node文件
            test: /\.node$/,
            loader: 'node-loader'
        }]
    },    // 配置 source-map 文件源码映射
    // devtool: isDevMode ? 'cheap-eval-source-map': 'source-map',
    node: {        // 添加node 变量
        __dirname: isDevMode,
        __filename: isDevMode
    },
    resolve: {
        // 引入文件时可以省略文件后缀名
        extensions:['.js','.json','.vue'],
        // 常用路径别名
        alias: {
            '@': path.join(__dirname, '../src/')
        }
    },
    plugins: [
        // 配置HTML页面模板
        new HtmlWebpackPlugin({
            // 使用模板的路径
            template: path.join(__dirname, '../src/renderer/index.html'),
            // 输出后的文件路径
            filename: './index.html',
            // 对文件添加hash值, 防止文件缓存
            hash: true
        }),
        new VueLoaderPlugin(),        // vue-loader 加载插件
        new CleanWebpackPlugin({ // 清除所有文件，main.js文件除外 因为主线程热加载必须要存在main.js文件如果不存在将会报错，所以需要排除
            cleanOnceBeforeBuildPatterns: ['**/*', '!main.js*']
        }),
        // new BundleAnalyzerPlugin({ analyzerPort: 8888 }), // chunks 分析插件 详细配置参考地址： https://github.com/webpack-contrib/webpack-bundle-analyzer
        new webpack.optimize.SplitChunksPlugin({　　　　　　　　// 详细配置参考地址： https://www.webpackjs.com/plugins/split-chunks-plugin/
            cacheGroups: {
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                },
                // 打包重复出现的代码
                vendor: {
                    name: 'vendor',
                    chunks: 'initial',
                    minChunks: 2,
                    maxInitialRequests: 5,
                    minSize: 0
                },
                // 打包第三方类库
                commons: {
                    name: 'commons',
                    chunks: 'initial',
                    minChunks: Infinity
                }
            }
        }),
        new MiniCssExtractPlugin({    // css打包成css文件插件 详细配置参考地址：https://github.com/webpack-contrib/mini-css-extract-plugin
            filename: 'css/[name].css',
            chunkFilename: 'css/[id].css',
        }),
        new CopyPlugin({ // 复制静态文件 　　详细配置参考地址：https://github.com/webpack-contrib/copy-webpack-plugin
            patterns: [{
                // 复制项目中所用到的公告文件
                from: path.join(__dirname, '../src/static'),
                to: path.join(__dirname, '../app/static')
            }]
        }),
    ],
    target: 'electron-renderer'
}
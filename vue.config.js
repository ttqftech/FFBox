// var webpack = require('webpack');

module.exports = {
    // configureWebpack: (config) => {
    //     config.plugins.push(new webpack.DefinePlugin({ "global.GENTLY": false }));
    //     config.node.__dirname = true;
    //     console.log(config);
    //     // plugins: [
    //     //     new webpack.DefinePlugin({ "global.GENTLY": false })
    //     // ]
    // },
    // chainWebpack: (config) => {
    //     // console.log(config);
    // },
    pluginOptions: {
        electronBuilder: {
            // chainWebpackMainProcess: (config) => {
            //     // Chain webpack config for electron main process only
            //     console.log(config);
            // },
            /*
            chainWebpackRendererProcess: (config) => {
                // Chain webpack config for electron renderer process only (won't be applied to web builds)
                console.log(config);
                config.target = 'electron-renderer';
            },
            */
            externals: [
                'formidable', 'koa-body'
            ],
            builderOptions: {
                appId: 'ttqftech.ffbox',
                productName: 'FFBox',
                electronDownload: {
                    mirror: 'https://npm.taobao.org/mirrors/electron/'
                },
                mac: {
                    icon: '512.ico',
                    target: 'dmg'
                },
                win: {
                    icon: 'icon.ico',
                    target: 'msi'
                }
            },
            mainProcessFile: 'src/main.ts', // Use this to change the entry point of your app's main process
            disableMainProcessTypescript: false, // Manually disable typescript plugin for main process. Enable if you want to use regular js for the main process (src/background.js by default).
            rendererProcessFile: 'src/electron/entry.js', // Use this to change the entry point of your app's render process. default src/[main|index].[js|ts]
        }
    },
    pages: {
        index: {
            entry: 'src/electron/entry.js',
            template: 'public/electron.html',
            filename: 'electron.html'
        }
    }
}
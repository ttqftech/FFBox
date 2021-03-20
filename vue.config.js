module.exports = {
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                appId: 'ttqftech.ffbox',
                productName: 'FFBox',
                electronDownload: {
                    mirror: 'https://npm.taobao.org/mirrors/electron'
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
            mainProcessFile: 'src/main.js', // Use this to change the entry point of your app's main process
            disableMainProcessTypescript: true, // Manually disable typescript plugin for main process. Enable if you want to use regular js for the main process (src/background.js by default).
            rendererProcessFile: 'src/electron/entry.js', // Use this to change the entry point of your app's render process. default src/[main|index].[js|ts]
        }
    },
    pages: {
        index: {
            entry: 'src/electron/entry.js',
            filename: 'electron.html'
        }
    }
}
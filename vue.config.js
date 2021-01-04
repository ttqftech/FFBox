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
            }
        }
    }
}
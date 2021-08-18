# FFBox

一个多媒体转码百宝箱 / 一个 FFmpeg 的套壳  

软件介绍及更新历史请转到[【这里】](http://ffbox.ttqf.tech/)。

![软件截图](http://ffbox.ttqf.tech/img/%E8%BD%AF%E4%BB%B6%E6%88%AA%E5%9B%BE.png)

## 工程简介

您现在看到的是 3.x 版本的 readme 文件。FFBox 在不同的大版本之间，使用的技术/框架存在区别。若需查阅版本对应的 readme，建议切换到对应分支。

- `1.x 版本`：经典的“html + css + js”前端三件套，没有工程化和模块化。
- `2.x 版本`：使用 vue 2 进行工程化、模块化开发。主要控制逻辑集中在状态管理器上。
- `3.x 版本`：更好的高聚低耦与工程结构，服务与 UI 分离，引入 TypeScript，支持远程控制

## 安装说明

### Windows

安装模式：在 Releases 中下载并运行 FFBox_Installation_v3.x.msi，按照指示操作即可完成。  
绿色模式：本软件也可便携运行，直接下载 zip 文件解压到文件夹也可运行。  
请注意本品不包含 FFmpeg，若需正常使用，请查阅下方“FFmpeg 安装”。  
建议安装后将软件文件夹添加“压缩”属性，这可以有效节省外存空间，代价是软件启动速度会变慢 :)。

### Linux / macOS

暂未制作安装包。如需自行制作，您可参考下方的“构建说明”。

### Android/iOS

未来会有的～

## 构建说明

1. 下载本工程。
2. 安装 Node.js。详情可见 [Node.js 官网](https://nodejs.org/zh-cn/)。安装完毕后，执行 `node --version`，可显示 Node.js 版本。安装过程中，应当自动安装 npm。检验方法：`npm --version`。
3. 安装依赖库。进入工程文件夹，执行 `yarn` 进行依赖库的安装。如没有 yarn，需执行 `npm install yarn -g`。如果速度慢可换源：`yarn config set registry https://registry.npm.taobao.org`。
4. 依赖库安装完成后，执行 `yarn electron:serve`，即可运行 FFBox。
5. 如需输出二进制包，执行 `yarn electron:build`。相关配置项在 vue.config.js 中。
6. 若想手动生成，在 dist_electron/bundled 内，**Windows** 用户执行 `electron-builder build --win [target]`，其中 `[target]` 为输出类型，经测试可用的项有 nsis（msi 安装包）、nsis-web（msi 安装外壳 + 程序压缩文件）、portable（单文件便携式）、msi（msi 安装包）、dir（程序文件夹）。**Linux** 用户执行 `electron-builder build --linux [target]`，其中 `[target]` 为输出类型，经测试可用的项有 AppImage（单文件便携式）、deb（Debian 系操作系统安装包）、dir（程序文件夹）。**macOS** 用户执行 `electron-builder build --mac [target]`，其中 `[target]` 为输出类型，经测试可用的项有 dmg（安装镜像）、pkg（安装程序，类似 Windows 上的 msi）、dir（程序文件夹）。  

### 注意事项

1. Linux 用户，下载工程后需要将 `yarn.lock` 删除，再执行 `yarn`，因此处的 `yarn.lock` 是仅适用于 Windows 的依赖库。
2. 如果在进行 `yarn electron:serve` 过程中出现 `Failed to fetch extension`，考虑翻墙。
3. deepin 中通过 deb 安装的包如无法卸载，可执行 `sudo apt purge ffbox`。
4. 如果项目中使用了 ffi-napi（调用 C++ API），那么只能用 electron packager。
5. Linux 打包时如果出现一大段空白的那种故障，检查一下 icon，以及使用上面手动下载的方式试一下。

### 解决 electron-builder 在国内下载速度慢的问题

手动将低速包从源上下载，然后将其放入 electron-builder 缓存文件夹中。
`electron-vx.x.x-win32-x64.zip` 放入 `C:\Users\[用户名]\AppData\Local\electron\Cache` 中。
`winCodeSign-2.6.0.7z` `nsis-3.0.4.1.7z` `nsis-resources-3.4.1.7z` 解压到 `C:\Users\[用户名]\AppData\Local\electron-builder\cache` **各自的文件夹**中，分文件夹命名（`nsis` 和 `winCodeSign`）。

直接运行 `electron-builder build` 就能看到它要下载的地址了，拷进下载器里下载即可。

具体步骤可参考 [此处](https://zhuanlan.zhihu.com/p/110448415) 。

Linux 上的对应缓存文件夹是 `/home/[用户名]/.cache/electron`。

也可以在 package.json 里配置如下内容，不过似乎没有用。
```json
  "build": {
    "electronDownload": {
      "mirror": "https://npm.taobao.org/mirrors/electron/"
    }
  }
```

## FFmpeg 安装

如果您没有 FFmpeg，那么 FFBox 只能为您输出命令行，不能进行转码工作。您需要在 [FFmpeg 下载页面](http://ffmpeg.org/download.html) 下载 FFmpeg 后，放到程序文件夹中，或者将其放到一个位置并添加环境变量，FFBox 即可进行转码工作。

### Windows

从 [此处](https://www.gyan.dev/ffmpeg/builds/) 下载 FFmpeg。Version 可以选择最新，但如果使用硬件加速时遇到需要更新显卡驱动的问题，则需要使用旧一点的版本。Linking 请选择 static。
添加到环境变量的操作请查阅 [这里](https://www.chiser.cc/1406.html) 。

### Linux

从 [此处](https://johnvansickle.com/ffmpeg/) 下载 FFmpeg。请选择 static 的包。

### macOS

从 [此处](https://evermeet.cx/ffmpeg/) 下载 FFmpeg。

## 这个项目是怎样被创建的？

具体流程见 https://www.jianshu.com/p/dfcf2a6a497c

1. vue create ffbox
```
? Please pick a preset: Manually select features
? Check the features needed for your project: Babel, Vuex
? Where do you prefer placing config for Babel, ESLint, etc.? In dedicated config files
? Save this as a preset for future projects? No
? Pick the package manager to use when installing dependencies: Yarn
```

2. 文件夹改名，进入，此时 yarn serve 可以直接运行 @vue/cli 项目

3. vue add electron-builder，当然这步也可以通过 vue ui 进行

4. yarn electron:serve

5. electron-builder build --win portable **失败**，因此进入 dist_electron/bundled 执行 yarn，然后常规 build，得到可执行文件

### 一些注意事项

在 .vue 的中引用资源图片，使用绝对路径，根目录是 /public  
在 js 里调用 spawn 时，使用相对路径，按照 electron 执行的位置读取，在开发环境中是 /，在生产环境中则跟随 /public 中的资源图片一起被放到 / 中。

### 在 electron 中使用 vue-devtools

https://www.jianshu.com/p/cfcfca4d8556  

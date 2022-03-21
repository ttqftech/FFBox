'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { FFBoxService } from './service/FFBoxService'
import { TransferStatus } from './types/types'
const isDevelopment = process.env.NODE_ENV !== 'production'

let win: BrowserWindow | null;
let exitConfirm = false;
let service: FFBoxService | null;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
	{ scheme: 'app', privileges: { secure: true, standard: true } }
])

function createWindow() {
	// Create the browser window.
	win = new BrowserWindow({
		width: isDevelopment ? 1280 : 960,
		height: 640,
		minWidth: 600,
		minHeight: 300,
		resizable: true,
		maximizable: true,
		center: true,
		transparent: true,
		frame: false,
		show: true,
		hasShadow: true,
		webPreferences: {
			nodeIntegration: true
		}
	})

	console.log('WEBPACK_DEV_SERVER_URL', process.env.WEBPACK_DEV_SERVER_URL);
	if (process.env.WEBPACK_DEV_SERVER_URL) {
		// Load the url of the dev server if in development mode
		win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + 'electron.html')
		if (!process.env.IS_TEST) win.webContents.openDevTools()
	} else {
		createProtocol('app')
		// Load the index.html when not in development
		win.loadURL('app://./electron.html')
	}

	mountWindowEvents();
	win.on('closed', () => {
		win = null
	});
}

function mountIpcEvents() {
	// 窗口主动发送的确认关闭通知
    ipcMain.on('exitConfirm', () => {
		exitConfirm = true;
		console.log('exitConfirm', exitConfirm);
	});

	// 窗口主动发送的关闭通知
    ipcMain.on('close', () => {
		win!.close();
		console.log('close');
	});

	// 获取主窗口 Hwnd
	ipcMain.on('getHwnd', (event, hwnd) => {
		win!.webContents.send('hwnd', win!.getNativeWindowHandle());
	});

	/**
	 * 启动文件下载流程：
	 * taskitem 双击，发出带有下载 url 的 downloadFile 信号
	 * 主进程打开另存为对话框，记录该 url 对应的保存位置，然后发送 downloadStatusChange 信号，告知主窗口改变 UI
	 * webContents.downloadURL()，mainWindow.webContents.session.on('will-download') 在此处 handle 下载进度，不断向主窗口发送 downloadProgress
	 * 下载完成后再次发送 downloadStatusChange 信号，告知主窗口改变 UI
	 */
	ipcMain.on('downloadFile', (event, params: { url: string, serverName: string, taskId: number }) => {
		win!.webContents.downloadURL(params.url);
		console.log("发动下载请求：", params.url);
	});

	// 启动一个 ffboxService，这个 ffboxService 目前钦定监听 localhost:33269，而 serviceBridge 会连接此 service
	ipcMain.on('startService', () => {
		if (service) {
			// 开发时使用重载，只重载网页（或热重载 Vue 相关内容），不重载服务
			setTimeout(() => {
				win!.webContents.send('serverReady');
			}, 0);
			return;
		}
		service = new FFBoxService();
		service.on('serverReady', () => {
			win!.webContents.send('serverReady');
		});
		service.on('serverError', (error) => {
			win!.webContents.send('serverError', error.error.message);
		})
	});
}

function mountWindowEvents() {
	win!.on('closed', () => {
		win = null
	});
	win!.webContents.session.on('will-download', (event, item, webContents) => {
		// item.setSavePath(folderpath + `\\${item.getFilename()}`);	// 设置文件存放位置
		win!.webContents.send('downloadStatusChange', { url: item.getURL(), status: TransferStatus.downloading });
		item.on('updated', (event, state) => {
			if (state === 'interrupted') {
				console.log(item.getURL(), '下载取消');
			} else if (state === 'progressing') {
				if (item.isPaused()) {
					console.log(item.getURL(), '下载暂停');
				} else {
					win!.webContents.send('downloadProgress', { url: item.getURL(), loaded: item.getReceivedBytes(), total: item.getTotalBytes() });
				}
			}
		})
		item.once('done', (event, state) => {
			console.log(item.getURL(), `下载${state === 'completed' ? '完成' : '失败'}`);
			win!.webContents.send('downloadStatusChange', { url: item.getURL(), status: TransferStatus.normal });
		})
	});
}

app.on('window-all-closed', () => {
	app.quit();
})

// This method will be called when Electron has finished initialization and is ready to create browser windows. Some APIs can only be used after this event occurs.
app.on('ready', async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		installExtension(VUEJS_DEVTOOLS).catch((e) => {
			console.error('Vue Devtools failed to install:', e.toString())
		}).finally(() => {
			createWindow();

			// 窗口产生关闭信号
			win!.on('close', (e) => {
				if (!exitConfirm) {
					e.preventDefault();
					win!.webContents.send('exitConfirm');  
				}
			});
			mountIpcEvents();
		});
	}
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
	if (process.platform === 'win32') {
		process.on('message', (data) => {
			if (data === 'graceful-exit') {
				win!.close();
				// app.quit()
			}
		})
	} else {
		process.on('SIGTERM', () => {
			win!.close();
			// app.quit()
		})
	}
}

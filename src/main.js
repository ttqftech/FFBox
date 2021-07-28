'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

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
			// Use pluginOptions.nodeIntegration, leave this alone
			// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
			// nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
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

	win.on('closed', () => {
		win = null
	})
}

// Quit when all windows are closed.
/*
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
*/

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow()
	}
})

var exitConfirm = false
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		try {
			await installExtension(VUEJS_DEVTOOLS)
		} catch (e) {
			console.error('Vue Devtools failed to install:', e.toString())
		}
	}
	createWindow()
	// 窗口产生关闭信号
	win.on('close', (e) => {
		if (!exitConfirm) {
			e.preventDefault();
			win.webContents.send('exitConfirm');  
		}
    })
	// 窗口主动发送的确认关闭通知
    ipcMain.on('exitConfirm', () => {
		exitConfirm = true;
		console.log('exitConfirm')
	})
	// 窗口主动发送的关闭通知
    ipcMain.on('close', () => {
		win.close();
		console.log('close')
	});
	// 获取主窗口 Hwnd
	ipcMain.on('getHwnd', (event, hwnd) => {
		win.webContents.send('hwnd', win.getNativeWindowHandle())
	})
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
	if (process.platform === 'win32') {
		process.on('message', (data) => {
			if (data === 'graceful-exit') {
				win.close();
				// app.quit()
			}
		})
	} else {
		process.on('SIGTERM', () => {
			win.close();
			// app.quit()
		})
	}
}

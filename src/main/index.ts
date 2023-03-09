import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
// import { electronApp, optimizer, is } from '@electron-toolkit/utils';
// import { FFBoxService } from './service/FFBoxService';

class ElectronApp {
	mainWindow: BrowserWindow | null = null;
	// service: FFBoxService | null = null;
	blockWindowClose = true;

	constructor() {
		this.mountAppEvents();
	}

	mountAppEvents(): void {
		// 本程序是启动的第二个实例时，将因获不到锁而退出
		if (!app.requestSingleInstanceLock()) {
			app.quit();
			process.exit(0);
		}
		app.whenReady().then(() => {
			if (process.platform === 'win32') {
				app.setAppUserModelId(app.getName());
			}
			this.createMainWindow();
			this.mountIpcEvents();
		});

		// 发现本程序启动了第二个实例的时候，弹出主窗口
		app.on('second-instance', () => {
			if (this.mainWindow) {
				this.mainWindow.focus();
			}
		});
		// macOS dock 操作相关适配，未验证
		app.on('activate', () => {
			if (BrowserWindow.getAllWindows()) {
				this.mainWindow?.focus();
			} else {
				this.createMainWindow();
			}
		});

		// Set app user model id for windows
		// electronApp.setAppUserModelId('com.electron');

		// Default open or close DevTools by F12 in development
		// and ignore CommandOrControl + R in production.
		// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
		// app.on('browser-window-created', (_, window) => {
		// 	optimizer.watchWindowShortcuts(window);
		// });
	}

	createMainWindow(): void {
		const mainWindow = new BrowserWindow({
			width: 1080,
			height: 720,
			minWidth: 600,
			minHeight: 300,
			show: false,
			resizable: true,
			maximizable: true,
			center: true,
			// transparent: true,
			frame: false,
			hasShadow: true,
			// titleBarOverlay: {
			// 	color: '#444444'
			// },
			// titleBarStyle: 'hidden',
			// autoHideMenuBar: true,
			...(process.platform === 'linux' ? { icon: path.join(__dirname, '../../build/icon.png') } : {}),
			webPreferences: {
				preload: path.join(__dirname, '../preload/index.cjs'),
				// nodeIntegration: true,
				// contextIsolation: false,
			},
		});
		this.mainWindow = mainWindow;

		// 设置默认使用外部应用（浏览器）打开链接
		mainWindow.webContents.setWindowOpenHandler(({ url }) => {
			if (['https:', 'http:'].includes(new URL(url).protocol)) {
				shell.openExternal(url);
			}
			return { action: 'deny' };
		});

		mainWindow.once('ready-to-show', () => {
			mainWindow!.show();
		});

		// HMR for renderer base on electron-vite cli.
		// Load the remote URL for development or the local html file for production.
		// if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
		// 	mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
		// } else {
		// 	mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
		// }
		if (app.isPackaged) {
			mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
		} else {
			// 环境变量来自 build.mjs 传入
			const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`;
	
			mainWindow.loadURL(url);
			mainWindow.webContents.openDevTools();
		}
	
		mainWindow.on('close', (e) => {
			if (this.blockWindowClose) {
				e.preventDefault();
				mainWindow!.webContents.send('exitConfirm');
			}
		});

		// 应用菜单
		const menuTemplate = [
			{
				label: 'FFBox (A)',
				submenu: [
					{ label: '访问官网', click: () => mainWindow.webContents.send('menu', 'FFBox.访问官网') },
					{ label: '访问源码' },
					{ label: '检查更新' },
					{ type: 'separator' },
					{ label: 'FFBox v4.0' },
				],
			},
			{
				label: '任务 (T)',
				submenu: [
					{ label: '添加任务' },
					{ label: '停止所有任务' },
					{ label: '强行停止所有任务' },
					{ label: '删除所有未在运行的任务' },
					{ type: 'separator' },
					{ label: '开始执行队列' },
					{ label: '暂停执行队列' },
				],
			},
			{
				label: '视图 (V)',
				submenu: [
					{ label: '放大' },
					{ label: '缩小' },
					{ label: '重置缩放' },
				],
			},
		];
		
		const menu = Menu.buildFromTemplate(menuTemplate as any);
		Menu.setApplicationMenu(menu)
	}

	createService(): void {
		// if (this.service) {
		// 	// 开发时使用重载，只重载网页（或热重载 Vue 相关内容），不重载服务
		// 	return;
		// }
		// this.service = new FFBoxService();
		// this.service.on('serverReady', () => {
		// 	this.mainWindow!.webContents.send('serverReady');
		// });
		// this.service.on('serverError', (error) => {
		// 	this.mainWindow!.webContents.send('serverError', error.error.message);
		// });
	}

	mountIpcEvents(): void {
		// 最小化按钮
		ipcMain.on('minimize', () => {
			this.mainWindow.minimize();
		});

		// 窗口模式按钮
		ipcMain.on('windowmode', () => {
			if (this.mainWindow.isMaximized()) {
				this.mainWindow.unmaximize();
			} else {
				this.mainWindow.maximize();
			}
		});

		// 关闭按钮
		ipcMain.on('close', () => {
			this.mainWindow.close();
		});

		// 窗口主动发送的确认关闭通知
		ipcMain.on('exitConfirm', () => {
			this.blockWindowClose = false;
		});

		// 窗口主动发送的关闭通知
		ipcMain.on('close', () => {
			this.mainWindow!.close();
		});

		// 获取主窗口 Hwnd
		ipcMain.on('getHwnd', () => {
			this.mainWindow!.webContents.send('hwnd', this.mainWindow!.getNativeWindowHandle());
		});

		// 闪烁任务栏图标
		ipcMain.on('flashFrame', (event, value) => {
			this.mainWindow!.flashFrame(value);
		})

		// 打开开发者工具
		ipcMain.on('openDevTools', (event) => {
			this.mainWindow!.webContents.openDevTools();
		})

		/**
		 * 启动文件下载流程：
		 * taskitem 双击，发出带有下载 url 的 downloadFile 信号
		 * 主进程打开另存为对话框，记录该 url 对应的保存位置，然后发送 downloadStatusChange 信号，告知主窗口改变 UI
		 * webContents.downloadURL()，mainWindow.webContents.session.on('will-download') 在此处 handle 下载进度，不断向主窗口发送 downloadProgress
		 * 下载完成后再次发送 downloadStatusChange 信号，告知主窗口改变 UI
		 */
		ipcMain.on('downloadFile', (_event, params: { url: string; serverName: string; taskId: number }) => {
			this.mainWindow!.webContents.downloadURL(params.url);
			console.log('发动下载请求：', params.url);
		});

		// 启动一个 ffboxService，这个 ffboxService 目前钦定监听 localhost:33269，而 serviceBridge 会连接此 service
		// ipcMain.on('startService', () => {
		// 	this.createService();
		// });
	}
}

new ElectronApp();

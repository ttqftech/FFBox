import { app, dialog, BrowserWindow, ipcMain, Menu, shell } from 'electron';
// import ElectronStore from 'electron-store';
import { exec } from 'child_process';
import path from 'path';
import CryptoJS from 'crypto-js';
import fs from 'fs/promises';
import { TransferStatus } from '@common/types';
import { getSingleArgvValue } from '@common/utils';
import ProcessInstance from '@common/processInstance';
import { convertFFBoxMenuToElectronMenuTemplate, getOs } from './utils';
import osBridge from './osBridge';
import * as mica from './mica';
// import { FFBoxService } from './service/FFBoxService';

import net from 'net';
const pipefile = "\\\\.\\pipe\\FFBoxPipe";

class ElectronApp {
	mainWindow: BrowserWindow | null = null;
	// electronStore: ElectronStore;
	service: ProcessInstance | null = null;
	blockWindowClose = true;
	launchedByHelper = false;
	pipeConnection: net.Socket;

	constructor() {
		this.launchedByHelper = getSingleArgvValue('--lbh') ? true : false;
		this.launchedByHelper = true;
		this.mountAppEvents();
	}

	initPipe() {
		return new Promise((resolve, reject) => {
			const client = net.createConnection(pipefile, () => {
				this.pipeConnection = client;
				client.write('4000000001'); // FFBox electron 主进程启动完成
				resolve(this.pipeConnection);
			});
			client.on('close', (hasError) => {
				this.launchedByHelper = false;
				this.pipeConnection = undefined;
			});
			client.on('end', () => {
				console.log('FFBoxHelper 进程管道断开连接，退回独立模式');
			});
			client.on('error', (e: any) => {
				if (e.errno === -4058) {
					// ENOENT，会触发 close
					// console.log('FFBoxHelper 进程管道创建失败，退回独立模式');
					resolve(undefined);
				}
			});
		});
	}

	mountAppEvents(): void {
		// 本程序是启动的第二个实例时，将因获不到锁而退出
		if (!app.requestSingleInstanceLock()) {
			app.quit();
			process.exit(0);
		}
		app.whenReady().then(async () => {
			if (process.platform === 'win32') {
				app.setAppUserModelId(app.getName());
			}
			if (this.launchedByHelper) {
				await this.initPipe();
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
			backgroundColor: '#00ffffff',
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
			if (this.launchedByHelper) {
				this.pipeConnection.write('4000000004'); // FFBox 窗口展示完成
			}
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

		mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
			// item.setSavePath(folderpath + `\\${item.getFilename()}`);	// 设置文件存放位置
			mainWindow.webContents.send('downloadStatusChange', { url: item.getURL(), status: TransferStatus.downloading });
			item.on('updated', (event, state) => {
				if (state === 'interrupted') {
					console.log(item.getURL(), '下载取消');
				} else if (state === 'progressing') {
					if (item.isPaused()) {
						console.log(item.getURL(), '下载暂停');
					} else {
						mainWindow.webContents.send('downloadProgress', { url: item.getURL(), loaded: item.getReceivedBytes(), total: item.getTotalBytes() });
					}
				}
			})
			item.once('done', (event, state) => {
				console.log(item.getURL(), `下载${state === 'completed' ? '完成' : '失败'}`);
				mainWindow.webContents.send('downloadStatusChange', { url: item.getURL(), status: TransferStatus.normal });
			})
		});	

		// 应用菜单
		const initialMenuTemplate = [
			{ label: 'FFBox' },
			{ label: '加载中' }
		]
		
		const menu = Menu.buildFromTemplate(initialMenuTemplate as any);
		Menu.setApplicationMenu(menu);

		// this.electronStore = new ElectronStore();
	}

	createService(): Promise<void> {
		this.service = new ProcessInstance();
		// 目前做不了进程分离，因为启动的时候会瞬间弹一个黑框，十分不优雅。等后期给选项让用户决定行为再去做：https://github.com/nodejs/node/issues/21825
		// return this.service.start('FFBoxService.exe', [], { detached: true, stdio: 'ignore', windowsHide: true, shell: false });
		return this.service.start('FFBoxService.exe').then(() => {
			if (this.launchedByHelper) {
				this.pipeConnection.write('4000000016'); // FFBox 服务启动成功
			}	
		});
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

		// 窗口主动发送的确认关闭通知
		ipcMain.on('exitConfirm', () => {
			this.blockWindowClose = false;
		});

		// 窗口主动发送的关闭通知
		ipcMain.on('close', () => {
			this.mainWindow!.close();
		});

		// 打开 url
		ipcMain.on('jumpToUrl', (event, url: string) => {
			switch (getOs()) {
				case 'MacOS':
					exec('open ' + url);
					break;
				case 'Windows':
					exec('start ' + url);
					break;
				case 'Linux':
					exec('xdg-open' + url);
					break;
			}
		});

		// 打开文件
		ipcMain.on('openFile', (event, url: string) => {
			switch (getOs()) {
				case 'MacOS':
					exec(url);
					break;
				case 'Windows':
					exec(url);
					break;
				case 'Linux':
					exec(url);
					break;
			}
		});

		// 闪烁任务栏图标
		ipcMain.on('flashFrame', (event, value) => {
			this.mainWindow!.flashFrame(value);
		});

		// 设置任务栏 / dock 进度状态
		ipcMain.on('setProgressBar', (event, progress: number, options?: Electron.ProgressBarOptions | undefined) => {
			this.mainWindow!.setProgressBar(progress, options);
		});

		// 打开开发者工具
		ipcMain.on('openDevTools', () => {
			this.mainWindow!.webContents.openDevTools();
		});

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
		ipcMain.on('startService', () => {
			this.createService();
		});

		// osBridge 系列
		ipcMain.on('triggerSystemMenu', () => osBridge.triggerSystemMenu());
		ipcMain.on('triggerSnapLayout', () => osBridge.triggerSnapLayout());
		ipcMain.on('appReady', () => this.launchedByHelper && this.pipeConnection.write('4000000008')); // FFBox App 应用初始化完毕
		ipcMain.on('rendererReady', () => this.launchedByHelper && this.pipeConnection.write('4000000002')); // FFBox 渲染进程初始化完毕

		// 应用菜单更新
		ipcMain.on('setApplicationMenu', (event, menuStr: string) => {
			const menuTemplate = convertFFBoxMenuToElectronMenuTemplate(menuStr, this.mainWindow.webContents);
			const menu = Menu.buildFromTemplate(menuTemplate as any);
			Menu.setApplicationMenu(menu);	
		});

		// 打开“打开文件”对话框
		ipcMain.handle('showOpenDialog', (event, options: Electron.OpenDialogOptions) => {
			return new Promise(resolve => {
				dialog.showOpenDialog(this.mainWindow, options).then((result) => {
					resolve(result.canceled ? [] : result.filePaths);
				});
			});
		});
		  
		// 界面放大缩小
		ipcMain.on('zoomPage', (event, type: 'in' | 'out' | 'reset') => {
			const finalZoomLevel = type === 'reset' ? 0 : this.mainWindow.webContents.zoomLevel + (type === 'in' ? 1 : -1);
			this.mainWindow.webContents.setZoomLevel(finalZoomLevel);
		});

		// 读取 LICENSE 文件
		ipcMain.handle('readLicense', () => {
			return new Promise((resolve) => {
				fs.readFile('./LICENSE', { encoding: 'utf-8' }).then((data) => {
					const cipherText = CryptoJS.SHA1(data);
					if (cipherText.toString() === '4e994ccf17287387cf8bf155ad40f30ad5ca5f38') {
						resolve(data);
					} else {
						resolve(undefined);
					}
				}).catch(() => {
					resolve(undefined);
				});
			});
		});

		// 半透明窗体
		ipcMain.on('setBlurBehindWindow', (event, on: boolean) => {
			switch (getOs()) {
				case 'MacOS':
					this.mainWindow.setVibrancy(on ? 'window' : 'window');
					break;
				case 'Windows':
					// this.mainWindow.setBackgroundMaterial(on ? 'mica' : 'none');
					// this.mainWindow.setDarkTheme();
					// this.mainWindow.setMicaEffect();
					mica.setBlur(this.mainWindow, on);					
					break;
			}
		});

		// ipcMain.handle('electron-store', (event, type: 'get' | 'set' | 'delete', key: string, value?: string) => {
		// 	if (type === 'get') {
		// 		return this.electronStore.get(key);
		// 	} else if (type === 'set') {
		// 		return this.electronStore.set(key, value);
		// 	} else {
		// 		return this.electronStore.delete(key);
		// 	}
		// });
	}
}

new ElectronApp();

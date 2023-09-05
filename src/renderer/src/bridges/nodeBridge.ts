// import _ElectronStore from 'electron-store';
import { IpcRenderer } from 'electron';
import { ChildProcess } from 'child_process';
import CryptoJS from 'crypto-js';
import { getEnv } from '@common/utils';

// let ElectronStore: typeof _ElectronStore, electronStore: _ElectronStore;
// let ipcRenderer: IpcRenderer;
// let spawn: (...args: any) => ChildProcess, exec: (...args: any) => ChildProcess;

// if (getEnv() === 'electron-renderer') {
// 	ElectronStore = window.require('electron-store');
// 	ipcRenderer = window.jsb.ipcRenderer as any;
// 	spawn = window.jsb.spawn;
// 	exec = window.jsb.exec;
// }

export default {
	get env(): 'electron' | 'browser' {
		if (window.jsb) {
			return 'electron';
		} else {
			return 'browser';
		}
	},

	get localStorage() {
		return {
			get(key: string): Promise<any> {
				return new Promise((resolve) => {
					if (key.indexOf('.') > -1) {
						// 若存在多级则进行特殊处理
						const keys = key.split('.');
						const keyInLS = keys[0];
						let storedValue;
						try {
							// key 中的第一项指示需要从 localStorage 读出的字符串
							storedValue = JSON.parse(localStorage.getItem(keys.shift()));
						} catch (error) {}
						if (storedValue == undefined) {
							storedValue = {};
						}
						let obj = storedValue;
						// obj 指示最深一层对象，而非最深一层对象的值，因此保留 1 的深度
						while (keys.length > 1) {
							const currentKey = keys.shift();
							if (obj[currentKey] == undefined) {
								obj[currentKey] = {};
							}
							obj = obj[currentKey]; // 进入深一层
						}
						resolve(obj[keys.shift()]);
					} else {
						try {
							const value = JSON.parse(localStorage.getItem(key));
							resolve(value);
						} catch (error) {
							resolve(localStorage.getItem(key));
						}
						resolve(localStorage.getItem(key));
					}
				});
			},
			set(key: string, value: any) {
				return new Promise((resolve) => {
					if (key.indexOf('.') > -1) {
						// 若存在多级则进行特殊处理
						const keys = key.split('.');
						const keyInLS = keys[0];
						let storedValue;
						try {
							// key 中的第一项指示需要从 localStorage 读出的字符串
							storedValue = JSON.parse(localStorage.getItem(keys.shift()));
						} catch (error) {}
						if (storedValue == undefined) {
							storedValue = {};
						}
						let obj = storedValue;
						// obj 指示最深一层对象，而非最深一层对象的值，因此保留 1 的深度
						while (keys.length > 1) {
							const currentKey = keys.shift();
							if (obj[currentKey] == undefined) {
								obj[currentKey] = {};
							}
							obj = obj[currentKey]; // 进入深一层
						}
						obj[keys.shift()] = typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value; // 对于对象，需先将其 Proxy 解开
						resolve(localStorage.setItem(keyInLS, JSON.stringify(storedValue)));
					} else {
						resolve(localStorage.setItem(key, JSON.stringify(value)))
					}
				});
			},
			delete(key: string) {
				return new Promise((resolve) => {
					if (key.indexOf('.') > -1) {
						// 若存在多级则进行特殊处理
						const keys = key.split('.');
						const keyInLS = keys[0];
						let storedValue;
						try {
							// key 中的第一项指示需要从 localStorage 读出的字符串
							storedValue = JSON.parse(localStorage.getItem(keys.shift()));
						} catch (error) {}
						if (storedValue == undefined) {
							storedValue = {};
						}
						let obj = storedValue;
						// obj 指示最深一层对象，而非最深一层对象的值，因此保留 1 的深度
						while (keys.length > 1) {
							const currentKey = keys.shift();
							if (obj[currentKey] == undefined) {
								obj[currentKey] = {};
							}
							obj = obj[currentKey]; // 进入深一层
						}
						delete obj[keys.shift()];
						resolve(localStorage.setItem(keyInLS, JSON.stringify(storedValue)));
					} else {
						resolve(localStorage.removeItem(key))
					}
				});
				return new Promise((resolve) => resolve(localStorage.removeItem(key)));
			},
		}
	},

	get ipcRenderer(): IpcRenderer | undefined {
		return window.jsb?.ipcRenderer as any;
	},

	get spawn(): (...args: any) => ChildProcess | undefined {
		return window.jsb?.spawn;
	},

	get exec(): (...args: any) => ChildProcess | undefined {
		return window.jsb?.exec;
	},

	get cryptoJS(): typeof CryptoJS {
		return CryptoJS;
	},

	get os(): 'Windows' | 'Linux' | 'MacOS' | 'Unix' | 'Android' | 'iPadOS' | 'iOS' | 'unknown' {
		// TODO this.isElectron 不可用
		if (this.isElectron) {
			// electron 环境
			let platform : NodeJS.Platform = process.platform
			switch (platform) {
				case 'win32':
					return 'Windows';
				case 'linux':
					return 'Linux';
				case 'darwin':
					return 'MacOS';
				default:
					return 'unknown';
			}
		} else {
			// web 环境（有新的 navigator.userAgentData 可以代替 platform）
			if (navigator.userAgent.match(/(Android)\s+([\d.]+)/)) {
				return 'Android';
			}
			if (navigator.userAgent.match(/(iPad).*OS\s([\d_]+)/)) {
				return 'iPadOS';
			}
			if (navigator.userAgent.match(/(iPhone\sOS)\s([\d_]+)/)) {
				return 'iOS';
			}
			if (navigator.platform.indexOf('Win') >= 0) {
				return 'Windows';
			}
			if (navigator.platform.indexOf('Mac') >= 0) {
				return 'MacOS';
			}
			if (navigator.platform.indexOf('Linux') >= 0) {
				return 'Linux';
			}
			if (navigator.platform.indexOf('X11') >= 0) {
				return 'Unix';
			}
			return 'unknown';
		}
	},

	jumpToUrl(url: string): void {
		if (window.jsb?.ipcRenderer) {
			window.jsb?.ipcRenderer.send('jumpToUrl', url);
		} else {
			window.open(url);
		}
	},

	openFile(url: string): void {
		if (window.jsb?.ipcRenderer) {
			window.jsb?.ipcRenderer.send('openFile', url);
		} else {
			window.open(url);
		}
	},

	flashFrame(value = true): void {
		window.jsb?.ipcRenderer?.send('flashFrame', value);
	},

	setProgressBar(progress: number, options?: Electron.ProgressBarOptions | undefined): void {
		window.jsb?.ipcRenderer?.send('setProgressBar', progress, options);
	},

	openDevTools(): void {
		window.jsb?.ipcRenderer?.send('openDevTools');
	},

	startService(): void {
		window.jsb?.ipcRenderer?.send('startService');
	},
}

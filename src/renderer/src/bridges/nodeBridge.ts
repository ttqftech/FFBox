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

	get electronStore() {
		return {
			get(key: string) {
				return window.jsb.ipcRenderer.invoke('electron-store', 'get', key);
			},
			set(key: string, value: any) {
				return window.jsb.ipcRenderer.invoke('electron-store', 'set', key, JSON.parse(JSON.stringify(value)));
			},
		}
	},

	get ipcRenderer(): IpcRenderer | undefined {
		return window.jsb.ipcRenderer as any;
	},

	get spawn(): (...args: any) => ChildProcess | undefined {
		return window.jsb.spawn;
	},

	get exec(): (...args: any) => ChildProcess | undefined {
		return window.jsb.exec;
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
		// TODO this.isElectron 不可用
		if (this.isElectron) {
			switch (this.os) {
				case 'MacOS':
					this.exec('open ' + url);
					break;
				case 'Windows':
					this.exec('start ' + url);
					break;
				case 'Linux':
					this.exec('xdg-open', [url]);
					break;
				default:
					window.open(url);
					break;
			}
		} else {
			window.open(url);
		}
	},

	openFile(url: string): void {
		// TODO this.isElectron 不可用
		if (!this.isElectron) {
			return;
		}
		switch (this.os) {
			case 'MacOS':
				this.exec(url);
				break;
			case 'Windows':
				this.exec(url);
				break;
			case 'Linux':
				this.exec(url);
				break;
			default:
				window.open(url);
				break;
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
}

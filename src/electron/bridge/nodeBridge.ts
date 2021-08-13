import _ElectronStore from "electron-store";
import { IpcRenderer , Remote } from 'electron';
import { ChildProcess } from "child_process";
import CryptoJS from "crypto-js";

let ElectronStore: typeof _ElectronStore, electronStore: _ElectronStore;
let ipcRenderer: IpcRenderer, remote: Remote;
let spawn: (...args: any) => ChildProcess, exec: (...args: any) => ChildProcess;

if (process.env.IS_ELECTRON) {
	ElectronStore = window.require('electron-store');
	ipcRenderer = window.require('electron').ipcRenderer;
	remote = window.require('electron').remote;
	spawn = window.require('child_process').spawn;
	exec = window.require('child_process').exec;
}

export default {
	/**
	 * 执行任何 nodeBridge 函数前都应检查当前是否在 electron 环境
	 * 可以通过此函数验证，或者，若不是 electron 环境，取出的 node 模块将为 undefined
	 */
	get isElectron(): boolean {
		return (process.env.IS_ELECTRON as any) ? true : false;
	},

	get electronStore(): _ElectronStore | undefined {
		if (ElectronStore) {
			if (!electronStore) {
				electronStore = new ElectronStore();
			}
			return electronStore;
		}
	},

	get ipcRenderer(): IpcRenderer | undefined {
		return ipcRenderer;
	},

	get remote(): Remote | undefined {
		return remote;
	},

	get spawn(): (...args: any) => ChildProcess | undefined {
		return spawn;
	},

	get exec(): (...args: any) => ChildProcess | undefined {
		return exec;
	},

	get cryptoJS(): typeof CryptoJS {
		return CryptoJS;
	},

	get os(): 'Windows' | 'Linux' | 'MacOS' | 'Unix' | 'Android' | 'iPadOS' | 'iOS' | 'unknown' {
		if (this.isElectron) {
			// electron 环境
			let platform : NodeJS.Platform = remote.process.platform
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
			// web 环境
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
	}

}

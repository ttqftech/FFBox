import nodeBridge from "./nodeBridge";
import { ChildProcess } from "child_process";
import { spawnInvoker } from "@common/spawnInvoker";

// let spawn = nodeBridge.spawn;
let ipcRenderer = nodeBridge.ipcRenderer;

let helper: ChildProcess | undefined = undefined;

/**
 * 保证 FFBoxHelper 已启动，否则再次启动
 * 然后执行 func。该函数应返回一个 Promise 或者任意类型，它的结果将作为 callHelper 的 Promise 结果原样返回
 * 如果 FFBoxHelper 没有启动，那么先启动它，然后再进行上面的步骤
 * 如果没有找到 FFBoxHelper，则 reject
 * 如果 nodeBridge 不可用，也直接 reject
 */
function callHelper<T>(func: (helper: ChildProcess) => Promise<T> | T): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		/**
		 * 在 helper 存在的情况下执行相应的传入函数
		 */
		function callCorrespondingFunction(helper: ChildProcess) {
			let ret = func(helper);
			if (ret instanceof Promise) {
				ret.then((value) => {
					resolve(value);
				}).catch((reason) => {
					reject(reason);
				});
			} else {
				resolve(ret);
			}
		}

		// 检查 nodeBridge
		// TODO isElectron 不可用
		// @ts-ignore
		if (!nodeBridge.isElectron) {
			reject('非 electron 环境');
			return;
		}
		// 检查 helper 是否存活
		if (helper) {
			callCorrespondingFunction(helper);
		} else {
			console.warn('正在启动 helper');
			spawnInvoker('FFBoxHelper.exe', [], {
				detached: false,
				shell: false,
				// encoding: 'utf8'
			}).then((_helper) => {
				helper = _helper;
				_helper.on('close', (code, signal) => {
					// 'close' 事件将始终在 'exit' 或 'error'（如果子进程衍生失败）已经触发之后触发
					switch (code) {
						case -4058:
							// 找不到文件，启动失败
							helper = undefined;
							reject('FFBoxHelper 未找到');
							break;
						case -1:
							// 进程退出
							helper = undefined;
							break;
					}
				});
				// helper?.on('exit', (code, signal) => {
				// 	console.log('exit', code, signal);
				// });
				// _helper.stdout!.on('data', (data) => {
				// 	console.warn(data.toString());
				// });
				callCorrespondingFunction(_helper);
			}).catch((reason) => {
				console.error(reason);
			});
		}
	});
}

export default {
	setBlurBehindWindow(turnON: boolean = true): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			if (!ipcRenderer) {
				return reject();
			}
			let hwnd: number;
			ipcRenderer.on('hwnd', (event, data: Buffer) => {
				hwnd = data[0] + data[1] * 2**8 + data[2] * 2**16 + data[3] * 2**24;
				console.log(`本窗口 hwnd：` + hwnd);
				callHelper((helper) => {
					// console.log('helper', helper);
					helper.stdin!.write(`2${turnON ? '1' : '0'}${hwnd.toString().padStart(8, '0')}`);
				}).then(() => {
					resolve();
				}).catch((err) => {
					reject(err);
				})
			})
			ipcRenderer.send('getHwnd');			
		})
	}
}
import { ChildProcess } from 'child_process';
import { BrowserWindow } from 'electron';
import { spawnInvoker } from '@common/spawnInvoker';
import { getSingleArgvValue } from '@common/utils';

let helper: ChildProcess | undefined = undefined;
const launchedByHelper = getSingleArgvValue('--lbh') ? true : false;

/**
 * 保证 FFBoxHelper 已启动，否则再次启动
 * 然后执行 func。该函数应返回一个 Promise 或者任意类型，它的结果将作为 callHelper 的 Promise 结果原样返回
 * 如果 FFBoxHelper 没有启动，那么先启动它，然后再进行上面的步骤
 * 如果没有找到 FFBoxHelper，则 reject
 * 如果 nodeBridge 不可用，也直接 reject
 */
function invokeHelper<T>(func: (helper: ChildProcess) => Promise<T> | T): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		/**
		 * 在 helper 存在的情况下执行相应的传入函数
		 */
		function callCorrespondingFunction(helper: ChildProcess) {
			func(helper);
		}

		// 检查 helper 是否存活
		if (helper) {
			callCorrespondingFunction(helper);
		} else {
			console.warn('正在启动 helper');
			spawnInvoker('FFBoxHelper.exe', ['--standalone'], {
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

function callHelper<T>(message: string): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		if (launchedByHelper) {
			console.log(message);
		} else {
			return invokeHelper((helper) => helper.stdin!.write(message));
		}
	});
}

export default {
	// value 的作用在 C++ 文件中定义。其中 0 代表关闭效果，1 代表开启效果，2 代表设置负边距
	setBlurBehindWindow(mainWindow: BrowserWindow, value: number): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const hWndBuffer = mainWindow!.getNativeWindowHandle();
			const hWnd = hWndBuffer[0] + hWndBuffer[1] * 2**8 + hWndBuffer[2] * 2**16 + hWndBuffer[3] * 2**24;
			callHelper(`2${value}${hWnd.toString().padStart(8, '0')}`).then(() => {
				resolve();
			}).catch((err) => {
				reject(err);
			});
		});
	},
	triggerSystemMenu(): Promise<void> {
		return callHelper(`30${'0'.padStart(8, '0')}`);
	},
	triggerSnapLayout(): Promise<void> {
		return callHelper(`30${'1'.padStart(8, '0')}`);
	},
}

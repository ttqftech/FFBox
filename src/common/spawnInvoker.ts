import { ChildProcess, spawn as spawnNode, SpawnOptions } from 'child_process';
import { getEnv } from './utils';

let spawnElectron: (...args: any) => ChildProcess;

if (getEnv() === 'electron-renderer') {
	spawnElectron = window.require('child_process').spawn;
}

export function spawnInvoker(command: string, args: ReadonlyArray<string> | undefined, options: SpawnOptions): Promise<ChildProcess> {
	if (getEnv() === 'browser') {
		return Promise.reject('非 electron 环境');
	}
	const spawn = (getEnv() === 'electron-renderer') ? spawnElectron : spawnNode;
	return new Promise((resolve, reject) => {
		let process: ChildProcess;

		function trySpawn(times: number): void {
			try {
				process = spawn(command, args || [], options);
				setTimeout(() => {
					if (process.killed) {
						reject(`${command} 启动异常`);
					} else {
						resolve(process);
					}
				}, 0);
				process.on('error', (e) => {
					const err = e as any;
					if (err.code === 'ENOENT') {
						reject(`${command} 不存在`);
					} else {
						reject(`${command} 启动异常`);
					}
				});
			} catch (e: any) {
				if (e.code === 'EACCES' || e.code === 'EISDIR' || e.code === 'ENOEXEC') {
					reject(`${command} 文件错误`);
				} else if (e.code === 'EPERM') {
					if (times === 0) {
						reject(`${command} 无权限运行`);
					} else {
						setTimeout(() => {
							trySpawn(times - 1);
						}, 0);
					}
				} else {
					reject(`${command} 无法启动`);
				}
			}
		}
		// Windows 中启动程序时可能遇到 EPERM 错误，重试有可能解决问题
		trySpawn(3);
	});
}

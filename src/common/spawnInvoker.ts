import { ChildProcess, spawn as spawnNode, SpawnOptions } from 'child_process';
import { getEnv } from './utils';

export enum ErrorType {
	DEAD = '启动异常', // 进程意外退出（启动异常）
	NON_EXISTENT = '文件不存在',  // 文件不存在
	NON_EXECUTABLE = '不是可执行文件',  // 不是可执行文件
	NO_PERMISSION = '无执行权限',  // 无执行权限
}
    
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
						reject(ErrorType.DEAD);
					} else {
						resolve(process);
					}
				}, 0);
				process.on('error', (e) => {
					const err = e as any;
					if (err.code === 'ENOENT') {
						reject(ErrorType.NON_EXISTENT);
					} else {
						reject(ErrorType.DEAD);
					}
				});
			} catch (e: any) {
				if (e.code === 'EACCES' || e.code === 'EISDIR' || e.code === 'ENOEXEC') {
					reject(ErrorType.NON_EXECUTABLE);
				} else if (e.code === 'EPERM') {
					if (times === 0) {
						reject(ErrorType.NO_PERMISSION);
					} else {
						setTimeout(() => {
							trySpawn(times - 1);
						}, 0);
					}
				} else {
					reject(ErrorType.DEAD);
				}
			}
		}
		// Windows 中启动程序时可能遇到 EPERM 错误，重试有可能解决问题
		trySpawn(3);
	});
}

import path from 'path';
import ChildProcess, { spawn } from 'child_process';
import { createServer, build } from 'vite';
import electron from 'electron';
import readline from 'readline';
import util from 'util';

const execPromise = util.promisify(ChildProcess.exec);

const mainConfig = path.resolve('config/vite.main.ts');
const preloadConfig = path.resolve('config/vite.preload.ts');
const rendererConfig = path.resolve('config/vite.renderer.ts');
const query = new URLSearchParams(import.meta.url.split('?')[1]);
const debug = query.has('debug');

const isMacOS = process.platform === 'darwin';
const npmExecutablePath = isMacOS ? 'npm' : 'npm.cmd';

// 颜色信息可参考 https://misc.flogisoft.com/bash/tip_colors_and_formatting
function wrapColor(color, msg) {
	const colorString = [49, 41, 42, 43, 46, 104][['default', 'red', 'green', 'yellow', 'cyan', 'light blue'].indexOf(color) || 0];
    return `\x1b[${colorString};97m ${msg} \x1b[49;39m`;
}

/**
 * 一个进行了 try catch 的 exec，把错误转换为 undefined
 * @param {string} command
 * @param {*} options
 * @returns {string | undefined} 执行结果，如果执行失败，返回 failValue
 */
async function emptyableExec(command, options, failValue = undefined) {
	try {
		return await (await execPromise(command, options)).stdout;
	} catch (error) {
		return failValue;
	}
}

/**
 * 读取环境变量判断是否为开发环境，读取 git 信息
 * 注入 process.env.buildInfo 供 vite 编译使用
 */
async function injectProcessEnv() {
	const gitStatusS = await emptyableExec('git status -s', undefined, null);
	const gitCommit1 = await emptyableExec('git show -s --format=%h');
	const gitCommitInfo = `${gitStatusS ? '*' : ''}${gitCommit1.slice(0, 7)}`;
	process.env.buildInfo = JSON.stringify({
		gitCommit: gitCommitInfo,
		isDev: true,
	});	
	console.log(wrapColor('cyan', '注入环境变量信息'), process.env.buildInfo);
}

/** The log will display on the next screen */
function clearConsole() {
	const blank = '\n'.repeat(process.stdout.rows)
	console.log(blank)
	readline.cursorTo(process.stdout, 0, 0)
	readline.clearScreenDown(process.stdout)
}

/**
 * @type {(server: import('vite').ViteDevServer) => Promise<import('rollup').RollupWatcher>}
 */
function watchMain(server) {
	/**
	 * @type {import('child_process').ChildProcessWithoutNullStreams | null}
	 */
	let electronProcess = null
	const address = server.httpServer.address()
	const env = Object.assign(process.env, {
		VITE_DEV_SERVER_HOST: address.address,
		VITE_DEV_SERVER_PORT: address.port,
	})

	/**
	 * @type {import('vite').Plugin}
	 */
	const startElectron = {
		name: 'electron-main-watcher',
		writeBundle() {
			clearConsole()

			if (electronProcess) {
				electronProcess.removeAllListeners()
				electronProcess.kill()
			}

			electronProcess = spawn(electron, ['.'], { env })
			electronProcess.once('exit', process.exit)
			// https://github.com/electron-vite/electron-vite-vue/pull/129
			electronProcess.stdout.on('data', (data) => {
				const str = data.toString().trim()
				str && console.log(str)
			})
			electronProcess.stderr.on('data', (data) => {
				const str = data.toString().trim()
				str && console.error(str)
			})
		},
	}

	return build({
		configFile: mainConfig,
		mode: 'development',
		plugins: [!debug && startElectron].filter(Boolean),
		build: {
			watch: {},
		},
	})
}

/**
 * @type {(server: import('vite').ViteDevServer) => Promise<import('rollup').RollupWatcher>}
 */
function watchPreload(server) {
	return build({
		configFile: preloadConfig,
		mode: 'development',
		plugins: [{
			name: 'electron-preload-watcher',
			writeBundle() {
				clearConsole()
				server.ws.send({ type: 'full-reload' })
			},
		}],
		build: {
			watch: {},
		},
	})
}

// Block the CTRL + C shortcut on a Windows terminal and exit the application without displaying a query
if (process.platform === 'win32') {
	readline.createInterface({ input: process.stdin, output: process.stdout }).on('SIGINT', process.exit)
}

await injectProcessEnv();

// bootstrap
const server = await createServer({ configFile: rendererConfig })

await server.listen();
const address = server.httpServer.address();
console.log(`已启动服务于 ${address.address}:${address.port}`);
await watchPreload(server);
await watchMain(server);

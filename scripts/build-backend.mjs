import ChildProcess, { spawnSync } from 'child_process';
import path from 'path';
import util from 'util';
import { createServer, build } from 'vite';

const execPromise = util.promisify(ChildProcess.exec);

const backendConfig = path.resolve('config/vite.backend.ts');
// const backendConfig = path.join(__dirname, '../config/vite.backend.ts');
// const backendConfig = require(path.join(__dirname, '../config/vite.backend.ts'));

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
		isDev: process.env.NODE_ENV === 'development',
	});	
	console.log(wrapColor('cyan', '注入环境变量信息'), process.env.buildInfo);
}

async function buildBackend() {
	// const buildProcess = spawn(npmExecutablePath, ['run', 'vite:backend'], { stdio: true ? 'inherit' : 'pipe' });
	// buildProcess.once('exit', process.exit);
	console.log(wrapColor('light blue', '开始编译后端'));
	await build({
		configFile: backendConfig,
		mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
	});
	const buildProcess = spawnSync(npmExecutablePath, ['run', `pkg:backend:${isMacOS ? 'mac' :　'win'}`], { stdio: 'inherit' });
	// buildProcess.once('exit', process.exit);
}

await injectProcessEnv();
await buildBackend();

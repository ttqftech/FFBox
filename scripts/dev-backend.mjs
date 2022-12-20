/**
 * 本文件无用
 */

import { spawn } from 'child_process';
import { createServer, build } from 'vite';
import electron from 'electron';
import readline from 'readline';
import path from 'path';

const backendConfig = path.resolve('config/vite.backend.ts');
// const backendConfig = path.join(__dirname, '../config/vite.backend.ts');
// const backendConfig = require(path.join(__dirname, '../config/vite.backend.ts'));

const query = new URLSearchParams(import.meta.url.split('?')[1])
const debug = query.has('debug')

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
function watchBackend(server) {
	return build({
		configFile: backendConfig,
		mode: 'development',
		plugins: [{
			name: 'electron-backend-watcher',
			writeBundle() {
				clearConsole()
				// server.ws.send({ type: 'full-reload' })
			},
		}],
		// build: {
		// 	watch: {},
		// },
	})
}

async function main() {
	// Block the CTRL + C shortcut on a Windows terminal and exit the application without displaying a query
	if (process.platform === 'win32') {
		readline.createInterface({ input: process.stdin, output: process.stdout }).on('SIGINT', process.exit)
	}
	
	// bootstrap
	const server = await createServer({ configFile: backendConfig });
	
	await server.listen();
	console.log(server.httpServer.address());
	await watchBackend(server);
}
await main();

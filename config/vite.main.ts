import { builtinModules } from 'module'
import { defineConfig } from 'vite'
import path from 'path';
import pkgJSON from '../package.json'

export default defineConfig({
	// 整个配置文件的根目录
	root: __dirname,
	build: {
		outDir: '../app/main',
		emptyOutDir: false,
		minify: process.env./* from mode option */NODE_ENV === 'production' || false,
		sourcemap: true,
		lib: {
			entry: '../src/main/index.ts',
			formats: ['cjs'],
			fileName: () => '[name].cjs',
		},
		rollupOptions: {
			external: [
				'electron',
				...builtinModules,
				// @ts-ignore
				...Object.keys(pkgJSON.dependencies || {}),
			],
		},
		commonjsOptions: {
			ignoreTryCatch: false,
		},
	},
	resolve: {
		extensions: ['.ts', '.js'],
		alias: {
			'@common': path.resolve('src/common'),
			'@main': path.resolve('src/main'),
		},
	},
})

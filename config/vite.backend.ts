import { builtinModules } from 'module'
import { defineConfig } from 'vite'
import path from 'path';
import pkgJSON from '../package.json'

export default defineConfig({
	// 整个配置文件的根目录
	root: __dirname,
	build: {
		outDir: '../app/backend',
		emptyOutDir: false,
		minify: process.env./* from mode option */NODE_ENV === 'production',
		sourcemap: true,
		lib: {
			entry: '../src/backend/index.ts',
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
	},
	server: {
		base: '../src/backend/index.ts'
	},
	resolve: {
		extensions: ['.ts', '.js'],
		alias: { '@common': path.resolve('src/common') },
	},
	define: {
		buildInfo: process.env.buildInfo, // 需要在执行 vite 之前通过编译脚本注入 buildInfo
	},
})

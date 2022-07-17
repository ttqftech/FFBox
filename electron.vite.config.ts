import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import vue from '@vitejs/plugin-vue';
/**
 * https://github.com/microsoft/TypeScript/issues/26722
 * tsconfigPaths 插件用于从 tsconfig 中识别 compilerOptions/paths 中的 alias 路径
 * 并将其放到 vite.config 的 resolve/alias 中，否则 tsc 编译出来的路径还是原封不动，vite 不会找
 * 但是在这个项目中，这个插件没有起作用，估计是因为它不会识别 references 的原因
 */
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	main: {
		plugins: [tsconfigPaths()],
		build: {
			rollupOptions: {
				external: ['@electron-toolkit/utils', 'koa-body'],
			},
		},
		resolve: {
			alias: { '@common': resolve('./src/common') },
		},
	},
	preload: {
		plugins: [tsconfigPaths()],
		build: {
			rollupOptions: {
				external: ['@electron-toolkit/preload'],
			},
		},
	},
	renderer: {
		plugins: [tsconfigPaths(), vue()],
		resolve: {
			alias: {
				'@renderer': resolve('src/renderer/src'),
				'@common': resolve('./src/common'),
			},
		},
	},
});

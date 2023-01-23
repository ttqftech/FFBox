import { builtinModules } from 'module';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import svgLoader from 'vite-svg-loader';
import path from 'path';
import pkgJSON from '../package.json';

export default defineConfig({
	// 整个配置文件的根目录
	root: path.join(__dirname, '../src/renderer'),
	// 任何路径的前缀，一般用于配置 web 应用所在的路径，对本地应用无实际作用
	base: './',
	build: {
		outDir: '../../app/renderer',
		emptyOutDir: false,
		minify: process.env./* from mode option */NODE_ENV === 'production' || false,
		sourcemap: true,
		// 如果使用了 lib 字段，vite 会将项目构建为库，此时不输出 index.html
		// 若有需要可在 rollupOptions 里配置输入，否则默认是 src/index
		// lib: {
		// 	entry: 'src/index.ts',
		// 	formats: ['cjs'],
		// 	fileName: () => '[name].cjs',
		// },
		rollupOptions: {
			external: [
				'electron',
				...builtinModules,
				// @ts-ignore
				...Object.keys(pkgJSON.dependencies || {}),
			],
		},
	},
	resolve: {
		extensions: ['.ts', '.js'],
		alias: {
			'@common': '../common',
			'@renderer': './src/',
		},
	},
	plugins: [
		vue(),
		vueJsx(),
		svgLoader(),
	]
})

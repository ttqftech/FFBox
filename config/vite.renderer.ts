import { builtinModules } from 'module';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import svgLoader from 'vite-svg-loader';
// import VueTypeImports from 'vite-plugin-vue-type-imports';
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
				// ...builtinModules,
				// @ts-ignore
				// ...Object.keys(pkgJSON.dependencies || {}),
			],
		},
	},
	resolve: {
		extensions: ['.ts', '.js', '.tsx'],
		alias: {
			'@common': path.resolve('src/common'),	// 因为 vite 根目录被设置成 renderer，其 devServer 出来的路径不能再找上一级了，所以需要另行处理
			'@renderer': path.resolve('src/renderer/src'),
			// '@renderer': './src',	// 生产模式下这样引用不到
		},
	},
	plugins: [
		vue(),
		vueJsx(
			// options are passed on to @vue/babel-plugin-jsx
		),
		// VueTypeImports(),	// 解决 <script setup> 中引入外部类型不能被 defineProps 识别的问题
		svgLoader({
			// svgo: false,
			svgoConfig: {
				plugins: [
					{
						name: 'preset-default',
						params: {
							overrides: {
								inlineStyles: {
									onlyMatchedOnce: false,
								},
							},
						},
					},
				],
			}
		}),
	],
	// server: {
	// 	host: '0.0.0.0',
	// },
});

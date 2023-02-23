<script setup lang="ts">
// 以下这句对全局有效
/// <reference types="vite-svg-loader" />
import { onMounted } from 'vue'
import { useAppStore } from '@renderer/stores/appStore';
import MainFrame from './containers/MainFrame.vue';

onMounted(() => {
	const appStore = useAppStore();
	setTimeout(() => {
		appStore.initTemp();
	}, 1000);
});
</script>

<template>
	<MainFrame />
</template>

<style>
	html {
		overflow: hidden;
	}
	body {
		width: 100vw;
		height: 100vh;
		margin: 0;
		font-weight: 400;
        font-family: "PingFang SC", 苹方, 微软雅黑, "Segoe UI", Consolas, Avenir, Arial, Helvetica, sans-serif, 黑体;
		-webkit-font-smoothing: grayscale;
		-moz-osx-font-smoothing: grayscale;
		text-align: center;
		color: hsl(0, 0%, 20%);
		position: relative;
		overflow: hidden;
		user-select: none;
	}
	#app {
		height: 100vh;
		overflow: hidden;
		position: relative;
	}
</style>

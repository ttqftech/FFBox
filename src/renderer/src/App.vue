<script setup lang="ts">
// 以下这句对全局有效
/// <reference types="vite-svg-loader" />
import { onMounted } from 'vue'
import { useAppStore } from '@renderer/stores/appStore';
import { handleDownloadStatusChange, handleDownloadProgress, handleCloseConfirm } from '@renderer/stores/eventsHandler';
import { TransferStatus } from '@common/types';
import MainFrame from './containers/MainFrame.vue';
import nodeBridge from './bridges/nodeBridge';
import { Server } from './types';

onMounted(() => {
	const appStore = useAppStore();

	// 初始化本地服务器
	if (location.href.startsWith('file')) {
		nodeBridge.startService();
	}
	const localServerId = appStore.addServer();
	appStore.initializeServer(localServerId, 'localhost', 33269);

	// 挂载退出确认
	nodeBridge.ipcRenderer?.on("exitConfirm", () => {
		const localServer = appStore.servers.find((server) => server.entity.ip === 'localhost')
		handleCloseConfirm(localServer as Server);
	});

	// 挂载下载进度指示
	nodeBridge.ipcRenderer?.on("downloadStatusChange", (event, params: { url: string, status: TransferStatus }) => {
		const { serverId, taskId } = appStore.downloadMap.get(params.url);
		const server = appStore.servers.find((server) => server.data.id === serverId);
		const task = server.data.tasks[taskId];
		// console.log("downloadStatusChange", params);
		handleDownloadStatusChange(task, params.status);
	});
	nodeBridge.ipcRenderer?.on("downloadProgress", (event, params: { url: string, loaded: number, total: number }) => {
		const { serverId, taskId } = appStore.downloadMap.get(params.url);
		const server = appStore.servers.find((server) => server.data.id === serverId);
		const task = server.data.tasks[taskId];
		handleDownloadProgress(task, params);
	});

	// 加载配置
	appStore.loadPresetList();
	(async () => {
		const gp = appStore.globalParams;
		gp.input = await nodeBridge.localStorage.get('input') || gp.input;
		gp.video = await nodeBridge.localStorage.get('video') || gp.video;
		gp.audio = await nodeBridge.localStorage.get('audio') || gp.audio;
		gp.output = await nodeBridge.localStorage.get('output') || gp.output;
	})();
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

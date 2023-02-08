<script setup lang="ts">
import { MenuItemConstructorOptions, MenuItem } from 'electron';
import { useAppStore } from '@renderer/stores/appStore';
import TitleBar from './MainFrame/TitleBar.vue';
import ActionBar from './MainFrame/ActionBar.vue';
import MainArea from './MainFrame/MainArea.vue';
import StatusBar from './MainFrame/StatusBar.vue';

// const menu = undefined;
const appStore = useAppStore();

// let currentServer: Server = this.$store.getters.currentServer;
// if (!currentServer) {
// 	return 'startbutton-gray';
// }

console.log('render', appStore.currentServer);

</script>

<template>
	<div class="container">
		<TitleBar></TitleBar>
		<ActionBar></ActionBar>
		<MainArea></MainArea>
		<StatusBar></StatusBar>
	</div>
	<div class="bigicon">
		<img :src="'./images/icon_256_transparent.png'" />
	</div>
</template>

<style lang="less" scoped>
	.container {
		position: relative;
		display: flex;
		flex-direction: column;		
		height: 100%;
		transform: translateZ(0); // 尝试使用 z-index 分离层叠上下文，但 devtools 报错 The intl string context variable "REASON_PROPERTY_DECLARATION_CODE" was not provided to the string

		// TitleBar
		// ActionBar
		// MainArea
		// StatusBar
	}
	.bigicon {
		position: absolute;
		top: 8px;
		left: 8px;
		width: 76px;
		height: 76px;
		background-color: hwb(0 98% 2%);
		border-radius: 8px;
		box-shadow: 0 2px 6px hwb(0 0% 100% / 0.2);
		img {
			width: 100%;
			height: 100%;
		}
	}
</style>

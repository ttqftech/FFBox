<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@renderer/stores/appStore';
import TitleBar from './MainFrame/TitleBar.vue';
import ActionBar from './MainFrame/ActionBar.vue';
import MainArea from './MainFrame/MainArea.vue';
import StatusBar from './MainFrame/StatusBar.vue';
import MenuCenter from './MainFrame/MenuCenter.vue';
import InfoCenter from './MainFrame/InfoCenter.vue';
import FixedButtons from './MainFrame/FixedButtons.vue';

// const menu = undefined;
const appStore = useAppStore();

</script>

<template>
	<div class="container">
		<div class="mainArea">
			<TitleBar></TitleBar>
			<ActionBar></ActionBar>
			<MainArea></MainArea>
			<MenuCenter></MenuCenter>
			<InfoCenter></InfoCenter>
		</div>
		<StatusBar></StatusBar>
	</div>
	<FixedButtons></FixedButtons>
</template>

<style lang="less" scoped>
	.container {
		position: relative;
		height: 100%;
		transform: translateZ(0); // 尝试使用 z-index 分离层叠上下文，但 devtools 报错 The intl string context variable "REASON_PROPERTY_DECLARATION_CODE" was not provided to the string

		.mainArea {
			position: relative;
			height: calc(100% - 24px);
			display: flex;
			flex-direction: column;
			overflow: hidden;
			// TitleBar
			// ActionBar
			// MainArea
		}
		// StatusBar
	}
</style>

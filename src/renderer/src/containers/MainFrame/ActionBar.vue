<script setup lang="ts">
import { computed } from 'vue';
import { ServiceBridgeStatus } from '@renderer/bridges/serviceBridge';
import { useAppStore } from '@renderer/stores/appStore';
import { WorkingStatus } from '@common/types';

const appStore = useAppStore();
const startButtonClass = computed(() => {
	if (!appStore.currentServer || appStore.currentServer.entity.status !== ServiceBridgeStatus.Connected) {
		return 'startbutton-gray';
	}
	return appStore.currentServer.data.workingStatus === WorkingStatus.running ? 'startbutton-yellow' : 'startbutton-green';
});
const startButtonText = computed(() => {
	if (!appStore.currentServer || appStore.currentServer.entity.status !== ServiceBridgeStatus.Connected) {
		return '▶开始';
	}
	return appStore.currentServer.data.workingStatus === WorkingStatus.running ? '⏸暂停' : '▶开始';
});

</script>

<template>
	<div class="actionbar">
		<div class="left">
				<!-- <button class="startbutton startbutton-gray" @click="appStore.initTemp()">➕添加</button> -->
			</div>
			<div class="right">
				<button class="startbutton" :class="startButtonClass" @click="appStore.startNpause()">{{ startButtonText }}</button>
			</div>
	</div>
</template>

<style scoped lang="less">
	.actionbar {
		position: relative;
		width: 100%;
		height: 56px;
		flex: 0 0 auto;
		display: flex;
		justify-content: space-between;
		background-color: hwb(220 97% 3%);
		box-shadow: 0 3px 2px -2px hwb(0 100% 0%) inset,
					0 20px 20px 0px hwb(0 0% 100% / 0.02),
					0 6px 6px 0px hwb(0 0% 100% / 0.02);
		z-index: 1;
		-webkit-app-region: drag;
		&>* {
			-webkit-app-region: none;
		}
		.left, .right {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;
		}
		.left {
			padding-left: 96px;
		}
		.right {
			padding-right: 16px;
		}
		.startbutton {
			position: relative;
			width: 120px;
			height: 36px;
			text-align: center;
			line-height: 36px;
			font-size: 20px;
			letter-spacing: 4px;
			text-indent: 2px;
			color: #FFF;
			text-shadow: 0px 1px 1px rgba(0, 0, 0, 0.5);
			border-radius: 10px;
			border: none;
			outline: none;
			&:hover:before {
				position: absolute;
				left: 0;
				content: "";
				width: 100%;
				height: 100%;
				border-radius: 10px;
				background: -webkit-linear-gradient(-90deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
			}
		}
		.startbutton-green {
			background: linear-gradient(180deg, hsl(120, 80%, 65%), hsl(120, 60%, 50%));
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.15),
						0px 4px 16px -4px hsl(120, 80%, 65%);
		}
		.startbutton-green:active {
			background: linear-gradient(180deg, hsl(120, 65%, 35%), hsl(120, 60%, 50%));
		}
		.startbutton-green:hover {
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.15),
						0px 4px 24px 0px hsl(120, 80%, 65%);
		}
		.startbutton-yellow {
			background: linear-gradient(180deg, hsl(54, 80%, 65%), hsl(54, 60%, 50%));
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.15),
						0px 4px 16px -4px hsl(54, 80%, 65%);
		}
		.startbutton-yellow:active {
			background: linear-gradient(180deg, hsl(54, 65%, 35%), hsl(54, 60%, 50%));
		}
		.startbutton-yellow:hover {
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.15),
						0px 4px 24px 0px hsl(54, 80%, 65%);
		}
		.startbutton-gray {
			color: hwb(0 40% 60%);
			text-shadow: none;
			opacity: 0.8;
			background: linear-gradient(180deg, hsl(0, 0%, 98%), hsl(0, 0%, 92%));
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),	// 上高光
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),	// 下立体
						0px 2px 6px 0px rgba(0, 0, 0, 0.15);	// 下阴影
			pointer-events: none;
		}
	}
</style>
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
	<div class="actionbar" :data-color_theme="appStore.frontendSettings.colorTheme">
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
		background-color: hwb(var(--bg97));
		box-shadow: 0 3px 2px -2px hwb(var(--highlight)) inset,
					0 20px 20px 0px hwb(var(--hoverShadow) / 0.02),
					0 6px 6px 0px hwb(var(--hoverShadow) / 0.02);
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
	}

	// 主题
	.actionbar[data-color_theme="themeLight"] {
		.startbutton-green {
			background: linear-gradient(180deg, hwb(120 40% 10%), hwb(120 20% 20%));
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),	// 去除上方阴影
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),	// 按钮厚度
						0px 2px 6px 0px rgba(0, 0, 0, 0.1),	// 按钮阴影
						0px 4px 16px -4px hwb(120 40% 10%);	// 按钮发光和远距阴影
		}
		.startbutton-green:active {
			background: linear-gradient(180deg, hwb(120 10% 40%), hwb(120 20% 20%));
		}
		.startbutton-green:hover {
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.1),
						0px 4px 24px 0px hwb(120 40% 10%);
		}
		.startbutton-yellow {
			background: linear-gradient(180deg, hwb(54 35% 5%), hwb(54 15% 15%));
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),	// 去除上方阴影
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),	// 按钮厚度
						0px 2px 6px 0px rgba(0, 0, 0, 0.1),	// 按钮阴影
						0px 4px 16px -4px hwb(54 35% 5%);	// 按钮发光和远距阴影
		}
		.startbutton-yellow:active {
			background: linear-gradient(180deg, hwb(54 5% 35%), hwb(54 15% 15%));
		}
		.startbutton-yellow:hover {
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.1),
						0px 4px 24px 0px hwb(54 35% 5%);
		}
		.startbutton-gray {
			color: hwb(0 60% 40%);
			text-shadow: none;
			opacity: 0.8;
			background: linear-gradient(180deg, hwb(0 96% 4%), hwb(0 88% 12%));
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),	// 上高光
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),	// 下立体
						0px 2px 6px 0px rgba(0, 0, 0, 0.1);	// 下阴影
			pointer-events: none;
		}
	}
	.actionbar[data-color_theme="themeDark"] {
		.startbutton-green {
			background: linear-gradient(180deg, hwb(120 20% 10%), hwb(120 10% 30%));
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),	// 去除上方阴影
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),	// 按钮厚度
						0px 2px 6px 0px rgba(0, 0, 0, 0.1),	// 按钮阴影
						0px 4px 16px -4px hwb(120 40% 10%);	// 按钮发光和远距阴影
		}
		.startbutton-green:active {
			background: linear-gradient(180deg, hwb(120 5% 50%), hwb(120 10% 30%));
		}
		.startbutton-green:hover {
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.1),
						0px 4px 24px 0px hwb(120 20% 10%);
		}
		.startbutton-yellow {
			background: linear-gradient(180deg, hwb(54 15% 5%), hwb(54 5% 25%));
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),	// 去除上方阴影
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),	// 按钮厚度
						0px 2px 6px 0px rgba(0, 0, 0, 0.1),	// 按钮阴影
						0px 4px 16px -4px hwb(54 15% 5%);	// 按钮发光和远距阴影
		}
		.startbutton-yellow:active {
			background: linear-gradient(180deg, hwb(54 5% 50%), hwb(54 5% 25%));
		}
		.startbutton-yellow:hover {
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.1),
						0px 4px 24px 0px hwb(54 15% 5%);
		}
		.startbutton-gray {
			color: hwb(0 60% 40%);
			text-shadow: none;
			opacity: 0.8;
			background: linear-gradient(180deg, hwb(0 20% 80%), hwb(0 16% 84%));
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),	// 上高光
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),	// 下立体
						0px 2px 6px 0px rgba(0, 0, 0, 0.1);	// 下阴影
			pointer-events: none;
		}
	}
</style>
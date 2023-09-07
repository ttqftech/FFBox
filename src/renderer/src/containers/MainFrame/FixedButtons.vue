<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@renderer/stores/appStore';
import IconAdd from '@renderer/assets/titleBar/add.svg?component';
import IconMinimize from '@renderer/assets/titleBar/minimize.svg?component';
import IconMaximize from '@renderer/assets/titleBar/maximize.svg?component';
import IconClose from '@renderer/assets/titleBar/close.svg?component';

const appStore = useAppStore();

let bigIconStyle = computed(() => {
	if (appStore.showInfoCenter) {
		return {
			width: '32px',
			height: '32px',
			borderRadius: '4px',
		};
	}
	return undefined;
});

// 最小化按钮点击响应
const handleMinimizeClicked = () => {
	window.jsb.ipcRenderer.send('minimize');
};

// 窗口模式按钮点击响应
const handleWindowmodeClicked = () => {
	window.jsb.ipcRenderer.send('windowmode');
};

// 关闭按钮
const handleCloseClicked = () => {
	window.jsb.ipcRenderer.send('close');
};

</script>

<template>
	<div class="buttonArea">
		<button v-if="!appStore.showInfoCenter" class="normalButton" aria-label="添加服务器" @click="appStore.addServer()">
			<IconAdd />
		</button>
		<button class="normalButton" aria-label="最小化窗口" @click="handleMinimizeClicked">
			<IconMinimize />
		</button>
		<button class="normalButton" aria-label="最大化或还原窗口" @click="handleWindowmodeClicked">
			<IconMaximize />
		</button>
		<button class="redButton" aria-label="关闭窗口" @click="handleCloseClicked">
			<IconClose />
		</button>
	</div>
	<div class="bigicon" :style="bigIconStyle">
		<img :src="'./images/icon_256_transparent.png'" />
	</div>
	<Transition name="titleTrans">
		<div v-if="appStore.showInfoCenter" class="title">FFBox</div>
	</Transition>
</template>

<style scoped lang="less">
	.buttonArea {
		position: fixed;
		right: 0;
		top: 0;
		width: 176px;
		height: 30px;
		padding-bottom: 8px;
		text-align: right;
		z-index: 100;
		button {
			width: 44px;
			height: 100%;
			display: inline-flex;
			justify-content: center;
			align-items: center;
			border: none;
			outline: none;
			background: none;
			svg {
				fill: hwb(0 30% 70%);
				width: 10px;
				height: 10px;
			}
		}
		.normalButton:hover {
			background-color: hwb(0 0% 100% / 0.10);
		}
		.normalButton:active {
			box-shadow: 0 1px 2px hwb(0 0% 100% / 0.3) inset;
			transform: translateY(0.5px);
		}
		.redButton:hover {
			background-color: hwb(0 15% 0% / 0.8);
			svg {
				fill: white;
			}
		}
		.redButton:active {
			box-shadow: 0 2px 4px hwb(0 0% 100% / 0.6) inset;
			transform: translateY(0.5px);
		}
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
		transition: all 0.3s ease;
		z-index: 1;
		img {
			width: 100%;
			height: 100%;
		}
	}
	.title {
		position: absolute;
		left: 56px;
		top: 8px;
		line-height: 32px;
		font-size: 18px;
		z-index: 1;
	}
	.titleTrans-enter-from, .titleTrans-leave-to {
		opacity: 0;
	}
	.titleTrans-enter-to, .titleTrans-leave-from {
		opacity: 1;
	}
	.titleTrans-enter-active {
		transition: opacity 0.5s 0.1s;
	}
	.titleTrans-leave-active {
		transition: opacity 0.1s;
	}
</style>
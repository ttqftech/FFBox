<script setup lang="ts">
import { computed, ref, VNodeRef } from 'vue';
import { useAppStore } from '@renderer/stores/appStore';
import nodeBridge from '@renderer/bridges/nodeBridge';
import { ServiceBridgeStatus } from '@renderer/bridges/serviceBridge';
import IconAdd from '@renderer/assets/fixedButtons/add.svg?component';
import IconBack from '@renderer/assets/fixedButtons/back.svg?component';
import IconMinimize from '@renderer/assets/fixedButtons/minimize.svg?component';
import IconMaximize from '@renderer/assets/fixedButtons/maximize.svg?component';
import IconClose from '@renderer/assets/fixedButtons/close.svg?component';

const appStore = useAppStore();

const bigIconRef = ref<VNodeRef>(null);

const bigIconStyle = computed(() => {
	if (appStore.showInfoCenter) {
		return {
			width: '32px',
			height: '32px',
			borderRadius: '4px',
		};
	}
});

const fourthButtonType = computed(() => {
	if (appStore.showInfoCenter || appStore.showMenuCenter === 2) {
		return 'back';
	} else {
		if (appStore.servers[appStore.servers.length - 1]?.entity.status !== ServiceBridgeStatus.Idle) {
			return 'addServer';
		}
	}
});

// 大图标按钮
const handleBigIconMousedown = (e: MouseEvent) => {
	const mouseupHandler = (e: MouseEvent) => {
		const elem = document.elementFromPoint(e.pageX, e.pageY);
		if (elem === bigIconRef.value) {
			if (e.button === 0) {
				if (appStore.showMenuCenter === 1) {
					appStore.showMenuCenter = 2;
				} else if (appStore.showMenuCenter === 2) {
					appStore.showMenuCenter = 0;
				}
			} else if (e.button === 2) {
				nodeBridge.triggerSystemMenu();
			}
		} else {
			if (appStore.showMenuCenter === 1) {
				appStore.showMenuCenter = 0;
			}
		}
		document.removeEventListener('mouseup', mouseupHandler);
	};
	document.addEventListener('mouseup', mouseupHandler);
	if (e.button === 0) {
		if (appStore.showMenuCenter === 0) {
			appStore.showMenuCenter = 1;
			appStore.showInfoCenter = false;
		}
	}
}

// 第四金刚键
const handleFourthButtonClicked = () => {
	if (fourthButtonType.value === 'addServer') {
		appStore.addServer();
	} else {
		appStore.showInfoCenter = false;
		appStore.showMenuCenter = 0;
	}
}

// 最小化按钮
const handleMinimizeClicked = () => {
	window.jsb.ipcRenderer.send('minimize');
};

// 窗口模式按钮
const handleWindowmodeClicked = () => {
	window.jsb.ipcRenderer.send('windowmode');
};
const windowmodeHoverTimer = ref(0);
const handleWindowmodeMouseEnter = () => {
	windowmodeHoverTimer.value = setTimeout(() => {
		nodeBridge.triggerSnapLayout();
	}, 600) as any;
};
const handleWindowmodeMouseLeave = () => {
	clearTimeout(windowmodeHoverTimer.value);
};

// 关闭按钮
const handleCloseClicked = () => {
	window.jsb.ipcRenderer.send('close');
};

</script>

<template>
	<div class="buttonArea">
		<button v-if="fourthButtonType" class="normalButton" aria-label="添加服务器" @click="handleFourthButtonClicked">
			<IconAdd v-if="fourthButtonType === 'addServer'" />
			<IconBack v-else-if="fourthButtonType === 'back'" />
		</button>
		<button class="normalButton" aria-label="最小化窗口" @click="handleMinimizeClicked">
			<IconMinimize />
		</button>
		<button class="normalButton" aria-label="最大化或还原窗口" @click="handleWindowmodeClicked" @mouseenter="handleWindowmodeMouseEnter" @mouseleave="handleWindowmodeMouseLeave">
			<IconMaximize />
		</button>
		<button class="redButton" aria-label="关闭窗口" @click="handleCloseClicked">
			<IconClose />
		</button>
	</div>
	<div class="bigicon" :style="bigIconStyle" @mousedown="handleBigIconMousedown" @dblclick="handleCloseClicked" ref="bigIconRef">
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
		-webkit-app-region: none;
		button {
			position: relative;
			width: 44px;
			height: 30px;
			display: inline-flex;
			justify-content: center;
			align-items: center;
			border: none;
			outline: none;
			background: none;
			svg {
				position: absolute;
				left: 17px;
				top: 10px;
				width: 10px;
				height: 10px;
				fill: var(--66);
			}
		}
		.normalButton:hover {
			background-color: hwb(var(--opposite) / 0.10);
		}
		.normalButton:active {
			box-shadow: 0 1px 2px hwb(0 0% 100% / 0.3) inset;
			transform: translateY(0.5px);
		}
		.redButton:hover {
			background-color: hwb(0 15% 0% / 0.8);
			svg {
				fill: #FFF;
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
		background-color: hwb(0.0 98% 2%);
		border-radius: 8px;
		box-shadow: 0 2px 6px hwb(0 0% 100% / 0.2);
		transition: all 0.3s ease, box-shadow 0s, transform 0s;
		z-index: 1;
		-webkit-app-region: none;
		img {
			width: 100%;
			height: 100%;
			pointer-events: none;
		}
		&:active {
			box-shadow: 0 0 2px 1px hwb(0deg 0% 100% / 0.1), 0 3px 6px hwb(0deg 0% 100% / 10%) inset;
			transform: translateY(0.5px);
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
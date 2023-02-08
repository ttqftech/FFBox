<script setup lang="ts">
import { useAppStore } from '@renderer/stores/appStore';
import IconX from '@renderer/assets/×.svg?component';
import IconAdd from '@renderer/assets/add.svg?component';
import IconMinimize from '@renderer/assets/minimize.svg?component';
import IconMaximize from '@renderer/assets/maximize.svg?component';
import IconClose from '@renderer/assets/close.svg?component';

const appStore = useAppStore();

// 最小化按钮点击响应
const handleMinimizeClicked = () => {
	window.electron.ipcRenderer.send('minimize');
};

// 窗口模式按钮点击响应
const handleWindowmodeClicked = () => {
	window.electron.ipcRenderer.send('windowmode');
};

// 关闭按钮
const handleCloseClicked = () => {
	window.electron.ipcRenderer.send('close');
};

</script>

<template>
	<div class="titlebar">
		<div class="tabArea">
			<div v-for="server in appStore.servers" class="tab">
				<span>{{ server.data.name }}</span>
				<div class="progress" style="width: 50%"></div>
				<div class="close">
					<img src="../../assets/×.svg" alt="" srcset="">
				</div>
			</div>
		</div>
		<div class="buttonArea">
			<button class="normalButton">
				<IconAdd />
			</button>
			<button class="normalButton" @click="handleMinimizeClicked">
				<IconMinimize />
			</button>
			<button class="normalButton" @click="handleWindowmodeClicked">
				<IconMaximize />
			</button>
			<button class="redButton" @click="handleCloseClicked">
				<IconClose />
			</button>
		</div>
	</div>

</template>

<style lang="less">
	.titlebar {
		position: relative;
		height: 36px;
		padding-left: 92px;
		display: flex;
		// background-color: hwb(220 25% 10%);
		background-color: hwb(220 92% 4%);
		box-shadow: 0 -32px 32px -16px hwb(0 0% 100% / 0.02) inset,
					0 -8px 8px -4px hwb(0 0% 100% / 0.02) inset;
		.tabArea {
			// height: 100%;
			// box-sizing: border-box;
			flex: 1 1 auto;
			display: flex;
			padding: 8px 6px 0;
			margin-left: -2px;
			overflow: auto hidden;
			-webkit-app-region: drag;
			&>* {
				-webkit-app-region: none;
			}
			&::-webkit-scrollbar {
				height: 0;
			}
			.tab {
				position: relative;
				flex: 0 1 200px;
				min-width: 140px;
				margin-right: 8px;
				border-radius: 6px 6px 0 0;
				background-color: hwb(0 97% 3%);
				box-shadow: 0 0 6px hwb(0 0% 100% / 0.2),
							0 -24px 12px -12px hwb(0 100% 0%) inset,
							0 4px 2px -2px hwb(0 100% 0% / 0.5) inset;
				span {
					font-size: 14px;
					line-height: 28px;
				}
				.progress {
					position: absolute;
					left: 0;
					height: 100%;
				}
				.close {
					position: absolute;
					right: 4px;
					top: 4px;
					width: 20px;
					height: 20px;
					border-radius: 2px;
					&:hover {
						box-shadow: 0 1px 4px hwb(0 0% 100% / 0.2),
									0 4px 2px -2px hwb(0 100% 0% / 0.5) inset;
					}
					&:active {
						box-shadow: 0 0px 1px hwb(0 0% 100% / 0.2),
									0 20px 15px -10px hwb(0 0% 100% / 0.15) inset;
						transform: translateY(0.25px);
					}
					img {
						width: 100%;
					}
				}
			}
		}
		.buttonArea {
			// height: 100%;
			padding-bottom: 8px;
			flex: 0 0 auto;
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
	}
</style>
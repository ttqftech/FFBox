<script setup lang="ts">
import { computed, StyleValue, watch } from 'vue';
import { useAppStore } from '@renderer/stores/appStore';
import { Server as ServerData, WorkingStatus } from '@common/types';
import IconX from '@renderer/assets/titleBar/×.svg?component';
import IconAdd from '@renderer/assets/titleBar/add.svg?component';
import IconMinimize from '@renderer/assets/titleBar/minimize.svg?component';
import IconMaximize from '@renderer/assets/titleBar/maximize.svg?component';
import IconClose from '@renderer/assets/titleBar/close.svg?component';
import nodeBridge from '@renderer/bridges/nodeBridge';

const appStore = useAppStore();

const serverStyle = computed(() => {
	const map: {
		[key: string]: {
			colorStyle: any;
			text: string;
		}
	} = {};
	for (const server of appStore.servers) {
		const obj = {
			colorStyle: { width: server.data.workingStatus === WorkingStatus.stopped ? '0%' : `${server.data.progress * 100}%` },
			text: server.data.name + (server.data.workingStatus === WorkingStatus.stopped ? '' : ` (${(server.data.progress * 100).toFixed(0)}%)`)
		};
		map[server.data.id] = obj;
	}
	return map;
});

watch(
	[() => appStore.currentServer?.data?.progress, () => appStore.currentServer?.data?.workingStatus],
	() => {
		const mode = ['indeterminate', 'normal', 'paused', 'none', 'error'][
			[NaN, WorkingStatus.running, WorkingStatus.paused, WorkingStatus.stopped].findIndex((value) => value === appStore.currentServer?.data?.workingStatus)
		] as any;
		nodeBridge.setProgressBar(
			appStore.currentServer?.data?.workingStatus !== WorkingStatus.stopped ? appStore.currentServer.data.progress * 0.99 + 0.01 : 0,
			{ mode },
		);
	}
);

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

// 点击标签页
const handleTabClicked = (serverId: string) => {
	appStore.currentServerId = serverId;
};

// 点击关闭标签页
const handleTabCloseClicked = (serverId: string, event: MouseEvent) => {
	appStore.removeServer(serverId);
	event.stopPropagation();
}

</script>

<template>
	<div class="titlebar">
		<div class="tabArea">
			<TransitionGroup name="tabanimate">
				<div
					v-for="server in appStore.servers"
					:key="server.data.id"
					class="tabWrapper"
					@click="handleTabClicked(server.data.id)"
				>
					<div class="tab" :class="appStore.currentServerId === server.data.id ? 'selected' : 'unselected'">
						<div class="progress progress-green" :style="{...serverStyle[server.data.id].colorStyle, opacity: server.data.workingStatus === WorkingStatus.running ? 1 : 0}" />
						<div class="progress progress-yellow" :style="{...serverStyle[server.data.id].colorStyle, opacity: server.data.workingStatus === WorkingStatus.paused ? 1 : 0}" />
						<span>{{ serverStyle[server.data.id].text }}</span>
						<div class="close" v-if="server.entity.ip !== 'localhost'" @click="handleTabCloseClicked(server.data.id, $event)">
							<img src="../../assets/titleBar/×.svg" alt="" srcset="">
						</div>
					</div>
				</div>
			</TransitionGroup>
		</div>
		<div class="buttonArea">
			<button class="normalButton" aria-label="添加服务器" @click="appStore.addServer()">
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
	</div>

</template>

<style scoped lang="less">
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
			.tabWrapper {
				position: relative;
				flex: 0 1 200px;
				min-width: 140px;
				margin-right: 8px;
				.tab {
					position: relative;
					height: 28px;
					border-radius: 6px 6px 0 0;
					overflow: hidden;
					transition: transform 0.4s cubic-bezier(0.1, 1.5, 0.3, 1);
					span {
						position: absolute;
						left: 0;
						top: 0;
						display: inline-block;
						width: 100%;
						height: 100%;
						font-size: 14px;
						line-height: 28px;
					}
					.progress {
						position: absolute;
						left: 0;
						top: 0;
						height: 100%;
						transition: width 0.3s ease-out, opacity 0.2s ease-out;
					}
					.progress-green {
						background: linear-gradient(180deg, hwb(120 80% 0% / 0.9), hwb(120 60% 0% / 0.9));
						box-shadow: 0 6px 12px hwb(120 30% 30% / 0.33);
					}
					.progress-yellow {
						background: linear-gradient(180deg, hwb(50 80% 0% / 0.9), hwb(50 60% 0% / 0.9));
						box-shadow: 0 6px 12px hwb(50 30% 30% / 0.33);
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
				.selected {
					background-color: hwb(0 97% 3%);
					box-shadow: 0 0 6px hwb(0 0% 100% / 0.2),	// 外阴影
								0 -24px 12px -12px hwb(0 100% 0%) inset,	// 内高光
								0 4px 2px -2px hwb(0 100% 0% / 0.5) inset;	// 上高光
					&:hover {
						box-shadow: 0 0 6px hwb(0 0% 100% / 0.3),	// 外阴影
								0 -32px 16px -12px hwb(0 100% 0%) inset,	// 内高光
								0 4px 2px -2px hwb(0 100% 0% / 0.5) inset;	// 上高光
					}
				}
				.unselected {
					background-color: transparent;
					transform: translateY(1px);
					opacity: 0.8;
					box-shadow: 0 0 6px hwb(0 0% 100% / 0.05),	// 外阴影
								0 -12px 10px -10px hwb(0 100% 0% / 0.1) inset,	// 内阴影
								0 4px 2px -2px hwb(0 100% 0% / 0.25) inset;	// 上高光
					&:hover {
						background-color: hwb(0 97% 3% / 0.5);
						opacity: 1;
					}
				}
			}
			.tabanimate-enter-from, .tabanimate-leave-to {
				.tab {
					transform: translateX(-100%);
				}
			}
			.tabanimate-enter-to, .tabanimate-leave-from {
				.tab {
					transform: translateX(0);
				}
			}
			.tabanimate-enter-active {	// 这个类似乎不生效
				overflow: hidden;
				// transition: transform linear 0.4s; // 这个 transition 会被上面的定义覆盖，无需启用
			}
			.tabanimate-leave-active {
				overflow: hidden;
				transition: transform linear 0.2s; // 这个 transition 会被上面的定义覆盖，但需要定义时长让 Vue 控制消失
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
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAppStore } from '@renderer/stores/appStore';
import { ServiceBridgeStatus } from '@renderer/bridges/serviceBridge';
import nodeBridge from '@renderer/bridges/nodeBridge';
import ListArea from './MainArea/ListArea.vue';
import ParaBox from './MainArea/ParaBox.vue';
import Inputbox from './MainArea/ParaBox/components/Inputbox.vue';
import Button, { ButtonType } from '@renderer/components/Button/Button';
import IconDisconnected from '@renderer/assets/mainArea/disconnect.svg?component';
import IconLoading from '@renderer/assets/mainArea/loading.svg?component';

const appStore = useAppStore();

/**
 * 生命周期  status    name     行为
 * 初始化    init     未连接    登录窗
 * 连接中  connecting 未连接    登录窗
 * 失败      init     未连接    登录窗
 * 成功    connected   ip       正常
 * 掉线       dis      ip   正常 + 掉线提示
 * 重连中 reconnecting ip   正常 + 掉线重连提示
 */
const ip = ref('127.0.0.1');
const port = ref('33269');
const loginBoxVisible = computed(() => [ServiceBridgeStatus.Idle, ServiceBridgeStatus.Connecting].includes(appStore.currentServer?.entity.status));
const isConnecting = computed(() => [ServiceBridgeStatus.Connecting, ServiceBridgeStatus.Reconnecting].includes(appStore.currentServer?.entity.status));
const isDisconnected = computed(() => [ServiceBridgeStatus.Disconnected, ServiceBridgeStatus.Reconnecting].includes(appStore.currentServer?.entity.status));

watch(() => appStore.currentServer?.entity.ip, (newValue, oldValue) => {
	if (newValue === 'localhost') {
		// 切到 entity.ip === 'localhost'（本地服务器）时候，输入框固定为 'localhost'
		ip.value = 'localhost';
	} else if (ip.value === 'localhost') {
		// 切到非本地服务器的时候，输入框分配一个不是 'localhost' 的值
		ip.value = '127.0.0.1';
	}
}, { immediate: true });

const ipInputFixer = (value: string) => {
	// 非本地服务器标签页不可输入 localhost
	if ((appStore.currentServer?.entity.ip || appStore.currentServer.entity.ip !== 'localhost') && value === 'localhost') {
		return '127.0.0.1';
	} else {
		return value;
	}
};

const handleConnectClicked = () => {
	if (!ip.value.length || isNaN(Number(port.value))) {
		return;
	}
	appStore.initializeServer(appStore.currentServerId, ip.value, Number(port.value));
};
const handleReconnectClicked = async () => {
	if (location.href.startsWith('file') && appStore.currentServer.entity.ip === 'localhost') {
		nodeBridge.startService();
	}
	appStore.reConnectServer(appStore.currentServerId);
};
</script>

<template>
	<div class="mainarea" :ref="(el) => appStore.componentRefs['MainArea'] = (el as Element)">
		<div class="upperArea" :style="{ height: `${appStore.draggerPos * 100}%`, position: 'relative' }">
			<!-- 登录窗口 -->
			<div class="loginArea" v-if="loginBoxVisible">
				<Transition name="bganimate" appear>
					<div v-if="loginBoxVisible" class="loginBackground" />
				</Transition>
				<Transition name="boxanimate" appear>
					<div
						v-if="loginBoxVisible"
						class="loginBox"
					>
						<h2>连接服务器</h2>
						<div class="box">
							<Inputbox title="IP" :value="ip" :disabled="ip === 'localhost'" :inputFixer="ipInputFixer" @change="ip = $event" />
							<Inputbox title="端口" :value="port" @change="port = $event" />
						</div>
						<div class="buttonBox">
							<Button
								:type="ButtonType.Primary"
								size="large"
								:disabled="appStore.currentServer?.entity.status === ServiceBridgeStatus.Connecting"
								@click="handleConnectClicked"
							>
								连接
							</Button>
						</div>
					</div>
				</Transition>
			</div>
			<!-- 正常区域 -->
			<ListArea v-if="!loginBoxVisible" />
			<!-- 掉线区域 -->
			<div class="disconnectArea" v-if="isDisconnected">
				<Transition name="bganimate" appear>
					<div v-if="isDisconnected" class="disconnectBackground" />
				</Transition>
				<Transition name="boxanimate" appear>
					<div
						v-if="isDisconnected"
						class="disconnectBox"
					>
						<div class="box">
							<h2>服务器掉线了……</h2>
							<div class="svg" v-if="appStore.currentServer?.entity.status === ServiceBridgeStatus.Disconnected">
								<IconDisconnected style="animation: none;" />
							</div>
							<div class="svg" v-if="isConnecting">
								<IconLoading style="width: 120px;" />
							</div>
						</div>
						<div class="buttonBox">
							<Button
								:type="ButtonType.Primary"
								size="large"
								:disabled="isConnecting"
								@click="handleReconnectClicked"
							>
								重试
							</Button>
						</div>
					</div>
				</Transition>
			</div>
		</div>
		<ParaBox :style="{ height: `${(1 - appStore.draggerPos) * 100}%` }" />
	</div>
</template>

<style scoped lang="less">
	.mainarea {
		position: relative;
		width: 100%;
		// height: 24px;
		background-color: hwb(var(--bg92));
		flex: 1 1 auto;
		overflow-y: auto;
		.upperArea {
			.loginArea, .disconnectArea {
				overflow: hidden;
				@keyframes bganimation {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}
				.bganimate-enter-active {
					animation: bganimation ease-out 0.3s;
				}
				.bganimate-leave-active {
					animation: bganimation ease-out 0.2s reverse;
				}
				.boxanimate-enter-from {
					transform: scale(1.1);
					opacity: 0;
				}
				.boxanimate-enter-active {
					transition: transform cubic-bezier(0.33, 1, 1, 1) 0.3s, opacity linear 0.2s;
				}
				.boxanimate-enter-to, .boxanimate-leave-from {
					transform: scale(1);
					opacity: 1;
				}
				.boxanimate-leave-active {
					transition: all linear 0.2s;
				}
				.boxanimate-leave-to {
					transform: scale(0.9);
					opacity: 0;
				}			
			}
			.loginArea {
				height: 100%;
				.loginBackground {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					will-change: opacity;
				}
				.loginBox {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					height: 100%;
					.box {
						display: flex;
						flex-direction: column;
						justify-content: center;
						align-items: center;
						border-radius: 8px;
						padding-right: 20px;
						background-color: hwb(var(--bg97) / 0.8);
						box-shadow: 0 3px 2px -2px hwb(var(--highlight)) inset,	// 上亮光
									0 16px 32px 0px hwb(var(--hoverShadow) / 0.02),
									0 6px 6px 0px hwb(var(--hoverShadow) / 0.02),
									0 0 0 1px hwb(var(--highlight) / 0.9);	// 包边
						will-change: transform, opacity;
						transition: transform cubic-bezier(0.33, 1, 1, 1) 0.3s, opacity linear 0.2s;
					}
					.buttonBox {
						margin: 24px 24px;
					}
				}
			}
			.disconnectArea {
				position: absolute;
				left: 0;
				top: 0;
				right: 0;
				bottom: 0;
				.disconnectBackground {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					backdrop-filter: blur(2px);
					background-color: hwb(var(--bg95) / 0.6);
				}
				.disconnectBox {
					position: relative;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					height: 100%;
					.box {
						display: flex;
						flex-direction: column;
						justify-content: center;
						align-items: center;
						width: 400px;
						border-radius: 8px;
						background-color: hwb(var(--bg97) / 0.8);
						box-shadow: 0 3px 2px -2px hwb(var(--highlight)) inset,	// 上亮光
									0 16px 32px 0px hwb(var(--hoverShadow) / 0.02),
									0 6px 6px 0px hwb(var(--hoverShadow) / 0.02),
									0 0 0 1px hwb(var(--highlight) / 0.9);	// 包边
						will-change: transform, opacity;
						transition: transform cubic-bezier(0.33, 1, 1, 1) 0.3s, opacity linear 0.2s;
						@keyframes rotation {
							from {
								transform: rotate(0deg);
							}
							to {
								transform: rotate(360deg);
							}
						}
						.svg {
							height: 160px;
							text-align: center;
							svg {
								width: auto;
								height: 100%;
								color: #66666699;
								animation: rotation 1s steps(8) infinite;
							}
						}
					}
					.buttonBox {
						margin: 24px 24px;
					}
				}
			}
			// .ListArea
		}
		// .ParaBox
	}

</style>
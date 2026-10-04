<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { ServiceBridgeStatus } from "@renderer/bridges/serviceBridge";
import nodeBridge from '@renderer/bridges/nodeBridge';
import { useAppStore } from '@renderer/stores/appStore';
import { limitations } from '@common/limitaions';
import Button from '@renderer/components/Button/Button';
import Popup from '@renderer/components/Popup/Popup';
import IconLoading from '@renderer/assets/loading.svg';

const appStore = useAppStore();

const iframeRef = ref<HTMLIFrameElement>();
const iframeLoading = ref(true);
const iframeFailed = ref(false);
const showAnswer = ref(false);
const frontendMachineId = ref<string | undefined>(undefined);
let iframeLoadTimer: ReturnType<typeof setTimeout> | undefined;

function onIframeLoad(event: Event) {
	iframeFailed.value = false;
	sendStateToIframe();
	startIframeLoadTimer();
}

function onIframeError() {
	if (iframeLoadTimer !== undefined) {
		clearTimeout(iframeLoadTimer);
		iframeLoadTimer = undefined;
	}
	iframeLoading.value = false;
	iframeFailed.value = true;
}

function startIframeLoadTimer() {
	iframeLoadTimer = setTimeout(() => {
		iframeLoadTimer = undefined;
		if (iframeLoading.value) {
			iframeLoading.value = false;
			iframeFailed.value = true;
		}
	}, 1000);
}

// Listen for messages from the iframe child page
const handleMessage = async (event: MessageEvent) => {
	const data = event.data;
	if (!data || !data.type) return;

	// childReady doesn't need requestId
	if (data.type === 'childReady') {
		if (iframeLoadTimer !== undefined) {
			clearTimeout(iframeLoadTimer);
			iframeLoadTimer = undefined;
		}
		iframeLoading.value = false;
		iframeFailed.value = false;
		return;
	}

	if (!data.requestId) return;

	let responseData: any = undefined;

	switch (data.type) {
		case 'jumpToUrl':
			nodeBridge.jumpToUrl(data.url);
			break;

		case 'getMachineId':
			responseData = await nodeBridge.getMachineId();
			break;

		case 'localStorageGet':
			responseData = await nodeBridge.localStorage.get(data.key);
			break;

		case 'activateFrontend':
			responseData = await appStore.activateFrontend(data.code).catch(() => false);
			break;

		case 'activateBackend':
			responseData = await appStore.activateBackend(data.code, data.serverId).catch(() => false);
			break;

		case 'popup':
			Popup({ message: data.message, level: data.level });
			break;

		case 'getState':
			responseData = buildState();
			break;
	}

	// Send response back to iframe
	iframeRef.value?.contentWindow?.postMessage({
		type: 'response',
		requestId: data.requestId,
		data: responseData,
	}, '*');
};

function buildState() {
	return {
		functionLevel: appStore.functionLevel,
		frontendMachineId: frontendMachineId.value,
		servers: appStore.servers.map((server) => ({
			id: server.data.id,
			name: server.data.name || server.entity.ip || '',
			ip: server.entity.ip || '',
			connected: server.entity.status === ServiceBridgeStatus.Connected,
			machineId: server.data.machineId,
			functionLevel: server.data.functionLevel,
		})),
		currentServerId: appStore.currentServerId,
		env: nodeBridge.env,
		colorTheme: appStore.frontendSettings.colorTheme,
		limitationItems: limitations,
		loader: { kind: 'FFBox', version: '6.0' },
	};
}

function sendStateToIframe() {
	iframeRef.value?.contentWindow?.postMessage({
		type: 'stateUpdate',
		state: buildState(),
	}, '*');
}

// 前端人品值、服务器列表、各服务器的连接状态/人品值/机器码、主题变化时同步给 iframe
watch(() => JSON.stringify(buildState()), sendStateToIframe);

onMounted(() => {
	window.addEventListener('message', handleMessage);
	nodeBridge.getMachineId().then((id) => {
		frontendMachineId.value = id;
	});
});

onBeforeUnmount(() => {
	window.removeEventListener('message', handleMessage);
	if (iframeLoadTimer !== undefined) {
		clearTimeout(iframeLoadTimer);
		iframeLoadTimer = undefined;
	}
});

</script>

<template>
	<div class="sponsorPanel">
		<iframe
			ref="iframeRef"
			src="https://ffbox.ttqf.tech/sponsorPanel/v2.html"
			src-local="http://127.0.0.1:5500/public/sponsorPanel/v2.html"
			@load="onIframeLoad"
			@error="onIframeError"
			allow="clipboard-read; clipboard-write"
			:style="{ opacity: iframeLoading ? 0.3 : 1 }"
		></iframe>
		<div
			v-if="iframeLoading"
			class="loadingOverlay"
		>
			<IconLoading />
			<span>加载中</span>
		</div>
		<Transition name="fadeUp">
			<div v-if="iframeFailed" class="failureOverlay">
				<p class="lyrics">
					<span style="font-size: 4em;">🎶</span><br>如果有一天，我离你遥远，不能再和你相见<br>你是否会发觉我已经说再见
				</p>
				<Button size="large" @click="showAnswer = true">怎么办？</Button>
				<p :class="`answer ${showAnswer ? `fadeUp-enter-active` : 'fadeUp-enter-from'}`">🎶想回到过去，试着让故事继续，至少不再让你离我而去<br>纵使网络已断，FFBox 依然与你相伴。想使用“支持作者”面板，不妨回到 FFBox 5.x 版本看看？</p>
			</div>
		</Transition>
	</div>
</template>

<style lang="less" scoped>
	.sponsorPanel {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		overflow: hidden;
		isolation: isolate;
		iframe {
			position: absolute;
			top: 0;
			width: 100%;
			height: 100%;
			border: none;
			background: transparent;
		}
		.loadingOverlay {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			width: 300px;
			height: 200px;
			border-radius: 8px;
			background-color: hwb(var(--bg97) / 0.8);
			box-shadow: 0 3px 2px -2px hwb(var(--highlight)) inset,	// 上亮光
						0 16px 32px 0px hwb(var(--hoverShadow) / 0.02),
						0 6px 6px 0px hwb(var(--hoverShadow) / 0.02),
						0 0 0 1px hwb(var(--highlight) / 0.9);	// 包边
			transition: opacity linear 0.2s;
			z-index: 1;
			@keyframes rotation {
				from {
					transform: rotate(0deg);
				}
				to {
					transform: rotate(360deg);
				}
			}
			svg {
				width: auto;
				height: 100px;
				color: #66666699;
				animation: rotation 1s steps(8) infinite;
			}
			&>span {
				margin: 16px 0 8px;
				font-size: 16px;
			}
			&>div {
				flex: 0 0 auto;
				width: 240px;
			}
		}
		.failureOverlay {
			position: absolute;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			text-align: center;
			z-index: 1;
			.lyrics {
				margin: 0 0 20px;
				font-size: 16px;
				line-height: 1.8;
				color: hwb(var(--fg) / 0.6);
			}
			.answer {
				margin: 22px 0;
				font-size: 14px;
				line-height: 1.8;
				color: hwb(var(--fg) / 0.4);
			}
		}
		.fadeUp-enter-active {
			transition: opacity 3s ease, transform 4s cubic-bezier(0.2, 1, 0.5, 1);
		}
		.fadeUp-enter-from {
			opacity: 0;
			transform: translateY(10px);
		}
	}
</style>
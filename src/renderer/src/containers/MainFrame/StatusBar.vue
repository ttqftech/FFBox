<script setup lang="ts">
import { useAppStore } from '@renderer/stores/appStore';
import { version } from '@common/constants'
import IconInfo from '@renderer/assets/statusBar/info.svg?component';
import { computed } from 'vue';

const appStore = useAppStore();

const versionStyle = computed(() => {
	if (appStore.currentServer?.data.ffmpegVersion) {
		return { zoom: 0.55 };
	} else {
		return { top: '10px' };
	}
})
const FFBoxVersionText = computed(() => {
	if (appStore.currentServer?.data.version === version || !appStore.currentServer?.data.version) {
		return version;
	} else {
		return `${version} | ${appStore.currentServer?.data.version}`;
	}
});
const handleInfoCenterButtonClicked = () => {
	appStore.showInfoCenter = !appStore.showInfoCenter;
	appStore.setUnreadNotifationCount(true);
}

</script>

<template>
	<div class="statusbar">
		<div class="left">
			<div>
				<div class="version" :style="versionStyle">FFBox：{{ FFBoxVersionText }}<br />FFmpeg：{{ appStore.currentServer?.data.ffmpegVersion || '-' }}</div>
			</div>
			<div @click="handleInfoCenterButtonClicked">
				<IconInfo />{{ appStore.unreadNotificationCount }}
			</div>
		</div>
	</div>
</template>

<style lang="less">
	.statusbar {
		width: 100%;
		height: 24px;
		flex: 0 0 auto;
		padding: 0 4px;
		background-color: hwb(220 25% 10%);
		color: white;
		/* box-shadow: 0 3px 2px -2px hwb(0deg 100% 0%) inset; */
		font-size: 14px;
		overflow: hidden;
		.left {
			float: left;
		}
		.right {
			float: right;
		}
		.left, .right {
			position: relative;
			&>div {
				display: inline-flex;
				justify-content: center;
				align-items: center;
				height: 24px;
				padding: 0 8px;
				// line-height: 24px;
				vertical-align: middle;
				&:hover {
					background-color: hwb(0	100% 0% / 0.2);
					box-shadow: 0 -1px 2px 0px hwb(0 100% 0% / 0.2) inset;
				}
				&:active {
					background-color: hwb(0	0% 100% / 0.15);
					box-shadow: 0 1px 2px hwb(0 0% 100% / 0.3) inset;
					// box-shadow: 0 0 2px 1px hwb(0 0% 100% / 0.05), // 外部阴影
					// 			0 6px 12px hwb(0 0% 100% / 0.2) inset; // 内部凹陷阴影
					transform: translateY(0.25px);
				}
				svg {
					width: 12px;
					height: 12px;
					margin-right: 6px;
				}
				.version {
					position: relative;
					top: 0;
					text-align: left;
					zoom: 1;
					transition: all 0.3s ease-out;
				}
			}
		}
	}
</style>
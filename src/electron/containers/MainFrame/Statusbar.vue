<template>
	<footer id="statusbar">
		<div id="ffmpeg-version">{{ ffmpegVersion }}</div>
		<button class="infoicon" @click="switchInfoCenter();" :class="$store.state.showInfoCenter ? 'infoicon-selected' : 'infoicon-unselected'" aria-label="通知中心开关">
			<img src="/images/info-transparent.svg" :style="{ animationName: 'unset' }" /><span class="infocount">{{ $store.state.unreadNotificationCount }}</span>
		</button>
		<button class="infoicon" @click="switchSponsorCenter();" @mousedown="sponsorCenterMouseDown();" @mouseup="sponsorCenterMouseUp();" :class="$store.state.showSponsorCenter ? 'infoicon-selected' : 'infoicon-unselected'" aria-label="打赏中心开关">
			<img src="/images/sponsor.svg" :style="{ animationName: $store.state.functionLevel < 50 ? '' : 'unset' }" />
			<div style="width: 12px"></div>
		</button>
		<div id="output-folder"></div>
	</footer>
</template>

<script lang="ts">
import Vue from 'vue';

import { Server } from '@/types/types';
import nodeBridge from "@/electron/bridge/nodeBridge";

export default Vue.extend({
	name: 'Statusbar',
	data: () => { return {
		sponsorTimer: NaN,
	}},
	computed: {
		ffmpegVersion: function (): string {
			let currentServer = this.$store.getters.currentServer as Server;
			if (!currentServer) {
				return 'FFBox 服务连接失败，请检查防火墙或重新打开应用！';
			}
			let ret = ``;
			if (currentServer.ffmpegVersion === ''){
				ret += 'FFmpeg 版本：检测中';
			} else if (currentServer.ffmpegVersion === '-'){
				ret += 'FFmpeg 版本：FFmpeg 未安装或未配置环境变量！请访问 FFBox 官网获取相关说明';
			} else {
				ret += 'FFmpeg 版本：' + currentServer.ffmpegVersion;
			}
			return ret;
		}
	},
	methods: {
		switchInfoCenter: function () {
			this.$store.commit('showInfoCenter_update', !this.$store.state.showInfoCenter);
		},
		switchSponsorCenter: function () {
			this.$store.commit('showSponsorCenter_update', !this.$store.state.showSponsorCenter);
		},
		sponsorCenterMouseDown: function () {
			this.sponsorTimer = setTimeout(() => {
				if (this.sponsorTimer) {
					if (nodeBridge.cryptoJS) {
						let cryptoJS = nodeBridge.cryptoJS;
						let machineCode = this.$store.state.machineCode;
						let fixedCode = 'be6729be8279be40';
						let key = machineCode + fixedCode;
						let min = cryptoJS.enc.Utf8.parse('50');
						this.$store.commit('activate', {
							userInput: cryptoJS.AES.encrypt(min, key).toString(),
							callback: (result: number | false) => {
								console.log('激活结果：' + result);
								this.$store.commit('pushMsg', {
									message: '激活结果请到开发人员控制台查看',
									level: 1,
								});
							}
						});
						clearTimeout(this.sponsorTimer);
						this.sponsorTimer = NaN;
					}
				}
			}, 1000) as any;
		},
		sponsorCenterMouseUp: function () {
			clearTimeout(this.sponsorTimer);
			this.sponsorTimer = NaN;
		},
	}
});
</script>

<style scoped>
	#statusbar {
		position: absolute;
		bottom: 0;
		width: 100%;
		height: 24px;
		z-index: 5;
		background: hsl(224, 68%, 57%);		
	}
		#ffmpeg-version {
			float: left;
			margin: 0px 8px 0px 16px;
			text-align: left;
			font-size: 13px;
			line-height: 24px;
			color: white;
		}
		.infoicon {
			float: left;
			position: relative;
			padding: 0px 8px;
			text-align: left;
			height: 24px;
			color: white;
			outline: none;
			border: none;
			font-family: inherit;
		}
		.infoicon:hover, .infoicon-selected {
			background: rgba(0, 0, 0, 0.4);
		}
		.infoicon-unselected {
			background: unset;
		}
		@keyframes sponsorFlash {
			0%, 20%, 100% {
				opacity: 1;
			}
			10% {
				opacity: 0.2;
			}
		}
			.infoicon img {
				display: block;
				position: absolute;
				top: 0;
				bottom: 0;
				left: 8px;
				height: 13px;
				width: 13px;
				margin: auto;
				-webkit-user-drag: none;
				animation: sponsorFlash 5s linear 5s infinite normal;
			}
			.infoicon .infocount {
				margin-left: 20px;
				line-height: 24px;
				font-size: 13px;
			}
		#output-folder {
			float: right;
			margin: 0px 16px 0px 8px;
			font-size: 13px;
			line-height: 24px;
			text-align: right;
			color: white;
		}
</style>

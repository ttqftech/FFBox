<template>
	<footer id="statusbar">
		<div id="ffmpeg-version">{{ ffmpegVersion }}</div>
		<button class="infoicon" @click="switchInfoCenter();" :class="$store.state.showInfoCenter ? 'infoicon-selected' : 'infoicon-unselected'" aria-label="通知中心开关">
			<img src="/images/info-transparent.svg" /><span class="infocount">{{ this.$store.state.infos.length }}</span>
		</button>
		<button class="infoicon" @click="switchSponsorCenter();" :class="$store.state.showSponsorCenter ? 'infoicon-selected' : 'infoicon-unselected'" aria-label="打赏中心开关">
			<img src="/images/sponsor.svg" /><div style="width: 12px"></div>
		</button>
		<div id="output-folder">{{ outputFolder }}</div>
	</footer>
</template>

<script>
export default {
	name: 'Statusbar',
	props: {},
	data: () => { return {
		outputFolder: '输出文件夹：与输入相同'
	}},
	computed: {
		ffmpegVersion: function () {
			if (this.$store.state.FFmpegVersion == ''){
				return '当前 FFmpeg 版本：检测中'
			} else if (this.$store.state.FFmpegVersion == '-'){
				return '当前 FFmpeg 版本：FFmpeg 未安装或未配置环境变量！'
			} else {
				return '当前 FFmpeg 版本：' + this.$store.state.FFmpegVersion
			}
		}
	},
	methods: {
		switchInfoCenter: function () {
			this.$store.commit('showInfoCenter_update', !this.$store.state.showInfoCenter)
		},
		switchSponsorCenter: function () {
			this.$store.commit('showSponsorCenter_update', !this.$store.state.showSponsorCenter)
		}
	}
	
}
</script>

<style scoped>
	#statusbar {
		position: absolute;
		bottom: 0;
		width: 100%;
		height: 24px;
		z-index: 5;
		background: #466edc;		
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
		.infoicon img {
			display: block;
			position: absolute;
			top: 0;
			bottom: 0;
			left: 8px;
			height: 13px;
			width: 13px;
			margin: auto;
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

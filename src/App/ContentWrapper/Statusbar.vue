<template>
	<footer id="statusbar">
		<div id="ffmpeg-version">{{ ffmpegVersion }}</div>
		<button id="infoicon" @click="switchInfoCenter();" aria-label="通知中心开关">
			<div src="/info-transparent.svg"></div><span id="infocount">{{ this.$store.state.infos.length }}</span>
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
			if (this.$store.state.showInfoCenter) {
				this.$store.commit('showInfoCenter_update', false)
			} else {
				this.$store.commit('showInfoCenter_update', true)
			}
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
		#infoicon {
			float: left;
			padding: 0px 8px;
			text-align: left;
			font-size: 13px;
			line-height: 24px;
			color: white;
			background: none;
			outline: none;
			border: none;
			vertical-align: middle;
			font-family: inherit;
		}
		#infoicon:hover, .infoicon-selected {
			background: rgba(0, 0, 0, 0.4);
		}
		#infoicon div {
			display: inline-block;
			position: relative;
			top: 2px;
			height: 13px;
			width: 13px;
			margin: 0px 8px 0px 0px;
			background: url(/info-transparent.svg) center/contain no-repeat;
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

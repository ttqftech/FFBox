<template>
	<div id="shorcuts-view">
		<div id="para_preview">
			<div id="para_preview-text">
				<p>参数预览功能暂时无用，将在未来版本中更新</p>
			</div>
			<buttonbox id="para_preview-save" text="恢复默认参数" @click="restoreDefault"></buttonbox>
		</div>
		<p>预设存取功能暂未开发</p>
	</div>
</template>

<script>
import Buttonbox from "./Components/Buttonbox";

export default {
	name: 'ShorcutsView',
	components: {
		Buttonbox
	},
	computed: {
	},
	methods: {
		restoreDefault: function () {
			this.$store.commit('replacePara')
			this.$store.commit('changePara')
			this.$store.commit('pushMsg', {
				msg: '参数已重置',
				level: 0
			})
		}
	}
}
</script>

<style scoped>
	#shorcuts-view {
		position: absolute;
		width: 100%;
		height: 100%;
		overflow-y: auto;
		display: flex;
		flex-wrap: wrap;
		align-items: center;	/* 一行 */
		/* align-content: space-between;	 多行 */
		justify-content: space-around;
	}

		#para_preview {
			position: relative;
			width: calc(100% - 16px);
			height: 128px;
			border-bottom: #DDD 2px solid;
			margin: 4px 36px;						
		}
			#para_preview-text {
				position: absolute;
				width: calc(100% - 180px);
				height: 120px;
				font-size: 14px;
				text-align: left;
			}
			#para_preview-text p {
				margin: 4px 0;
			}
			#para_preview-save {
				position: absolute;
				right: -12px;
				top: 40px;
			}


</style>

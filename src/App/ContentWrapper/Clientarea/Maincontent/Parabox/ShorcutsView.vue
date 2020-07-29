<template>
	<div id="shorcuts-view">
		<div id="para_preview">
			<div id="para_preview-text">
				<p>参数预览功能暂时无用，将在未来版本中更新</p>
			</div>
			<!--
			<div id="para_preview-save" class="presetbutton">
				<img src="image/star.png" />
				保存当前配置
			</div>
			-->
		</div>
		<p>预设存取功能暂未开发</p>
	</div>
</template>

<script>

export default {
	name: 'ShorcutsView',
	components: {
		
	},
	props: {		
	},
	computed: {

	},
	methods: {
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
			.presetbutton {
				position: relative;
				height: 40px;
				line-height: 40px;
				/*width: 120px;*/
				text-align: center;
				padding-left: 40px;
				padding-right: 10px;
				border-radius: 10px;
				background: linear-gradient(180deg, #fefefe, #f0f0f0);
				box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.3);
				margin: 8px 12px;
			}
			.presetbutton:active {
				background: linear-gradient(180deg, #e7e7e7, #f0f0f0);
			}
			.presetbutton:hover:before {
				position: absolute;
				left: 0;
				content: "";
				width: 100%;
				height: 100%;
				border-radius: 10px;
				background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
			}
			.presetbutton img {
				position: absolute;
				left: 10px;
				top: 10px;
				width: 20px;
				height: 20px;
			}

</style>

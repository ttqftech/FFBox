<template>
	<div id="command-view">
		<div id="commandwin" class="commandwin-small">
			<div id="outputCommand">
				<div class="commandwin-title" v-html="`FFmpeg 输出（${selectedTask == null ? '全局' : selectedTask.filepath}）`"></div>
				<div class="commandwin-box">
					<textarea id="commandwin-output" readonly v-html="textareaOutput"></textarea>
				</div>
			</div>
			<div id="currentCommand">
				<div class="commandwin-title" id="commandwin-current-title" v-html="`当前文件指令（${selectedTask == null ? '未选择文件' : selectedTask.filepath}）`"></div>
				<div class="commandwin-box">
					<textarea id="commandwin-current" readonly v-model="textareaCurrent"></textarea>
				</div>
			</div>
			<div id="globalCommand">
				<div class="commandwin-title">全局指令</div>
				<div class="commandwin-box">
					<textarea id="commandwin-global" readonly v-model="textareaGlobal"></textarea>
				</div>
			</div>			
		</div>
	</div>
</template>

<script>
export default {
	name: 'CommandView',
	components: {},
	props: {
		show: Boolean	// 不显示时不更新，节省能源	
	},
	computed: {
		selectedTask: function () {
			// 无选择时返回 null，选择时返回第一个
			if (this.$store.state.taskSelection.size == 0) {
				return null
			} else if (this.$store.state.taskSelection.size > 0) {
				var task
				for (const id of this.$store.state.taskSelection) {
					task = this.$store.state.tasks[id]
					break
				}
				return task
			}
		},
		textareaOutput: function () {
			if (!this.show) {
				return
			}
			var selectedTask_res = this.selectedTask
			this.$nextTick(() => {
				const commandwin_output = document.getElementById('commandwin-output')
				commandwin_output.scrollTop = commandwin_output.scrollHeight - commandwin_output.offsetHeight
			})
			if (selectedTask_res == null) {
				// 显示全局 cmd
				return this.$store.state.cmdData
			} else {
				return selectedTask_res.cmdData
			}
		},
		textareaCurrent: function () {
			var selectedTask_res = this.selectedTask
			if (selectedTask_res != null) {
				return ['ffmpeg', ...selectedTask_res.paraArray].join(' ')
			} 
		},
		textareaGlobal: function () {
			var globalParaArray = this.$store.state.globalParams.paraArray
			if (globalParaArray != null) {
				return ['ffmpeg', ...globalParaArray].join(' ')
			}
		}
	},
	methods: {
	}
}
</script>

<style scoped>
	#command-view {
		position: absolute;
		width: 100%;
		height: 100%;
		/* background: #EEE; */
	}
		#commandwin {
			display: flex;
			flex-direction: column;	
			width: 100%;
			height: 100%;
			box-sizing: border-box;
			padding: 8px 0px;
		}
			#commandwin>div {
				transition: flex-grow 0.3s;
				overflow: hidden;
			}
			#outputCommand {
				position: relative;
				flex-grow: 3;
			}
			#currentCommand {
				position: relative;
				flex-grow: 1;
			}
			#globalCommand {
				position: relative;
				flex-grow: 1;
			}
			.commandwin-mini #currentCommand, .commandwin-mini #globalCommand {
				flex-grow: 0;
			}
				.commandwin-title {								
					position: absolute;
					top: 6px;
					left: 16px;
					color: #25B;
					transition: font-size 0.3s;
				}
				.commandwin-normal .commandwin-title {
					font-size: 20px;
				}
				.commandwin-small .commandwin-title, .commandwin-mini .commandwin-title {
					font-size: 12px;
				}
				.commandwin-box {
					position: absolute;
					left: 16px;
					right: 16px;
					bottom: 8px;
					transition: top 0.3s;
					box-sizing: border-box;
					background: #F7F7F7;
					box-shadow: 0px 0px 1px #F7F7F7;
				}
				.commandwin-normal .commandwin-box {
					top: 36px;
				}
				.commandwin-small .commandwin-box, .commandwin-mini .commandwin-box {
					top: 28px;
				}
				.commandwin-box textarea {
					border: none;
					background: transparent;
					width: calc(100% - 4px);
					height: calc(100% - 4px);
					resize: none;
					font-family: Consolas,monaco,黑体,苹方-简,苹方,Roboto;
					font-weight: 400;
				}
				.commandwin-box textarea::-webkit-scrollbar {
					width: 10px;
					background: transparent;
				}
				.commandwin-box textarea::-webkit-scrollbar-thumb {
					border-radius: 10px;
					background: rgba(127, 127, 127, 0.2);
				}
				.commandwin-box textarea::-webkit-scrollbar-track {
					border-radius: 10px;
					background: rgba(127, 127, 127, 0.1);
				}

</style>

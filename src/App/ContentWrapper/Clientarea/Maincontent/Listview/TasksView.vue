<template>
	<div id="tasks-view" @dragenter="onDragenter($event)" @dragover="onDragenter($event)" @dragleave="onDragleave($event)" @drop="onDrop($event)">
		<div id="startbutton" class="startbutton " :class="startbuttonClass" @click="$store.commit('startNpause')">{{ this.$store.state.workingStatus > 0 ? '⏸暂停' : '▶开始' }}</div>
		<div id="tasklist-wrapper">
			<div id="tasklist">
				<taskitem v-for="(task, index) in taskList" :key="task.id" :id='task.id' :duration="task.duration" :filename="task.filename" :before="task.before" :after="task.after" :progress_smooth="task.progress_smooth" :status="task.status" :selected="taskSelected(task.id)" :computed_after="task.computedAfter" @itemClicked="onItemClicked($event, task.id, index)" @pauseNremove="onItemPauseNdelete(task.id)"></taskitem>
			</div>
			<div id="dropfilesdiv" @click="itemUnselect">
				<div id="dropfilesimage" @click="debugLauncher" :style="{ 'backgroundImage': `url(${dropfilesimage})` }"></div>
			</div>
		</div>
	</div>
</template>

<script>
import Taskitem from './Taskitem/Taskitem'

const remote = window.require('electron').remote
const currentWindow = remote.getCurrentWindow()

const TASK_DELETED = -2;
const TASK_PENDING = -1;
const TASK_STOPPED = 0;
const TASK_RUNNING = 1;
const TASK_PAUSED = 2;
const TASK_STOPPING = 3;
const TASK_FINISHING = 4;
const TASK_FINISHED = 5;
const TASK_ERROR = 6;

export default {
	name: 'TasksView',
	components: {
		Taskitem
	},
	props: {
		
	},
	data: () => { return {
		clickSpeedCounter: 0,
		clickSpeedTimer: 0,
		clickSpeedTimerStatus: false,
		taskSelection_last: -1,
		draggingFiles: false,
		lastTaskListLength: 0		// 记录上一次计算 taskList 的长度，如变大了说明拖进来文件，就要滚动到底
	}},
	computed: {
		taskList: function () {
			// console.log('taskList updated at ' + new Date().getTime())
			var ret = []
			for (const taskIndex of this.$store.state.taskOrder) {
				let task = this.$store.state.tasks.get(taskIndex)
				if (typeof task != 'undefined') {
					ret.push({ ...task, id: taskIndex })
				}
			}
			// 新任务加入，更新选择
			if (ret.length > this.lastTaskListLength) {
				this.$nextTick(() => {
					})
				setTimeout(() => {
					this.$store.commit('taskSelection_update', new Set([(ret.slice(ret.length - 1)[0]).id]))
					var tasklistWrapper = document.getElementById('tasklist-wrapper')
					tasklistWrapper.scrollTop = tasklistWrapper.scrollHeight - tasklistWrapper.offsetHeight
				}, 100);			// 咱也不清楚为啥要给个延时，不然读出来的数据不更新到 DOM 上
			}
			this.lastTaskListLength = ret.length
			return ret
		},
		taskSelected: function () {
			// this.$store.state.taskSelection		// 使 Vue 监听到 taskSelection 的变化，否则 Vue 只是在监听下面的 function（后来改成使用 store 存储 taskSelection，每次直接更新整个 Set 的引用，因此这里不需要了）
			// onItemClicked 使 this.taskSelection 产生变化，触发 taskSelected，taskitem 的 selected prop 更新，触发重新渲染
			return function (id) {
				return this.$store.state.taskSelection.has(id)
			}
		},
		dropfilesimage: function () {
			if (this.$store.state.FFmpegVersion != '-') {
				if (this.draggingFiles) {
					return '/drop_files_ok.png'
				} else {
					return '/drop_files.png'
				}
			} else {
				return '/drop_files_noffmpeg.png'
			}
		},
		startbuttonClass: function () {
			return this.$store.state.workingStatus > 0 ? 'startbutton-yellow' : 'startbutton-green'
		}
	},
	methods: {
		debugLauncher: function () {
			this.clickSpeedCounter += 20;
			if (this.clickSpeedCounter > 100) {
				this.$store.commit('popup', {
					msg: '打开开发者工具',
					level: 0
				})
				currentWindow.openDevTools();
				this.clickSpeedCounter = 0;
				clearInterval(this.clickSpeedTimer);
				this.clickSpeedTimerStatus = false;
			} else if (this.clickSpeedTimerStatus == false) {
				this.clickSpeedTimerStatus = true;
				this.clickSpeedTimer = setInterval(() => {
					// console.log(this.clickSpeedCounter)
					if (this.clickSpeedCounter == 0) {
						clearInterval(this.clickSpeedTimer);
						this.clickSpeedTimerStatus = false;
					}
					this.clickSpeedCounter -= 1;
				}, 70)
			}
		},
		onItemClicked: function (event, id, index) {
			var currentSelection = new Set(this.$store.state.taskSelection)
			if (event.shiftKey) {
				if (this.taskSelection_last != -1) {		// 之前没选东西，现在选一堆
					currentSelection.clear()
					var minIndex = Math.min(this.taskSelection_last, index);
					var maxIndex = Math.max(this.taskSelection_last, index);
					for (var i = minIndex; i <= maxIndex; i++) {	// 对 taskOrder 里指定区域项目进行选择
						currentSelection.add(this.taskList[i].id)
						// if (taskArray.has(id)) {	// 如果任务未被删除
						// 	currentSelection.add(i);
						// }
					}
				} else {							// 之前没选东西，现在选第一个
					currentSelection = new Set([id])
				}
			} else if (event.ctrlKey == true) {
				if (currentSelection.has(id)) {
					currentSelection.delete(id);
				} else {
					currentSelection.add(id);
				}
			} else {
				currentSelection.clear()
				currentSelection.add(id)
			}
			this.taskSelection_last = index;
			// this.taskSelection = new Set([...this.taskSelection])	// 更新自身的引用值以触发 computed: taskSelected
			this.$store.commit('taskSelection_update', currentSelection)
		},
		itemUnselect: function () {
			this.$store.commit('taskSelection_update', new Set())
		},
		onItemPauseNdelete: function (id) {
			this.$store.commit('pauseNremove', id)
		},
		onDragenter: function (event) {
			// 这里把 dragenter 和 dragover 都引到这里了，拖动时会高频率调用，虽然不是很好，但是不加 dragover 会导致 drop 没反应
			if (this.$store.state.FFmpegVersion != '-') {
				event.preventDefault()
				this.draggingFiles = true
			}
		},
		onDragleave: function (event) {
			event.preventDefault()
			this.draggingFiles = false
		},
		onDrop: function (event) {
			event.stopPropagation()
			this.draggingFiles = false
			var dropDelayCount = 0
			for (const file of event.dataTransfer.files) {
				setTimeout(() => {
					console.log(file.path)
					this.$store.commit('addTask', file)
				}, dropDelayCount);
				dropDelayCount += 100
			}
		}
	}
}

</script>

<style scoped>
	#tasks-view {
		position: absolute;
		width: 100%;
		height: 100%;
		/* background: #EEE; */
	}
		.startbutton-green {
			background: linear-gradient(180deg, #5e5, #3c3);
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.15),
						0px 4px 16px -4px #5e5;
		}
		.startbutton-green:active {
			background: linear-gradient(180deg, #292, #3c3);
		}
		.startbutton-green:hover {
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.15),
						0px 4px 24px 0px #5e5;
		}
		.startbutton-yellow {
			background: linear-gradient(180deg, #ed5, #cb3);
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.15),
						0px 4px 16px -4px #ed5;
		}
		.startbutton-yellow:active {
			background: linear-gradient(180deg, #992, #cb3);
		}
		.startbutton-yellow:hover {
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.15),
						0px 4px 24px 0px #ed5;
		}
		.startbutton {
			position: absolute;
			top: 10px;
			right: 16px;
			width: 120px;
			height: 36px;
			display: table-cell;
			text-align: center;
			line-height: 36px;
			font-size: 20px;
			letter-spacing: 4px;
			color: #FFF;
			text-shadow: 0px 1px 1px rgba(0, 0, 0, 0.5);
			border-radius: 10px;
		}
		.startbutton:hover:before {
			position: absolute;
			left: 0;
			content: "";
			width: 100%;
			height: 100%;
			border-radius: 10px;
			background: -webkit-linear-gradient(-90deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
		}

		#tasklist-wrapper {
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			top: 56px;
			overflow-y: auto;
			display: flex;
			flex-direction: column;
		}
			#tasklist {
				padding-bottom: 8px;
			}
			#dropfilesdiv {
				display: flex;
				width: 100%;
				min-height: 80px;
				flex-grow : 1;
			}
				#dropfilesimage {
					/* background-image: url(/drop_files.png); */
					background-size: contain;
					background-position: center;
					background-repeat: no-repeat;
					margin: auto;
					width: 100%;
					max-height: 400px;
					height: 100%;
				}

</style>

<template>
	<div id="tasks-view" @dragenter="onDragenter($event)" @dragover="onDragenter($event)" @dragleave="onDragleave($event)" @drop="onDrop($event)">
		<button id="startbutton" class="startbutton " :class="startbuttonClass" @click="$store.commit('startNpause')">{{ this.$store.state.workingStatus > 0 ? '⏸暂停' : '▶开始' }}</button>
		<div id="tasklist-wrapper">
			<div id="tasklist">
				<taskitem v-for="(task, index) in taskList" :key="parseInt(task.id)" :id='task.id' :duration="task.duration" :filename="task.filename" :before="task.before" :after="task.after" :progress_smooth="task.progress_smooth" :status="task.status" :selected="taskSelected(task.id)" :computed_after="task.computedAfter" @itemClicked="onItemClicked($event, task.id, index)" @pauseNremove="onItemPauseNdelete(task.id)"></taskitem>
			</div>
			<div id="dropfilesdiv" @click="itemUnselect">
				<div id="dropfilesimage" @click="debugLauncher" :style="{ 'backgroundImage': `url(${dropfilesimage})` }"></div>
			</div>
		</div>
	</div>
</template>

<script>
import Taskitem from './Taskitem/Taskitem'

let remote, currentWindow
if (process.env.IS_ELECTRON) {
	remote = window.require('electron').remote
	currentWindow = remote.getCurrentWindow()
}

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
		taskSelection_last: -1,
		draggingFiles: false,
		lastTaskListLength: 0		// 记录上一次计算 taskList 的长度，如变大了说明拖进来文件，就要滚动到底
	}},
	computed: {
		taskList: function () {
			console.log('taskList updated at ' + new Date().getTime())
			var ret = [];
			for (const [id, task] of Object.entries(this.$store.state.tasks)) {
				ret.push({ ...task, id })
			}
			// 新任务加入，滚动到底
			if (ret.length > this.lastTaskListLength) {
				// v2.4 开始这里不需要加延时了
				// this.$store.commit('taskSelection_update', new Set([(ret.slice(ret.length - 1)[0]).id]))
				var tasklistWrapper = document.getElementById('tasklist-wrapper')
				tasklistWrapper.scrollTop = tasklistWrapper.scrollHeight - tasklistWrapper.offsetHeight
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
					return '/images/drop_files_ok.png'
				} else {
					return '/images/drop_files.png'
				}
			} else {
				return '/images/drop_files_noffmpeg.png'
			}
		},
		startbuttonClass: function () {
			return this.$store.state.workingStatus > 0 ? 'startbutton-yellow' : 'startbutton-green'
		}
	},
	methods: {
		debugLauncher: (function () {
			var clickSpeedCounter = 0
			var clickSpeedTimer = 0
			var clickSpeedTimerStatus = false
			return function () {
				clickSpeedCounter += 20;
				if (clickSpeedCounter > 100) {
					this.$store.commit('popup', {
						msg: '打开开发者工具',
						level: 0
					})
					currentWindow.openDevTools();
					clickSpeedCounter = 0;
					clearInterval(clickSpeedTimer);
					clickSpeedTimerStatus = false;
				} else if (clickSpeedTimerStatus == false) {
					clickSpeedTimerStatus = true;
					clickSpeedTimer = setInterval(() => {
						// console.log(clickSpeedCounter)
						if (clickSpeedCounter == 0) {
							clearInterval(clickSpeedTimer);
							clickSpeedTimerStatus = false;
						}
						clickSpeedCounter -= 1;
					}, 70)
				}
			}
		})(),
		onItemClicked: function (event, id, index) {
			console.log(event)
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
			} else if (event.ctrlKey == true || remote.process.platform == 'darwin' && event.metaKey == true) {
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
		onDrop: function (event) {	// 此函数触发四次 taskList update，分别为加入任务、ffmpeg data、ffmpeg metadata、taskSelection update
			event.stopPropagation()
			this.draggingFiles = false
			var dropDelayCount = 0
			var fileCount = event.dataTransfer.files.length
			let newIDs = []
			for (const file of event.dataTransfer.files) {
				setTimeout(() => {	// v2.4 版本开始完全可以不要延时，但是太生硬，所以加个动画
					console.log(file.path)
					this.$store.commit('addTask', { name: file.name, path: file.path, callback: id => {
						newIDs.push(id + '')
						if (--fileCount == 0) {
							this.$store.commit('taskSelection_update', new Set(newIDs))
						}
					}})
				}, dropDelayCount);
				// console.log(dropDelayCount)
				dropDelayCount += 33.33
			}
		}
	},
	watch: {
		/*	仅供数据刷新测试，经试验在使用 Vue.set 时不需 deep 也能监听
		'$store.state.tasks': {
			handler: function(newValue, oldValue) {
				console.log('task: ', newValue, oldValue)
			},
		}
		*/
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
			border: none;
			outline: none;
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
					/* background-image: url(/images/drop_files.png); */
					background-size: contain;
					background-position: center;
					background-repeat: no-repeat;
					margin: auto;
					width: 100%;
					max-height: 400px;
					height: 100%;
				}

</style>

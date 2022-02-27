<template>
	<div id="tasks-view" @dragenter="onDragenter($event)" @dragover="onDragenter($event)" @dragleave="onDragleave($event)" @drop="onDrop($event)">
		<div class="server">
			<combobox title="服务器" readonly="true" :deletable="true" :text="$store.state.currentServerName" :list="serverList" @change="onServerChange($event)" @delete="onServerDelete($event)"></combobox>
			<buttonbox text="添加服务器" @click="addServer"></buttonbox>
		</div>
		<button id="startbutton" class="startbutton " :class="startbuttonClass" @click="$store.commit('startNpause')">{{ startbuttonText }}</button>
		<div id="tasklist-wrapper" ref="tasklist_wrapper">
			<div id="tasklist">
				<taskitem v-for="(task, index) in taskList" :key="parseInt(task.id)" :id='task.id' :duration="task.duration" :file_name="task.fileBaseName" :before="task.before" :after="task.after" :dashboard_smooth="task.dashboard_smooth" :size="task.transferProgressLog.total" :status="task.status" :transferStatus="task.transferStatus" :selected="taskSelected(task.id)" @itemClicked="onItemClicked($event, task.id, index)" @pauseNremove="onItemPauseNdelete(task.id)"></taskitem>
			</div>
			<div id="dropfilesdiv" @click="itemUnselect">
				<div id="dropfilesimage" @click="debugLauncher" :style="{ 'backgroundImage': `url(${dropfilesimage})` }"></div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';

import { BaseComboItem, NotificationLevel, Server, UITask } from '@/types/types';
import Taskitem from '@/electron/components/Taskitem.vue'
import nodeBridge from "@/electron/bridge/nodeBridge";
import Combobox from '@/electron/components/parabox/Combobox.vue';
import Buttonbox from '@/electron/components/parabox/Buttonbox.vue';

export default Vue.extend({
	name: 'TasksView',
	components: {
		Taskitem, Combobox, Buttonbox
	},
	data: () => { return {
		selectedTask_last: -1,
		draggingFiles: false,
		lastTaskListLength: 0		// 记录上一次计算 taskList 的长度，如变大了说明拖进来文件，就要滚动到底
	}},
	computed: {
		serverList: function (): Array<BaseComboItem> {
			let ret: Array<BaseComboItem> = [];
			for (const key of Object.keys(this.$store.state.servers)) {
				ret.push({
					sName: key,
					lName: key,
				})
			}
			return ret;
		},
		taskList: function (): Array<UITask & {id: number}> {
			let currentServer: Server = this.$store.getters.currentServer;
			if (!currentServer) {
				return [];
			}
			let ret = [];
			for (const [id_s, task] of Object.entries(currentServer.tasks)) {
				let id = parseInt(id_s);
				if (id_s !== '-1') {
					ret.push({ ...task, id });
				}
			}
			// 新任务加入，滚动到底
			if (ret.length > this.lastTaskListLength) {
				let tasklistWrapper = this.$refs.tasklist_wrapper as Element;
				tasklistWrapper.scrollTop = tasklistWrapper.scrollHeight - tasklistWrapper.getBoundingClientRect().height;
			}
			this.lastTaskListLength = ret.length;
			return ret;
		},
		taskSelected: function (): (id: number) => boolean {
			// this.$store.state.selectedTask		// 使 Vue 监听到 selectedTask 的变化，否则 Vue 只是在监听下面的 function（后来改成使用 store 存储 selectedTask，每次直接更新整个 Set 的引用，因此这里不需要了）
			// onItemClicked 使 this.selectedTask 产生变化，触发 taskSelected，taskitem 的 selected prop 更新，触发重新渲染
			return (id: number) => {
				return this.$store.state.selectedTask.has(id);
			}
		},
		dropfilesimage: function (): string {
			let currentServer: Server = this.$store.getters.currentServer;
			if (!currentServer) {
				return '/images/drop_files_noserver.png';
			}
			if (currentServer.ffmpegVersion != '-') {
				if (this.draggingFiles) {
					return '/images/drop_files_ok.png';
				} else {
					return '/images/drop_files.png';
				}
			} else {
				return '/images/drop_files_noffmpeg.png';
			}
		},
		startbuttonText: function () {
			let currentServer: Server = this.$store.getters.currentServer;
			if (!currentServer) {
				return '-';
			}
			return currentServer.workingStatus > 0 ? '⏸暂停' : '▶开始'
		},
		startbuttonClass: function (): string {
			let currentServer: Server = this.$store.getters.currentServer;
			if (!currentServer) {
				return 'startbutton-gray';
			}
			return currentServer.workingStatus > 0 ? 'startbutton-yellow' : 'startbutton-green';
		}
	},
	methods: {
		debugLauncher: (() => {
			let clickSpeedCounter = 0;
			let clickSpeedTimer = 0;
			let clickSpeedTimerStatus = false;
			return function () {
				clickSpeedCounter += 20;
				if (clickSpeedCounter > 100) {
					// @ts-ignore
					this.$popup({
						message: '打开开发者工具',
						level: NotificationLevel.info
					});
					(nodeBridge.remote?.getCurrentWindow() as any).openDevTools();
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
					}, 70) as any as number;
				}
			}
		})(),
		onServerChange: function (value: string) {
			this.$store.commit('switchServer', { serverName: value });
		},
		onServerDelete: function (index: number) {
			let serverName = this.serverList[index].sName;
			if (serverName === 'localhost') {
				this.$popup({
					message: '不支持断开本地服务器的连接',
					level: NotificationLevel.error,
				})
			} else {
				this.$store.commit('removeServer', { serverName });
			}
		},
		addServer: function () {
			this.$inputbox({
				title: '添加服务器',
				inputs: [
					{ title: 'IP', default: '127.0.0.1', notNull: true },
					{ title: '端口', default: '33269', type: 'number' },
				],
			}).then((inputsValue: Array<string>) => {
				this.$store.commit('addServer', {
					ip: inputsValue[0],
					port: inputsValue[1],
				})
			})
		},
		onItemClicked: function (event: MouseEvent, id: number, index: number) {
			let currentSelection = new Set(this.$store.state.selectedTask);
			if (event.shiftKey) {
				if (this.selectedTask_last != -1) {		// 之前没选东西，现在选一堆
					currentSelection.clear();
					var minIndex = Math.min(this.selectedTask_last, index);
					var maxIndex = Math.max(this.selectedTask_last, index);
					for (var i = minIndex; i <= maxIndex; i++) {	// 对 taskOrder 里指定区域项目进行选择
						currentSelection.add(this.taskList[i].id);
						// if (taskArray.has(id)) {	// 如果任务未被删除
						// 	currentSelection.add(i);
						// }
					}
				} else {							// 之前没选东西，现在选第一个
					currentSelection = new Set([id]);
				}
			} else if (event.ctrlKey == true || nodeBridge.os === 'MacOS' && event.metaKey == true) {
				if (currentSelection.has(id)) {
					currentSelection.delete(id);
				} else {
					currentSelection.add(id);
				}
			} else {
				currentSelection.clear();
				currentSelection.add(id);
			}
			this.selectedTask_last = index;
			// this.selectedTask = new Set([...this.selectedTask])	// 更新自身的引用值以触发 computed: taskSelected
			this.$store.commit('selectedTask_update', currentSelection);
		},
		itemUnselect: function () {
			this.$store.commit('selectedTask_update', new Set());
		},
		onItemPauseNdelete: function (id: string) {
			this.$store.commit('pauseNremove', id);
		},
		onDragenter: function (event: DragEvent) {
			// 这里把 dragenter 和 dragover 都引到这里了，拖动时会高频率调用，虽然不是很好，但是不加 dragover 会导致 drop 没反应
			let currentServer: Server = this.$store.getters.currentServer;
			if (!currentServer || currentServer.ffmpegVersion === '-') {
				return;
			}
			event.preventDefault();
			this.draggingFiles = true;
		},
		onDragleave: function (event: DragEvent) {
			event.preventDefault();
			this.draggingFiles = false;
		},
		onDrop: function (event: DragEvent) {	// 此函数触发四次 taskList update，分别为加入任务、ffmpeg data、ffmpeg metadata、selectedTask update
			event.stopPropagation();
			this.draggingFiles = false;
			this.$store.commit('addTasks', (event.dataTransfer && event.dataTransfer.files) || []);
		},
	},
});

</script>

<style scoped>
	#tasks-view {
		position: absolute;
		width: 100%;
		height: 100%;
		/* background: #EEE; */
	}
		.server {
			text-align: left;
		}
			.server>* {
				display: inline-block;
				vertical-align: middle;
				margin-top: 2px;
				margin-bottom: 2px;
			}
		.startbutton-green {
			background: linear-gradient(180deg, hsl(120, 80%, 65%), hsl(120, 60%, 50%));
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.15),
						0px 4px 16px -4px hsl(120, 80%, 65%);
		}
		.startbutton-green:active {
			background: linear-gradient(180deg, hsl(120, 65%, 35%), hsl(120, 60%, 50%));
		}
		.startbutton-green:hover {
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.15),
						0px 4px 24px 0px hsl(120, 80%, 65%);
		}
		.startbutton-yellow {
			background: linear-gradient(180deg, hsl(54, 80%, 65%), hsl(54, 60%, 50%));
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.15),
						0px 4px 16px -4px hsl(54, 80%, 65%);
		}
		.startbutton-yellow:active {
			background: linear-gradient(180deg, hsl(54, 65%, 35%), hsl(54, 60%, 50%));
		}
		.startbutton-yellow:hover {
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.15),
						0px 4px 24px 0px hsl(54, 80%, 65%);
		}
		.startbutton-gray {
			background: linear-gradient(180deg, hsl(0, 0%, 65%), hsl(0, 0%, 50%));
			box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
						0px 1px 1px 0px rgba(16, 16, 16, 0.15),
						0px 2px 6px 0px rgba(0, 0, 0, 0.15),
						0px 4px 16px -4px hsl(0, 0%, 65%);
		}
		.startbutton {
			position: absolute;
			top: 12px;
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

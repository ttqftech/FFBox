<template>
	<div id="app">
		<main-frame></main-frame>
	</div>
</template>

<script lang="ts">
import Vue from 'vue'
import Vuex from 'vuex'

import MainFrame from '@/electron/containers/MainFrame.vue'
import Popup from '@/electron/components/floating/Popup/index'
import Msgbox from '@/electron/components/floating/Msgbox/index.js'
import Tooltip from '@/electron/components/floating/Tooltip/index.js'

let ElectronStore, electronStore: any, ipc: any, remote: any, currentWindow: any, spawn: any
if (process.env.IS_ELECTRON) {
	ElectronStore = window.require('electron-store')
	electronStore = new ElectronStore()
	ipc = window.require('electron').ipcRenderer
	remote = window.require('electron').remote
	currentWindow = remote.getCurrentWindow();
	spawn = window.require('child_process').spawn;
}

const maxThreads = 2

import { FFBoxService } from "@/service/FFBoxService";

import { defaultParams } from "../common/defaultParams";
import { StoreState, NotificationLevel, ServiceTask, WorkingStatus, TaskStatus, Server, UITask, Task } from '@/types/types'
import { getInitialUITask } from '@/common/utils'
import { version, buildNumber } from "@/types/constants";
import { getFFmpegParaArray } from '@/common/getFFmpegParaArray'
import { mergeTaskFromService } from '@/service/netApi'

let ffboxService: FFBoxService;
let mainVue: Vue;

Vue.use(Vuex)
Vue.use(Popup);
Vue.use(Msgbox);
Vue.use(Tooltip);

const store = new Vuex.Store<StoreState>({
	state: {
		// 界面类
		showSponsorCenter: false,
		showInfoCenter: false,
		listSelected: 0,
		paraSelected: 1,
		draggerPos: 60,
		// 非界面类
		notifications: [],
		servers: {
			'local': { tasks: [], ffmpegVersion: '', workingStatus: WorkingStatus.stopped, progress: 0 }
		},
		currentServerName: 'local',
		selectedTask: new Set(),
		globalParams: Object.assign({}, defaultParams),
		overallProgressTimerID: NaN,
	},
	getters: {
		currentServer (state) {
			return state.servers[state.currentServerName];
		}
	},
	mutations: {
		// #region 纯 UI
		// 切换显示/不显示打赏中心
		showSponsorCenter_update (state, value: boolean) {
			state.showSponsorCenter = value;
			if (state.showSponsorCenter && state.showInfoCenter) {
				state.showInfoCenter = false;
			}
		},
		// 切换显示/不显示通知中心
		showInfoCenter_update (state, value) {
			state.showInfoCenter = value
			if (state.showSponsorCenter && state.showInfoCenter) {
				state.showSponsorCenter = false
			}
		},
		// 更改左侧边栏选择的项目，其中（0~1）更改 list，（2~8）更改 para
		listNparaSelect (state, value) {
			if (value < 2) {
				state.listSelected = value
			} else {
				state.paraSelected = value - 2
			}
		},
		// 拖动参数盒的横杠
		dragParabox (state, value) {
			state.draggerPos = value
		},
		// #endregion
		// 点击开始/暂停按钮
		startNpause (state) {
			let currentServer = state.servers[state.currentServerName];
			if (!currentServer) {
				return;
			}
			if (currentServer.workingStatus === WorkingStatus.stopped || currentServer.workingStatus === WorkingStatus.paused) {		// 开始任务
				ffboxService.queueAssign();
			} else {
				ffboxService.queuePause();
			}
		},
		pauseNremove (state, id: number) {
			let currentServer = state.servers[state.currentServerName];
			if (!currentServer) {
				return;
			}
			let task = currentServer.tasks[id];
			if (task.status === TaskStatus.TASK_RUNNING) {
				ffboxService.taskPause(id);
			} else if (task.status === TaskStatus.TASK_PAUSED || task.status === TaskStatus.TASK_STOPPING || task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR) {
				ffboxService.taskReset(id);
			} else if (task.status === TaskStatus.TASK_STOPPED) {
				ffboxService.taskDelete(id);
			}
		},
		dashboardTimer (state, id) {
			/*
			var task = state.tasks[id]
			var index = task.taskProgress.length - 1;			// 上标 = 长度 - 1
			var avgTotal = 6, avgCount = 0;						// avgTotal 为权重值，每循环一次 - 1；avgCount 每循环一次加一次权重
			var deltaSysTime = 0, deltaFrame = 0, deltaTime = 0
			while (index > 1 && task.taskProgress.length - index < 6) {													// 数据量按最大 6 条算，忽略第 1 条
				deltaSysTime += (task.taskProgress[index][0] - task.taskProgress[index - 1][0]) * avgTotal;				// x 轴
				deltaFrame += (task.taskProgress[index][1] - task.taskProgress[index - 1][1]) * avgTotal;					// y 轴
				deltaTime += (task.taskProgress[index][2] - task.taskProgress[index - 1][2]) * avgTotal;					// y 轴
				avgCount += avgTotal;
				avgTotal--;
				index--;
			}
			deltaSysTime /= avgCount; deltaFrame /= avgCount; deltaTime /= avgCount;							// 取平均
			index = task.taskProgress.length - 1			// 上标 = 长度 - 1
			var frameK = (deltaFrame / deltaSysTime); var frameB = task.taskProgress[index][1] - frameK * task.taskProgress[index][0];		// b = y1 - x1 * k;
			var timeK = (deltaTime / deltaSysTime); var timeB = task.taskProgress[index][2] - timeK * task.taskProgress[index][0];

			// size 专属处理区域
			var index = task.taskProgress_size.length - 1;	// 上标 = 长度 - 1
			var avgTotal = 3, avgCount = 0;					// avgTotal 为权重值，每循环一次 - 1；avgCount 每循环一次加一次权重
			var deltaSysTime = 0, deltaSize = 0;
			while (index > 0 && task.taskProgress_size.length - index < 3) {												// 数据量按最大 3 条算，无需忽略第 1 条
				deltaSysTime += (task.taskProgress_size[index][0] - task.taskProgress_size[index - 1][0]) * avgTotal;		// x 轴
				deltaSize += (task.taskProgress_size[index][1] - task.taskProgress_size[index - 1][1]) * avgTotal;		// y 轴
				avgCount += avgTotal;
				avgTotal--;
				index--;
			}
			deltaSysTime /= avgCount; deltaSize /= avgCount;	// 取平均
			index = task.taskProgress_size.length - 1;		// 上标 = 长度 - 1
			var sizeK = (deltaSize / deltaSysTime); var sizeB = task.taskProgress_size[index][1] - sizeK * task.taskProgress_size[index][0];

			var sysTime = new Date().getTime() / 1000;
			var currentFrame = frameK * sysTime + frameB;
			var currentTime = timeK * sysTime + timeB;		// 单位：s
			var currentSize = sizeK * sysTime + sizeB;		// 单位：kB
			// console.log("frameK: " + frameK + ", timeK: " + timeK + ", sizeK: " + sizeK);
			// console.log("currentFrame: " + currentFrame + ", currentTime: " + currentTime + ", currentSize: " + currentSize);

			// 界面显示内容：码率、速度、时间、帧
			// 计算方法：码率：Δ大小/Δ时间　速度：（带视频：Δ帧/视频帧速/Δ系统时间　纯音频：Δ时间/Δ系统时间（秒））　时间、帧：平滑
			if (task.before.duration != -1) {
				var progress = currentTime / task.before.duration
				if (isNaN(progress) || progress == Infinity) {
					task.progress.progress = 0
				} else {
					task.progress.progress = progress
				}
			} else {
				task.progress.progress = 0.5;
			}
			if (task.progress.progress < 0.995) {				// 进度满了就别更新了
				task.progress.bitrate = (sizeK / timeK) * 8;
				if (task.before.vframerate != "-") {				// 可以读出帧速，用帧速算更准确
					task.progress.speed = frameK / task.before.vframerate;
				} else {
					task.progress.speed = 0;
				}
				task.progress.time = currentTime;
				task.progress.frame = currentFrame;

				// 平滑处理
				task.progress_smooth.progress = task.progress_smooth.progress * 0.7 + task.progress.progress * 0.3;
				task.progress_smooth.bitrate  = task.progress_smooth.bitrate * 0.9 + task.progress.bitrate * 0.1;
				task.progress_smooth.speed    = task.progress_smooth.speed * 0.6 + task.progress.speed * 0.4;
				task.progress_smooth.time     = task.progress_smooth.time * 0.7 + task.progress.time * 0.3;
				task.progress_smooth.frame    = task.progress_smooth.frame * 0.7 + task.progress.frame * 0.3;
				if (isNaN(task.progress_smooth.bitrate) || task.progress_smooth.bitrate == Infinity) {task.progress_smooth.bitrate = 0;} 
				if (isNaN(task.progress_smooth.speed)) {task.progress_smooth.speed = 0;} 
				if (isNaN(task.progress_smooth.time)) {task.progress_smooth.time = 0;} 
				if (isNaN(task.progress_smooth.frame)) {task.progress_smooth.frame = 0;} 
			} else {
				task.progress.progress = 1;
			}
			task.progress_smooth = JSON.parse(JSON.stringify(task.progress_smooth))
			// state.taskOrder = [...state.taskOrder]			// 刷新 TasksView 的 taskList
			*/
		},
		overallProgressTimer (state) {
			/*
			if (this.getters.queueTaskCount > 0) {
				var totalTime = 0.000001;
				var totalProcessedTime = 0;
				for (const task of Object.values(state.tasks)) {
					totalTime += task.before.duration;
					totalProcessedTime += task.progress_smooth.progress * task.before.duration;
				}
				var progress = totalProcessedTime / totalTime;
				state.progress = progress
				if (this.getters.workingTaskCount > 0) {
					currentWindow.setProgressBar(parseFloat(progress * 0.99 + 0.01), {mode: "normal"});
				} else {
					state.workingStatus = -1
					currentWindow.setProgressBar(parseFloat(progress * 0.99 + 0.01), {mode: "paused"});
					clearInterval(state.overallProgressTimerID);
				}
			} else {			// 任务全部结束
				if (state.workingStatus == 1) {
					if (!currentWindow.isVisible()) {
						currentWindow.flashFrame(true);
					}
					clearInterval(state.overallProgressTimerID);
				}
				state.workingStatus = 0
				currentWindow.setProgressBar(0, {mode: "none"});
				clearInterval(state.overallProgressTimerID);
			}
			*/
		},
		/**
		 * 发布本地消息（存在 store 中，非 local service 的 globalTask）
		 */
		pushMsg (state, args: { message: string, level: NotificationLevel }) {
			// let id = Symbol()
			// state.infos.push({
			// 	msg: args.msg, level: args.level, time: + new Date(), id
			// })
			mainVue.$popup({
				message: args.message,
				level: args.level,
			});
			state.notifications.push({
				time: new Date().getTime(),
				content: args.message,
				level: args.level,
			});
		},
		// 删除第 index 条消息
		deleteMsg (state, index) {
			state.infos.splice(index, 1)
		},
		// 修改参数，保存到本地磁盘（args：type (input | video | videoDetail | audio | audioDetail | output), key, value）。args 不传则直接存盘
		changePara (state, args) {
			if (args) {
				switch (args.type) {
					case 'input':
						state.globalParams.input[args.key] = args.value
						break;
					case 'video':
						state.globalParams.video[args.key] = args.value
						break;
					case 'videoDetail':
						state.globalParams.video.detail[args.key] = args.value
						break;
					case 'audio':
						state.globalParams.audio[args.key] = args.value
						break;
					case 'audioDetail':
						state.globalParams.audio.detail[args.key] = args.value
						break;
					case 'output':
						state.globalParams.output[args.key] = args.value
						break;
				}
			}
			// 更改到一些不匹配的值后会导致 getFFmpegParaArray 出错，但是修正代码就在后面，因此仅需忽略它，让它继续运行下去，不要急着更新
			Vue.nextTick(() => {
				// state.globalParams.paraArray = getFFmpegParaArray('[输入文件名]', state.globalParams.input, state.globalParams.video, state.globalParams.audio, state.globalParams.output)
				state.globalParams = Object.assign({}, state.globalParams);
				
				let currentServer = state.servers[state.currentServerName];
				if (!currentServer) {
					return;
				}
				// 收集需要批量更新的输出参数，交给 service
				let needToUpdateIds: Array<number> = [];
				for (const id of state.selectedTask) {
					let task = currentServer.tasks[parseInt(id)];
					task.after = Object.assign({}, state.globalParams);
					needToUpdateIds.push(parseInt(id));
				}
				// paraArray 由 service 算出后回填本地
				let result = ffboxService.setParameter(needToUpdateIds, state.globalParams);
				for (const indexNid of Object.entries(needToUpdateIds)) {
					let task = currentServer.tasks[parseInt(indexNid[0])];
					task.paraArray = result[indexNid[1]];
				}

				// 刷新所有单个任务
				// state.tasks = new Map(state.tasks)	// 更新整个 tasks，因为 TasksView -> computed -> taskList -> this.$store.state.tasks.get(id) 仅监听到 tasks 这层，无法获知取出的单个 task 的变化
				// this.commit('selectedTask_update', new Set([...state.selectedTask]))
				// paraPreview();					// 这句要在上面 for 之后，因为上面的 for 用于同步全局与单个文件
			})

			// 存盘
			clearTimeout((window as any).saveAllParaTimer);
			(window as any).saveAllParaTimer = setTimeout(() => {
				electronStore.set('input', state.globalParams.input);
				electronStore.set('video', state.globalParams.video);
				electronStore.set('audio', state.globalParams.audio);
				electronStore.set('output', state.globalParams.output);
				console.log("参数已保存");
			}, 700);
		},
		// 使用任务的参数替换参数盒，after 不传值为重置为默认
		replacePara (state, after) {
			if (after) {
				state.globalParams = after;
			} else {
				state.globalParams = Object.assign({}, defaultParams);
			}
		},
		/**
		 * 添加任务
		 * @param args name, path, callback（传回添加后的 id）
		 */
		addTask (state, args) {
			let currentServer = state.servers[state.currentServerName];
			if (!currentServer) {
				return;
			}
			let id = ffboxService.taskAdd(args.path, args.name, state.globalParams);
			let newTask = getInitialUITask(args.name, args.path, state.globalParams);
			currentServer.tasks[id] = newTask;
			if (typeof args.callback == 'function') {
				args.callback(id);
			}
		},
		selectedTask_update (state, set) {
			// console.log('selectedTask updated at ' + new Date().getTime())
			state.selectedTask = set;
			if (set.size > 0) {
				let currentServer = state.servers[state.currentServerName];
				if (!currentServer) {
					return;
				}
				for (const id of set) {
					this.commit('replacePara', currentServer.tasks[id].after);
					break
				}
			}
		},
		// 关闭窗口事件触发时调用
		closeConfirm (state) {
			function readyToClose () {
				ipc.send('exitConfirm');
				ipc.send('close');
			}
			if (this.getters.queueTaskCount > 0) {
				mainVue.$confirm({
					title: '要退出咩？',
					content: `您还有 ${this.getters.queueTaskCount} 个任务未完成，要退出🐴？`,
				}).then(readyToClose);
			} else {
				readyToClose();
			}
		},
		// #region handle FFBox service event，似乎不需要用
		/**
		 * 当接收到 service 过来的 FFBoxServiceEvent.tasklistUpdate 后调用此处更新列表
		 */
		updateTaskList (state, newList) {
			let currentServer = state.servers[state.currentServerName];
			if (!currentServer) {
				return;
			}
			currentServer.tasks = newList;
		},
		/**
		 * 当接收到 service 过来的 FFBoxServiceEvent.ffmpegVersion 后调用此处
		 */
		FFmpegVersion_update (state, content) {
			let currentServer = state.servers[state.currentServerName];
			if (!currentServer) {
				return;
			}
			currentServer.ffmpegVersion = content;
		},
		// #endregion
	}
})

export default Vue.extend({
	name: 'App',
	components: {
		MainFrame
	},
	methods: {
		handleFFmpegVersion(content: string) {
			let currentServer: Server = this.$store.getters.currentServer;
			if (!currentServer) {
				return;
			}
			currentServer.ffmpegVersion = content || '-';
		},
		handleWorkingStatusUpdate(value: WorkingStatus) {
			let currentServer: Server = this.$store.state.servers[this.$store.state.currentServerName];
			if (!currentServer) {
				return;
			}
			currentServer.workingStatus = value;
		},
		handleTasklistUpdate(content: Array<number>) {
			let currentServer: Server = this.$store.getters.currentServer;
			if (!currentServer) {
				return;
			}

			let localI = 0;
			let remoteI = 0;
			let localKeys = Object.keys(currentServer.tasks).map(Number).filter((value) => value >= 0);	// [1,3,4,5]
			let remoteKeys = content.filter((value) => value >= 0);										// [1,3,5,6,7]
			let newTaskList: Array<UITask> = [];
			while (localI < localKeys.length || remoteI < remoteKeys.length) {
				let localKey = localKeys[localI];
				let remoteKey = remoteKeys[remoteI];
				if (localI >= localKeys.length) {
					// 本地下标越界，说明远端添加任务了
					let newTask = getInitialUITask('', '');
					newTask = mergeTaskFromService(newTask, ffboxService.getTask(remoteKey) as Task);
					newTaskList[remoteKey] = newTask;
					remoteI++;
				} else if (remoteI >= remoteKeys.length) {
					// 远端下标越界，说明远端删除了最后面的若干个任务
					break;
				} else if (localKey > remoteKey) {
					// 本地跳号了，说明远端删除了中间的任务
					localI++;
				} else if (localKey === remoteKey) {
					// 从 local 处直接复制
					newTaskList[localKey] = currentServer.tasks[localKey];
					localI++;
					remoteI++;
				}
			}
			currentServer.tasks = Object.assign(newTaskList, {'-1': currentServer.tasks[-1]});
		},
		/**
		 * 更新整个 task
		 */
		handleTaskUpdate(id: number, content: ServiceTask) {
			let currentServer: Server = this.$store.state.servers[this.$store.state.currentServerName];
			if (!currentServer) {
				return;
			}
			currentServer.tasks[id] = mergeTaskFromService(currentServer.tasks[id], content);
			currentServer.tasks = Object.assign({}, currentServer.tasks);
		},
		/**
		 * 增量更新 cmdData
		 */
		handleCmdUpdate(id: number, content: string) {
			let currentServer: Server = this.$store.state.servers[this.$store.state.currentServerName];
			if (!currentServer) {
				return;
			}
			let task = currentServer.tasks[id];
			if (task.cmdData.slice(-1) !== '\n' && task.cmdData.length) {
				task.cmdData += '\n';
			}
			task.cmdData += content;
		},
		/**
		 * 整个更新 taskProgress
		 */
		handleProgressUpdate(id: number, content: any) {
			let currentServer: Server = this.$store.state.servers[this.$store.state.currentServerName];
			if (!currentServer) {
				return;
			}
			currentServer.tasks[id].taskProgress = content;
		},
		/**
		 * 增量更新 notifications
		 */
		handleTaskNotification(id: number, content: string, level: NotificationLevel) {
			let currentServer: Server = this.$store.state.servers[this.$store.state.currentServerName];
			if (!currentServer) {
				return;
			}
			currentServer.tasks[id].notifications.push({ content, level, time: new Date().getTime() });

		},
		// 读取 service 中 task id 为 -1 的 globalTask
		updateGlobalTask () {
			let currentServer: Server = this.$store.state.servers[this.$store.state.currentServerName];
			if (!currentServer) {
				return;
			}
			let newTask = getInitialUITask('', '');
			currentServer.tasks[-1] = mergeTaskFromService(newTask, ffboxService.getTask(-1) as Task);
		},
	},
	beforeCreate: function () {
		document.querySelector('body')!.className = "body";
	},
	mounted: function () {
		document.title = 'FFBox v' + version + (process.env.NODE_ENV != 'production' ? 'd' : '');
		mainVue = this;
		(window as any).mainVue = mainVue;

		console.warn('正在启动 helper');
		let helper = spawn("FFBoxHelper.exe", undefined, {
			detached: false,
			shell: true,
			encoding: 'utf8'
		});
		helper.stdout.on('data', (data) => {
			console.warn(data.toString());
		})
		setTimeout(() => {
			// 保持最上层
			var hwnd
			ipc.on('hwnd', (event, data) => {
				hwnd = data[0] + data[1] * 2**8 + data[2] * 2**16 + data[3] * 2**24
				console.log(`本窗口 hwnd：` + hwnd)
				helper.stdin.write(`2p${hwnd.toString().padStart(7, '0')}`);
			})
			ipc.send('getHwnd')
		}, 500);

		// 更新全局参数输出
		// this.$set(this.$store.state.globalParams, 'paraArray', getFFmpegParaArray('[输入文件名]', this.$store.state.globalParams.input, this.$store.state.globalParams.video, this.$store.state.globalParams.audio, this.$store.state.globalParams.output))

		console.log(
			'exe 路径　　　　　：' + remote.app.getPath('exe') + '\n' +
			'electron 执行路径：' + remote.app.getAppPath() + '\n' +
			'node 路径　　　　 ：' + process.execPath + '\n' +
			'命令执行根路径　　 ：' + process.cwd() + '\n' +
		// 	'命令执行根路径（resolve）：' + resolve('./') + '\n' +
			'页面 js 文件路径　：' + __dirname + '\n'
		);
		// 初始化 FFmpeg
		setTimeout(() => {
			if (!electronStore.has('ffbox.buildNumber') || electronStore.get('ffbox.buildNumber') != buildNumber) {
				this.$store.commit('pushMsg', {
					msg: '欢迎使用 FFBox v' + version + '！',
					level: 0
				});
				electronStore.set('ffbox.buildNumber', buildNumber)
				electronStore.set('input', this.$store.state.globalParams.input)
				electronStore.set('video', this.$store.state.globalParams.video)
				electronStore.set('audio', this.$store.state.globalParams.audio)
				electronStore.set('output', this.$store.state.globalParams.output)
			} else {
				this.$store.commit('replacePara', {
					input: electronStore.get('input'),
					video: electronStore.get('video'),
					audio: electronStore.get('audio'),
					output: electronStore.get('output'),
				});
			}
		}, 0);

		// 挂载退出确认
		ipc.on("exitConfirm", () => this.$store.commit('closeConfirm'));

		// 捐助提示
		setTimeout(() => {
			this.$store.commit('pushMsg', {
				message: '觉得好用的话，可以点击下方状态栏的“支持作者”给 github 上的项目点一个⭐哦～',
				level: 0
			})
		}, 120000)

		// 挂载 ffboxService 各种更新事件
		window.ffboxService = new FFBoxService();
		ffboxService = window.ffboxService;
		ffboxService.on('ffmpegVersion', (data) => {
			console.log('event: ffmpegVersion', data);
			this.$store.commit('pushMsg',{
				message: 'event: ffmpegVersion',
				level: Math.floor(Math.random() * 4),
			})
			this.handleFFmpegVersion(data.content);
		});
		ffboxService.on('workingStatusUpdate', (data) => {
			console.log('event: workingStatusUpdate', data);
			this.$store.commit('pushMsg',{
				message: 'event: workingStatusUpdate',
				level: Math.floor(Math.random() * 4),
			})
			this.handleWorkingStatusUpdate(data.value);
		});
		ffboxService.on('tasklistUpdate', (data) => {
			console.log('event: tasklistUpdate', data);
			this.$store.commit('pushMsg',{
				message: 'event: tasklistUpdate',
				level: Math.floor(Math.random() * 4),
			})
			this.handleTasklistUpdate(data.content);
		});
		ffboxService.on('taskUpdate', (data) => {
			console.log('event: taskUpdate', data);
			this.$store.commit('pushMsg',{
				message: 'event: taskUpdate',
				level: Math.floor(Math.random() * 4),
			})
			this.handleTaskUpdate(data.id, data.content);
		});
		ffboxService.on('cmdUpdate', (data) => {
			console.log('event: cmdUpdate', data);
			this.$store.commit('pushMsg',{
				message: 'event: cmdUpdate',
				level: Math.floor(Math.random() * 4),
			})
			this.handleCmdUpdate(data.id, data.content);
		});
		ffboxService.on('taskNotification', (data) => {
			console.log('event: taskNotification', data);
			this.$store.commit('pushMsg',{
				message: 'event: taskNotification',
				level: Math.floor(Math.random() * 4),
			})
			this.handleTaskNotification(data.id, data.content, data.level);
			mainVue.$popup({
				message: data.content,
				level: data.level,
			});
		});
		this.updateGlobalTask();
		this.handleTasklistUpdate(ffboxService.getTaskList());
		console.log('App 加载完成');
	},
	store
})

</script>

<style>
	.body {
		margin: 0;
		padding: 0;
		background-color: transparent;
		user-select: none;
		font-family: "PingFang SC", 苹方, 微软雅黑, "Segoe UI", Consolas, Avenir, Arial, Helvetica, sans-serif, 黑体;
	}
	#app {
		font-weight: 400;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-align: center;
		color: hsl(0, 0%, 20%);
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}
</style>

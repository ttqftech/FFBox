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

const maxThreads = 2;

import { StoreState, NotificationLevel, ServiceTask, WorkingStatus, TaskStatus, Server, UITask, Task, OutputParams } from '@/types/types'
import { version, buildNumber } from "@/types/constants";
import { getInitialUITask, randomString } from '@/common/utils'
import { defaultParams } from "../common/defaultParams";
import { FFBoxService } from "@/service/FFBoxService";
import { mergeTaskFromService } from '@/service/netApi'
import nodeBridge from "./bridge/nodeBridge";
import osBridge from "./bridge/osBridge";

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
		unreadNotificationCount: 0,
		servers: {
			'local': { tasks: [], ffmpegVersion: '', workingStatus: WorkingStatus.stopped, progress: 0 }
		},
		currentServerName: 'local',
		selectedTask: new Set(),
		globalParams: JSON.parse(JSON.stringify(defaultParams)),
		overallProgressTimerID: NaN,
		machineCode: '',
		functionLevel: 20,
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
			if (state.showInfoCenter) {
				state.unreadNotificationCount = 0;
			}
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
		// #region 任务处理
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
		/**
		 * 添加任务
		 * @param args name, path, callback（传回添加后的 id）
		 */
		addTask (state, args) {
			let currentServer = state.servers[state.currentServerName];
			if (!currentServer) {
				return;
			}
			let id = ffboxService.taskAdd(args.path, args.name, JSON.parse(JSON.stringify(state.globalParams)));
			if (typeof args.callback == 'function') {
				args.callback(id);
			}
		},
		selectedTask_update (state, set) {
			state.selectedTask = set;
			if (set.size > 0) {
				let currentServer = state.servers[state.currentServerName];
				if (!currentServer) {
					return;
				}
				for (const id of set) {
					state.globalParams = JSON.parse(JSON.stringify(currentServer.tasks[id].after));	// replacePara
					break;
				}
			}
		},
		setOverallProgressTimer (state, timerID) {
			state.overallProgressTimerID = timerID;
		},
		// #endregion
		// #region 参数处理
		/**
		 * 修改参数，然后保存到本地磁盘。args 不传则直接存盘
		 */
		changePara (state, args: {type: 'input' | 'video' | 'videoDetail' | 'audio' | 'audioDetail' | 'output', key: string, value: any}) {
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
			let currentServer = state.servers[state.currentServerName];
			if (currentServer) {
				// 收集需要批量更新的输出参数，交给 service
				let needToUpdateIds: Array<number> = [];
				for (const id of state.selectedTask) {
					let task = currentServer.tasks[parseInt(id)];
					task.after = JSON.parse(JSON.stringify(state.globalParams));
					needToUpdateIds.push(parseInt(id));
				}
				// paraArray 由 service 算出后回填本地
				let result = ffboxService.setParameter(needToUpdateIds, state.globalParams);
				for (const indexNid of Object.values(needToUpdateIds)) {
					let task = currentServer.tasks[indexNid];
					task.paraArray = result[indexNid];
				}	
			}

			// 存盘
			clearTimeout((window as any).saveAllParaTimer);
			(window as any).saveAllParaTimer = setTimeout(() => {
				let electronStore = nodeBridge.electronStore;
				if (nodeBridge.isElectron && electronStore) {
					electronStore.set('input', state.globalParams.input);
					electronStore.set('video', state.globalParams.video);
					electronStore.set('audio', state.globalParams.audio);
					electronStore.set('output', state.globalParams.output);
					console.log("参数已保存");
				}
			}, 700);
		},
		/**
		 * 使用任务的参数替换参数盒，after 不传值为重置为默认
		 */
		replacePara (state, after: OutputParams) {
			if (after) {
				state.globalParams = JSON.parse(JSON.stringify(after));
			} else {
				state.globalParams = JSON.parse(JSON.stringify(defaultParams));
			}
		},
		// #endregion
		// #region 通知处理
		/**
		 * 发布本界面消息（存在 store 中，非 local service 的 globalTask）
		 */
		pushMsg (state, args: { message: string, level: NotificationLevel }) {
			mainVue.$popup({
				message: args.message,
				level: args.level,
			});
			state.notifications.push({
				time: new Date().getTime(),
				content: args.message,
				level: args.level,
			});
			state.unreadNotificationCount++;
		},
		/**
		 * 删除消息
		 */
		deleteNotification (state, args: { serverName: string, taskId: number, index: number }) {			
			if (args.serverName) {
				let server: Server = state.servers[args.serverName];
				if (true) {
					ffboxService.deleteNotification(args.taskId, args.index);
				}
			} else {
				state.notifications.splice(args.index, 1);
			}
		},
		/**
		 * 设置未读消息计数器，read 为真时清零，否则计数器 +1
		 */
		setUnreadNotification (state, read: boolean) {
			if (read) {
				state.unreadNotificationCount = 0;
			} else {
				state.unreadNotificationCount++;
			}
		},
		// #endregion
		// #region 其他
		// 关闭窗口事件触发时调用
		closeConfirm (state) {
			function readyToClose () {
				nodeBridge.ipcRenderer?.send('exitConfirm');
				nodeBridge.ipcRenderer?.send('close');
			}
			if (ffboxService.getQueueTaskCount() > 0) {
				mainVue.$confirm({
					title: '要退出咩？',
					content: `本地服务器还有 ${ffboxService.getQueueTaskCount()} 个任务未完成，要退出🐴？`,
				}).then(readyToClose);
			} else {
				readyToClose();
			}
		},
		activate (state, args: { userInput: string, callback: (result: number | false) => any }) {
			let electronStore = nodeBridge.electronStore;
			let cryptoJS = nodeBridge.cryptoJS;
			if (nodeBridge.isElectron && electronStore) {
				/**
				 * 客户端和管理端均使用机器码 + 固定码共 32 位作为 key
				 * 管理端使用这个 key 对 functionLevel 加密，得到的加密字符串由用户输入到 userInput 中去
				 * 客户端将 userInput 使用 key 解密，如果 userInput 不是瞎编的，那么就能解出正确的 functionLevel
				 */
				let machineCode = electronStore.get('userinfo.machineCode');
				let fixedCode = 'be6729be8279be40';
				let key = machineCode + fixedCode;
				let decrypted = cryptoJS.AES.decrypt(args.userInput, key)
				let decryptedString = cryptoJS.enc.Utf8.stringify(decrypted);
				if (parseInt(decryptedString).toString() === decryptedString) {
					state.functionLevel = parseInt(decryptedString);
					ffboxService.activate(machineCode, args.userInput);
					args.callback(parseInt(decryptedString))
				} else {
					args.callback(false);
				}
			}
		},
		setMachineCode (state, code: string) {
			state.machineCode = code;
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
		handleWorkingStatusUpdate(workingStatus: WorkingStatus) {
			let currentServer: Server = this.$store.state.servers[this.$store.state.currentServerName];
			if (!currentServer) {
				return;
			}
			currentServer.workingStatus = workingStatus;
			if (workingStatus === WorkingStatus.running && !this.$store.state.overallProgressTimerID) {
				let timerID = setInterval(overallProgressTimer, 80, workingStatus, currentServer);
				this.$store.commit('setOverallProgressTimer', timerID);
				overallProgressTimer(workingStatus, currentServer);
			} else if (workingStatus === WorkingStatus.stopped && this.$store.state.overallProgressTimerID) {
				clearInterval(this.$store.state.overallProgressTimerID);
				this.$store.commit('setOverallProgressTimer', NaN);
				overallProgressTimer(workingStatus, currentServer);
				if (nodeBridge.remote && nodeBridge.remote.getCurrentWindow().isFocused()) {
					nodeBridge.remote.getCurrentWindow().flashFrame(true);
				}
			} else if (workingStatus === WorkingStatus.paused && this.$store.state.overallProgressTimerID) {
				clearInterval(this.$store.state.overallProgressTimerID);
				this.$store.commit('setOverallProgressTimer', NaN);
				overallProgressTimer(workingStatus, currentServer);
			}
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
				} else if (localKey < remoteKey) {
					// 远端跳号了，说明远端删除了中间的任务
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
			let task = mergeTaskFromService(currentServer.tasks[id], content);
			currentServer.tasks[id] = task;
			// timer 相关处理
			if (task.status === TaskStatus.TASK_RUNNING && !task.dashboardTimer) {
				task.dashboardTimer = setInterval(dashboardTimer, 50, task);
			} else if (task.dashboardTimer) {
				clearInterval(task.dashboardTimer);
				task.dashboardTimer = NaN;
			}
			// 进度条相关处理
			if (task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR) {
				task.progress.progress = 1;
				task.progress_smooth.progress = 1;
			} else if (task.status === TaskStatus.TASK_STOPPED) {
				task.progress.progress = 0;
				task.progress_smooth.progress = 0;
			}
			// currentServer.tasks = Object.assign({}, currentServer.tasks);
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
		 * 整个更新 progressHistory
		 */
		handleProgressUpdate(id: number, progressHistory: Task['progressHistory']) {
			let currentServer: Server = this.$store.state.servers[this.$store.state.currentServerName];
			if (!currentServer) {
				return;
			}
			currentServer.tasks[id].progressHistory = progressHistory;
			if (this.$store.state.functionLevel < 50) {
				if (progressHistory.normal.slice(-1)[0].mediaTime > 671 ||
					progressHistory.elapsed + new Date().getTime() / 1000 - progressHistory.lastStarted > 671) {
					ffboxService.trailLimit_stopTranscoding(id);
					return;
				}
			}

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
			this.$popup({
				message: content,
				level: level,
			});
			this.$store.commit('setUnreadNotification', false);
		},
		/**
		 * 读取 service 中 task id 为 -1 的 globalTask
		 */
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
		document.body.className = "body";
	},
	mounted: function () {
		document.title = 'FFBox v' + version + (process.env.NODE_ENV != 'production' ? 'd' : '');
		mainVue = this;
		(window as any).mainVue = mainVue;

		setTimeout(() => {
			let val = new Date().getSeconds() % 2 === 1 || true;
			this.$popup({
				message: `设置${val ? '毛玻璃' : '光滑玻璃'}`,
				level: 0,
			})
			console.log(`设置${val ? '毛玻璃' : '光滑玻璃'}`);
			osBridge.setBlurBehindWindow(val);
		}, 2500);

		console.log(
			(nodeBridge.remote ? ('exe 路径　　　　　：' + nodeBridge.remote.app.getPath('exe') + '\n') : '') +
			(nodeBridge.remote ? ('electron 执行路径：' + nodeBridge.remote.app.getAppPath() + '\n') : '') +
			(process ? ('node 路径　　　　 ：' + process.execPath + '\n') : '') +
			(process ? ('命令执行根路径　　 ：' + process.cwd() + '\n') : '') +
		// 	'命令执行根路径（resolve）：' + resolve('./') + '\n' +
			'页面 js 文件路径　：' + __dirname + '\n'
		);

		// 初始化参数项
		setTimeout(() => {
			let electronStore = nodeBridge.electronStore;
			if (nodeBridge.isElectron && electronStore) {
				if (!electronStore.has('version.buildNumber') || electronStore.get('version.buildNumber') != buildNumber) {
					// 读取默认值
					this.$store.commit('pushMsg', {
						message: '欢迎使用 FFBox v' + version + '！',
						level: 0
					});
					electronStore.set('version.buildNumber', buildNumber);
					electronStore.set('input', this.$store.state.globalParams.input);
					electronStore.set('video', this.$store.state.globalParams.video);
					electronStore.set('audio', this.$store.state.globalParams.audio);
					electronStore.set('output', this.$store.state.globalParams.output);
					// 生成随机机器码
					let machineCode = randomString(16, '0123456789abcdef');
					electronStore.set('userinfo.machineCode', machineCode);
					this.$store.commit('setMachineCode', machineCode);
				} else {
					// 读取存储值
					this.$store.commit('replacePara', {
						input: electronStore.get('input'),
						video: electronStore.get('video'),
						audio: electronStore.get('audio'),
						output: electronStore.get('output'),
					});
					let machineCode = electronStore.get('userinfo.machineCode');
					this.$store.commit('setMachineCode', machineCode);
					this.$store.commit('activate', {
						userInput: '',
						callback: (result: number | false) => {}
					});

				}
			} else {
				this.$store.commit('pushMsg', {
					message: '欢迎使用 FFBox v' + version + ' 网页版！',
					level: 0,
				});
			}
		}, 0);

		// 挂载退出确认
		nodeBridge.ipcRenderer?.on("exitConfirm", () => this.$store.commit('closeConfirm'));

		// 捐助提示
		setTimeout(() => {
			this.$store.commit('pushMsg', {
				message: '觉得好用的话，可以点击下方状态栏的“支持作者”给本项目点一个⭐哦～',
				level: 0
			})
		}, 120000);

		// 挂载 ffboxService 各种更新事件
		window.ffboxService = new FFBoxService();
		ffboxService = window.ffboxService;
		ffboxService.on('ffmpegVersion', (data) => {
			console.log('event: ffmpegVersion', data);
			this.$store.commit('pushMsg',{
				message: 'event: ffmpegVersion',
				level: 0,
			})
			this.handleFFmpegVersion(data.content);
		});
		ffboxService.on('workingStatusUpdate', (data) => {
			console.log('event: workingStatusUpdate', data);
			this.$store.commit('pushMsg',{
				message: 'event: workingStatusUpdate',
				level: 0,
			})
			this.handleWorkingStatusUpdate(data.value);
		});
		ffboxService.on('tasklistUpdate', (data) => {
			console.log('event: tasklistUpdate', data);
			this.$store.commit('pushMsg',{
				message: 'event: tasklistUpdate',
				level: 0,
			})
			this.handleTasklistUpdate(data.content);
		});
		ffboxService.on('taskUpdate', (data) => {
			console.log('event: taskUpdate', data);
			this.$store.commit('pushMsg',{
				message: 'event: taskUpdate',
				level: 0,
			})
			this.handleTaskUpdate(data.id, data.content);
		});
		ffboxService.on('cmdUpdate', (data) => {
			this.handleCmdUpdate(data.id, data.content);
		});
		ffboxService.on('progressUpdate', (data) => {
			this.handleProgressUpdate(data.id, data.content);
		});
		ffboxService.on('taskNotification', (data) => {
			console.log('event: taskNotification', data);
			this.$store.commit('pushMsg',{
				message: 'event: taskNotification',
				level: 0,
			})
			this.handleTaskNotification(data.id, data.content, data.level);
		});
		this.updateGlobalTask();
		this.handleTasklistUpdate(ffboxService.getTaskList());
		console.log('App 加载完成');
	},
	store,
});

/**
 * 计算单个任务的 timer 函数，根据计算结果原地修改 progress 和 progress_smooth
 */
function dashboardTimer(task: UITask) {
	{
		let prog = task.progressHistory.normal;
		let index = prog.length - 1;
		let avgTotal = 6, avgCount = 0;						// avgTotal 为权重值，每循环一次 - 1；avgCount 每循环一次加一次权重
		let deltaRealTime = 0, deltaFrame = 0, deltaTime = 0;
		while (index > 1 && prog.length - index < 6) {												// 数据量按最大 6 条算，忽略第 1 条
			deltaRealTime += (prog[index].realTime - prog[index - 1].realTime) * avgTotal;			// x 轴
			deltaFrame += (prog[index].frame - prog[index - 1].frame) * avgTotal;					// y 轴
			deltaTime += (prog[index].mediaTime - prog[index - 1].mediaTime) * avgTotal;			// y 轴
			avgCount += avgTotal;
			avgTotal--;
			index--;
		}
		deltaRealTime /= avgCount; deltaFrame /= avgCount; deltaTime /= avgCount;							// 取平均
		index = prog.length - 1;
		var frameK = (deltaFrame / deltaRealTime); var frameB = prog[index].frame - frameK * prog[index].realTime;		// b = y1 - x1 * k;
		var timeK = (deltaTime / deltaRealTime); var timeB = prog[index].mediaTime - timeK * prog[index].realTime;
	}
	{
		var prog = task.progressHistory.size;
		var index = prog.length - 1;
		var avgTotal = 3, avgCount = 0;					// avgTotal 为权重值，每循环一次 - 1；avgCount 每循环一次加一次权重
		var deltaSysTime = 0, deltaSize = 0;
		while (index > 0 && prog.length - index < 3) {												// 数据量按最大 3 条算，无需忽略第 1 条
			deltaSysTime += (prog[index].realTime - prog[index - 1].realTime) * avgTotal;		// x 轴
			deltaSize += (prog[index].size - prog[index - 1].size) * avgTotal;		// y 轴
			avgCount += avgTotal;
			avgTotal--;
			index--;
		}
		deltaSysTime /= avgCount; deltaSize /= avgCount;	// 取平均
		index = prog.length - 1;
		var sizeK = (deltaSize / deltaSysTime); var sizeB = prog[index].size - sizeK * prog[index].realTime;
	}

	let sysTime = new Date().getTime() / 1000;
	let currentFrame = frameK * sysTime + frameB;
	let currentTime = timeK * sysTime + timeB;		// 单位：s
	let currentSize = sizeK * sysTime + sizeB;		// 单位：kB
	// console.log("frameK: " + frameK + ", timeK: " + timeK + ", sizeK: " + sizeK);
	// console.log("currentFrame: " + currentFrame + ", currentTime: " + currentTime + ", currentSize: " + currentSize);

	// 界面显示内容：码率、速度、时间、帧
	// 计算方法：码率：Δ大小/Δ时间　速度：（带视频：Δ帧/视频帧速/Δ系统时间　纯音频：Δ时间/Δ系统时间（秒））　时间、帧：平滑
	if (task.before.duration !== -1) {
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
		if (!isNaN(task.before.vframerate)) {				// 可以读出帧速，用帧速算更准确
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
	// task.progress_smooth = Object.assign({}, task.progress_smooth); 
}

/**
 * 计算整体进度的 timer，根据计算结果修改 currentServer.progress 和 progressBar
 */
function overallProgressTimer(workingStatus: WorkingStatus, currentServer: Server) {
	let tasks = currentServer.tasks;
	let totalTime = 0.000001;
	let totalProcessedTime = 0;
	for (const task of Object.values(tasks)) {
		if (!task.before.duration) {
			continue;
		}
		totalTime += task.before.duration;
		totalProcessedTime += task.progress_smooth.progress * task.before.duration;
	}
	let progress = totalProcessedTime / totalTime;
	currentServer.progress = progress;
	let mode: 'indeterminate' | 'normal' | 'paused' | 'none' | 'error' = 'indeterminate';
	switch (workingStatus) {
		case WorkingStatus.running:
			mode = 'normal';
			break;
		case WorkingStatus.paused:
			mode = 'paused';
			break;
		case WorkingStatus.stopped:
			mode = 'none';
			break;
	}
	nodeBridge.remote?.getCurrentWindow().setProgressBar(progress * 0.99 + 0.01, {mode});
}

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

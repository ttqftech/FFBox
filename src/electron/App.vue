<template>
	<div id="app" :style="showUIstyle">
		<main-frame v-show="showUI"></main-frame>
	</div>
</template>

<script lang="ts">
import Vue from 'vue'
import Vuex from 'vuex'
import upath from 'upath';

import MainFrame from '@/electron/containers/MainFrame.vue'
import Popup from '@/electron/components/floating/Popup/index'
import Msgbox from '@/electron/components/floating/Msgbox/index.js'
import Tooltip from '@/electron/components/floating/Tooltip/index.js'

import { StoreState, NotificationLevel, WorkingStatus, TaskStatus, Server, UITask, Task, OutputParams, FFBoxServiceInterface, OutputParams_input, OutputParams_video, OutputParams_audio, OutputParams_output, SingleProgressLog, TransferStatus } from '@/types/types'
import { version, buildNumber } from "@/types/constants";
import { getInitialUITask, mergeTaskFromService, randomString, replaceOutputParams } from '@/common/utils'
import { defaultParams } from "../common/defaultParams";
import { ServiceBridge } from './bridge/serviceBridge'
import nodeBridge from "./bridge/nodeBridge";
import osBridge from "./bridge/osBridge";

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
		servers: {},
		serviceBridges: {},
		currentServerName: 'localhost',
		selectedTask: new Set(),
		globalParams: JSON.parse(JSON.stringify(defaultParams)),
		downloadMap: new Map(),
		machineCode: '',
		functionLevel: 20,
	},
	getters: {
		currentServer (state) {
			return state.servers[state.currentServerName];
		},
		currentBridge (state) {
			return state.serviceBridges[state.currentServerName];
		},
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
			let currentBridge = state.serviceBridges[state.currentServerName];
			if (!currentServer || !currentBridge) {
				return;
			}
			if (currentServer.workingStatus === WorkingStatus.stopped || currentServer.workingStatus === WorkingStatus.paused) {		// 开始任务
				currentBridge.queueAssign();
			} else {
				currentBridge.queuePause();
			}
		},
		pauseNremove (state, id: number) {
			let currentServer = state.servers[state.currentServerName];
			let currentBridge = state.serviceBridges[state.currentServerName];
			if (!currentServer || !currentBridge) {
				return;
			}
			let task = currentServer.tasks[id];
			if (task.status === TaskStatus.TASK_RUNNING) {
				currentBridge.taskPause(id);
			} else if (task.status === TaskStatus.TASK_PAUSED || task.status === TaskStatus.TASK_STOPPING || task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR) {
				currentBridge.taskReset(id);
			} else if (task.status === TaskStatus.TASK_STOPPED || task.status === TaskStatus.TASK_INITIALIZING) {
				currentBridge.taskDelete(id);
			}
		},
		/**
		 * 添加一系列任务，来自 TaskView.onDrop
		 */
		addTasks (state, files: FileList) {
			let fileCount = files.length;
			let currentBridge = state.serviceBridges[state.currentServerName];
			let newlyAddedTaskIds: Array<Promise<number>> = [];
			let dropDelayCount = 0;
			for (const file of files) {
				setTimeout(() => {	// v2.4 版本开始完全可以不要延时，但是太生硬，所以加个动画
					console.log(file.path);
					let isRemote = currentBridge.ip !== 'localhost';
					let promise: Promise<number> = (mainVue as any).addTask(upath.trimExt(file.name), undefined, isRemote ? '' : file.path);
					if (isRemote) {
						promise.then((id) => {
							(mainVue as any).checkAndUploadFile(file, currentBridge, id);
						});
					}
					newlyAddedTaskIds.push(promise);
					if (newlyAddedTaskIds.length === fileCount) {
						Promise.all(newlyAddedTaskIds).then((ids) => {
							(mainVue as any).$store.commit('selectedTask_update', new Set(ids));
						})
					}
				}, dropDelayCount);
				// console.log(dropDelayCount)
				dropDelayCount += 33.33;
			}
		},
		mergeUploaded (state, args: { id: number, hash: string }) {
			let currentBridge = state.serviceBridges[state.currentServerName];
			currentBridge.mergeUploaded(args.id, [args.hash]);
		},
		selectedTask_update (state, set) {
			state.selectedTask = set;
			if (set.size > 0) {
				let currentServer = state.servers[state.currentServerName];
				if (!currentServer) {
					return;
				}
				for (const id of set) {
					state.globalParams = replaceOutputParams(currentServer.tasks[id].after, state.globalParams);
					break;
				}
			}
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
						state.globalParams.input[args.key as keyof OutputParams_input] = args.value;
						break;
					case 'video':
						// @ts-ignore
						state.globalParams.video[args.key as keyof OutputParams_video] = args.value;
						break;
					case 'videoDetail':
						state.globalParams.video.detail[args.key as keyof OutputParams_video['detail']] = args.value;
						break;
					case 'audio':
						// @ts-ignore
						state.globalParams.audio[args.key as keyof OutputParams_audio] = args.value;
						break;
					case 'audioDetail':
						// @ts-ignore
						state.globalParams.audio.detail[args.key as keyof OutputParams_audio['deatail']] = args.value;
						break;
					case 'output':
						// @ts-ignore
						state.globalParams.output[args.key as keyof OutputParams_output] = args.value;
						break;
				}
			}
			// 更改到一些不匹配的值后会导致 getFFmpegParaArray 出错，但是修正代码就在后面，因此仅需忽略它，让它继续运行下去，不要急着更新
			let currentServer = state.servers[state.currentServerName];
			let currentBridge = state.serviceBridges[state.currentServerName];
			if (currentServer) {
				// 收集需要批量更新的输出参数，交给 service
				let needToUpdateIds: Array<number> = [];
				for (const id of state.selectedTask) {
					let task = currentServer.tasks[parseInt(id)];
					task.after = replaceOutputParams(state.globalParams, task.after);
					needToUpdateIds.push(parseInt(id));
				}
				// paraArray 由 service 算出后回填本地
				// 更新方式是 taskUpdate
				currentBridge.setParameter(needToUpdateIds, state.globalParams);
				// for (const indexNid of Object.values(needToUpdateIds)) {
				// 	let task = currentServer.tasks[indexNid];
				// 	task.paraArray = result[indexNid];
				// }	
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
				state.globalParams = replaceOutputParams(after, state.globalParams);
			} else {
				state.globalParams = replaceOutputParams(defaultParams, state.globalParams);
			}
		},
		// #endregion
		// #region 通知处理
		/**
		 * 发布本界面消息（存在 store 中，不在服务器上）
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
				let server = state.servers[args.serverName];
				let bridge = state.serviceBridges[args.serverName];
				if (true) {
					bridge.deleteNotification(args.taskId, args.index);
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
		// #region 服务器处理
		addServer (state, args: { ip: string, port: number} ) {
			if (!args.ip) {
				mainVue.$popup({
					message: '请输入服务器 IP 或域名以添加服务器',
					level: NotificationLevel.error,
				})
				return;
			}
			if (!args.port) {
				args.port = 33269;
			}
			state.servers[args.ip] = {
				tasks: [],
				ffmpegVersion: '',
				workingStatus: WorkingStatus.stopped,
				progress: 0,
				overallProgressTimerID: NaN,
			}
			state.serviceBridges[args.ip] = new ServiceBridge(args.ip, args.port);
			state.servers = Object.assign({}, state.servers);	// 用于刷新 TasksView 的 serverList
			mainVue.$store.commit('initializeServer', { serverName: args.ip });
		},
		initializeServer (state, args: { serverName: string }) {
			console.log('initializeServer', args.serverName);

			let server: Server = state.servers[args.serverName];
			let bridge: ServiceBridge = state.serviceBridges[args.serverName];

			bridge.on('connected', () => {
				mainVue.$store.commit('pushMsg',{
					message: `成功连接到服务器 ${args.serverName}`,
					level: NotificationLevel.ok,
				});
				(mainVue as any).updateGlobalTask(server, bridge);
				bridge.getTaskList();
				mainVue.$store.commit('switchServer', { serverName: args.serverName });
			});
			bridge.on('disconnected', () => {
				mainVue.$store.commit('pushMsg',{
					message: `已断开服务器 ${args.serverName} 的连接`,
					level: NotificationLevel.warning,
				});
			});
			bridge.on('error', () => {
				mainVue.$store.commit('pushMsg',{
					message: `服务器 ${args.serverName} 连接出错，建议检查网络连接或防火墙`,
					level: NotificationLevel.error,
				});
			});

			bridge.on('ffmpegVersion', (data) => {
				console.log('event: ffmpegVersion', data);
				(mainVue as any).handleFFmpegVersion(server, bridge, data.content);
			});
			bridge.on('workingStatusUpdate', (data) => {
				console.log('event: workingStatusUpdate', data);
				(mainVue as any).handleWorkingStatusUpdate(server, bridge, data.value);
			});
			bridge.on('tasklistUpdate', (data) => {
				console.log('event: tasklistUpdate', data);
				(mainVue as any).handleTasklistUpdate(server, bridge, data.content);
			});
			bridge.on('taskUpdate', (data) => {
				console.log('event: taskUpdate', data);
				(mainVue as any).handleTaskUpdate(server, bridge, data.id, data.content);
			});
			bridge.on('cmdUpdate', (data) => {
				(mainVue as any).handleCmdUpdate(server, bridge, data.id, data.content);
			});
			bridge.on('progressUpdate', (data) => {
				(mainVue as any).handleProgressUpdate(server, bridge, data.id, data.content);
			});
			bridge.on('taskNotification', (data) => {
				console.log('event: taskNotification', data);
				(mainVue as any).handleTaskNotification(server, bridge, data.id, data.content, data.level);
			});
		},
		switchServer (state, args: { serverName: string }) {
			state.currentServerName = args.serverName;
		},
		removeServer (state, args: { serverName: string }) {
			state.currentServerName = 'localhost';
			state.serviceBridges[args.serverName].disconnect();
			delete state.serviceBridges[args.serverName];
			delete state.servers[args.serverName];
			state.servers = Object.assign({}, state.servers);	// 用于刷新 TasksView 的 serverList
		},
		setDownloadMap (state, args: { url: string, serverName: string, taskId: number }) {
			state.downloadMap.set(args.url, { serverName: args.serverName, taskId: args.taskId });
		},
		// #endregion
		// #region 其他
		// 关闭窗口事件触发时调用
		closeConfirm (state) {
			function readyToClose () {
				osBridge.setBlurBehindWindow(false);
				mainVue.$data.closing = true;
				nodeBridge.ipcRenderer?.send('exitConfirm');
				setTimeout(() => {
					nodeBridge.ipcRenderer?.send('close');
				}, 500);
			}
			// getQueueTaskCount 拷贝自 FFBoxService
			function getQueueTaskCount(server: Server) {
				let count: number = 0;
				for (const task of Object.values(server.tasks)) {
					if (task.status === TaskStatus.TASK_RUNNING || task.status === TaskStatus.TASK_PAUSED || task.status === TaskStatus.TASK_STOPPING || task.status === TaskStatus.TASK_FINISHING) {
						count++;
					}
				}
				return count;
			}
			let currentServer = state.servers[state.currentServerName];
			if (!currentServer) {
				readyToClose();
			} else {
				let queueTaskCount = getQueueTaskCount(currentServer);
				if (queueTaskCount > 0) {
					mainVue.$confirm({
						title: '要退出咩？',
						content: `本地服务器还有 ${queueTaskCount} 个任务未完成，要退出🐴？`,
					}).then(readyToClose);
				} else {
					readyToClose();
				}
			} 
		},
		activate (state, args: { userInput: string, callback: (result: number | false) => any }) {
			let electronStore = nodeBridge.electronStore;
			let cryptoJS = nodeBridge.cryptoJS;
			let currentBridge = state.serviceBridges[state.currentServerName];
			if (nodeBridge.isElectron && electronStore && currentBridge) {
				/**
				 * 客户端和管理端均使用机器码 + 固定码共 32 位作为 key
				 * 管理端使用这个 key 对 functionLevel 加密，得到的加密字符串由用户输入到 userInput 中去
				 * 客户端将 userInput 使用 key 解密，如果 userInput 不是瞎编的，那么就能解出正确的 functionLevel
				 */
				let machineCode = (electronStore.get('userinfo.machineCode') || '') as string;
				let fixedCode = 'be6729be8279be40';
				let key = machineCode + fixedCode;
				let decrypted = cryptoJS.AES.decrypt(args.userInput, key)
				let decryptedString = cryptoJS.enc.Utf8.stringify(decrypted);
				if (parseInt(decryptedString).toString() === decryptedString) {
					state.functionLevel = parseInt(decryptedString);
					currentBridge.activate(machineCode, args.userInput);
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
	data: () => { return {
		showUI: false,
		closing: false,
	}},
	components: {
		MainFrame
	},
	computed: {
		showUIstyle: function () {
			return {
				visibility: this.showUI,
				animation: this.showUI ? (this.closing ? 'closeMainUIanimation 0.5s cubic-bezier(0.3, 0.6, 0, 1) forwards' : `showMainUIanimation 1.2s cubic-bezier(0.3, 0.6, 0, 1) forwards`) : '',
			};
		}
	},
	methods: {
		handleFFmpegVersion(server: Server, bridge: FFBoxServiceInterface, content: string) {
			server.ffmpegVersion = content || '-';
		},
		handleWorkingStatusUpdate(server: Server, bridge: FFBoxServiceInterface, workingStatus: WorkingStatus) {
			server.workingStatus = workingStatus;
			// 处理 overallProgressTimer
			if (workingStatus === WorkingStatus.running && !server.overallProgressTimerID) {
				let timerID = setInterval(overallProgressTimer, 80, server);
				server.overallProgressTimerID = timerID;
				overallProgressTimer(server);
			} else if (workingStatus === WorkingStatus.stopped && server.overallProgressTimerID) {
				clearInterval(server.overallProgressTimerID);
				server.overallProgressTimerID = NaN;
				overallProgressTimer(server);
				if (nodeBridge.remote && nodeBridge.remote.getCurrentWindow().isFocused()) {
					nodeBridge.remote.getCurrentWindow().flashFrame(true);
				}
			} else if (workingStatus === WorkingStatus.paused && server.overallProgressTimerID) {
				clearInterval(server.overallProgressTimerID);
				server.overallProgressTimerID = NaN;
				overallProgressTimer(server);
			}
		},
		handleTasklistUpdate(server: Server, bridge: FFBoxServiceInterface, content: Array<number>) {
			let localI = 0;
			let remoteI = 0;
			let localKeys = Object.keys(server.tasks).map(Number).filter((value) => value >= 0);	// [1,3,4,5]
			let remoteKeys = content.filter((value) => value >= 0);										// [1,3,5,6,7]
			let newTaskIds: Array<number> = [];
			let newTaskList: Array<UITask> = [];
			while (localI < localKeys.length || remoteI < remoteKeys.length) {
				let localKey = localKeys[localI];
				let remoteKey = remoteKeys[remoteI];
				if (localI >= localKeys.length) {
					// 本地下标越界，说明远端添加任务了
					let newTask = getInitialUITask('');
					// newTask = mergeTaskFromService(newTask, ffboxService.getTask(remoteKey) as Task);
					// 先用一个 InitialUITask 放在新位置，完成列表合并后再统一 getTask() 获取任务信息
					newTaskIds.push(remoteKey);
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
					newTaskList[localKey] = server.tasks[localKey];
					localI++;
					remoteI++;
				}
			}
			server.tasks = Object.assign(newTaskList, {'-1': server.tasks[-1]});
			// 依次获取所有新增任务的信息
			for (const newTaskId of newTaskIds) {
				bridge.getTask(newTaskId);
			}
		},
		/**
		 * 更新整个 task
		 */
		handleTaskUpdate(server: Server, bridge: FFBoxServiceInterface, id: number, content: Task) {
			let task = mergeTaskFromService(server.tasks[id], content);
			server.tasks[id] = task;
			// timer 相关处理
			if (task.status === TaskStatus.TASK_RUNNING && !task.dashboardTimer) {
				task.dashboardTimer = setInterval(dashboardTimer, 50, task) as any;
			} else if (task.dashboardTimer) {
				clearInterval(task.dashboardTimer);
				task.dashboardTimer = NaN;
			}
			// 进度条相关处理
			if (task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR) {
				task.dashboard.progress = 1;
				task.dashboard_smooth.progress = 1;
			} else if (task.status === TaskStatus.TASK_STOPPED) {
				task.dashboard.progress = 0;
				task.dashboard_smooth.progress = 0;
			}
			// server.tasks = Object.assign({}, server.tasks);
		},
		/**
		 * 增量更新 cmdData
		 */
		handleCmdUpdate(server: Server, bridge: FFBoxServiceInterface, id: number, content: string) {
			let task = server.tasks[id];
			if (task.cmdData.slice(-1) !== '\n' && task.cmdData.length) {
				task.cmdData += '\n';
			}
			task.cmdData += content;
		},
		/**
		 * 整个更新 progressLog
		 */
		handleProgressUpdate(server: Server, bridge: FFBoxServiceInterface, id: number, progressLog: Task['progressLog']) {
			server.tasks[id].progressLog = progressLog;
			if (this.$store.state.functionLevel < 50) {
				if (progressLog.time.slice(-1)[0][1] > 671 ||
					progressLog.elapsed + new Date().getTime() / 1000 - progressLog.lastStarted > 671) {
					bridge.trailLimit_stopTranscoding(id);
					return;
				}
			}

		},
		/**
		 * 增量更新 notifications
		 */
		handleTaskNotification(server: Server, bridge: FFBoxServiceInterface, id: number, content: string, level: NotificationLevel) {
			server.tasks[id].notifications.push({ content, level, time: new Date().getTime() });
			this.$popup({
				message: content,
				level: level,
			});
			this.$store.commit('setUnreadNotification', false);
		},
		/**
		 * 读取 service 中 task id 为 -1 的 globalTask
		 */
		updateGlobalTask (server: Server, bridge: FFBoxServiceInterface) {
			let newTask = getInitialUITask('');
			server.tasks[-1] = newTask;
			bridge.getTask(-1);
		},
		/**
		 * 不带分片功能的文件上传，由 store.addTasks 调用（这样做只是为了拿到 thisVue。这样做确实不好，未来有重构计划）
		 * id 用于取到 task，此处认为先发送 addTask 指令再 checkAndUploadFile，任务就已存在于 tasklist 中，尽管无法保证此顺序
		 */
		checkAndUploadFile: function (file: File, bridge: ServiceBridge, id: number) {
			const CryptoJS = nodeBridge.cryptoJS;
			const reader = new FileReader();
			const thisVue = this;
			reader.readAsBinaryString(file);
			reader.addEventListener('loadend', () => {
				console.log(file.name, '开始计算文件校验码');
				let contentBuffer = reader.result as string;
				// 为什么用 Latin1：https://www.icode9.com/content-1-193333.html
				let toEncode = CryptoJS.enc.Latin1.parse(contentBuffer);
				let hash = CryptoJS.SHA1(toEncode).toString();
				console.log(file.name, '校验码：' + hash);
				fetch(`http://${bridge.ip}:${bridge.port}/upload/check/`, {
					method: 'post',
					body: JSON.stringify({
						hashs: [hash]
					}),
					headers: new Headers({
						'Content-Type': 'application/json'
					}),
				}).then((response) => {
					response.text().then((text) => {
						let content = JSON.parse(text) as Array<number>;
						if (content[0] % 2) {
							console.log(file.name, '已缓存');
							thisVue.$store.commit('mergeUploaded', { id, hash });
						} else {
							console.log(file.name, '未缓存');
							(thisVue as any).uploadFile(id, hash, file, bridge);
						}
					})
				}).catch((err) => {
					console.error('网络请求出错', err);
				})
			})
		},
		/**
		 * 添加任务
		 * path 将自动添加到 params 中去
		 * 对于远程任务，path 留空
		 * @param args baseName, path, callback
		 */
		addTask (baseName: string, callback: Function, path?: string) {
			const currentBridge = this.$store.state.serviceBridges[this.$store.state.currentServerName] as ServiceBridge;
			if (!currentBridge) {
				return;
			}
			const params: OutputParams = JSON.parse(JSON.stringify(this.$store.state.globalParams));
			params.input.files.push({
				filePath: path
			});
			const result = currentBridge.taskAdd(baseName, params);
			if (typeof callback == 'function') {
				callback(result);
			}
			return result;
		},
		/**
		 * 直接上传文件
		 */
		uploadFile (id: number, hash: string, file: File, bridge: ServiceBridge) {
			const thisVue = this;
			const currentServer = this.$store.state.servers[this.$store.state.currentServerName] as Server;
			const task = currentServer.tasks[id];
			task.transferStatus = TransferStatus.uploading;
			task.transferProgressLog.total = file.size;
			const form = new FormData();
			form.append('name', hash);
			form.append('file', file);
			const xhr = new XMLHttpRequest;
			xhr.upload.addEventListener('progress', (event) => {
				// let progress = event.loaded / event.total;
				const transferred = task.transferProgressLog.transferred;
				transferred.push([new Date().getTime() / 1000, event.loaded]);
				transferred.splice(0, transferred.length - 3);	// 限制列表最大长度为 3
			}, false);
			xhr.onreadystatechange = function (e) {
				if (xhr.readyState !== 0) {
					if (xhr.status >= 400 && xhr.status < 500) {
						thisVue.$popup({
							message: `【${file.name}】网络请求故障，上传失败`,
							level: NotificationLevel.error,
						})
					} else if (xhr.status >= 500 && xhr.status < 600) {
						thisVue.$popup({
							message: `【${file.name}】服务器故障，上传失败`,
							level: NotificationLevel.error,
						})
					}
				}
			}
			xhr.onload = function () {
				console.log(file.name, `发送完成`);
				thisVue.$store.commit('mergeUploaded', { id, hash });
				task.transferStatus = TransferStatus.normal;
				clearInterval(task.dashboardTimer);
				task.dashboardTimer = NaN;
			}
			xhr.open('post', `http://${bridge.ip}:${bridge.port}/upload/file/`, true);
			// xhr.setRequestHeader('Content-Type', 'multipart/form-data');
			xhr.send(form);
			task.dashboardTimer = setInterval(dashboardTimer, 50, task) as any;
		},
		/**
		 * 响应 IPC 的下载状态信息
		 */
		handleDownloadStatusChange (server: Server, taskId: number, status: TransferStatus) {
			const task = server.tasks[taskId];
			// timer 相关处理
			if (task.transferStatus === TransferStatus.normal && status === TransferStatus.downloading) {
				task.transferProgressLog.transferred = [];
				task.dashboardTimer = setInterval(dashboardTimer, 50, task) as any;
			} else {
				clearInterval(task.dashboardTimer);
				task.dashboardTimer = NaN;
			}
			task.transferStatus = status;			
		},
		/**
		 * 响应 IPC 的下载进度信息
		 */
		handleDownloadProgress (server: Server, taskId: number, progress: { loaded: number, total: number }) {
			const task = server.tasks[taskId];
			task.transferProgressLog.total = progress.total;
			const transferred = task.transferProgressLog.transferred;
			transferred.push([new Date().getTime() / 1000, progress.loaded]);
			transferred.splice(0, transferred.length - 3);	// 限制列表最大长度为 3
		},
	},
	mounted: function () {
		document.title = 'FFBox v' + version;
		mainVue = this;
		(window as any).mainVue = mainVue;

		console.log(
			(nodeBridge.remote ? ('exe 路径　　　　　：' + nodeBridge.remote.app.getPath('exe') + '\n') : '') +
			(nodeBridge.remote ? ('electron 执行路径：' + nodeBridge.remote.app.getAppPath() + '\n') : '') +
			(process ? ('node 路径　　　　 ：' + process.execPath + '\n') : '') +
			(process ? ('命令执行根路径　　 ：' + process.cwd() + '\n') : '') +
		// 	'命令执行根路径（resolve）：' + resolve('./') + '\n' +
			'页面 js 文件路径　：' + __dirname + '\n'
		);

		// 初始化参数项
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
			}
		} else {
			this.$store.commit('pushMsg', {
				message: '欢迎使用 FFBox v' + version + ' 网页版！',
				level: 0,
			});
		}

		// 挂载退出确认
		nodeBridge.ipcRenderer?.on("exitConfirm", () => this.$store.commit('closeConfirm'));

		// 挂载下载进度指示
		nodeBridge.ipcRenderer?.on("downloadStatusChange", (event, params: { url: string, status: TransferStatus }) => {
			const { serverName, taskId } = this.$store.state.downloadMap.get(params.url);
			const server = this.$store.state.servers[serverName];
			console.log("downloadStatusChange", params);
			(this as any).handleDownloadStatusChange(server, taskId, params.status);
		});
		nodeBridge.ipcRenderer?.on("downloadProgress", (event, params: { url: string, loaded: number, total: number }) => {
			const { serverName, taskId } = this.$store.state.downloadMap.get(params.url);
			const server = this.$store.state.servers[serverName];
			(this as any).handleDownloadProgress(server, taskId, { loaded: params.loaded, total: params.total });
		});

		// 捐助提示
		setTimeout(() => {
			this.$store.commit('pushMsg', {
				message: '作者希望您能点击下方状态栏的“支持作者”给本 repo 点个⭐哦～',
				level: 0
			})
		}, 120000);

		// 连接服务器
		this.$store.commit('addServer', { 
			ip: 'localhost',
			port: 33269
		});

		setTimeout(() => {
			this.showUI = true;
		}, 300);
		setTimeout(() => {
			osBridge.setBlurBehindWindow(true);
		}, 1000);
		console.log('App 加载完成');
	},
	store,
});

/**
 * 用于 dashboardTimer
 * 通过线性加权移动平均获取数值变化的速率（k 值）
 */
function getKbyLWMA_obj(sampleCount: number, xFactorName: string, yFactorsName: Array<string>, data: Array<any>): Array<number> {
	let deltaXFactorSum = 0;
	let deltaYFactorsSum = Array(yFactorsName.length).fill(0);
	// 对于数据，在区间 [data.length - sampleCount, data.length - 1] 内，其权重在 [1, sampleCount] 之间递增
	// 因为采样数可能大于总样本数，所以倒序遍历，先计算最大的权重（index 最大），直到无法继续计算
	for (let weight = sampleCount, index = data.length - 1; index > 0 && weight > 0; weight--, index--) {
		deltaXFactorSum += weight * (data[index][xFactorName] - data[index - 1][xFactorName]);
		yFactorsName.forEach((factorName, i) => {
			deltaYFactorsSum[i] += weight * (data[index][factorName] - data[index - 1][factorName]);
		});
	}
	// 分子分母都有 totalWeight，所以消了，因此算式里就没有 totalWeight 出现
	return yFactorsName.map((factorName, i) => {
		return deltaYFactorsSum[i] / deltaXFactorSum;
	})
}

/**
 * 用于 dashboardTimer
 * 通过线性加权移动平均获取数值变化的速率（k 值）
 * 如果采样数量少于 sampleCount，低权重的缺失值相当于填充 0
 */
function getKbyLWMA(sampleCount: number, data: SingleProgressLog): number {
	// xFactor：时间　yFactor：参数值
	let deltaXFactorSum = 0;
	let deltaYFactorSum = 0;
	// 对于数据，在区间 [data.length - sampleCount, data.length - 1] 内，其权重在 [1, sampleCount] 之间递增
	// 因为采样数可能大于总样本数，所以倒序遍历，先计算最大的权重（index 最大），直到无法继续计算
	for (let weight = sampleCount, index = data.length - 1; index > 0 && weight > 0; weight--, index--) {
		deltaXFactorSum += weight * (data[index][0] - data[index - 1][0]);
		deltaYFactorSum += weight * (data[index][1] - data[index - 1][1]);
	}
	// 分子分母都有 totalWeight，所以消了，因此算式里就没有 totalWeight 出现
	return deltaYFactorSum / deltaXFactorSum;
}

/**
 * 对单个数据计算数据变化速率（k）和初值（b），获得该数据在指定时间的预估值（current）
 * 将对整个数组进行采样。因此如果要限定采样长度，先对数组进行裁剪处理
 */
function calcDashboard(progressLog: SingleProgressLog, time = new Date()) {
	const K = getKbyLWMA(progressLog.length, progressLog);
	const B = progressLog[progressLog.length - 1][1] - K * progressLog[progressLog.length - 1][0];	// b = y - k * x
	const systime = new Date().getTime() / 1000;
	const currentValue = systime * K + B;
	return { K, B, currentValue };
}

/**
 * 计算单个任务的 timer 函数，根据计算结果原地修改 progress 和 progress_smooth
 */
function dashboardTimer(task: UITask) {
	if (task.transferStatus === TransferStatus.normal) {
		if (task.progressLog.time.length <= 2) {
			// 任务刚开始时显示的数据不准确
			return;
		}

		const { K: frameK, B: frameB, currentValue: currentFrame } = calcDashboard(task.progressLog.frame);
		const { K: timeK, B: timeB, currentValue: currentTime } = calcDashboard(task.progressLog.time);
		const { K: sizeK, B: sizeB, currentValue: currentSize } = calcDashboard(task.progressLog.size);
		// console.log("frameK: " + frameK + ", timeK: " + timeK + ", sizeK: " + sizeK);
		// console.log("currentFrame: " + currentFrame + ", currentTime: " + currentTime + ", currentSize: " + currentSize);

		// 任务进度计算
		let progress: number;
		if (task.before.duration !== -1) {
			progress = currentTime / task.before.duration;
			progress = isNaN(progress) || progress === Infinity ? 0 : progress;
		} else {
			progress = 0.5;
		}

		// 进度细节计算
		if (progress < 0.995) {
			task.dashboard = {
				...task.dashboard,
				progress,
				bitrate: (sizeK / timeK) * 8,
				speed: frameK / task.before.vframerate || timeK,	// 如果可以读出帧速，或者输出的是视频，用帧速算 speed 更准确；否则用时间算 speed
				time: currentTime,
				frame: currentFrame,
			};

			// 平滑处理
			let { bitrate, speed, time, frame } = task.dashboard_smooth;
			progress = progress * 0.7 + task.dashboard.progress * 0.3;
			bitrate  = bitrate * 0.9 + task.dashboard.bitrate * 0.1;
			speed    = speed * 0.6 + task.dashboard.speed * 0.4;
			time     = time * 0.7 + task.dashboard.time * 0.3;
			frame    = frame * 0.7 + task.dashboard.frame * 0.3;
			if (isNaN(bitrate) || bitrate == Infinity) { bitrate = 0 }
			if (isNaN(speed)) { speed = 0 }
			if (isNaN(time)) { time = 0 }
			if (isNaN(frame)) { frame = 0 }
			task.dashboard_smooth = { ...task.dashboard_smooth, progress, bitrate, speed, time, frame };
		} else {
			// 进度满了就别更新了
			task.dashboard.progress = 1;
		}
	} else {
		if (task.transferProgressLog.transferred.length <= 2) {
			// 任务刚开始时显示的数据不准确
			return;
		}

		const { K: transferredK, B: transferredB, currentValue: currentTransferred } = calcDashboard(task.transferProgressLog.transferred);
		// console.log(`transferredK: ${transferredK}`);
		// console.log(`currentTransferred: ${currentTransferred}`);

		// 任务进度计算
		let progress: number;
		const total = task.transferProgressLog.total;
		progress = currentTransferred / total;
		progress = progress === Infinity ? 0 : progress;

		// 进度细节计算
		if (progress < 0.995) {
			task.dashboard = {
				...task.dashboard,
				transferred: currentTransferred,
				transferSpeed: transferredK / 1000,
			};

			// 平滑处理
			let { transferred, transferSpeed } = task.dashboard_smooth;
			transferred = transferred * 0.7 + task.dashboard.transferred * 0.3;
			transferSpeed = transferSpeed * 0.9 + task.dashboard.transferSpeed * 0.1;
			task.dashboard_smooth = { ...task.dashboard_smooth, transferred, transferSpeed };
		} else {
			// 进度满了就别更新了
			task.dashboard.transferred = 0.995 * total;
		}
	}
	// task.progress_smooth = Object.assign({}, task.progress_smooth); 
}

/**
 * 计算整体进度的 timer，根据计算结果修改 currentServer.progress
 * （progressBar 的修改由 titlebar.vue 负责）
 */
function overallProgressTimer(currentServer: Server) {
	let tasks = currentServer.tasks;
	let totalTime = 0.000001;
	let totalProcessedTime = 0;
	for (const task of Object.values(tasks)) {
		if (!task.before.duration) {
			continue;
		}
		totalTime += task.before.duration;
		totalProcessedTime += task.dashboard_smooth.progress * task.before.duration;
	}
	let progress = totalProcessedTime / totalTime;
	currentServer.progress = progress;
}

</script>

<style>
	#app {
		font-weight: 400;
		-webkit-font-smoothing: grayscale;
		-moz-osx-font-smoothing: grayscale;
		text-align: center;
		color: hsl(0, 0%, 20%);
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}
	@keyframes showMainUIanimation {
		0%, 20% {
			opacity: 0;
			filter: brightness(3);
		}
	}
	@keyframes closeMainUIanimation {
		0% {
			filter: saturate(1);
		}
		100% {
			opacity: 0;
			filter: saturate(0);
		}
	}
</style>

import { VNodeRef } from 'vue';
import { defineStore } from 'pinia';
import CryptoJS from 'crypto-js';
import { NotificationLevel, OutputParams, TaskStatus, TransferStatus, WorkingStatus } from '@common/types';
import { Server } from '@renderer/types';
import { defaultParams } from "@common/defaultParams";
import { ServiceBridge, ServiceBridgeStatus } from '@renderer/bridges/serviceBridge'
import { getInitialUITask, randomString, replaceOutputParams } from '@common/utils';
import path from '@common/path';
import { handleCmdUpdate, handleFFmpegVersion, handleProgressUpdate, handleTasklistUpdate, handleTaskNotification, handleTaskUpdate, handleWorkingStatusUpdate } from './eventsHandler';
import nodeBridge from '@renderer/bridges/nodeBridge';
import { dashboardTimer } from '@renderer/common/dashboardCalc';
import Popup from '@renderer/components/Popup/Popup';

const { trimExt } = path;

interface StoreState {
	// 界面类
	paraSelected: number,
	draggerPos: number,
	taskViewSettings: {
		showParams: boolean,
		showDashboard: boolean,
		showCmd: boolean,
		cmdDisplay: 'input' | 'output',
		paramsVisibility: {
			duration: 'all' | 'input' | 'none',
			format: 'all' | 'input' | 'none',
			smpte: 'all' | 'input' | 'none',
			video: 'all' | 'input' | 'none',
			audio: 'all' | 'input' | 'none',
		},
	}
	showGlobalParams: boolean,
	componentRefs: { [key: string]: VNodeRef | Element },
	// 非界面类
	servers: Server[];
	currentServerId: string;
	selectedTask: Set<number>,
	globalParams: OutputParams;
	downloadMap: Map<string, { serverId: string, taskId: number }>;
	functionLevel: number;
}

// useStore 可以是 useUser、useCart 之类的任何东西
// 第一个参数是应用程序中 store 的唯一 id
export const useAppStore = defineStore('app', {
	// other options...
	// 推荐使用 完整类型推断的箭头函数
	state: (): StoreState => {
		return {
			// 所有这些属性都将自动推断其类型
			// 界面类
			paraSelected: 1,
			draggerPos: 0.6,
			taskViewSettings: {
				showParams: true,
				showDashboard: true,
				showCmd: true,
				cmdDisplay: 'input',
				paramsVisibility: {
					duration: 'none',
					format: 'none',
					smpte: 'none',
					video: 'none',
					audio: 'none',
				},
			},
			showGlobalParams: true,
			componentRefs: {},
			// 非界面类
			servers: [],
			currentServerId: undefined,
			selectedTask: new Set(),
			globalParams: JSON.parse(JSON.stringify(defaultParams)),
			downloadMap: new Map(),
			functionLevel: 50,
		};
	},
	getters: {
		currentServer: (state) => {
			return state.servers.find((server) => server.data.id === state.currentServerId);
		},
	},
	actions: {
		// #region 纯 UI
		// #endregion 纯 UI
		// #region 任务处理
		/**
		 * 添加一系列任务，来自 TaskView.onDrop
		 */
		addTasks (files: FileList) {
			function checkAndUploadFile(file: File, id: number) {
				const reader = new FileReader();
				reader.readAsBinaryString(file);
				reader.addEventListener('loadend', () => {
					console.log(file.name, '开始计算文件校验码');
					let contentBuffer = reader.result as string;
					// 为什么用 Latin1：https://www.icode9.com/content-1-193333.html
					let toEncode = CryptoJS.enc.Latin1.parse(contentBuffer);
					let hash = CryptoJS.SHA1(toEncode).toString();
					console.log(file.name, '校验码：' + hash);
					fetch(`http://${server.entity.ip}:${server.entity.port}/upload/check/`, {
						method: 'post',
						body: JSON.stringify({
							hashs: [hash]
						}),
						headers: new Headers({
							'Content-Type': 'application/json'
						}),
					}).then((response) => {
						response.text().then((text) => {
							let content = JSON.parse(text) as number[];
							if (content[0] % 2) {
								console.log(file.name, '已缓存');
								server.entity.mergeUploaded(id, [hash]);
							} else {
								console.log(file.name, '未缓存');
								uploadFile(id, hash, file);
							}
						})
					}).catch((err) => {
						console.error('网络请求出错', err);
					})
				})
			}
			function uploadFile(id: number, hash: string, file: File) {
				const currentServer = 这.currentServer.data;
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
							Popup({
								message: `【${file.name}】网络请求故障，上传失败`,
								level: NotificationLevel.error,
							})
						} else if (xhr.status >= 500 && xhr.status < 600) {
							Popup({
								message: `【${file.name}】服务器故障，上传失败`,
								level: NotificationLevel.error,
							})
						}
					}
				}
				xhr.onload = function () {
					console.log(file.name, `发送完成`);
					server.entity.mergeUploaded(id, [hash]);
					task.transferStatus = TransferStatus.normal;
					clearInterval(task.dashboardTimer);
					task.dashboardTimer = NaN;
				}
				xhr.open('post', `http://${server.entity.ip}:${server.entity.port}/upload/file/`, true);
				// xhr.setRequestHeader('Content-Type', 'multipart/form-data');
				xhr.send(form);
				task.dashboardTimer = setInterval(dashboardTimer, 50, task) as any;
			}
			const 这 = useAppStore();
			let fileCount = files.length;
			let server = 这.currentServer;
			let newlyAddedTaskIds: Promise<number>[] = [];
			let dropDelayCount = 0;
			for (const file of files) {
				setTimeout(() => {	// v2.4 版本开始完全可以不要延时，但是太生硬，所以加个动画
					console.log('添加任务', file.path);
					let isRemote = server.entity.ip !== 'localhost';
					let promise: Promise<number> = 这.addTask(trimExt(file.name), isRemote ? '' : file.path);
					if (isRemote) {
						promise.then((id) => {
							checkAndUploadFile(file, id);
						});
					}
					newlyAddedTaskIds.push(promise);
					if (newlyAddedTaskIds.length === fileCount) {
						Promise.all(newlyAddedTaskIds).then((ids) => {
							这.selectedTask = new Set(ids);
							这.applySelectedTask();
						})
					}
				}, dropDelayCount);
				// console.log(dropDelayCount)
				dropDelayCount += 33.33;
			}
		},
		/**
		 * 添加任务
		 * path 将自动添加到 params 中去
		 * @param path 输入文件（仅支持 1 个）的路径。若为远程任务则留空
		 */
		addTask(baseName: string, path?: string): Promise<number> {
			const 这 = useAppStore();
			const currentBridge = 这.currentServer?.entity;
			if (!currentBridge) {
				return;
			}
			const params: OutputParams = JSON.parse(JSON.stringify(这.globalParams));
			params.input.files.push({
				filePath: path ? path.replace(/\\/g, '/') : undefined,
			});
			const result = currentBridge.taskAdd(baseName, params);
			return result;
		},
		/**
		 * 获取 service 中 task id 为 -1 的 globalTask 更新到本地
		 */
		updateGlobalTask(server: Server) {
			let newTask = getInitialUITask('');
			server.data.tasks[-1] = newTask;
			server.entity.getTask(-1);
		},
		/**
		 * 修改已选任务项后调用
		 * 函数将使用已选择的任务项替换 globalParameters
		 */
		applySelectedTask() {
			const 这 = useAppStore();
			if (这.selectedTask.size > 0) {
				for (const id of 这.selectedTask) {
					这.globalParams = replaceOutputParams(这.currentServer.data.tasks[id].after, 这.globalParams);
				}
			}
		},
		startNpause () {
			const 这 = useAppStore();
			if (这.currentServer.entity.status !== ServiceBridgeStatus.Connected) {
				return;
			}
			const data = 这.currentServer.data;
			const entity = 这.currentServer.entity;
			if (data.workingStatus === WorkingStatus.stopped || data.workingStatus === WorkingStatus.paused) {		// 开始任务
				entity.queueAssign();
			} else {
				entity.queuePause();
			}
		},
		pauseNremove (taskId: number) {
			const 这 = useAppStore();
			if (这.currentServer.entity.status !== ServiceBridgeStatus.Connected) {
				return;
			}
			const data = 这.currentServer.data;
			const entity = 这.currentServer.entity;
			let task = data.tasks[taskId];
			if (task.status === TaskStatus.TASK_RUNNING) {
				entity.taskPause(taskId);
			} else if (task.status === TaskStatus.TASK_PAUSED || task.status === TaskStatus.TASK_STOPPING || task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR) {
				entity.taskReset(taskId);
			} else if (task.status === TaskStatus.TASK_STOPPED || task.status === TaskStatus.TASK_INITIALIZING) {
				entity.taskDelete(taskId);
			}
		},
		// #endregion 任务处理
		// #region 参数处理
		/**
		 * 修改全局参数后调用
		 * 函数将修改后的全局参数应用到当前选择的任务项，然后保存到本地磁盘
		 */
		applyParameters() {
			const 这 = useAppStore();
			// 更改到一些不匹配的值后会导致 getFFmpegParaArray 出错，但是修正代码就在后面，因此仅需忽略它，让它继续运行下去，不要急着更新
			// let currentServer = state.servers[state.currentServerName];
			// let currentBridge = state.serviceBridges[state.currentServerName];
			const entity = 这.currentServer?.entity;
			const data = 这.currentServer?.data;
			if (data) {
				// 收集需要批量更新的输出参数，交给 service
				let needToUpdateIds: Array<number> = [];
				for (const id of 这.selectedTask) {
					let task = data.tasks[id];
					task.after = replaceOutputParams(这.globalParams, task.after);
					needToUpdateIds.push(id);
				}
				// paraArray 由 service 算出后回填本地
				// 更新方式是 taskUpdate
				entity.setParameter(needToUpdateIds, 这.globalParams);
				// for (const indexNid of Object.values(needToUpdateIds)) {
				// 	let task = currentServer.tasks[indexNid];
				// 	task.paraArray = result[indexNid];
				// }
			}

			// 存盘
			clearTimeout((window as any).saveAllParaTimer);
			(window as any).saveAllParaTimer = setTimeout(() => {
				let electronStore = nodeBridge.electronStore;
				if (nodeBridge.env === 'electron') {
					nodeBridge.electronStore.set('input', 这.globalParams.input);
					nodeBridge.electronStore.set('video', 这.globalParams.video);
					nodeBridge.electronStore.set('audio', 这.globalParams.audio);
					nodeBridge.electronStore.set('output', 这.globalParams.output);
					console.log('参数已保存');
				}
			}, 700);
		
		},
		/**
		 * 检查有多少参数是非“不重新编码”的，以此更改界面显示形式
		 * 在服务器初次加载和修改参数时调用
		 */
		recalcChangedParams() {
			const 这 = useAppStore();
			const paramsVisibility = {
				duration: 0,
				format: 0,
				smpte: 0,
				video: 0,
				audio: 0,
			};
			for (const [index, task] of Object.entries(这.currentServer?.data.tasks) || []) {
				if (index === '-1') {
					continue;
				}
				const after = task.after;
				if (after.input.begin || after.input.end || after.output.begin || after.output.end) {
					paramsVisibility.duration = Math.max(paramsVisibility.duration, 2);
				} else {
					paramsVisibility.duration = Math.max(paramsVisibility.duration, 1);
				}
				if (after.output.format === '无' || after.output.format === task.before.format) {
					paramsVisibility.format = Math.max(paramsVisibility.format, 1);
				} else {
					paramsVisibility.format = Math.max(paramsVisibility.format, 2);
				}
				if (after.video.vcodec !== '禁用视频') {
					if (after.video.vcodec !== '不重新编码') {
						paramsVisibility.video = Math.max(paramsVisibility.video, 2);
						if (after.video.resolution !== '不改变' || task.after.video.framerate !== '不改变') {
							paramsVisibility.smpte = Math.max(paramsVisibility.smpte, 2);
						} else {
							paramsVisibility.smpte = Math.max(paramsVisibility.smpte, 1);
						}
					} else {
						paramsVisibility.video = Math.max(paramsVisibility.video, 1);
					}
				}
				if (after.audio.acodec !== '禁用音频') {
					if (after.audio.acodec !== '不重新编码') {
						paramsVisibility.audio = Math.max(paramsVisibility.audio, 2);
					} else {
						paramsVisibility.audio = Math.max(paramsVisibility.audio, 1);
					}
				}
			}
			这.taskViewSettings.paramsVisibility = {
				duration: (['none', 'input', 'all'] as any)[paramsVisibility.duration],
				format: (['none', 'input', 'all'] as any)[paramsVisibility.format],
				smpte: (['none', 'input', 'all'] as any)[paramsVisibility.smpte],
				video: (['none', 'input', 'all'] as any)[paramsVisibility.video],
				audio: (['none', 'input', 'all'] as any)[paramsVisibility.audio],
			};
			// console.log('recalcChangedParams', 这.taskViewSettings.paramsVisibility);
		},
		// #endregion 参数处理
		// #region 通知处理
		// #endregion 通知处理
		// #region 服务器处理
		/**
		 * 添加服务器标签页
		 */
		addServer() {
			const 这 = useAppStore();
			if (这.servers.length && 这.servers[这.servers.length - 1].entity.status === ServiceBridgeStatus.Idle) {
				return;
			}
			const id = randomString(6);
			这.servers.push({
				data: {
					id: id,
					name: '未连接',
					tasks: [],
					ffmpegVersion: '',
					workingStatus: WorkingStatus.stopped,
					progress: 0,
					overallProgressTimerID: NaN,
				},
				entity: new ServiceBridge(),
			});
			这.currentServerId = id;
			return id;
		},
		/**
		 * 关闭服务器标签页
		 * TODO 暂未实现上传下载中断逻辑
		 */
		removeServer(serverId: string) {
			const 这 = useAppStore();
			const index = 这.servers.findIndex((server) => server.data.id === serverId);
			if (index > -1) {
				这.servers.splice(index, 1);
			}
			if (这.currentServerId === serverId) {
				这.currentServerId = 这.servers[index - 1].data.id;
			}
		},
		/**
		 * 初始化服务器连接并挂载事件监听
		 */
		initializeServer(serverId: string, ip: string, port: number) {
			const 这 = useAppStore();
			const server = 这.servers.find((server) => server.data.id === serverId) as Server;
			const entity = server.entity;
			if (!ip) {
				return;
			}
			const _port = port ?? 33269;
			console.log('初始化服务器连接', server.data);
			entity.connect(ip, _port);

			entity.on('connected', () => {
				server.data.name = ip === 'localhost' ? '本地服务器' : ip;
				console.log(`成功连接到服务器 ${server.entity.ip}`);
				// mainVue.$store.commit('pushMsg',{
				// 	message: `成功连接到服务器 ${args.serverName}`,
				// 	level: NotificationLevel.ok,
				// });

				entity.on('ffmpegVersion', (data) => {
					handleFFmpegVersion(server, data.content);
				});
				entity.on('workingStatusUpdate', (data) => {
					handleWorkingStatusUpdate(server, data.value);
				});
				entity.on('tasklistUpdate', (data) => {
					handleTasklistUpdate(server, data.content);
					这.recalcChangedParams();
				});
				entity.on('taskUpdate', (data) => {
					handleTaskUpdate(server, data.id, data.content);
					这.recalcChangedParams();
				});
				entity.on('cmdUpdate', (data) => {
					handleCmdUpdate(server, data.id, data.content);
				});
				entity.on('progressUpdate', (data) => {
					handleProgressUpdate(server, data.id, data.content, 这.functionLevel);
				});
				entity.on('taskNotification', (data) => {
					handleTaskNotification(server, data.id, data.content, data.level);
				});

				这.updateGlobalTask(server);
				entity.getTaskList();
			});
			entity.on('disconnected', () => {
				console.log(`已断开服务器 ${server.entity.ip} 的连接`);
				for (const eventName of ['ffmpegVersion', 'workingStatusUpdate', 'tasklistUpdate', 'taskUpdate', 'cmdUpdate', 'progressUpdate', 'taskNotification'] as any[]) {
					entity.removeAllListeners(eventName);
				}
				// mainVue.$store.commit('pushMsg',{
				// 	message: `已断开服务器 ${args.serverName} 的连接`,
				// 	level: NotificationLevel.warning,
				// });
			});
			entity.on('error', () => {
				console.log(`服务器 ${server.entity.ip} 连接出错，建议检查网络连接或防火墙`);
				// mainVue.$store.commit('pushMsg',{
				// 	message: `服务器 ${args.serverName} 连接出错，建议检查网络连接或防火墙`,
				// 	level: NotificationLevel.error,
				// });
			});
		},
		/**
		 * 重新连接已掉线或未成功连接的服务器
		 */
		reConnectServer(serverId: string) {
			const 这 = useAppStore();
			const server = 这.servers.find((server) => server.data.id === serverId) as Server;
			server.entity.connect();
		},
		// #endregion 服务器处理
		// #region 其他
		// #endregion 其他
	},
});

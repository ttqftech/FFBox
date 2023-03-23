import { VNodeRef } from 'vue';
import { defineStore } from 'pinia';
import { OutputParams, WorkingStatus } from '@common/types';
import { Server } from '@renderer/types';
import { defaultParams } from "@common/defaultParams";
import { ServiceBridge, ServiceBridgeStatus } from '@renderer/bridges/serviceBridge'
import { getInitialUITask, randomString, replaceOutputParams } from '@common/utils';
import { handleCmdUpdate, handleFFmpegVersion, handleProgressUpdate, handleTasklistUpdate, handleTaskNotification, handleTaskUpdate, handleWorkingStatusUpdate } from './serverEventsHandler';
import nodeBridge from '@renderer/bridges/nodeBridge';

interface StoreState {
	// 界面类
	paraSelected: number,
	draggerPos: number,
	taskViewSettings: {
		showParams: boolean,
		showDashboard: boolean,
		showCmd: boolean,
		cmdDisplay: 'input' | 'output',
	}
	showGlobalParams: boolean,
	componentRefs: { [key: string]: VNodeRef | Element },
	// 非界面类
	servers: Server[];
	currentServerId: string;
	selectedTask: Set<number>,
	globalParams: OutputParams;
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
			},
			showGlobalParams: true,
			componentRefs: {},
			// 非界面类
			servers: [],
			currentServerId: undefined,
			selectedTask: new Set(),
			globalParams: JSON.parse(JSON.stringify(defaultParams)),
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
				filePath: path,
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
			const entity = 这.currentServer.entity;
			const data = 这.currentServer.data;
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
				// mainVue.$popup({
				// 	message: '请输入服务器 IP 或域名以添加服务器',
				// 	level: NotificationLevel.error,
				// })
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
				这.updateGlobalTask(server);
				entity.getTaskList();
				这.switchServer(server.data.id);
			});
			entity.on('disconnected', () => {
				console.log(`已断开服务器 ${server.entity.ip} 的连接`);
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

			entity.on('ffmpegVersion', (data) => {
				handleFFmpegVersion(server, data.content);
			});
			entity.on('workingStatusUpdate', (data) => {
				handleWorkingStatusUpdate(server, data.value);
			});
			entity.on('tasklistUpdate', (data) => {
				handleTasklistUpdate(server, data.content);
			});
			entity.on('taskUpdate', (data) => {
				handleTaskUpdate(server, data.id, data.content);
			});
			entity.on('cmdUpdate', (data) => {
				handleCmdUpdate(server, data.id, data.content);
			});
			entity.on('progressUpdate', (data) => {
				handleProgressUpdate(server, data.id, data.content);
			});
			entity.on('taskNotification', (data) => {
				handleTaskNotification(server, data.id, data.content, data.level);
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
		/**
		 * 切换当前服务器标签页
		 */
		switchServer(serverId: string) {
			const 这 = useAppStore();
			这.currentServerId = serverId;
		},
		// #endregion 服务器处理
		// #region 其他
		// #endregion 其他

		initTemp() {
			const 这 = useAppStore();
			const localServerId = 这.addServer();
			setTimeout(() => {
				这.initializeServer(localServerId, 'localhost', 33269);
				// 这.addTask('小光芒', 'B:/文档/人物/童可可/MV/童可可 - 小光芒.mp4')
			}, 800);
		},
	},
});

import { VNodeRef } from 'vue';
import { defineStore } from 'pinia';
import { OutputParams, WorkingStatus } from '@common/types';
import { Server } from '@renderer/types';
import { defaultParams } from "@common/defaultParams";
import { ServiceBridge } from '@renderer/bridges/serviceBridge'
import { getInitialUITask, randomString } from '@common/utils';
import { handleCmdUpdate, handleFFmpegVersion, handleProgressUpdate, handleTasklistUpdate, handleTaskNotification, handleTaskUpdate, handleWorkingStatusUpdate } from './serverEventsHandler';

interface StoreState {
	// 界面类
	paraSelected: number,
	draggerPos: number,
	taskViewSettings: {
		showParams: boolean,
		showDashboard: boolean,
		showCmd: boolean,
	}
	showGlobalParams: boolean,
	componentRefs: { [key: string]: VNodeRef | Element },
	// 非界面类
	servers: Server[];
	currentServerId: string;
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
			draggerPos: 60,
			taskViewSettings: {
				showParams: true,
				showDashboard: true,
				showCmd: true,
			},
			showGlobalParams: true,
			componentRefs: {},
			// 非界面类
			servers: [],
			currentServerId: undefined,
			globalParams: JSON.parse(JSON.stringify(defaultParams)),
		};
	},
	getters: {
		currentServer: (state) => {
			return state.servers.find((server) => server.data.id === state.currentServerId);
		},
	},
	actions: {
		/**
		 * 添加服务器
		 */
		addServer (ip: string, port: number) {
			const 这 = useAppStore();
			if (!ip) {
				// mainVue.$popup({
				// 	message: '请输入服务器 IP 或域名以添加服务器',
				// 	level: NotificationLevel.error,
				// })
				return;
			}
			const _port = port ?? 33269;
			const id = randomString(6);
			这.servers.push({
				data: {
					id: id,
					name: ip === 'localhost' ? '本地服务器' : ip,
					tasks: [],
					ffmpegVersion: '',
					workingStatus: WorkingStatus.stopped,
					progress: 0,
					overallProgressTimerID: NaN,	
				},
				entity: new ServiceBridge(ip, _port),
			});
			这.initializeServer(id);
			return id;
		},
		/**
		 * 添加任务
		 * path 将自动添加到 params 中去
		 * @param path 输入文件（仅支持 1 个）的路径。若为远程任务则留空
		 */
		addTask (baseName: string, path?: string): Promise<number> {
			const 这 = useAppStore();
			const currentBridge = 这.currentServer?.entity;
			if (!currentBridge) {
				return;
			}
			const params: OutputParams = JSON.parse(JSON.stringify(这.globalParams));
			params.input.files.push({
				filePath: path
			});
			const result = currentBridge.taskAdd(baseName, params);
			return result;
		},
		/**
		 * 初始化服务器连接并挂载事件监听
		 */
		initializeServer(serverId: string) {
			const 这 = useAppStore();
			const server = 这.servers.find((server) => server.data.id === serverId) as Server;
			console.log('初始化服务器连接', server.data);

			const entity = server.entity;
			entity.on('connected', () => {
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
		 * 切换当前服务器标签页
		 */
		switchServer (serverId: string) {
			const 这 = useAppStore();
			这.currentServerId = serverId;
		},
		/**
		 * 获取 service 中 task id 为 -1 的 globalTask 更新到本地
		 */
		updateGlobalTask (server: Server) {
			let newTask = getInitialUITask('');
			server.data.tasks[-1] = newTask;
			server.entity.getTask(-1);
		},
		initTemp() {
			const 这 = useAppStore();
			const localServerId = 这.addServer('localhost', 33269);
			这.currentServerId = localServerId;
			setTimeout(() => {
				// 这.addTask('小光芒', 'B:/文档/人物/童可可/MV/童可可 - 小光芒.mp4')
			}, 1000);
		},
	},
});

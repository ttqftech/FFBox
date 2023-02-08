import { defineStore } from 'pinia';
import { OutputParams, Server as ServerData, WorkingStatus } from '@common/types';
import { defaultParams } from "@common/defaultParams";
import { ServiceBridge } from '@renderer/bridges/serviceBridge'
import { randomString } from '@common/utils';

interface Server {
	data: ServerData;
	entity: ServiceBridge;
}

interface StoreState {
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
			这.servers.push({
				data: {
					id: randomString(6),
					name: ip === 'localhost' ? '本地服务器' : ip,
					tasks: [],
					ffmpegVersion: '',
					workingStatus: WorkingStatus.stopped,
					progress: 0,
					overallProgressTimerID: NaN,	
				},
				entity: new ServiceBridge(ip, _port),
			});
			// mainVue.$store.commit('initializeServer', { serverName: args.ip });
		},
		/**
		 * 添加任务
		 * path 将自动添加到 params 中去
		 * @param path 输入文件（仅支持 1 个）的路径。若为远程任务则留空
		 */
		addTask (baseName: string, path?: string) {
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
		initializeServer() {},
		initTemp() {
			const 这 = useAppStore();
			这.addServer('localhost', 33269);
			setTimeout(() => {
				这.addTask('小光芒', 'B:/文档/人物/童可可/MV/童可可 - 小光芒.mp4')
			}, 1000);
		},
	},
});

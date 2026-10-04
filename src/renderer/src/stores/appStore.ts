import { h, VNodeRef, nextTick } from 'vue';
import { defineStore } from 'pinia';
import gsap from 'gsap';
import { FFmpegCodecDetail, FFmpegDemuxerDetail, FFmpegFilterDetail, FFmpegMuxerDetail, Notification, NotificationLevel, OutputParams, Permission, TaskStatus, WorkingStatus } from '@common/types';
import { validUntil, version } from '@common/constants';
import { isV2Code, isLegacyCode, verifyActivationCode } from '@common/activation';
import { defaultParams } from "@common/defaultParams";
import { Server, UITask } from '@renderer/types';
import { getMenuItemByValue } from '@common/menu';
import { allVcodecs, builtInVcodecs } from '@common/params/vcodecs';
import { allAcodecs, builtInAcodecs } from '@common/params/acodecs';
import { allMuxers, builtInMuxers } from '@common/params/formats';
import { RateControl } from '@common/params/parameter';
import path from '@common/path';
import i11n from '@common/i11n/i11n';
import { parseFFmpegCodecsToCodecsList, parseFFmpegFiltersToFiltersList, parseFFmpegMuDeMuxersToList } from '@common/params/parser';
import { ServiceBridge, ServiceBridgeStatus } from '@renderer/bridges/serviceBridge'
import { registerServerForDashboard } from '@renderer/common/dashboardCalc';
import { randomString, replaceOutputParams, getInitialUITask, mergeTaskFromService, getTaskLatestOutputParams, getNewUIRun } from '@common/utils';
import { handleCmdUpdate, handleFFmpegInfo, handleProgressUpdate, handleTasklistUpdate, handleNotificationUpdate, handleTaskUpdate, handleStatusUpdate } from '@renderer/logic/eventsHandler';
import nodeBridge from '@renderer/bridges/nodeBridge';
import { addUploadTask } from '@renderer/logic/transferManager2';
import { getLimitation } from '@renderer/logic/limitations';
import Popup from '@renderer/components/Popup/Popup';

interface StoreState {
	// 界面类
	showMenuCenter: 0 | 1 | 2; // 0：关闭　1：开启菜单栏　2：全开
	showInfoCenter: boolean;
	showTransferCenter: boolean;
	showTaskInfo: [number, 0 | 1 | 2, params?: any] | undefined;
	showCutOperator: { initialDraggerPos: number; focusOn: 'input' | 'output' } | undefined;  // 新增：裁切操作器状态
	showDragFilesOverlay: boolean;
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
	},
	frontendSettings: {
		// 所有值都是必需预置默认值的，这样在初始化时会把没有保存过的设置存一遍
		colorTheme: string,
		useIEC: boolean,
		aiDisabled: boolean,
		useVirtualTaskList: boolean,
		autoHideCoarseSlider: boolean,
		taskListInfiniteScrollThreshold: number,
		taskListPageSize: number,
	},
	unreadNotificationCount: number,
	componentRefs: { [key: string]: VNodeRef | Element },
	// 非界面类
	notifications: Notification[],
	servers: Server[];
	currentServerId: string | undefined;
	selectedTask: Set<number>,
	isAllSelected: boolean;	// 标记是否已全选所有任务（跨缓冲区），滚动时不清除选中状态
	taskSelectionModified: boolean;	// 修改参数后显示提示是否应用到所有任务，更改 selectedTask 时去除显示
	globalParams: OutputParams;
	presetName: string | undefined;
	availablePresets: string[];
	downloadMap: Map<string, string>;	// <url, serverId>
	latestVersion?: string;
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
			showMenuCenter: 0,
			showInfoCenter: false,
			showTransferCenter: false,
			showTaskInfo: undefined,
			showCutOperator: undefined,
			showDragFilesOverlay: false,
			paraSelected: 1,
			draggerPos: 0.57,
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
			frontendSettings: {
				colorTheme: 'themeLight',
				useIEC: false,
				aiDisabled: false,
				useVirtualTaskList: true,
				autoHideCoarseSlider: true,
				taskListInfiniteScrollThreshold: 500,
				taskListPageSize: 200,
			},
			unreadNotificationCount: 0,
			componentRefs: {},
			// 非界面类
			notifications: [],
			servers: [],
			currentServerId: undefined,
			selectedTask: new Set(),
			isAllSelected: false,
			taskSelectionModified: false,
			globalParams: JSON.parse(JSON.stringify(defaultParams)),
			presetName: '',
			availablePresets: [],
			downloadMap: new Map(),
			latestVersion: undefined,
			functionLevel: 20,
		};
	},
	getters: {
		currentServer: (state) => {
			return state.servers.find((server) => server.data.id === state.currentServerId);
		},
		localServer: (state) => {
			// app 初始化逻辑中会通过识别 nodeBridge.env 添加一个 localhost 服务器。除此以外没有添加 localhost 的渠道
			return state.servers.length && state.servers[0].entity.ip === 'localhost' ? state.servers[0] : undefined;
		},
	},
	actions: {
		// #region 辅助方法
		/**
		 * 根据 taskId 从当前服务器的 tasks 数组中查找任务
		 * @returns UITask 或 undefined（不在缓冲区中）
		 */
		getTaskById(taskId: number): UITask | undefined {
			const data = this.currentServer?.data;
			if (!data) return undefined;
			const index = data.taskIdToIndex.get(taskId);
			return index !== undefined ? data.tasks[index] : undefined;
		},
		// #endregion 辅助方法
		// #region 纯 UI
		/**
		 * 打开切割操作器
		 */
		openCutOperator(focusOn: 'input' | 'output') {
			// 检查进入条件
			const globalParams = this.globalParams;
			const filter = globalParams.filter;
			if (globalParams.input.files.length !== 1 ||
				globalParams.outputs.length !== 1 ||
				filter.nodes.length > 0 ||
				filter.lines.length > 0) {
				Popup({ message: '此功能仅限单输入输出模式使用', level: NotificationLevel.warning });
				return;
			}
			if (this.selectedTask.size !== 1) {
				Popup({ message: '请先选择一个任务', level: NotificationLevel.warning });
				return;
			}

			this.showInfoCenter = false;
			this.showTransferCenter = false;
			this.showTaskInfo = undefined;
			this.showMenuCenter = 0;
			this.showCutOperator = { initialDraggerPos: this.draggerPos, focusOn };

			const target = { value: this.draggerPos };
			gsap.to(target, {
				value: 0,
				duration: 0.5,
				ease: "power3.inOut",
				onUpdate: () => {
					this.draggerPos = target.value;
				},
			});
		},
		/**
		 * 关闭切割操作器
		 */
		closeCutOperator() {
			if (!this.showCutOperator) return;
			const target = { value: 0 };
			const initialDraggerPos = this.showCutOperator.initialDraggerPos;
			if (this.draggerPos <= 0.01) {
				gsap.to(target, {
					value: initialDraggerPos,
					duration: 0.5,
					ease: "power3.inOut",
					onUpdate: () => {
						this.draggerPos = target.value;
					},
				});
			}
			this.showCutOperator = undefined;
		},
		// #endregion 纯 UI
		// #region 任务处理
		/**
		 * 添加一系列任务。仅支持本地文件和远程路径，本地文件夹需展开后再传入，未知路径传入无效
		 * Promise 最终会在后端返回任务更新（或 200ms 超时）后，并将 globalParams 替换后 resolve
		 */
		async addTasks (inputList: string[] | FileList, type: 'multiTask' | 'multiInput' = 'multiTask') {
			const store = this;
			const server = store.currentServer;
			if (!server) { debugger; throw 'ub'; }

			function selectAndApply(ids: number[]) {
				// 等待第一个 taskUpdate，确保任务参数已在本地同步，再 applySelectedTask
				// 由于网络到达顺序的不确定性，加一个 timeout 做兜底
				const handler = () => {
					clearTimeout(timer);
					server!.entity.off('taskUpdate', handler);
					store.selectedTask = new Set(ids);
					store.applySelectedTask();
					return ids;
				};
				const timer = setTimeout(handler, 200);
				server!.entity.on('taskUpdate', handler);
			}

			// 任务添加时是否需要上传文件：取决于用户是否具有 FileSystem 权限，而不是物理连接位置
			// 有 FileSystem 权限 → 直接使用原路径（后端直接读取文件）
			// 无 FileSystem 权限 → 需要上传文件到服务器缓存，使用改写路径模式
			const hasFileSystemPermission = server.entity.permissions.includes(Permission.FileSystem);
			const needUploadForFileSystem = !hasFileSystemPermission;
			if (!needUploadForFileSystem && nodeBridge.env === 'browser') {
				Popup({ message: '网页版受安全限制无法取到文件路径\n当前登录的用户具有文件系统权限，请双击任务列表或从主菜单中以文本方式添加任务😊', level: NotificationLevel.info });
				return [];
			}
			const maxTaskCount = getLimitation('maxTaskListCount');
			const maxUploadCount = getLimitation('maxUploadListCount');
			const activeUploadCount = server.data.uploadFiles.filter(f => f.status !== 'finished' && f.status !== 'error').length;

			if (type === 'multiTask') {
				if (server.data.totalCount >= maxTaskCount) {
					store.pushMsg(
						i11n.service.功能限制_任务数上限(maxTaskCount, true),
						NotificationLevel.warning
					);
					return [];
				}

				// 收集所有文件路径，同时检查上传限制
				const filePaths: string[] = [];
				const inputMeta: { input: string | File; fileBaseName: string; needUpload: boolean }[] = [];
				let newUploadCount = 0;

				for (const input of inputList) {
					const fileBaseName = typeof input === 'string' ? path.parse(input.replaceAll('\\', '/')).base : input.name;
					const fileType = typeof input === 'string' ? (await nodeBridge.getPathsCategorized(input)).lineResults?.[0] : 'lf';
					const needUpload = fileType === 'lf' && needUploadForFileSystem;	// lf = 本地文件；无 FileSystem 权限时需上传，有则直接使用路径
					if (needUpload) {
						if (activeUploadCount + newUploadCount >= maxUploadCount) {
							store.pushMsg(
								i11n.service.功能限制_上传数上限(maxUploadCount),
								NotificationLevel.warning
							);
							break;
						}
						const limitedFileSizeGB = getLimitation('maxUploadSizeGB');
						const fileSize = typeof input === 'string' ? (await nodeBridge.getLocalFileStats(input)).size : input.size;
						if (fileSize > limitedFileSizeGB * 1000 * 1000 * 1000) {
							Popup({
								message: `${fileBaseName} 文件大小超过 ${limitedFileSizeGB} GB，暂不支持上传操作`,
								level: 2,
							});
							continue;
						}
						newUploadCount++;
					}
					const uploadInputName = `[uploading] ${fileBaseName}`;
					const filePath = typeof input === 'string' ? input : nodeBridge.getPathForFile(input);
					if (!needUpload && !filePath) {
						continue;	// 取不到磁盘路径（WebUI 或 JS 构造的 File），无法作为任务输入
					}
					filePaths.push(needUpload ? uploadInputName : filePath.replace(/\\/g, '/'));
					inputMeta.push({ input, fileBaseName, needUpload });
				}
				if (filePaths.length === 0) {
					return [];
				}

				// 批量创建任务
				const ids = await server.entity.taskAddBatch(filePaths, store.globalParams);

				// 对需要上传的文件启动上传
				for (let i = 0; i < ids.length; i++) {
					const { input, fileBaseName, needUpload } = inputMeta[i];
					if (needUpload) {
						const uploadInputName = `[uploading] ${fileBaseName}`;
						// await new Promise((r) => setTimeout(r, 150));
						const file = await addUploadTask(server as any, input, ids[i], fileBaseName, uploadInputName);
						server.data.uploadFiles.push(file);
					}
				}

				selectAndApply(ids);
			} else if (type === 'multiInput') {
				if (server.data.totalCount >= maxTaskCount) {
					store.pushMsg(
						i11n.service.功能限制_任务数上限(maxTaskCount, true),
						NotificationLevel.warning
					);
					return [];
				}

				// 批量创建 1 个空路径任务
				const ids = await server.entity.taskAddBatch([''], store.globalParams);
				const taskId = ids[0];

				// 收集输入文件路径（处理上传）
				const inputPaths: string[] = [];
				let newUploadCount = 0;
				for (const input of inputList) {
					const fileBaseName = typeof input === 'string' ? path.parse(input.replaceAll('\\', '/')).base : input.name;
					const fileType = typeof input === 'string' ? (await nodeBridge.getPathsCategorized(input)).lineResults?.[0] : 'lf';
					const needUpload = fileType === 'lf' && needUploadForFileSystem;	// lf = 本地文件；无 FileSystem 权限时需上传
					if (needUpload) {
						if (activeUploadCount + newUploadCount >= maxUploadCount) {
							store.pushMsg(
								i11n.service.功能限制_上传数上限(maxUploadCount),
								NotificationLevel.warning
							);
							break;
						}
						const limitedFileSizeGB = getLimitation('maxUploadSizeGB');
						const fileSize = typeof input === 'string' ? (await nodeBridge.getLocalFileStats(input)).size : input.size;
						if (fileSize > limitedFileSizeGB * 1000 * 1000 * 1000) {
							Popup({
								message: `${fileBaseName} 文件大小超过 ${limitedFileSizeGB} GB，暂不支持上传操作`,
								level: 2,
							});
							continue;
						}
						newUploadCount++;
					}
					if (needUpload) {
						const inputName = `[uploading] ${fileBaseName}`;
						const file = await addUploadTask(server as any, input, taskId, fileBaseName, inputName);
						server.data.uploadFiles.push(file);
						inputPaths.push(inputName);
					} else {
						const filePath = typeof input === 'string' ? input : nodeBridge.getPathForFile(input);
						if (filePath) inputPaths.push(filePath);
					}
				}

				// 设置输入列表
				const params = store.globalParams;
				server.entity.setParameters([taskId], {
					...params,
					input: {
						files: inputPaths.map((p, index) => ({
							filePath: p.replace(/\\/g, '/'),
							demuxer: params.input.files[index]?.demuxer ?? '自动',
							begin: params.input.files[index]?.begin ?? '',
							end: params.input.files[index]?.end ?? '',
							hwaccel: params.input.files[index]?.hwaccel ?? '',
							skipFrame: params.input.files[index]?.skipFrame ?? '',
							readrate: params.input.files[index]?.readrate ?? '',
							detail: params.input.files[index]?.detail ?? {},
							custom: params.input.files[index]?.custom ?? '',
						})),
					},
				}, true);
				selectAndApply([taskId]);	// TODO 不用等 setParameters 完成吗？
			}
		},
		/**
		 * 获取 service 的 taskList 更新到本地（基于缓冲区范围）
		 * 既是初始化加载的入口，也是滚动停止/粗调跳转后的刷新方法
		 * @param firstVisibleIndex 可见范围中第一个任务的全局序号（默认取 viewRange）
		 * @param lastVisibleIndex 可见范围中最后一个任务的全局序号（默认取 viewRange）
		 * @param force 是否强制完整拉取（默认 true）。为 false 且处于无限滚动模式时，仅拉取缓冲区前后缺失的部分
		 * 计算范围：firstVisibleIndex - pageSize/2 ~ lastVisibleIndex + pageSize/2
		 */
		async updateTaskList(firstVisibleIndex?: number, lastVisibleIndex?: number, force: boolean = true): Promise<void> {
			const server = this.currentServer;
			if (!server) { debugger; throw 'ub'; }
			const totalCount = server.data.totalCount;
			const _first = firstVisibleIndex ?? server.data.viewRange.firstIndex;
			const _last = lastVisibleIndex ?? _first ?? server.data.viewRange.lastIndex;
			const halfPage = Math.round(this.frontendSettings.taskListPageSize / 2);
			const threshold = this.frontendSettings.taskListInfiniteScrollThreshold;

			// 判断是否启用无限滚动：totalCount 为 0 时（初始加载）按 pageSize 拉取，已知 totalCount 时按阈值判断
			const useInfiniteScroll = totalCount > 0 && totalCount >= threshold;

			let newStart: number, newEnd: number;
			if (!useInfiniteScroll) {
				// 一次性拉取全部任务（初始加载时拉取足够多以覆盖非无限滚动场景）
				newStart = 0;
				newEnd = totalCount > 0 ? totalCount : 0;	// TODO 任务数量为 0 时有可能是初次加载
			} else {
				// 无限滚动模式：基于可见范围前后各预加载 halfPage
				newStart = Math.max(0, _first - halfPage);
				newEnd = Math.min(totalCount, _last + halfPage + 1);
			}

			const size = newEnd - newStart;
			if (size <= 0) {
				// 仅当初始化时会出现 0, 0 的情况，此时要获取任务总量
				await server.entity.getTaskList(0, 0).then((resp) => server.data.totalCount = resp.totalCount);
				return;
			};

			// 增量拉取分支：仅拉取缓冲区前后的缺失部分，中间已有任务不重新拉取
			if (!force && useInfiniteScroll) {
				const { bufferStart: oldStart, bufferEnd: oldEnd } = server.data;
				const hasOverlap = oldStart < newEnd && oldEnd > newStart;

				// 1. 无交集，直接拉取新区完全替换老区（走下方完整拉取路径）
				if (hasOverlap && oldEnd > oldStart) {
					// 2. 前拉：新区开始 < 老区开始时，前拉起点：Math.min(新区开始, 老区开始)；前拉终点：Math.max(新区开始, 老区开始)。拉取 [新区开始, 老区开始)
					// 3. 后拉：新区结束 > 老区结束时，后拉起点：Math.min(新区结束, 老区结束)；后拉终点：Math.max(新区结束, 老区结束)。拉取 [老区结束, 新区结束)
					// 4. 前删：新区开始 > 老区开始时，前删起点：Math.min(新区开始, 老区开始)；前删终点：Math.max(新区开始, 老区开始)。丢弃 [老区开始, 新区开始)
					// 5. 后删：新区结束 < 老区结束时，后删起点：Math.min(新区结束, 老区结束)；后删终点：Math.max(新区结束, 老区结束)。丢弃 [新区结束, 老区结束)
					// AI 并没有按我给的前删后删思路，给了个更简单的 filter 实现
					const [prefixResp, suffixResp] = await Promise.all([
						newStart < oldStart ? server.entity.getTaskList(newStart, oldStart - newStart) : Promise.resolve(null),
						newEnd > oldEnd ? server.entity.getTaskList(oldEnd, newEnd - oldEnd) : Promise.resolve(null),
					]);
					server.data.totalCount = prefixResp?.totalCount ?? suffixResp?.totalCount ?? totalCount;	// 更新任务总量

					// 前删 + 后删：从现有缓冲区中保留 [newStart, newEnd) 范围内的任务
					const existingInRange = server.data.tasks.filter((task) => task.taskIndex! >= newStart && task.taskIndex! < newEnd);

					// 按顺序拼接：前缀（缓冲区之前的新任务）+ 现有（范围内）+ 后缀（缓冲区之后的新任务）
					// 前缀/后缀来自缓冲区之外，不可能与现有任务重复，直接创建新 UITask
					const merged: UITask[] = [];

					for (const task of prefixResp?.tasks ?? []) {
						const uiTask = getInitialUITask(task.id, '');
						mergeTaskFromService(uiTask, task, true);
						uiTask.taskIndex = newStart + merged.length;
						uiTask.selectedRunIndex = uiTask.runs.length - 1;
						merged.push(uiTask);
					}
					for (const task of existingInRange) {
						merged.push(task);	// 老任务本身有 index，除非任务列表有变，否则 id 不用重新计算
					}
					for (const task of suffixResp?.tasks ?? []) {
						const uiTask = getInitialUITask(task.id, '');
						mergeTaskFromService(uiTask, task, true);
						uiTask.taskIndex = newStart + merged.length;
						uiTask.selectedRunIndex = uiTask.runs.length - 1;
						merged.push(uiTask);
					}

					// 重建 taskIdToIndex 映射
					const newMap = new Map<number, number>();
					for (let i = 0; i < merged.length; i++) newMap.set(merged[i].id, i);
					server.data.tasks = merged;
					server.data.taskIdToIndex = newMap;
					server.data.bufferStart = newStart;
					server.data.bufferEnd = newStart + merged.length;
					console.log(`任务列表更新完成，缓冲区范围：${server.data.bufferStart} - ${server.data.bufferEnd}`);

					server.entity.replaceSubscription(merged.map(t => t.id));
					this.recalcChangedParams();
					return;
				}
			}

			// 完整拉取路径（原逻辑）
			const response = await server.entity.getTaskList(newStart, size);
			const { tasks, totalCount: newTotalCount } = response;
			server.data.totalCount = newTotalCount;

			// 构建旧任务的临时 Map，用于合并保留已有的 dashboard 等状态
			const oldTasksById = new Map<number, UITask>();
			for (const task of server.data.tasks) {
				oldTasksById.set(task.id, task);
			}

			// 重建 tasks 数组和 taskIdToIndex 映射
			const newTasks: UITask[] = [];
			const newMap = new Map<number, number>();
			for (let i = 0; i < tasks.length; i++) {
				const task = tasks[i];
				const globalIndex = newStart + i;
				const existing = oldTasksById.get(task.id);
				if (existing) {
					mergeTaskFromService(existing, task, true);
					existing.taskIndex = globalIndex;
					newTasks.push(existing);
				} else {
					const uiTask = getInitialUITask(task.id, '');
					mergeTaskFromService(uiTask, task, true);
					uiTask.taskIndex = globalIndex;
					uiTask.selectedRunIndex = uiTask.runs.length - 1;
					newTasks.push(uiTask);
				}
				newMap.set(task.id, i);
			}
			server.data.tasks = newTasks;
			server.data.taskIdToIndex = newMap;

			// 更新缓冲区范围
			server.data.bufferStart = newStart;
			server.data.bufferEnd = newStart + tasks.length;

			// 订阅当前缓冲区的 taskId
			server.entity.replaceSubscription([...newTasks.map(t => t.id)]);

			this.recalcChangedParams();
		},
		/**
		 * 从后端获取所有任务的 ID 列表（用于全选和跨区选择）
		 */
		async fetchAllTaskIds(): Promise<number[]> {
			if (!this.currentServer) return [];
			const server = this.currentServer;
			const totalCount = server.data.totalCount;
			if (totalCount === 0) return [];
			const response = await server.entity.getTaskList(0, totalCount, true);
			return response.taskIds;
		},
		/**
		 * 按状态从后端查询任务 ID 并设为选中集合
		 */
		async selectTasksByStatus(status: TaskStatus): Promise<number[]> {
			if (!this.currentServer) return [];
			const response = await this.currentServer.entity.getTaskIdsByStatus(status);
			this.selectedTask = new Set(response.taskIds);
			this.isAllSelected = false;
			this.taskSelectionModified = false;
			return response.taskIds;
		},
		/**
		 * 获取 service 的 task 更新到本地
		 */
		updateTask(taskId: number) {
			const server = this.currentServer;
			if (!server) return;
			server.entity.getTask(taskId).then((content) => {
				handleTaskUpdate(server, taskId, content, true);
				this.recalcChangedParams();
			});
		},
		/**
		 * 检查每个任务的上传状态，调用 entity.deleteTask
		 * @param taskIds
		 */
		deleteTasks(taskIds: number[]) {
			if (!this.currentServer) { debugger; throw 'ub'; }
			for (const taskId of taskIds) {
				const uploadFiles = this.currentServer.data.uploadFiles.filter((uploadFile) => uploadFile.taskId === taskId)
				for (const uploadFile of uploadFiles) {
					// 对于正在读取校验的任务
					uploadFile.readTask?.stop();	// 不一定有，比如上传完成
					// 对于正在上传的任务
					const uploadingChunks = uploadFile.chunks.filter((chunk) => chunk.status === 'uploading');
					uploadingChunks.forEach((chunk) => chunk.abortController.abort());
				}
			}
			this.currentServer.entity.taskDelete(taskIds);
		},
		/**
		 * 修改已选任务项后调用
		 * 函数将使用已选择的任务项替换 globalParameters
		 */
		applySelectedTask() {
			if (!this.currentServer) { debugger; throw 'ub'; }
			if (this.selectedTask.size > 0) {
				const data = this.currentServer.data;
				for (const id of this.selectedTask) {
					const index = data.taskIdToIndex.get(id);
					if (index !== undefined) {
						const task = data.tasks[index];
						const run = task.runs[task.selectedRunIndex];
						this.globalParams = replaceOutputParams(run.after, this.globalParams, true);
					}
				}
			}
			this.globalParams.extra.presetName = '';
			this.presetName = '';
		},
		startNpause () {
			if (!this.currentServer) { debugger; throw 'ub'; }
			if (this.currentServer.entity.status !== ServiceBridgeStatus.Connected) {
				return;
			}
			const data = this.currentServer.data;
			const entity = this.currentServer.entity;
			if (data.workingStatus === WorkingStatus.idle) {		// 开始任务
				entity.queueStart();
			} else {
				entity.queuePause();
			}
		},
		// #endregion 任务处理
		// #region 参数处理
		/**
		 * 修改 globalParams 后需调用此函数
		 * 函数将修改后的全局参数应用到当前选择的任务项，然后保存到本地磁盘
		 * 对于用户操作，将预设参数置为未保存
		 */
		applyParameters(behavior: 'modifyTask' | 'applyToAllTasks' | 'loadPreset' | 'verifyDefaults' = 'modifyTask', selection?: Set<number>) {
			// 更改到一些不匹配的值后会导致 getFFmpegParaArray 出错，但是修正代码就在后面，因此仅需忽略它，让它继续运行下去，不要急着更新

			// 变更预设参数
			if (behavior === 'modifyTask') {
				this.globalParams.extra.presetName = '';
				this.presetName = '';
			}

			if (!this.currentServer) { debugger; throw 'ub'; }
			const entity = this.currentServer.entity;
			const data = this.currentServer.data;
			if (data) {
				// this.globalParams
				// 收集需要批量更新的输出参数，交给 service。同时本地替换一次 run.after
				const targetIds = Array.from(selection || this.selectedTask);
				const isSingleTaskModify = behavior === 'modifyTask' && this.selectedTask.size === 1;

				// 本地更新缓冲区中的任务
				for (let i = 0; i < targetIds.length; i++) {
					const id = targetIds[i];
					const taskIndex = data.taskIdToIndex.get(id);
					if (taskIndex === undefined) continue;

					let task = data.tasks[taskIndex];
					let latestRun = task.runs[task.runs.length - 1];
					const isRunning = [TaskStatus.running, TaskStatus.paused, TaskStatus.paused_queued, TaskStatus.stopping, TaskStatus.finishing].includes(task.status);
					if (isRunning) {
						targetIds.splice(i, 1);
						i--;
						continue;
					}
					const hasRunFinished = [TaskStatus.finished, TaskStatus.error].includes(task.status);
					if (hasRunFinished) {
						const newRun = getNewUIRun(JSON.parse(JSON.stringify(latestRun.after)));
						task.runs.push(newRun);
						latestRun = newRun;
						task.status = TaskStatus.idle;		
					}
					latestRun.after = replaceOutputParams(this.globalParams, latestRun.after, isSingleTaskModify);	// TODO：这里的 index 是不对的
				}
				if (targetIds.length) {
					// paraArray 由 service 算出后回填本地
					// 更新方式是 taskUpdate
					// 注意回填本地时也会产生一次 run.after 更新
					entity.setParameters(targetIds, this.globalParams, isSingleTaskModify);
				}

				this.taskSelectionModified = true;
			}

			// 存盘
			clearTimeout((window as any).saveAllParaTimer);
			(window as any).saveAllParaTimer = setTimeout(() => {
				nodeBridge.localStorage.set('globalParams', this.globalParams);
				console.log('参数已保存');
			}, 700);
		},
		/**
		 * 切换编码器之后或者第一次使用 FFBox 需要预置一些默认值，通过调用此函数进行
		 * 并会调用一次 applyParameters 以存储并将当前配置应用到所选任务上
		 */
		checkAndApplyCodecDefaults(who: { video?: true, audio?: true, mux?: true }, outputIndex = 0) {
			if (who.video) {
				const v = this.globalParams.outputs[outputIndex].video;
				const vcodec = getMenuItemByValue(builtInVcodecs, v.vcodec) ?? getMenuItemByValue(allVcodecs, v.vcodec);
				// 清理所有码率控制参数
				const rcList = ((vcodec as any)?.extra?.rateControl || []) as any[];
				for (const item of rcList) {
					if (item.type !== 'normal' || item.value === '自动' || !item.extra) continue;
					for (const name of (item.extra as RateControl).paramNames) {
						delete v.detail[name];
					}
				}
				// 设置 detail 默认值
				for (const parameter of ((vcodec as any)?.extra?.parameters || [])) {
					if (parameter.optional) {
						continue;	// 默认不启用可选参数。在勾选后才读取默认值
					}
					if (parameter.mode === 'combo') {
						const defaultValue = parameter.default ?? parameter.items[0].value;
						console.log(`参数 ${parameter.parameter} 重置为默认值或首项：${defaultValue}`);
						v.detail[parameter.parameter] = defaultValue;
					} else if (parameter.mode == 'slider') {
						const defaultValue = parameter.default ?? ((parameter.max ?? 1) + (parameter.min ?? 0)) / 2;
						console.log(`参数 ${parameter.parameter} 重置为默认值或中间值：${defaultValue}`);	// 假定所有 string 类的 slider 都必须定义 default
						v.detail[parameter.parameter] = defaultValue;
					}
				}
				// 设置码率控制默认值
				const firstRC = rcList.find((item: any) => item.type === 'normal' && item.value !== '自动');
				v.ratecontrol = firstRC?.value ?? undefined;
				if (firstRC?.extra) {
					Object.assign(v.detail, (firstRC.extra as RateControl).defaultDetail);
				}
			}
			if (who.audio) {
				const a = this.globalParams.outputs[outputIndex].audio;
				const acodec = getMenuItemByValue(builtInAcodecs, a.acodec) ?? getMenuItemByValue(allAcodecs, a.acodec);
				// 清理所有码率控制参数
				const rcList = ((acodec as any)?.extra?.rateControl || []) as any[];
				for (const item of rcList) {
					if (item.type !== 'normal' || item.value === '自动' || !item.extra) continue;
					for (const name of (item.extra as RateControl).paramNames) {
						delete a.detail[name];
					}
				}
				// 设置 detail 默认值
				for (const parameter of ((acodec as any)?.extra?.parameters || [])) {
					if (parameter.optional) {
						continue;	// 默认不启用可选参数。在勾选后才读取默认值
					}
					if (parameter.mode === 'combo') {
						const defaultValue = parameter.default ?? parameter.items[0].value;
						console.log(`参数 ${parameter.parameter} 重置为默认值或首项：${defaultValue}`);
						a.detail[parameter.parameter] = defaultValue;
					} else if (parameter.mode == 'slider') {
						const defaultValue = parameter.default ?? ((parameter.max ?? 1) + (parameter.min ?? 0)) / 2;
						console.log(`参数 ${parameter.parameter} 重置为默认值或中间值：${defaultValue}`);	// 假定所有 string 类的 slider 都必须定义 default
						a.detail[parameter.parameter] = defaultValue;
					}
				}
				// 设置码率控制默认值
				const firstRC = rcList.find((item: any) => item.type === 'normal' && item.value !== '自动');
				a.ratecontrol = firstRC?.value ?? undefined;
				if (firstRC?.extra) {
					Object.assign(a.detail, (firstRC.extra as RateControl).defaultDetail);
				}
			}
			if (who.mux) {
				const m = this.globalParams.outputs[outputIndex].mux;
				const muxer = getMenuItemByValue(builtInMuxers, m.format) ?? getMenuItemByValue(allMuxers, m.format)
				for (const parameter of ((muxer as any)?.extra?.parameters || [])) {
					if (parameter.optional) {
						continue;	// 默认不启用可选参数。在勾选后才读取默认值
					}
					if (parameter.mode === 'combo') {
						const defaultValue = parameter.default ?? parameter.items[0].value;
						console.log(`参数 ${parameter.parameter} 重置为默认值或首项：${defaultValue}`);
						m.detail[parameter.parameter] = defaultValue;
					} else if (parameter.mode == 'slider') {
						const defaultValue = parameter.default ?? ((parameter.max ?? 1) + (parameter.min ?? 0)) / 2;
						console.log(`参数 ${parameter.parameter} 重置为默认值或中间值：${defaultValue}`);	// 假定所有 string 类的 slider 都必须定义 default
						m.detail[parameter.parameter] = defaultValue;
					}
				}
			}
			this.applyParameters('verifyDefaults');
		},
		/**
		 * 检查有多少参数是非"不重新编码"的，以此更改界面显示形式（paramsVisibility）
		 * 在服务器初次加载和修改参数时调用
		 * 目前均以第一个输入和第一个输出的参数为准
		 */
		recalcChangedParams() {
			if (!this.currentServer) { debugger; throw 'ub'; }
			const paramsVisibility = {
				duration: 0,
				format: 0,
				smpte: 0,
				video: 0,
				audio: 0,
			};
			for (const task of this.currentServer.data.tasks || []) {
				const after = getTaskLatestOutputParams(task);
				if (after.input.files.length !== 1 || after.outputs.length !== 1) {
					continue;
				}
				if (after.input.files[0].begin || after.input.files[0].end || after.outputs[0].mux.begin || after.outputs[0].mux.end) {
					paramsVisibility.duration = Math.max(paramsVisibility.duration, 2);
				} else {
					paramsVisibility.duration = Math.max(paramsVisibility.duration, 1);
				}
				if (after.outputs[0].mux.format === '无' || after.outputs[0].mux.format === task.before[0]?.demuxer) {
					paramsVisibility.format = Math.max(paramsVisibility.format, 1);
				} else {
					paramsVisibility.format = Math.max(paramsVisibility.format, 2);
				}
				if (after.outputs[0].video.vcodec !== '禁用视频') {
					if (after.outputs[0].video.vcodec !== '不重新编码') {
						paramsVisibility.video = Math.max(paramsVisibility.video, 2);
						if (after.outputs[0].video.resolution !== '不改变' || after.outputs[0].video.framerate !== '不改变') {
							paramsVisibility.smpte = Math.max(paramsVisibility.smpte, 2);
						} else {
							paramsVisibility.smpte = Math.max(paramsVisibility.smpte, 1);
						}
					} else {
						paramsVisibility.video = Math.max(paramsVisibility.video, 1);
					}
				}
				if (after.outputs[0].audio.acodec !== '禁用音频') {
					if (after.outputs[0].audio.acodec !== '不重新编码') {
						paramsVisibility.audio = Math.max(paramsVisibility.audio, 2);
					} else {
						paramsVisibility.audio = Math.max(paramsVisibility.audio, 1);
					}
				}
			}
			const newVisibility = {
				duration: (['none', 'input', 'all'] as any)[paramsVisibility.duration],
				format: (['none', 'input', 'all'] as any)[paramsVisibility.format],
				smpte: (['none', 'input', 'all'] as any)[paramsVisibility.smpte],
				video: (['none', 'input', 'all'] as any)[paramsVisibility.video],
				audio: (['none', 'input', 'all'] as any)[paramsVisibility.audio],
			};
			if (
				this.taskViewSettings.paramsVisibility.duration !== newVisibility.duration ||
				this.taskViewSettings.paramsVisibility.format !== newVisibility.format ||
				this.taskViewSettings.paramsVisibility.smpte !== newVisibility.smpte ||
				this.taskViewSettings.paramsVisibility.video !== newVisibility.video ||
				this.taskViewSettings.paramsVisibility.audio !== newVisibility.audio
			) {
				this.taskViewSettings.paramsVisibility = newVisibility;
			}
			// this.taskViewSettings.paramsVisibility = {
			// 	duration: (['none', 'input', 'all'] as any)[paramsVisibility.duration],
			// 	format: (['none', 'input', 'all'] as any)[paramsVisibility.format],
			// 	smpte: (['none', 'input', 'all'] as any)[paramsVisibility.smpte],
			// 	video: (['none', 'input', 'all'] as any)[paramsVisibility.video],
			// 	audio: (['none', 'input', 'all'] as any)[paramsVisibility.audio],
			// };
			// console.log('recalcChangedParams', this.taskViewSettings.paramsVisibility);
		},
		/**
		 * 按名称载入预设并更新配置（含所选任务配置）
		 */
		async loadPreset(name: string) {
			const secureName = name.replaceAll('.', '．');
			if (secureName === '默认配置') {
				this.globalParams = JSON.parse(JSON.stringify(defaultParams));
				this.presetName = secureName;
				this.checkAndApplyCodecDefaults({ video: true, audio: true });
			} else {
				const params = await nodeBridge.localStorage.get(`presets.${secureName}`);
				if (params) {
					this.globalParams = params;
				}
				this.presetName = secureName;
				this.applyParameters('loadPreset');
			}
			if (this.selectedTask.size > 0 && this.currentServer) {
				// 这个操作约等于 applySelectedTask
				// 主要目的是，当选中了任务更改预设时，全局参数中的输入文件名等信息会被替换，但任务中的不被替换。若马上就修改其他参数，会导致任务中的输入文件名等信息变成全局的
				const fisrtSelectedTaskId = [...this.selectedTask][0];
				const taskIndex = this.currentServer.data.taskIdToIndex.get(fisrtSelectedTaskId);
				if (taskIndex !== undefined) {
					const task = this.currentServer.data.tasks[taskIndex];
					this.globalParams = replaceOutputParams(task.runs[task.runs.length - 1].after, this.globalParams, true);
				}
			}
		},
		savePreset(name: string) {
			const secureName = name.replaceAll('.', '．');
			return nodeBridge.localStorage.set(`presets.${secureName}`, this.globalParams).then(() => {
				this.presetName = secureName;
				this.loadPresetList();
			});
		},
		editPreset(oldName: string, newName: string) {
			const store = this;
			const secureOldName = oldName.replaceAll('.', '．');
			const secureNewName = newName.replaceAll('.', '．');
			async function f() {
				const oldPreset = await nodeBridge.localStorage.get(`presets.${secureOldName}`);
				nodeBridge.localStorage.set(`presets.${secureNewName}`, oldPreset);
				if (newName !== oldName) {
					nodeBridge.localStorage.delete(`presets.${secureOldName}`);
				}
				store.presetName = secureNewName;
				store.loadPresetList();
			}
			return f();
		},
		deletePreset(name: string) {
			const secureName = name.replaceAll('.', '．');
			return nodeBridge.localStorage.delete(`presets.${secureName}`).then(() => {
				this.presetName = '';
				this.loadPresetList();
			});
		},
		/**
		 * 通过 electronStore.get('presets') 得到的 key 更新当前可用的预设菜单
		 */
		loadPresetList() {
			nodeBridge.localStorage.get('presets').then((presets) => {
				try {
					this.availablePresets = Object.keys(presets);
				} catch (error) {
					nodeBridge.localStorage.set('presets', {});
				}
			});
		},
		fetchAVOptions() {
			if (!this.currentServer) { debugger; throw 'ub'; }
			const entity = this.currentServer.entity;
			const data = this.currentServer.data;
			if (entity.status === ServiceBridgeStatus.Connected) {
				entity.getAVOptions().then((result: { codecs: { video: FFmpegCodecDetail[], audio: FFmpegCodecDetail[] }, formats: { muxer: FFmpegMuxerDetail[], demuxer: FFmpegDemuxerDetail[] }, filters: FFmpegFilterDetail[] }) => {
					parseFFmpegCodecsToCodecsList(result.codecs);
					parseFFmpegFiltersToFiltersList(result.filters);
					parseFFmpegMuDeMuxersToList(result.formats);
					nodeBridge.localStorage.set('ffmpegCodecs', result.codecs);
					nodeBridge.localStorage.set('ffmpegFormats', result.formats);
					nodeBridge.localStorage.set('ffmpegFilters', result.filters);
					Popup({ message: `已获取来自 ${data.name} ffmpeg 的 ${result.codecs.video.length} 种视频编码、${result.codecs.audio.length} 种音频编码、${result.formats.demuxer.length} 个解复用器、${result.formats.muxer.length} 个复用器、${result.filters.length} 个滤镜`, level: NotificationLevel.ok });
					window?.dispatchEvent(new CustomEvent('finished-fetch-codecs'));
				});
			} else {
				Popup({ message: '请先连接当前标签的服务器', level: NotificationLevel.error });
			}
		},
		// #endregion 参数处理
		// #region 通知处理
		/**
		 * 获取 service 的 notifications 更新到本地
		 */
		updateNotifications() {
			if (!this.currentServer) { debugger; throw 'ub'; }
			const entity = this.currentServer.entity;
			entity.getNotifications().then((result) => {
				this.currentServer!.data.notifications = result;
			});
		},
		pushMsg(message: string, level: NotificationLevel) {
			Popup({ message, level });
			this.notifications.push({
				time: new Date().getTime(),
				content: message,
				level,
			})
		},
		setUnreadNotifationCount(clear = false) {
			this.unreadNotificationCount = clear ? 0 : this.unreadNotificationCount + 1;
		},
		// #endregion 通知处理
		// #region 服务器处理
		/**
		 * 获取 service 的版本和属性更新到本地
		 */
		updateServerProperties() {
			const server = this.currentServer;
			if (!server) { debugger; throw 'ub'; }
			Promise.all([
				fetch(`http://${server.entity.ip}:${server.entity.port}/api/v1/system/version`, { method: 'get' }),
				server.entity.getProperties(),
				server.entity.getWorkingStatus(),
			]).then(([versionResponse, properties, workingStatus]) => {
				versionResponse.text().then((text) => {
					server.data.version = text;
					if (['3.0', '4.0', '4.1', '4.2', '4.3', '4.4', '4.5', '5.0', '5.1', '5.2'].includes(text)) {
						// 4.3 版本更新了任务管理方式
						// 5.0 版本更新了任务参数数据结构
						// 5.1 版本更新了任务名
						// 5.3 版本更新了 API
						Popup({ message: `服务器版本 ${text} 与客户端版本 ${version} 不兼容，请更换服务器或客户端`, level: NotificationLevel.warning });
					} else if (text !== version) {
						Popup({ message: `服务器版本 ${text} 与客户端版本不匹配，可能会导致部分操作异常，请谨慎操作`, level: NotificationLevel.warning });
					}
				});

				// properties
				server.data.os = properties.os;
				server.data.isSandboxed = properties.isSandboxed;
				server.data.machineId = properties.machineId;
				server.data.functionLevel = properties.functionLevel;
				server.data.ffmpegInfo = properties.ffmpegInfo;

				// workingStatus
				if (typeof workingStatus === 'object' && workingStatus !== null && (workingStatus as any).workingStatus !== undefined) {
					const ws = workingStatus as { workingStatus: WorkingStatus; progress: number };
					if (ws.workingStatus === WorkingStatus.idle || ws.workingStatus === WorkingStatus.running) {
						server.data.workingStatus = ws.workingStatus;
						if (ws.workingStatus === WorkingStatus.running) registerServerForDashboard(server as any, 'start');
					}
					server.data.progress = ws.progress;
				}
			});
		},
		/**
		 * 添加服务器标签页
		 */
		addServer() {
			const id = randomString(6);
			this.servers.push({
				data: {
					id: id,
					name: '未连接',
					tasks: [],
					taskIdToIndex: new Map(),
					notifications: [],
					uploadFiles: [],
					downloadFiles: [],
					ffmpegInfo: { version: '', scanning: false, videoEncodersCount: 0, audioEncodersCount: 0, muxersCount: 0, demuxersCount: 0, filtersCount: 0 },
					version: '',
					totalCount: 0,
					bufferStart: 0,
					bufferEnd: 0,
					viewRange: { firstIndex: 0, lastIndex: 0 },
					workingStatus: WorkingStatus.idle,
					progress: -1,
					asyncList: [],
				},
				entity: new ServiceBridge(),
			});
			this.selectedTask.clear();
			this.currentServerId = id;
			return id;
		},
		/**
		 * 关闭服务器标签页
		 * TODO 暂未实现上传下载中断逻辑
		 */
		removeServer(serverId: string) {
			const index = this.servers.findIndex((server) => server.data.id === serverId);
			if (index === -1) return;
			const server = this.servers[index];
			server.entity.disconnect();
			this.servers.splice(index, 1);
			if (this.currentServerId === serverId) {
				this.currentServerId = this.servers[index - 1].data.id;
			}
		},
		/**
		 * 初始化服务器连接并挂载事件监听
		 */
		initializeServer(serverId: string, ip: string, port: number, username: string, password: string, retryCount = 0) {
			const server = this.servers.find((server) => server.data.id === serverId) as Server;
			const entity = server.entity;
			if (!ip) {
				return Promise.reject();
			}
			const _port = port ?? 33269;
			console.log('初始化服务器连接', server.data);

			const destroy = () => {
				for (const eventName of ['connected', 'disconnected', 'error', 'ffmpegInfo', 'workingStatusUpdate', 'tasklistUpdate', 'taskUpdate', 'cmdUpdate', 'progressUpdate', 'notificationUpdate', 'asyncListUpdate'] as any[]) {
					entity.removeAllListeners(eventName);
				}
			}
			return new Promise((resolve, reject) => {
				entity.connect(ip, _port, username, password);

				entity.on('connected', () => {
					server.data.name = ip === 'localhost' ? '本地服务器' : ip;
					console.log(`成功连接到服务器 ${server.entity.ip}`);
					this.pushMsg(`成功连接到服务器 ${server.data.name}`, NotificationLevel.ok);
					server.data.tasks = [];	// 由于 taskList 只包含 id，重新连接后需要清除原 task 信息以获取新的
					server.data.taskIdToIndex = new Map();
					// 以下操作针对的是特定 server（闭包捕获），而非 currentServer（可能已切换），因此直接调用 server.entity 而非 store action
					this.updateServerProperties();
					this.updateTaskList(0).then(() => {
						// 先拉一次任务总数（以决定是否要开启无限滚动，以确认 pageSize），再触发一次任务拉取
						this.updateTaskList(0);
					});
					// entity.updateTaskList();
					this.updateNotifications();
					resolve(server);
				});
				entity.on('disconnected', () => {
					console.log(`已断开服务器 ${server.entity.ip} 的连接`);
					this.pushMsg(`已断开服务器 ${server.data.name} 的连接`, NotificationLevel.warning);
					destroy();
				});
				entity.on('error', (reason) => {
					if (!retryCount || reason.includes('连接失败')) {
						console.log(`服务器 ${server.entity.ip} ${reason}`);
						this.pushMsg(`服务器 ${server.data.name} ${reason}`, NotificationLevel.error);
						destroy();
						reject(reason);
					} else {
						console.log(`服务器 ${server.entity.ip} ${reason}，剩余重试次数 ${retryCount}`);
						setTimeout(() => {
							this.initializeServer(serverId, ip, port, username, password, retryCount - 1);
						}, 150);
					}
				});

				entity.on('ffmpegInfo', (data) => {
					handleFFmpegInfo(server, data);
				});
				entity.on('workingStatusUpdate', (data) => {
					if (data.workingStatus) {
						handleStatusUpdate(server, data.workingStatus);
					}
					server.data.progress = data.progress;
				});
				entity.on('tasklistUpdate', (data) => {
					handleTasklistUpdate(server, data);
					this.recalcChangedParams();
				});
				entity.on('taskUpdate', (data) => {
					handleTaskUpdate(server, data.taskId, data.task);
					this.recalcChangedParams();
				});
				entity.on('cmdUpdate', (data) => {
					handleCmdUpdate(server, data.taskId, data.runIndex, data.content, data.append);
				});
				entity.on('progressUpdate', (data) => {
					handleProgressUpdate(server, data.taskId, data.runIndex, data.time, data.status, this.functionLevel);
				});
				entity.on('notificationUpdate', (data) => {
					handleNotificationUpdate(server, data.notificationId, data.notification);
				});
				entity.on('asyncListUpdate', (data) => {
					server.data.asyncList = data.list;
				});
			});
		},
		/**
		 * 重新连接已掉线或未成功连接的服务器
		 */
		reConnectServer(serverId: string) {
			const server = this.servers.find((server) => server.data.id === serverId) as Server;
			const entity = server.entity;
			this.initializeServer(serverId, entity.ip, entity.port, entity.username, entity.password);
		},
		// #endregion 服务器处理
		// #region 其他
		/**
		 * 激活后端（FFBoxService）
		 * @param serverId 指定激活哪台服务器；不传则激活当前服务器
		 */
		async activateBackend(userInput: string, serverId?: string): Promise<number | false> {
			const server = serverId ? this.servers.find((server) => server.data.id === serverId) : this.currentServer;
			const result = await server?.entity.activate(userInput).catch(() => false);
			if (result && Number.isFinite(+result)) {
				server!.data.functionLevel = +result;
				return +result;
			}
			return false;
		},
		async activateFrontend(userInput: string): Promise<number | false> {
			if (validUntil !== undefined && new Date() > validUntil) {
				this.pushMsg('FFBox 内部版本已过期，当前版本功能受限，请更新版本后使用。', NotificationLevel.warning);
				this.functionLevel = 0;
				return 0;
			}
			if (nodeBridge.env !== 'electron') {
				return false;
			}
			const machineId = await nodeBridge.getMachineId();
			if (!machineId) return false;

			// 新版激活码（facv2.*）：公钥验签 + machineId 匹配 + 流速衰减
			if (isV2Code(userInput)) {
				const r = await verifyActivationCode(userInput, true);
				if (r.ok && r.machineId === machineId) {
					this.functionLevel = r.functionLevel!;
					nodeBridge.localStorage.set('frontendSettings.activationCode', userInput);
					return r.functionLevel!;
				}
				return false;
			}

			// 旧版激活码（U2FsdGVkX1*）：不生效，提示升级
			if (isLegacyCode(userInput)) {
				this.pushMsg('感谢您使用以前版本的 FFBox！❤️\n旧版本的激活码机制在当前版本已不再支持。请进入左上角菜单中心，在「支持作者」面板中使用旧激活码换取新的“解锢密令”！🙇', NotificationLevel.warning);
				return false;
			}

			return false;
		},
		/**
		 * 修改前端设置后调用
		 * 函数将修改后的全局参数应用到当前选择的任务项，然后保存到本地磁盘
		 * 对于用户操作，进行存盘
		 */
		applyFrontendSettings(isUserInteraction: boolean) {
			if (isUserInteraction) {
				// 存盘
				clearTimeout((window as any).saveAllParaTimer);
				(window as any).saveAllParaTimer = setTimeout(() => {
					nodeBridge.localStorage.set('frontendSettings', this.frontendSettings);
					console.log('设置已保存');
				}, 700);
			}

			document.body.className = this.frontendSettings.colorTheme;
			if (this.frontendSettings.colorTheme === 'themeAcrylic') {
				nodeBridge.setBlurBehindWindow(true);
			} else {
				nodeBridge.setBlurBehindWindow(false);
			}
			// document.body.setAttribute('data-color_theme', this.frontendSettings.colorTheme);

			window.frontendSettings!.useIEC = this.frontendSettings.useIEC;
		},

		// #endregion 其他
	},
});
import EventEmitter from 'events';
import CryptoJS from 'crypto-js';
import { TypedEventEmitter } from '@common/utils';
import { version } from '@common/constants';
import { FFBoxServiceEvent, FFBoxServiceEventApi, FFBoxServiceInterface, Frame, InputInfo, Notification, OutputParams, Task, TaskStatus, Permission, UserConfig, ServerSettingsData, WorkingStatus } from '@common/types';

export interface ServiceBridgeEvent {
	connected: () => void;
	disconnected: () => void;
	error: (reason: string) => void;
	message: (event: MessageEvent<any>) => void;
};

export enum ServiceBridgeStatus {
	Idle = 'Idle',
	Connecting = 'Connecting',
	Connected = 'Connected',
	Disconnected = 'Disconnected',
	Reconnecting = 'Reconnecting',
};

// TODO 6.0 版本中，前后端不再是仿 RPC 设计，因此这里的接口并没有 implements FFBoxServiceInterface
export class ServiceBridge extends (EventEmitter as new () => TypedEventEmitter<FFBoxServiceEvent & ServiceBridgeEvent>) implements FFBoxServiceInterface {
	private ws: WebSocket | null = null;
	public ip: string | undefined;
	public port: number | undefined;
	public username: string | undefined;
	public password: string | undefined;
	public status = ServiceBridgeStatus.Idle;
	public sessionId?: string;
	public permissions: Permission[] = [];

	constructor(ip?: string, port?: number) {
		super();
		setTimeout(() => {
			if (ip && port) {
				this.connect(ip, port);
			}
		}, 0);
	}

	// #region HTTP 请求封装

	/**
	 * 发送 HTTP 请求（public：供 AISearchIframeHost 代调用 iframe 指定的 API）
	 */
	public async httpRequest<T>(method: string, path: string, body?: any): Promise<T> {
		const headers: HeadersInit = { 'Content-Type': 'application/json' };
		if (this.sessionId) {
			headers['Authorization'] = `Bearer ${this.sessionId}`;
		}
		const response = await fetch(`http://${this.ip}:${this.port}${path}`, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});
		if (!response.ok) {
			// throw new Error(`HTTP ${response.status}`);
		}
		const text = await response.text();
		try {
			return JSON.parse(text);
		} catch {
			return text as T;
		}
	}

	/**
	 * 带超时的 fetch，避免服务器无响应时连接流程永久卡住
	 */
	private fetchWithTimeout(path: string, init?: RequestInit, timeout = 5000): Promise<Response> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeout);
		return fetch(`http://${this.ip}:${this.port}${path}`, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
	}

	// #endregion

	// #region 连接/断开/WebSocket 监听

	public async connect(ip?: string, port?: number, username?: string, password?: string) {
		if (ip && port) {
			this.ip = ip;
			this.port = port;
		}
		if (this.status === ServiceBridgeStatus.Idle) {
			this.status = ServiceBridgeStatus.Connecting;
		} else if (this.status === ServiceBridgeStatus.Disconnected) {
			this.status = ServiceBridgeStatus.Reconnecting;
		} else {
			return;
		}

		const finalResult = await new Promise(async (connectResult, _) => {
			// 4.4 版本后的服务器具有登录系统。不支持以前版本的服务器
			// 5.3 版本大量改用 HTTP request，并且版本接口新增 /api/v1 前缀

			// TODO 0. 检查服务器是否可连接

			// 1. 检查服务器版本
			console.log(`serviceBridge: 正在检查服务器版本 http://${this.ip}:${this.port}/api/v1/system/version`);
			let serverVersion: string | null = null;
			try {
				const responseOK1 = await this.fetchWithTimeout('/api/v1/system/version');
				if (responseOK1.ok) {
					serverVersion = (await responseOK1.text()).trim();
				} else {
					console.warn(`serviceBridge: 版本接口响应异常，HTTP ${responseOK1.status}`);
				}
			} catch (err) {
				console.warn('serviceBridge: 获取后端版本失败', err);
			}
			// 只比较主版本号，忽略开发版附加的后缀（如 *、git commit）；次版本不一致仅警告，不阻断连接
			const serverVersionParts = serverVersion?.match(/\d+\.\d+/)?.[0].split('.');
			const localVersionParts = version.match(/\d+\.\d+/)?.[0].split('.');
			if (!serverVersion || !serverVersionParts || serverVersionParts[0] !== localVersionParts?.[0]) {
				this.emit('error', `连接失败：前后端版本不匹配或端口非FFBoxService服务（前端 ${version}，后端 ${serverVersion ?? '未知异常'}）`);
				connectResult(false);
				return;
			}
			if (serverVersionParts[1] !== localVersionParts?.[1]) {
				this.emit('error', `前端与后端版本不一致（前端 ${version}，后端 ${serverVersion}），部分功能可能异常`);
			}

			// 2. HTTP 登录获取 sessionId
			console.log(`serviceBridge: 正在登录 http://${this.ip}:${this.port}/api/v1/auth/login`);
			const [loginSuccess, loginResult] = await new Promise<[boolean, any]>((resolve, reject) => {
				this.fetchWithTimeout('/api/v1/auth/login', {
					method: 'post',
					body: JSON.stringify({
						username: username || '',
						passkey: password ? CryptoJS.SHA256(password).toString() : '',
					}),
					headers: new Headers({
						'Content-Type': 'application/json'
					}),
				}).then((response) => {
					response.json().then((result) => {
						resolve([result.isSuccess, result]);
					}).catch(() => {
						resolve([false, null]);
					});
				}).catch((err) => {
					resolve([false, null]);
				});
			});

			if (!loginSuccess) {
				if (loginResult?.isUserExist === false) {
					this.emit('error', '登录失败：用户名错误');
				} else {
					this.emit('error', '登录失败：密码错误');
				}
				connectResult(false);
				return;
			}

			this.sessionId = loginResult.sessionId;
			this.permissions = loginResult.permissions ?? [];
			console.log(`serviceBridge: 登录成功，sessionId: ${this.sessionId}, permissions: ${JSON.stringify(this.permissions)}`);

			// 3. 建立 WebSocket 连接（携带 sessionId）
			console.log(`serviceBridge: 正在连接 WebSocket ws://${this.ip}:${this.port}/?sessionId=${this.sessionId}`);
			const ws = new WebSocket(`ws://${this.ip}:${this.port}/?sessionId=${this.sessionId}`);
			this.ws = ws;
			const 这 = this;
			// ws 握手超时保护：超时仍未打开则按失败结束连接，避免 status 永久停在 Connecting
			const wsConnectTimeout = setTimeout(() => {
				if (ws.readyState !== WebSocket.OPEN) {
					ws.close();
					这.emit('error', '连接失败：WebSocket 连接超时');
					connectResult(false);
				}
			}, 5000);

			ws.onopen = async function (event) {
				console.log(`serviceBridge: WebSocket 连接成功`, event);
				clearTimeout(wsConnectTimeout);
				这.status = ServiceBridgeStatus.Connected;
				这.emit('connected');
				connectResult(true);
			};

			ws.onclose = function (event) {
				// close 事件在 error 事件后触发
				if (这.status === ServiceBridgeStatus.Connected) {
					clearTimeout(wsConnectTimeout);
					// 掉线
					这.status = ServiceBridgeStatus.Disconnected;
				} else {
					// 未连接成功，由 onerror 处理过，这里不需处理
				}
				这.sessionId = undefined;
				这.permissions = [];
				这.emit('disconnected');
			};

			ws.onerror = function (event) {
				clearTimeout(wsConnectTimeout);
				这.emit('error', 'WebSocket 连接失败');
				connectResult(false); // 确保 status 能重置，不再永久卡在 Connecting
				// return;
			};

			ws.onmessage = function (event) {
				// console.log(`serviceBridge: ws://${这.ip}:${这.port}/ 服务器发来消息`, event);
				// 这.emit('message', event);
				这.handleWsEvents(event);
			};
		});

		if (!finalResult) {
			if (this.status === ServiceBridgeStatus.Connecting) {
				this.status = ServiceBridgeStatus.Idle;
			} else if (this.status === ServiceBridgeStatus.Reconnecting) {
				this.status = ServiceBridgeStatus.Disconnected;
			}
		}
	}

	public disconnect() {
		console.log(`serviceBridge: 正在断开服务器 ws://${this.ip}:${this.port}/`);
		this.ws?.close();
		this.ws = null;
		this.status = ServiceBridgeStatus.Idle;
	}

	/**
	 * 接受 service 事件入口（来自 ws.onmessage）
	 */
	private handleWsEvents(event: MessageEvent<any>) {
		const data: FFBoxServiceEventApi = JSON.parse(event.data);
		if (data.event === 'connected') {
			console.log(`serviceBridge: 收到 connected 事件`, data.payload);
		} else {
			this.emit(data.event, data.payload as any);
		}
	}

	// #endregion

	// #region 流式请求

	/**
	 * 发送流式 HTTP 请求（用于视频预览等场景）
	 * 返回原始 Response 对象，可通过 response.body.getReader() 控制读取节奏
	 */
	public fetchHttp(path: string, signal?: AbortSignal): Promise<Response> {
		const headers: HeadersInit = {};
		if (this.sessionId) {
			headers['Authorization'] = `Bearer ${this.sessionId}`;
		}
		return fetch(`http://${this.ip}:${this.port}${path}`, { headers, signal });
	}

	// #endregion

	// #region 任务管理

	public taskAddBatch(filePaths: string[], outputParams?: OutputParams): Promise<number[]> {
		return this.httpRequest<number[]>('POST', '/api/v1/tasks', { filePaths, outputParams });
	}

	public taskCopy(id: number, count?: number): Promise<number> {
		return this.httpRequest<number>('POST', `/api/v1/tasks/${id}/copy`, { count });
	}

	public taskDelete(ids: number[]): Promise<void> {
		return this.httpRequest<void>('POST', '/api/v1/tasks/delete', { ids });
	}

	public taskStart(ids: number[]): Promise<void> {
		return this.httpRequest<void>('POST', '/api/v1/tasks/start', { ids });
	}

	public taskReady(ids: number[]): Promise<void> {
		return this.httpRequest<void>('POST', '/api/v1/tasks/ready', { ids });
	}

	public taskPause(ids: number[]): Promise<void> {
		return this.httpRequest<void>('POST', '/api/v1/tasks/pause', { ids });
	}

	public taskResume(ids: number[]): Promise<void> {
		return this.httpRequest<void>('POST', '/api/v1/tasks/resume', { ids });
	}

	public taskReset(ids: number[]): Promise<void> {
		return this.httpRequest<void>('POST', '/api/v1/tasks/reset', { ids });
	}

	public mergeUploaded(id: number, hashs: string[], fileBaseName: string, inputName?: string, fileTime?: { accessTime: number, createTime: number, modifyTime: number }): Promise<void> {
		return this.httpRequest<void>('POST', `/api/v1/tasks/${id}/merge-upload`, { hashs, fileBaseName, inputName, fileTime });
	}

	public setUploadStatus(id: number, isUploading: boolean): Promise<void> {
		return this.httpRequest<void>('PUT', `/api/v1/tasks/${id}/upload-status`, { isUploading });
	}

	public setParameters(ids: number[], params: OutputParams, fullyReplace: boolean): Promise<void> {
		return this.httpRequest<void>('PUT', `/api/v1/tasks/parameters`, { ids, params, fullyReplace });
	}

	public trailLimit_stopTranscoding(id: number, reason: 'media' | 'working', byFrontend?: boolean): Promise<void> {
		return this.httpRequest<void>('POST', `/api/v1/tasks/${id}/stop`, { reason });
	}

	// #endregion

	// #region 队列管理

	public queueStart(): Promise<void> {
		return this.httpRequest<void>('POST', '/api/v1/queue/start');
	}

	public queuePause(): Promise<void> {
		return this.httpRequest<void>('POST', '/api/v1/queue/pause');
	}

	// #endregion

	// #region 通知管理

	public deleteNotification(notificationId: number): Promise<void> {
		return this.httpRequest<void>('DELETE', `/api/v1/system/notifications/${notificationId}`);
	}

	// #endregion

	// #region 信息获取

	public getProperties(): Promise<any> {
		return this.httpRequest<any>('GET', '/api/v1/system/properties');
	}

	public getWorkingStatus(): Promise<{ workingStatus: WorkingStatus; progress: number }> {
		return this.httpRequest<{ workingStatus: WorkingStatus; progress: number }>('GET', '/api/v1/system/working-status');
	}

	// 6.0 已不再是仿 IPC 结构了，所以这里要考虑在类型上把 implements FFBoxServiceInterface 去掉
	public getTaskList(offset: number, size: number): Promise<{ tasks: Task[], totalCount: number }>;
	public getTaskList(offset: number, size: number, idOnly: true): Promise<{ taskIds: number[], totalCount: number }>;
	public getTaskList(offset: number, size: number, idOnly?: boolean): Promise<{ tasks: Task[], totalCount: number } | { taskIds: number[], totalCount: number }> {
		const idOnlyParam = idOnly ? '&idOnly=true' : '';
		return this.httpRequest<any>('GET', `/api/v1/tasks?offset=${offset}&size=${size}${idOnlyParam}`);
	}

	/**
	 * 按状态筛选任务 ID 列表
	 */
	public getTaskIdsByStatus(status: TaskStatus): Promise<{ taskIds: number[], totalCount: number }> {
		return this.httpRequest<any>('GET', `/api/v1/tasks?status=${status}`);
	}

	public getTaskOutputFiles(taskRunEntries: { taskId: number; runIndex?: number }[]): Promise<{ taskId: number; taskIndex: number; runIndex: number; outputIndex: number; filePath: string; fileBaseName: string; fileTime?: { accessTime: number; createTime: number; modifyTime: number } }[]> {
		return this.httpRequest<any>('POST', '/api/v1/tasks/output-files', { taskRunEntries });
	}

	public getMediaFrameInfo(id: number, fileIndex: number, videoStreamIndex: number, type?: 'fast' | 'full' | 'stop'): Promise<Frame[]> {
		return this.httpRequest<Frame[]>('POST', `/api/v1/tasks/${id}/frame-info`, { fileIndex, videoStreamIndex, type });
	}

	public getThumbnailStream(id: number, fileIndex: number, videoStreamIndex: number, width: number, height: number, density: 'M' | 'H', abortSignal: AbortSignal): Promise<Response> {
		return this.fetchHttp(`/api/v1/tasks/${id}/thumbnail-stream?fileIndex=${fileIndex}&videoStreamIndex=${videoStreamIndex}&width=${width}&height=${height}&density=${density}`, abortSignal);
	}

	public subscribeTasks(taskIds: number[]): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify({ type: 'subscribe', taskIds }));
		}
	}

	public unsubscribeTasks(taskIds: number[]): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify({ type: 'unsubscribe', taskIds }));
		}
	}

	public replaceSubscription(taskIds: number[]): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify({ type: 'replaceSubscription', taskIds }));
		}
	}

	public getTask(taskId: number): Promise<Task> {
		return this.httpRequest<Task>('GET', `/api/v1/tasks/${taskId}`);
	}

	public getTaskIndex(taskId: number): Promise<number> {
		return this.httpRequest<{ index: number }>('GET', `/api/v1/tasks/${taskId}/index`).then(r => r.index);
	}

	public getNotifications(): Promise<Notification[]> {
		return this.httpRequest<Notification[]>('GET', '/api/v1/system/notifications');
	}

	public getAVOptions(): Promise<any> {
		return this.httpRequest<any>('GET', '/api/v1/system/codecs');
	}

	// #endregion

	// #region 激活与缓存

	public activate(activationCode: string): Promise<string | false> {
		return this.httpRequest<string | false>('POST', '/api/v1/activation', { userInput: activationCode });
	}

	public getCacheInfo(needDelete: boolean): Promise<{ uploadCount: number, uploadSize: number, downloadCount: number, downloadSize: number }> {
		return this.httpRequest<{ uploadCount: number, uploadSize: number, downloadCount: number, downloadSize: number }>(
			needDelete ? 'DELETE' : 'GET',
			'/api/v1/cache'
		);
	}

	// #endregion

	// #region 服务器配置与用户管理

	public getServerSettings(): Promise<ServerSettingsData> {
		return this.httpRequest<ServerSettingsData>('GET', '/api/v1/settings/server');
	}

	public setServerSettings(settings: Partial<ServerSettingsData>): Promise<void> {
		return this.httpRequest<void>('PUT', '/api/v1/settings/server', settings);
	}

	public getUsers(): Promise<UserConfig[]> {
		return this.httpRequest<UserConfig[]>('GET', '/api/v1/settings/users');
	}

	public setUsers(users: UserConfig[]): Promise<void> {
		return this.httpRequest<void>('PUT', '/api/v1/settings/users', users);
	}

	// #endregion
}
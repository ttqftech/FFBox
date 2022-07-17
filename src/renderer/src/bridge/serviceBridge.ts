import { getTimeString, TypedEventEmitter } from '@common/utils';
import { FFBoxServiceEvent, FFBoxServiceEventApi, FFBoxServiceFunctionApi, FFBoxServiceInterface, OutputParams } from '@common/types';
import EventEmitter from 'events';

export interface ServeiceBridgeEvent {
	connected: () => void;
	disconnected: () => void;
	error: (event: Event) => void;
	message: (event: MessageEvent<any>) => void;
}

export class ServiceBridge extends (EventEmitter as new () => TypedEventEmitter<FFBoxServiceEvent & ServeiceBridgeEvent>) implements FFBoxServiceInterface {
	private ws: WebSocket | null;
	public ip: string;
	public port: number;
	private wsReady = false;

	constructor(ip: string, port: number) {
		super();
		this.ip = ip;
		this.port = port;
		this.ws = null;
		setTimeout(() => {
			this.connect();
		}, 0);
	}

	public connect(): void {
		console.log(`serviceBridge: 正在连接服务器 ws://${this.ip}:${this.port}/`);
		const ws = new WebSocket(`ws://${this.ip}:${this.port}/`);
		this.ws = ws;
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const 这 = this;
		ws.onopen = function (event) {
			console.log(`serviceBridge: ws://${这.ip}:${这.port}/ 服务器连接成功`, event);
			这.wsReady = true;
			这.emit('connected');
			这.getFFmpegVersion();

			setTimeout(() => {
				// 这.testSendBigPackage();	// test
			}, 4000);
		};
		ws.onclose = function (event) {
			这.wsReady = false;
			这.emit('disconnected');
		};
		ws.onerror = function (event) {
			console.log(`serviceBridge: ws://${这.ip}:${这.port}/ 服务器连接失败`, event);
			这.wsReady = false;
			这.emit('error', event);
		};
		ws.onmessage = function (event) {
			// console.log(`serviceBridge: ws://${这.ip}:${这.port}/ 服务器发来消息`, event);
			// 这.emit('message', event);
			这.handleWsEvents(event);
		};
	}

	public disconnect(): void {
		console.log(`serviceBridge: 正在断开服务器 ws://${this.ip}:${this.port}/`);
		this.wsReady = false;
		this.ws?.close();
		this.ws = null;
	}

	/**
	 * 接受 service 事件入口（来自 ws.onmessage）
	 */
	private handleWsEvents(event: MessageEvent<any>): void {
		const data: FFBoxServiceEventApi = JSON.parse(event.data);
		this.emit(data.event, data.payload as any);
	}

	/**
	 * UI 调用 service 网络出口
	 */
	private sendWs(data: FFBoxServiceFunctionApi): void {
		this.wsReady && this.ws?.send(JSON.stringify(data));
	}

	private testSendBigPackage(): void {
		console.log(getTimeString(new Date()), '发送大包');
		const array = new Float32Array(512);

		for (let i = 0; i < array.length; ++i) {
			array[i] = i;
		}

		this.ws?.send(array);
	}

	public initFFmpeg(): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'initFFmpeg',
			args: [],
		};
		this.sendWs(data);
	}

	public getFFmpegVersion(): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'getFFmpegVersion',
			args: [],
		};
		this.sendWs(data);
	}

	public taskAdd(fileBaseName: string, outputParams?: OutputParams): Promise<number> {
		return new Promise((resolve, reject) => {
			fetch(`http://${this.ip}:${this.port}/task/add`, {
				method: 'post',
				body: JSON.stringify({ fileBaseName, outputParams }),
				headers: new Headers({
					'Content-Type': 'application/json'
				}),
			}).then((response) => {
				response.text().then((text) => {
					const id = parseInt(text);
					resolve(id);
				});
			}).catch((err) => {
				reject(err);
			});
		});
	}

	public mergeUploaded(id: number, hashs: Array<string>): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'mergeUploaded',
			args: [id, hashs],
		};
		this.sendWs(data);
	}

	public taskDelete(id: number): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'taskDelete',
			args: [id],
		};
		this.sendWs(data);
	}

	public taskStart(id: number): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'taskStart',
			args: [id],
		};
		this.sendWs(data);
	}

	public taskPause(id: number, startFromBehind?: boolean): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'taskPause',
			args: [id, startFromBehind],
		};
		this.sendWs(data);
	}

	public taskResume(id: number): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'taskResume',
			args: [id],
		};
		this.sendWs(data);
	}

	public taskReset(id: number): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'taskReset',
			args: [id],
		};
		this.sendWs(data);
	}

	public getTaskList(): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'getTaskList',
			args: [],
		};
		this.sendWs(data);
	}

	public getTask(id: number): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'getTask',
			args: [id],
		};
		this.sendWs(data);
	}

	public queueAssign(startFrom?: number): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'queueAssign',
			args: [startFrom],
		};
		this.sendWs(data);
	}

	public queuePause(): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'queuePause',
			args: [],
		};
		this.sendWs(data);
	}

	public deleteNotification(taskId: number, index: number): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'deleteNotification',
			args: [taskId, index],
		};
		this.sendWs(data);
	}

	public setParameter(ids: Array<number>, param: OutputParams): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'setParameter',
			args: [ids, param],
		};
		this.sendWs(data);
	}

	public activate(machineCode: string, activationCode: string): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'activate',
			args: [machineCode, activationCode],
		};
		this.sendWs(data);
	}

	public trailLimit_stopTranscoding(id: number): void {
		const data: FFBoxServiceFunctionApi = {
			function: 'trailLimit_stopTranscoding',
			args: [id],
		};
		this.sendWs(data);
	}
}

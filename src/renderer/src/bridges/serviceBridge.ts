import { getTimeString, TypedEventEmitter } from '@common/utils';
import { FFBoxServiceEvent, FFBoxServiceEventApi, FFBoxServiceFunctionApi, FFBoxServiceInterface, OutputParams } from '@common/types';
import EventEmitter from 'events';

export interface ServeiceBridgeEvent {
	connected: () => void;
	disconnected: () => void;
	error: (event: Event) => void;
	message: (event: MessageEvent<any>) => void;
};

export enum ServiceBridgeStatus {
	Idle = 'Idle',
	Connecting = 'Connecting',
	Connected = 'Connected',
	Disconnected = 'Disconnected',
};

export class ServiceBridge extends (EventEmitter as new () => TypedEventEmitter<FFBoxServiceEvent & ServeiceBridgeEvent>) implements FFBoxServiceInterface {
	private ws: WebSocket | null = null;
	public ip: string;
	public port: number;
	public status = ServiceBridgeStatus.Idle;

	constructor(ip?: string, port?: number) {
		super();
		setTimeout(() => {
			if (ip && port) {
				this.connect(ip, port);
			}
		}, 0);
	}

	public connect(ip?: string, port?: number) {
		if (ip && port) {
			this.ip = ip;
			this.port = port;
		}
		console.log(`serviceBridge: 正在连接服务器 ws://${this.ip}:${this.port}/`);
		this.status = ServiceBridgeStatus.Connecting;
		let ws = new WebSocket(`ws://${this.ip}:${this.port}/`);
		this.ws = ws;
		let 这 = this;
		ws.onopen = function (event) {
			console.log(`serviceBridge: ws://${这.ip}:${这.port}/ 服务器连接成功`, event);
			这.status = ServiceBridgeStatus.Connected;
			这.emit('connected');
			这.getFFmpegVersion();

			setTimeout(() => {
				// 这.testSendBigPackage();	// test
			}, 4000);
		}
		ws.onclose = function (event) {
			这.status = ServiceBridgeStatus.Disconnected;
			这.emit('disconnected');
		}
		ws.onerror = function (event) {
			console.log(`serviceBridge: ws://${这.ip}:${这.port}/ 服务器连接失败`, event);
			这.status = ServiceBridgeStatus.Idle;
			这.emit('error', event);
		}
		ws.onmessage = function (event) {
			// console.log(`serviceBridge: ws://${这.ip}:${这.port}/ 服务器发来消息`, event);
			// 这.emit('message', event);
			这.handleWsEvents(event);
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
		let data: FFBoxServiceEventApi = JSON.parse(event.data);
		this.emit(data.event, data.payload as any);
	}

	/**
	 * UI 调用 service 网络出口
	 */
	private sendWs(data: FFBoxServiceFunctionApi) {
		this.status === ServiceBridgeStatus.Connected && this.ws?.send(JSON.stringify(data));
	}

	private testSendBigPackage() {
		console.log(getTimeString(new Date()), '发送大包');
		const array = new Float32Array(512);

		for (var i = 0; i < array.length; ++i) {
			array[i] = i;
		}
	  
		this.ws?.send(array);

	}

	public initFFmpeg() {
		let data: FFBoxServiceFunctionApi = {
			function: 'initFFmpeg',
			args: [],
		}
		this.sendWs(data);
	}

	public getFFmpegVersion() {
		let data: FFBoxServiceFunctionApi = {
			function: 'getFFmpegVersion',
			args: [],
		}
		this.sendWs(data);
	}

	public taskAdd(fileBaseName: string, outputParams?: OutputParams): Promise<number> {
		return new Promise((resolve, reject) => {
			fetch(`http://${this.ip}:${this.port}/task`, {
				method: 'put',
				body: JSON.stringify({ fileBaseName, outputParams }),
				headers: new Headers({
					'Content-Type': 'application/json'
				}),
			}).then((response) => {
				response.text().then((text) => {
					let id = parseInt(text);
					resolve(id);
				})
			}).catch((err) => {
				reject(err);
			})
		})
	}

	public mergeUploaded(id: number, hashs: Array<string>) {
		let data: FFBoxServiceFunctionApi = {
			function: 'mergeUploaded',
			args: [id, hashs],
		}
		this.sendWs(data);
	}

	public taskDelete(id: number) {
		let data: FFBoxServiceFunctionApi = {
			function: 'taskDelete',
			args: [id],
		}
		this.sendWs(data);
	}

	public taskStart(id: number) {
		let data: FFBoxServiceFunctionApi = {
			function: 'taskStart',
			args: [id],
		}
		this.sendWs(data);
	}

	public taskPause(id: number, startFromBehind?: boolean) {
		let data: FFBoxServiceFunctionApi = {
			function: 'taskPause',
			args: [id, startFromBehind],
		}
		this.sendWs(data);
	}

	public taskResume(id: number) {
		let data: FFBoxServiceFunctionApi = {
			function: 'taskResume',
			args: [id],
		}
		this.sendWs(data);
	}

	public taskReset(id: number) {
		let data: FFBoxServiceFunctionApi = {
			function: 'taskReset',
			args: [id],
		}
		this.sendWs(data);
	}

	public queueAssign(startFrom?: number) {
		let data: FFBoxServiceFunctionApi = {
			function: 'queueAssign',
			args: [startFrom],
		}
		this.sendWs(data);
	}

	public queuePause() {
		let data: FFBoxServiceFunctionApi = {
			function: 'queuePause',
			args: [],
		}
		this.sendWs(data);
	}

	public deleteNotification(notificationId: number) {
		let data: FFBoxServiceFunctionApi = {
			function: 'deleteNotification',
			args: [notificationId],
		}
		this.sendWs(data);
	}

	public setParameter(ids: Array<number>, param: OutputParams) {
		let data: FFBoxServiceFunctionApi = {
			function: 'setParameter',
			args: [ids, param],
		}
		this.sendWs(data);
	}

	public activate(machineCode: string, activationCode: string) {
		let data: FFBoxServiceFunctionApi = {
			function: 'activate',
			args: [machineCode, activationCode],
		}
		this.sendWs(data);
	}

	public trailLimit_stopTranscoding(id: number) {
		let data: FFBoxServiceFunctionApi = {
			function: 'trailLimit_stopTranscoding',
			args: [id],
		}
		this.sendWs(data);
	}
}

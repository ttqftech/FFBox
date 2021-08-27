import { TypedEventEmitter } from "@/common/utils";
import { FFBoxServiceEvent, FFBoxServiceEventApi, FFBoxServiceFunctionApi, FFBoxServiceInterface, OutputParams } from "@/types/types";
import EventEmitter from "events";

export interface ServeiceBridgeEvent {
	connected: () => void;
	disconnected: () => void;
	error: (event: Event) => void;
	message: (event: MessageEvent<any>) => void;
}

export class ServiceBridge extends (EventEmitter as new () => TypedEventEmitter<FFBoxServiceEvent & ServeiceBridgeEvent>) implements FFBoxServiceInterface {
	private ws: WebSocket | null;
	private ip: string;
	private port: number;
	private wsReady: boolean = false;

	constructor(ip: string, port: number) {
		super();
		this.ip = ip;
		this.port = port;
		this.ws = null;
		setTimeout(() => {
			this.connect();
		}, 0);
	}

	public connect() {
		console.log(`serviceBridge: 正在连接服务器 ws://${this.ip}:${this.port}/`);
		let ws = new WebSocket(`ws://${this.ip}:${this.port}/`);
		this.ws = ws;
		let 这 = this;
		ws.onopen = function (event) {
			console.log(`serviceBridge: ws://${这.ip}:${这.port}/ 服务器连接成功`, event);
			这.wsReady = true;
			这.emit('connected');
			这.getFFmpegVersion();
		}
		ws.onclose = function (event) {
			这.wsReady = false;
			这.emit('disconnected');
		}
		ws.onerror = function (event) {
			console.log(`serviceBridge: ws://${这.ip}:${这.port}/ 服务器连接失败`, event);
			这.wsReady = false;
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
		this.wsReady = false;
		this.ws?.close();
		this.ws = null;
	}

	private handleWsEvents(event: MessageEvent<any>) {
		let data: FFBoxServiceEventApi = JSON.parse(event.data);
		this.emit(data.event, data.payload as any);
	}

	private sendWs(data: FFBoxServiceFunctionApi) {
		this.wsReady && this.ws?.send(JSON.stringify(data));
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

	public taskAdd(filePath: string, fileName: string, outputParams?: OutputParams) {
		let data: FFBoxServiceFunctionApi = {
			function: 'taskAdd',
			args: [filePath, fileName, outputParams],
		}
		this.sendWs(data);
	}

	public getNewlyAddedTaskIds() {
		let data: FFBoxServiceFunctionApi = {
			function: 'getNewlyAddedTaskIds',
			args: [],
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

	public getTaskList() {
		let data: FFBoxServiceFunctionApi = {
			function: 'getTaskList',
			args: [],
		}
		this.sendWs(data);
	}

	public getTask(id: number) {
		let data: FFBoxServiceFunctionApi = {
			function: 'getTask',
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

	public deleteNotification(taskId: number, index: number) {
		let data: FFBoxServiceFunctionApi = {
			function: 'deleteNotification',
			args: [taskId, index],
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
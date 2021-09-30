import WebSocket from "ws";
import { FFBoxServiceEventApi, FFBoxServiceEventParam, FFBoxServiceFunctionApi } from "@/types/types";
import { FFBoxService } from "./FFBoxService";
import { getTimeString } from "@/common/utils";

let webSocket: typeof WebSocket | null;

let wss: WebSocket.Server | null;
let ffboxService: FFBoxService | null;

if (typeof window !== 'undefined') {
	webSocket = window.require('ws');
} else {
	webSocket = require('ws');
}

export default {
	init(self: FFBoxService) {
		ffboxService = self;
	},
	
	listen() {
		if (!webSocket) {
			console.warn('uiBridge: 非 electron 环境无法加载 WebSocket Server！');
			return
		}
		const 这 = this;
		wss = new webSocket.Server({ port: 33269 });
		console.log(getTimeString(new Date()), '开始监听端口 33269。')
		wss.on('connection', function (ws, request) {
			let address = request.socket.remoteAddress;
			console.log(getTimeString(new Date()), `新客户端接入：${address}。`);

			ws.on('message', function (message) {
				// console.log('uiBridge: 收到来自客户端的消息', message);
				这.handleMessageFromClient(message as string);
			});

			ws.on('close', function (code: number, reason: string) {
				console.log(getTimeString(new Date()), `客户端连接关闭：${address}。`, code, reason);
			});

			ws.on('error', function (err: Error) {
				console.log(getTimeString(new Date()), `客户端连接出错：${address}。`, err);
			});

			ws.on('open', function () {
				console.log(getTimeString(new Date()), `客户端连接打开：${address}。`);
			})
		});
		wss.on('error', function (error: Error) {
			console.log(getTimeString(new Date()), `服务器出错，建议检查防火墙。`, error);
			ffboxService!.emit('serverError', { error });
			wss = null;
		});
		wss.on('close', function () {
			ffboxService!.emit('serverClose');
			console.log(getTimeString(new Date()), `服务器关闭。`);
			wss = null;
		});
		setTimeout(() => {
			if (wss) {
				this.mountEventFromService();
				ffboxService!.emit('serverReady');
			}
		}, 0);
	},

	handleMessageFromClient(message: string) {
		if (!ffboxService) {
			throw new Error("uiBridge 使用前应 init()");
		}
		let data: FFBoxServiceFunctionApi = JSON.parse(message);
		let args = data.args;
		// @ts-ignore
		ffboxService[data.function](...args);
	},

	mountEventFromService() {
		if (!ffboxService || !wss) {
			throw new Error("uiBridge 使用前应 init()");
		}
		let eventsEnum: Array<keyof FFBoxServiceEventParam> = [
			'ffmpegVersion',
			'newlyAddedTaskIds',
			"workingStatusUpdate",
			"tasklistUpdate",
			"taskUpdate",
			"cmdUpdate",
			"progressUpdate",
			"taskNotification",
		]
		for (const event of eventsEnum) {
			ffboxService.on(event, (payload: FFBoxServiceEventParam[keyof FFBoxServiceEventParam]) => {
				for (const client of wss!.clients) {
					if (client.readyState === client.OPEN) {
						let data: FFBoxServiceEventApi = {
							event,
							payload,
						}
						client.send(JSON.stringify(data));
					}
				}
			})
		}
	}
}
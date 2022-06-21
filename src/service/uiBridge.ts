import Http from "http";
import WebSocket from "ws";
import Koa from "koa";
import Router from "koa-router";
import koaBody from "koa-body";
import koaStatic from "koa-static";
import koaMount from "koa-mount";
import formidable from "formidable";
import fs from "fs";
import os from "os"
import { FFBoxServiceEventApi, FFBoxServiceEventParam, FFBoxServiceFunctionApi } from "@/types/types";
import { FFBoxService } from "./FFBoxService";
import { getTimeString } from "@/common/utils";

// let koaBody = require('koa-body');

let server: Http.Server | null;
let koa: Koa | null;
let wss: WebSocket.Server | null;
let ffboxService: FFBoxService | null;

const uploadDir = os.tmpdir() + '/FFBoxUploadCache' // 文件上传目录
const downloadDir = os.tmpdir() + '/FFBoxDownloadCache' // 文件下载目录

const uiBridge = {
	init(self: FFBoxService) {
		ffboxService = self;
		const uploadDirCheck = new Promise((resolve) => {
			fs.access(uploadDir, fs.constants.F_OK, (err) => {
				return resolve(err ? false : true);
			});	
		})
		const downloadDirCheck = new Promise((resolve) => {
			fs.access(downloadDir, fs.constants.F_OK, (err) => {
				return resolve(err ? false : true);
			});	
		})
		Promise.all([uploadDirCheck, downloadDirCheck]).then((values) => {
			if (!values.every((value) => value)) {
				console.log(getTimeString(new Date()), `创建缓存文件夹`);
				fs.mkdir(uploadDir, () => {});
				fs.mkdir(downloadDir, () => {});	
			}
		});
	},
	
	listen() {
		koa = new Koa();

		// 初始化响应头和响应码
		koa.use(async (ctx, next) => {
			console.log(getTimeString(new Date()), '收到请求：', ctx.request.url);
			ctx.response.set('Access-Control-Allow-Origin', '*');
			ctx.response.set('Access-Control-Allow-Headers', 'Content-Type');
			if (ctx.request.method === 'OPTIONS') {
				ctx.response.status = 200;
				// ctx.response.message = '冇找到啊';
			}
			try {
				await next();
			} catch (err) {
				console.log(err);
			}
		});
		
		// 读取请求体，提取到 request.body 中
		koa.use(koaBody({
			multipart: true,
			formidable: {
				maxFileSize: 1024 ** 4,	// 设置上传文件大小最大限制为 1TiB，默认 2MB
				uploadDir
			}
		}));

		// 下载资源响应
		const staticServer = koaStatic(`${os.tmpdir()}/FFBoxDownloadCache`);
		koa.use(koaMount('/download', staticServer));
				
		// 路由
		const router = getRouter();
		koa.use(router.routes());

		server = Http.createServer(koa.callback());

		wss = new WebSocket.Server({ server });

		server.listen(33269);
		console.log(getTimeString(new Date()), '开始监听端口 33269。');

		// 挂载 WebSocket 服务器相关事件
		wss.on('connection', mountWebSocketEvents);
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
				mountEventFromService();
				ffboxService!.emit('serverReady');
			}
		}, 0);
	},

}

// #region 事件挂载区

/**
 * 对每个传入的 WebSocket 客户端连接挂载事件监听
 */
function mountWebSocketEvents(ws: WebSocket, request: Http.IncomingMessage) {
	let address = request.socket.remoteAddress;
	console.log(getTimeString(new Date()), `新客户端接入：${address}。`);

	ws.on('message', function (message: string | Buffer) {
		// console.log('uiBridge: 收到来自客户端的消息', message);
		if (typeof message === 'string') {
			handleMessageFromClient(message as string);
		}
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
}

/**
 * 接受 UI 事件入口（来自 ws.onmessage）
 */
function handleMessageFromClient(message: string) {
	if (!ffboxService) {
		throw new Error("uiBridge 使用前应 init()");
	}
	let data: FFBoxServiceFunctionApi = JSON.parse(message);
	let args = data.args;
	// @ts-ignore
	ffboxService[data.function](...args.map((value) => value === null ? undefined : value));
}

/**
 * 挂载 ffboxService 事件发送到 UI 的监听
 */
function mountEventFromService() {
	if (!ffboxService || !wss) {
		throw new Error("uiBridge 使用前应 init()");
	}
	let eventsEnum: Array<keyof FFBoxServiceEventParam> = [
		'ffmpegVersion',
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
					// console.log('将要发送 ws 信息', event, event === 'taskUpdate' ? [(payload as any).content.after.input.files, (payload as any).content.paraArray.join(' ')] : undefined);
					client.send(JSON.stringify(data));
				}
			}
		})
	}
}

// #endregion

// #region http request 服务区

/**
 * 网络文件添加说明
 * 1. addTask，文件路径留空，指示该文件未 ready，暂不调用 FFmpeg 读取信息
 * 2. 前端扫描整个文件 md5，/upload/check 检查文件是否已缓存，已缓存返回奇数
 * 3. 前端判断文件完整性，然后 /upload/file 上传文件（后端根据文件名信息判断是否已缓存，过滤非法请求）
 * 5. updateUploadProgress，上传过程中更新任务的进度
 * 4. mergeUploaded 文件上传完成后，前端发送 md5 列表和任务 id，后端更新任务信息然后 TaskUpdate
 */

function getRouter(): Router {
	let router = new Router();

	// 检查文件是否已缓存
	// 已缓存返回奇数
	router.post('/upload/check/', async function (ctx) {
		if (!ctx.request.body || !(ctx.request.body.hashs instanceof Array)) {
			// 非法请求
			ctx.response.status = 400;
			return;
		}
		// 暂定 body 里的属性只有一个 hashs: Array<string>，不写 ts 定义了
		console.log('检查文件', ctx.request.body);
		let hashs = ctx.request.body.hashs as Array<string>;
		let ret = [];
		for (const hash of hashs) {
			let filePath = uploadDir + '/' + hash;
			if (fs.existsSync(filePath)) {
				ret.push(Math.floor(Math.random() * (2 ** 31)) * 2 + 1);
			} else {
				ret.push(Math.floor(Math.random() * (2 ** 31)) * 2);
			}
		}
		ctx.response.status = 200;
		ctx.response.body = ret;
	})
	
	// 接收文件
	router.post('/upload/file', async function (ctx) {
		if (!ctx.request.files || !ctx.request.files.file/* || !(ctx.request.files instanceof formidable.File)*/) {
			// 非法请求
			ctx.response.status = 400;
			return;
		}
		let file = ctx.request.files.file as any as formidable.File;
		let body = ctx.request.body;
		console.log(getTimeString(new Date()), '收到文件', file.name);
		let destPath = uploadDir + '/' + body.name;
		try {
			fs.renameSync(file.path, destPath);
			console.log(getTimeString(new Date()), '文件已缓存至', destPath);
			ctx.response.status = 200;
		} catch (error) {
			console.error(getTimeString(new Date()), '文件重命名失败', error);
			ctx.response.status = 500;
		}
	});

	// 因为需要返回 id 所以特意改用 http request 实现的 taskAdd
	router.post('/task/add', async function (ctx) {
		if (!ctx.request.body) {
			// 非法请求
			ctx.response.status = 400;
			return;
		}
		let body = ctx.request.body;
		let result = await ffboxService!.taskAdd(body.fileBaseName, body.outputParams);
		ctx.response.status = 200;
		ctx.response.body = result;
	});

	return router;
}

// #endregion

export default uiBridge;
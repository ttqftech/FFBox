import Http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { PassThrough } from 'stream';
import Koa from 'koa';
import Router from 'koa-router';
import { koaBody } from 'koa-body';
import koaStatic from 'koa-static';
import koaMount from 'koa-mount';
// import formidable from 'formidable';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { FFBoxServiceEventApi, FFBoxServiceEventParam, OutputParams, CreateWebhookRequest, UpdateWebhookRequest, WsClientMessage, TaskStatus, Permission, UserConfig } from '@common/types';
import { version } from '@common/constants';
import { getSingleArgvValue, randomString, getTaskLatestOutputParams } from '@common/utils';
import localConfig from '@common/localConfig';
import { FFBoxService } from './FFBoxService';
import { getOs, log } from './utils';
import { webhookManager } from './webhookManager';
import { ControllableTransform } from './ControllableTransform';

interface Client {
	ws?: WebSocket;
	sessionId: string;
	username: string;
	permissions: Permission[];
	loginTime: number;
	subscribedTaskIds: Set<number>;
}

/**
 * 创建新会话（登录时调用），返回 sessionId
 */
function createSession(username: string, permissions: Permission[]): string {
	const sessionId = randomString(32);
	clients.set(sessionId, {
		sessionId,
		username,
		permissions,
		loginTime: Date.now(),
		subscribedTaskIds: new Set(),
	});
	return sessionId;
}

let server: Http.Server | null;
let koa: Koa | null;
let wss: WebSocket.Server | null;
let wssPreview: WebSocket.Server | null;  // 预览流 WebSocket
let clients = new Map<string, Client>();
let ffboxService: FFBoxService | null;

// 预览 WebSocket 会话管理
interface PreviewSession {
	ws: WebSocket;
	taskId: number;
	startTime: number;
	quality: 'H' | 'M' | 'L' | 'XL' | 'XXL';  // 画质等级
	ffmpeg: ReturnType<typeof spawn> | null;
	transform: ControllableTransform;
}
const previewSessions = new Map<string, PreviewSession>();

const uploadDir = os.tmpdir() + '/FFBoxUploadCache'; // 文件上传目录
const downloadDir = os.tmpdir() + '/FFBoxDownloadCache'; // 文件下载目录

// 任务状态中文名映射，供 /api/v1/tasks/summary 组装纯文本使用
const TASK_STATUS_CN: Record<string, string> = {
	deleted: '已删除',
	initializing: '初始化中',
	idle: '空闲',
	idle_queued: '排队开始',
	running: '运行中',
	paused: '已暂停',
	paused_queued: '排队继续',
	stopping: '正在停止',
	finishing: '正在完成',
	finished: '已完成',
	error: '已失败',
};

const uiBridge = {
	init(self: FFBoxService): void {
		ffboxService = self;
		const uploadDirCheck = new Promise((resolve) => {
			fs.access(uploadDir, fs.constants.F_OK, (err) => {
				return resolve(err ? false : true);
			});
		});
		const downloadDirCheck = new Promise((resolve) => {
			fs.access(downloadDir, fs.constants.F_OK, (err) => {
				return resolve(err ? false : true);
			});
		});
		Promise.all([uploadDirCheck, downloadDirCheck]).then((values) => {
			if (!values.every((value) => value)) {
				log.info('创建缓存文件夹', uploadDir, downloadDir);
				fs.mkdir(uploadDir, () => {});
				fs.mkdir(downloadDir, () => {});
			}
		});
		// koaBody({
		// 	multipart: true,
		// 	formidable: {
		// 		maxFileSize: 1024 ** 4, // 设置上传文件大小最大限制为 1TiB，默认 2MB
		// 		uploadDir,
		// 	},
		// });
	},

	listen(): void {
		koa = new Koa();

		// 初始化响应头和响应码
		koa.use(async (ctx, next) => {
			const authHeader = ctx.get('Authorization');
			const sessionId = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
		
			log.dev('收到请求', sessionId, ctx.request.method, ctx.request.url);
			ctx.response.set('Access-Control-Allow-Origin', '*');
			ctx.response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
			ctx.response.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
			ctx.response.set('Access-Control-Max-Age', '999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999');
			if (ctx.request.method === 'OPTIONS') {
				ctx.response.status = 204;
				// ctx.response.message = '多 9 余';
				return;	// 直接返回，不走后续逻辑
			}
			if (ctx.path.startsWith('/download')) {
				const fileBaseName = ctx.query.fileBaseName as string || path.basename(ctx.path);
				ctx.response.set('Content-Disposition', `attachment; filename="${encodeURI(fileBaseName)}`);
			}
			try {
				await next();
			} catch (err) {
				console.log(err);
				ctx.status = 500;
				ctx.body = { error: 'Internal Server Error' };
			}
		});

		// 读取请求体 - 添加错误处理捕获不可解析的请求
		koa.use(async (ctx, next) => {
			try {
				await koaBody({
					multipart: true,
					formidable: {
						maxFileSize: 1024 ** 4, // 设置上传文件大小最大限制为 1TiB，默认 2MB
						uploadDir,
					},
				})(ctx, next);
			} catch (err: any) {
				// 客户端发送了不可解析的数据，返回 400 Bad Request
				log.warn('请求体解析失败', err.message, ctx.request.url);
				ctx.status = 400;
				ctx.body = { error: 'Request body is invalid data' };
			}
		});

		// 下载资源响应
		const staticServer = koaStatic(`${os.tmpdir()}/FFBoxDownloadCache`);
		koa.use(koaMount('/download', staticServer));

		// 路由
		const router = getRouter();
		koa.use(router.routes());

		server = Http.createServer(koa.callback());

		// WebSocket 改为 noServer 模式，支持多个路径
		wss = new WebSocket.Server({ noServer: true });
		wssPreview = new WebSocket.Server({ noServer: true });

		// 手动处理 WebSocket 升级请求，根据路径分发
		server.on('upgrade', (request, socket, head) => {
			const pathname = new URL(request.url || '/', 'http://localhost').pathname;
			if (pathname === '/') {
				// 主 WebSocket（UI-Service 事件）
				wss!.handleUpgrade(request, socket, head, (ws) => {
					wss!.emit('connection', ws, request);
				});
			} else if (pathname === '/ws/preview') {
				// 预览流 WebSocket
				wssPreview!.handleUpgrade(request, socket, head, (ws) => {
					wssPreview!.emit('connection', ws, request);
				});
			} else {
				// 拒绝其他路径的 WebSocket 升级
				socket.destroy();
			}
		});

		const port = +(getSingleArgvValue('--port') || 33269);
		const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
		server.listen(port, '::');
		log.info(`HTTP/WebSocket 服务开始监听端口 ${port}。`);
		server.on('error', async (error: Error) => {
			const code = (error as NodeJS.ErrnoException).code;
			if (
				code === 'EADDRINUSE' ||
				code === 'EACCES' ||
				String(error).includes('address already in use')
			) {
				log.error('端口已占用，服务无法启动，请关闭占用端口的进程或服务。');
				// log.error(error);
				log.error('【进程即将退出】');
				await sleep(1000);
				process.exit(1);
			}
		});

		// 挂载主 WebSocket 服务器相关事件
		wss.on('connection', mountWebSocketEvents);
		wss.on('error', function (error: Error) {
			log.error('WebSocket 服务出错，建议检查防火墙。', error);
			ffboxService!.emit('serverError', { error });
			wss = null;
		});
		wss.on('close', function () {
			ffboxService!.emit('serverClose');
			log.info('WebSocket 服务关闭。');
			wss = null;
		});

		// 挂载预览 WebSocket 服务器相关事件
		wssPreview.on('connection', mountPreviewWebSocketEvents);
		wssPreview.on('error', function (error: Error) {
			log.error('预览 WebSocket 服务出错。', error);
			wssPreview = null;
		});
		wssPreview.on('close', function () {
			log.info('预览 WebSocket 服务关闭。');
			wssPreview = null;
		});

		setTimeout(() => {
			if (wss) {
				mountEventFromService();
				ffboxService!.emit('serverReady');
			}
		}, 0);
	},
};

// #region WebSocket 事件处理

/**
 * WebSocket 连接处理
 * 新流程：前端先通过 HTTP 登录获取 sessionId，然后建立 WebSocket 时在 URL query 中携带 sessionId
 */
function mountWebSocketEvents(ws: WebSocket, request: Http.IncomingMessage): void {
	const address = request.socket.remoteAddress;

	// 从 URL query 中获取 sessionId
	const url = new URL(request.url || '/', `http://localhost`);
	const sessionId = url.searchParams.get('sessionId');

	if (!sessionId) {
		log.warn(`客户端连接被拒绝：缺少 sessionId。地址：${address}`);
		ws.close(4001, 'Missing sessionId');
		return;
	}

	const client = clients.get(sessionId);
	if (!client) {
		log.warn(`客户端连接被拒绝：无效的 sessionId。地址：${address}`);
		ws.close(4001, 'Invalid sessionId');
		return;
	}

	// 检查是否已有该 sessionId 的 WebSocket 连接，如果有则断开旧连接
	if (client.ws) {
		debugger;
		log.info(`客户端重复连接，断开旧连接。sessionId：${sessionId}`);
		client.ws.close(4002, 'Replaced by new connection');
	}

	// 绑定 WebSocket 到已有会话
	client.ws = ws;
	client.subscribedTaskIds = new Set();
	log.info(`新客户端接入：${address}。sessionId：${sessionId}，用户：${client.username || '(匿名)'}。当前客户端数量：${clients.size}。`);

	// 处理客户端订阅消息
	ws.on('message', (rawData: Buffer) => {
		try {
			const message: WsClientMessage = JSON.parse(rawData.toString());
			switch (message.type) {
				case 'subscribe':
					for (const taskId of message.taskIds) {
						client.subscribedTaskIds.add(taskId);
					}
					break;
				case 'unsubscribe':
					for (const taskId of message.taskIds) {
						client.subscribedTaskIds.delete(taskId);
					}
					break;
				case 'replaceSubscription':
					client.subscribedTaskIds = new Set(message.taskIds);
					break;
			}
		} catch (e) {
			log.warn('WebSocket 消息解析失败', e);
		}
	});

	ws.on('close', function (code: number, reason: Buffer) {
		clients.delete(sessionId);
		log.info(`客户端连接关闭：${address}。当前客户端数量：${clients.size}。`, code, reason.toString());
		client.ws = undefined;
		client.subscribedTaskIds.clear();
	});
	ws.on('error', function (err: Error) {
		log.error(`客户端连接出错：${address}。`, err);
	});

	// 发送连接成功事件
	const data: FFBoxServiceEventApi = {
		event: 'connected',
		payload: { timestamp: Date.now() },
	};
	ws.send(JSON.stringify(data));
}

/**
 * 挂载 ffboxService 事件发送到 UI 的监听
 */
function mountEventFromService(): void {
	if (!ffboxService || !wss) {
		throw new Error('uiBridge 使用前应 init()');
	}

	// 全局事件：推送给所有客户端
	const globalEvents: Array<keyof FFBoxServiceEventParam> = [
		'ffmpegInfo',
		'workingStatusUpdate',
		'tasklistUpdate',
		'notificationUpdate',
		'asyncListUpdate',
	];
	for (const event of globalEvents) {
		ffboxService.on(event, (payload: FFBoxServiceEventParam[keyof FFBoxServiceEventParam]) => {
			for (const client of clients.values()) {
				if (client.ws?.readyState === WebSocket.OPEN) {
					const data: FFBoxServiceEventApi = {
						event,
						payload,
					};
					log.dev('触发信息：', data);
					client.ws.send(JSON.stringify(data));
				}
			}
		});
	}

	// 任务级事件：仅推送给订阅了对应 taskId 的客户端
	const taskScopedEvents: Array<keyof FFBoxServiceEventParam> = [
		'taskUpdate',
		'cmdUpdate',
		'progressUpdate',
	];
	for (const event of taskScopedEvents) {
		ffboxService.on(event, (payload: any) => {
			const taskId = payload.taskId;
			const data: FFBoxServiceEventApi = {
				event,
				payload,
			};
			const sendQueue = [];
			for (const client of clients.values()) {
				if (client.ws?.readyState === WebSocket.OPEN && client.subscribedTaskIds.has(taskId)) {
					sendQueue.push(client);
				}
			}
			log.dev('触发信息：', data, `将发送给 ${sendQueue.length} 个客户端`);
			for (const client of sendQueue) {
				client.ws!.send(JSON.stringify(data));
			}
		});
	}
}

// #endregion

// #region 预览 WebSocket 事件处理

/**
 * 预览 WebSocket 连接处理
 * 从 URL query 获取 taskId、startTime 和 quality，无需 sessionId 验证
 */
function mountPreviewWebSocketEvents(ws: WebSocket, request: Http.IncomingMessage): void {
	const address = request.socket.remoteAddress;

	// 从 URL query 获取参数
	const url = new URL(request.url || '/', 'http://localhost');
	const taskId = parseInt(url.searchParams.get('taskId') || '');
	const startTime = parseFloat(url.searchParams.get('startTime') || '0');
	const quality = (url.searchParams.get('quality') || 'H') as 'H' | 'M' | 'L' | 'XL';  // 默认高画质

	if (!ffboxService!.taskList.has(taskId)) {
		log.warn(`预览 WebSocket 连接被拒绝：无效 taskId。地址：${address}`);
		ws.close(4003, 'Invalid taskId');
		return;
	}

	const sessionId = `preview_${taskId}_${Date.now()}`;

	log.info(`预览 WebSocket 连接：${address}，taskId：${taskId}，startTime：${startTime}，quality：${quality}`);

	// 创建会话
	const session: PreviewSession = {
		ws,
		taskId,
		startTime,
		quality,
		ffmpeg: null,
		transform: new ControllableTransform({ highWaterMark: 1000 * 1000, batchMode: true }),  // 1MB 批次
	};
	previewSessions.set(sessionId, session);

	// WebSocket 消息处理
	ws.on('message', (data: Buffer) => {
		handlePreviewMessage(sessionId, session, data);
	});

	ws.on('close', () => {
		cleanupPreviewSession(sessionId);
		log.info(`预览 WebSocket 关闭：${address}`);
	});

	ws.on('error', (err: Error) => {
		log.error(`预览 WebSocket 错误：${address}`, err);
		cleanupPreviewSession(sessionId);
	});

	// 发送连接成功消息
	ws.send(JSON.stringify({
		type: 'connected',
		sessionId,
		taskId,
		startTime,
	}));
}

/**
 * 处理预览 WebSocket 消息
 */
function handlePreviewMessage(sessionId: string, session: PreviewSession, data: Buffer): void {
	try {
		const message = JSON.parse(data.toString());
		// log.dev('收到预览消息', message);

		switch (message.type) {
			case 'start':
				startPreviewStream(session, message.startTime ?? session.startTime);
				break;
			case 'stop':
				cleanupPreviewSession(sessionId);
				break;
			case 'ping':
				session.ws.send(JSON.stringify({ type: 'pong' }));
				break;
			case 'continue':
				// 步进模式：前端确认发送下一个 chunk
				session.transform.continueStream();
				break;
			default:
				log.warn('未知的预览消息类型', message.type);
		}
	} catch (e) {
		log.error('解析预览消息失败', e);
	}
}

/**
 * 根据画质等级和像素量计算 crf 值
 * H=18, M=24, L=30 (基准 1080p)
 * XL: crf=30 但分辨率减半
 * 像素量每提升到 4 倍，crf 加 3
 */
function calculateCrf(quality: 'H' | 'M' | 'L' | 'XL' | 'XXL', resolution: string): { crf: number; scale: number } {
	const baseCrfMap = { H: 18, M: 24, L: 30, XL: 30, XXL: 30 };
	const baseCrf = baseCrfMap[quality];

	// 从 resolution 字符串解析宽高（格式如 "1920x1080"）
	const match = resolution.match(/^(\d+)x(\d+)$/);
	const width = match ? parseInt(match[1]) : 1920;
	const height = match ? parseInt(match[2]) : 1080;
	const pixelCount = width * height;

	// XL 画质：分辨率减半；XXL 再减半
	const scale = quality === 'XXL' ? 0.25 : (quality === 'XL' ? 0.5 : 1);
	const effectivePixelCount = pixelCount * scale * scale;

	const basePixelCount = 1920 * 1080;
	// 像素量每提升到 4 倍，crf 加 3
	const ratio = effectivePixelCount / basePixelCount;
	const additionalCrf = Math.floor(Math.log2(ratio) / 2) * 3;  // log4(pixelRatio) * 3
	console.log('crf', baseCrf + additionalCrf, 'scale', scale);
	return { crf: baseCrf + additionalCrf, scale };
}

/**
 * 启动预览流
 */
function startPreviewStream(session: PreviewSession, startTime: number): void {
	const task = ffboxService!.taskList.getById(session.taskId);
	if (!task) {
		session.ws.send(JSON.stringify({
			type: 'error',
			message: 'Task not found',
		}));
		return;
	}

	const filePath = getTaskLatestOutputParams(task).input.files[0]?.filePath;
	if (!filePath) {
		session.ws.send(JSON.stringify({
			type: 'error',
			message: 'No input file',
		}));
		return;
	}

	const realFilePath = task.remoteTask
		? `${os.tmpdir()}/FFBoxUploadCache/${filePath}`
		: filePath;

	session.startTime = startTime;

	// 获取视频分辨率并计算 crf
	const resolution = task.before?.[0]?.streams?.[0]?.resolution || '1920x1080';
	const { crf, scale } = calculateCrf(session.quality, resolution);

	// FFmpeg 参数：输出 fragmented MP4（支持流式传输）
	const ffmpegArgs = [
		'-hwaccel', 'auto',
		'-ss', String(startTime),
		'-i', realFilePath,
		'-map', '0:v:0',
		'-c:v', 'libx264',
		'-preset', 'ultrafast',
		'-tune', 'zerolatency',
		'-crf', String(crf),
		...(scale !== 1 ? ['-vf', `scale=iw*${scale}:ih*${scale}`] : []),
		'-g', '1',  // 全关键帧
		'-movflags', '+frag_keyframe+empty_moov+default_base_moof',
		'-f', 'mp4',
		'-',
	];
	log.dev(`[任务 ${session.taskId}] 预览流 ffmpeg 启动`, (ffmpegArgs || []).join(', '));

	// 启动 FFmpeg
	session.ffmpeg = spawn(ffboxService!.ffmpegPath, ffmpegArgs);

	// 重置 Transform
	session.transform.reset();

	// 管道连接：FFmpeg.stdout -> Transform -> WebSocket
	session.ffmpeg.stdout!.pipe(session.transform);

	// Transform 输出到 WebSocket
	session.transform.on('data', (chunk: Buffer) => {
		if (session.ws.readyState === WebSocket.OPEN) {
			session.ws.send(chunk);  // 二进制数据
		}
	});

	session.transform.on('end', () => {
		if (session.ws.readyState === WebSocket.OPEN) {
			session.ws.send(JSON.stringify({ type: 'streamEnd' }));
		}
	});

	// session.ffmpeg.stderr.on('data', (data: Buffer) => {
	// 	log.dev('FFmpeg preview:', data.toString());
	// });

	session.ffmpeg.on('close', (code: number) => {
		log.dev('FFmpeg preview closed', code);
		session.ffmpeg = null;
	});

	session.ffmpeg.on('error', (err: Error) => {
		log.error('FFmpeg preview error', err);
		session.ws.send(JSON.stringify({
			type: 'error',
			message: err.message,
		}));
	});

	// 发送开始确认
	session.ws.send(JSON.stringify({
		type: 'started',
		startTime,
	}));
}

/**
 * 清理预览会话
 */
function cleanupPreviewSession(sessionId: string): void {
	const session = previewSessions.get(sessionId);
	if (!session) return;

	if (session.ffmpeg) {
		session.ffmpeg.kill();
		session.ffmpeg = null;
	}

	session.transform.reset();
	previewSessions.delete(sessionId);
}

// #endregion

// #region HTTP 路由

/**
 * 可选鉴权中间件
 * - 有 sessionId 时验证 sessionId
 * - 无 sessionId 时检查是否允许无密码访问
 */
async function optionalAuth(ctx: Koa.Context, next: () => Promise<void>): Promise<void> {
	const authHeader = ctx.get('Authorization');
	const sessionId = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

	if (sessionId) {
		const client = clients.get(sessionId);
		if (client) {
			ctx.state.session = client;
			await next();
			return;
		}
		ctx.status = 401;
		ctx.body = { error: 'Invalid session' };
		return;
	}

	async function isPasswordlessAllowed(): Promise<boolean> {
		const users = await ffboxService!.userManager.getUsers();
		const defaultAdmin = users?.find((u) => u.username === '');
		return !defaultAdmin || !defaultAdmin.passkey;
	}
	
	// 无 sessionId 时检查是否允许无密码访问
	if (await isPasswordlessAllowed()) {
		ctx.state.isAnonymous = true;
		await next();
		return;
	}

	ctx.status = 401;
	ctx.body = { error: 'Authentication required' };
}

/**
 * 权限检查中间件工厂
 */
function requirePermission(permission: Permission) {
	return async (ctx: Koa.Context, next: () => Promise<void>) => {
		const session = ctx.state.session as Client;
		if (!session) {
			ctx.status = 401;
			ctx.body = { error: 'Authentication required' };
			return;
		}
		if (!session.permissions.includes(permission)) {
			ctx.status = 403;
			ctx.body = { error: 'Permission denied' };
			return;
		}
		await next();
	};
}

function getRouter(): Router {
	const router = new Router();

	// #region 认证模块

	/**
	 * @openapi
	 * /api/v1/auth/login:
	 *   post:
	 *     summary: 用户登录
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               username:
	 *                 type: string
	 *               passkey:
	 *                 type: string
	 *                 description: SHA256 哈希后的密码
	 *     responses:
	 *       200:
	 *         description: 登录结果
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 isUserExist:
	 *                   type: boolean
	 *                 isSuccess:
	 *                   type: boolean
	 *                   description: 密码不正确则失败
	 *                 sessionId:
	 *                   type: string
	 *                 permissions:
	 *                   type: array
	 *                   items:
	 *                     type: string
	 *                   description: 用户权限列表。undefined/空表示未配置权限（全部开放）
	 */
	router.post('/api/v1/auth/login', async function (ctx) {
		if (!ctx.request.body) {
			ctx.status = 400;
			ctx.body = { error: 'Missing request body' };
			return;
		}

		const { username, passkey } = ctx.request.body;
		const users = await ffboxService!.userManager.getUsers();

		// 查找用户（空用户名匹配默认管理员）
		const user = users.find((u) => u.username === (username || ''));

		if (!user) {
			ctx.body = { isUserExist: false, isSuccess: false };
			return;
		}

		// 验证密码（空密码直接通过）
		if (!user.passkey || user.passkey === passkey) {
			const sessionId = createSession(user.username || '', user.permissions);
			ctx.body = {
				isUserExist: true,
				isSuccess: true,
				sessionId,
				permissions: user.permissions,
			};
		} else {
			ctx.body = { isUserExist: true, isSuccess: false };
		}
	});

	// #endregion

	// #region 任务管理模块

	/**
	 * @openapi
	 * /api/v1/tasks:
	 *   get:
	 *     summary: 任务区段查询
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: query
	 *         name: offset
	 *         schema:
	 *           type: integer
	 *           default: 0
	 *         description: 起始偏移
	 *       - in: query
	 *         name: size
	 *         schema:
	 *           type: integer
	 *           default: 100
	 *         description: 查询数量
	 *       - in: query
	 *         name: idOnly
	 *         schema:
	 *           type: boolean
	 *           default: false
	 *         description: 为 true 时只返回 taskIds 数组，不返回完整任务对象
	 *       - in: query
	 *         name: status
	 *         schema:
	 *           type: string
	 *           enum: [deleted, initializing, idle, idle_queued, running, paused, paused_queued, stopping, finishing, finished, error]
	 *         description: 按任务状态筛选，传入时忽略 offset/size，返回匹配该状态的所有任务 ID
	 *     responses:
	 *       200:
	 *         description: 任务列表（tasks 或 taskIds，取决于 idOnly 参数；指定 status 时始终返回 taskIds）
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 tasks:
	 *                   type: array
	 *                   items:
	 *                     $ref: '#/components/schemas/Task'
	 *                 taskIds:
	 *                   type: array
	 *                   items:
	 *                     type: integer
	 *                 totalCount:
	 *                   type: integer
	 */
	router.get('/api/v1/tasks', optionalAuth, async function (ctx) {
		const status = ctx.query.status as string | undefined;
		const totalCount = ffboxService!.taskList.count();
		// 按状态筛选模式
		if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
			const taskIds = ffboxService!.getTaskIdsByStatus(status as TaskStatus);
			ctx.body = { taskIds, totalCount };
			return;
		}
		const offset = parseInt(ctx.query.offset as string) || 0;
		const size = parseInt(ctx.query.size as string) || 0;
		const idOnly = ctx.query.idOnly === 'true';
		if (idOnly) {
			const taskIds = await ffboxService!.getTaskList(offset, size, true);
			ctx.body = { taskIds, totalCount };
		} else {
			const tasks = await ffboxService!.getTaskList(offset, size);
			ctx.body = { tasks, totalCount };
		}
	});

	/**
	 * @openapi
	 * /api/v1/tasks/summary:
	 *   get:
	 *     summary: 任务列表摘要（纯文本）
	 *     description: |
	 *       一次返回任务总数与各任务状态的统计信息，由后端组装为纯文本简介。
	 *       sampleSize 是「每种状态」最多展示的 id 数量：该状态任务数 ≤ sampleSize 时正常列出全部 id，否则显示「数量较多，将隐去 id」，
	 *       若任务总数超过 1000000，直接返回「任务数量过多」提示，不遍历、不返回具体结果。
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: query
	 *         name: sampleSize
	 *         schema:
	 *           type: integer
	 *           default: 50
	 *     responses:
	 *       200:
	 *         description: 任务列表摘要纯文本
	 *         content:
	 *           text/plain:
	 *             schema:
	 *               type: string
	 */
	router.get('/api/v1/tasks/summary', optionalAuth, async function (ctx) {
		const sampleSize = parseInt(ctx.query.sampleSize as string) || 50;
		const summary = ffboxService!.getTaskSummary(sampleSize + 1);
		if (summary.tooManyTasks) {
			ctx.body = `当前服务器任务数量过多（${summary.totalCount}），暂不支持汇总，请减少任务数量后再试。`;
			return;
		}
		const lines: string[] = [`当前服务器任务列表概览（共 ${summary.totalCount} 个任务）：`];
		for (const status of Object.values(TaskStatus)) {
			if (status === TaskStatus.deleted) continue;
			const stat = summary.statusStats[status];
			if (!stat || stat.count === 0) continue;
			const statusName = TASK_STATUS_CN[status] || status;
			if (stat.count > sampleSize) {
				lines.push(`${statusName}：${stat.count} 个任务（数量较多，将隐去 id）`);
			} else {
				const ids = stat.samples.map(s => s.id).join(', ');
				lines.push(`${statusName}：${stat.count} 个任务（id: ${ids}）`);
			}
		}
		ctx.body = lines.join('\n');
	});

	/**
	 * @openapi
	 * /api/v1/tasks/briefs:
	 *   post:
	 *     summary: 批量获取任务简介（按序号 indexes 或 taskId）
	 *     description: |
	 *       按 indexes（全局序号）或 taskIds 批量返回任务简介（taskId、taskName、status）。
	 *       用于 AI 工具按序号或按 id 查询任务的场景。
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               taskIndexes:
	 *                 type: array
	 *                 items:
	 *                   type: integer
	 *               taskIds:
	 *                 type: array
	 *                 items:
	 *                   type: integer
	 *     responses:
	 *       200:
	 *         description: 任务简介数组
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 type: object
	 */
	router.post('/api/v1/tasks/briefs', optionalAuth, async function (ctx) {
		const body = ctx.request.body || {};
		if (Array.isArray(body.taskIndexes)) {
			ctx.body = ffboxService!.getTaskBriefsByIndexes(body.taskIndexes);
		} else if (Array.isArray(body.taskIds)) {
			ctx.body = ffboxService!.getTaskBriefsByIds(body.taskIds);
		} else {
			ctx.status = 400;
			ctx.body = { error: '需要提供 taskIndexes 或 taskIds' };
		}
	});

	/**
	 * @openapi
	 * /api/v1/tasks:
	 *   post:
	 *     summary: 批量创建新任务
	 *     description: |
	 *       接收文件路径数组和输出参数模板，为每个路径创建一个任务。
	 *       当路径为 1 个时，完全使用前端的输出参数；当路径为多个时，对每个任务进行输入路径替换。
	 *       任务名称由后端从文件路径自动计算（去除扩展名）。
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [filePaths, outputParams]
	 *             properties:
	 *               filePaths:
	 *                 type: array
	 *                 items:
	 *                   type: string
	 *                 description: 文件路径数组，每个路径创建一个任务。路径为空字符串时使用默认名称
	 *               outputParams:
	 *                 $ref: '#/components/schemas/OutputParams'
	 *     responses:
	 *       200:
	 *         description: 返回新创建的任务 ID 数组
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 type: integer
	 *       400:
	 *         description: 请求参数错误
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	router.post('/api/v1/tasks', optionalAuth, async function (ctx) {
		if (!ctx.request.body) {
			ctx.status = 400;
			ctx.body = { error: 'Missing request body' };
			return;
		}
		const { outputParams, filePaths } = ctx.request.body;
		// 判断文件路径模式：有 FileSystem 权限直接使用原路径，否则使用上传/改写路径模式
		// 有 session 的用户：检查其权限
		// 匿名用户（允许无密码访问时）：默认继承管理员权限（包含 FileSystem）
		const session = ctx.state.session as Client | undefined;
		let useManagedFilePaths = true;
		if (session) {
			useManagedFilePaths = !session.permissions.includes(Permission.FileSystem);
		} else if (ctx.state.isAnonymous) {
			// 匿名用户允许无密码访问 = 视为默认管理员（含 FileSystem 权限），直接使用原路径
			useManagedFilePaths = false;
		}
		if (!Array.isArray(filePaths) || !filePaths.every((p: any) => typeof p === 'string')) {
			ctx.status = 400;
			ctx.body = { error: 'filePaths must be an array of strings' };
			return;
		}
		if (!outputParams || typeof outputParams !== 'object') {
			ctx.status = 400;
			ctx.body = { error: 'outputParams is required' };
			return;
		}
		const result = await ffboxService!.taskAddBatch(filePaths, outputParams, useManagedFilePaths);
		ctx.body = result;
	});

	/**
	 * @openapi
	 * /api/v1/tasks/{id}/copy:
	 *   post:
	 *     summary: 复制已有任务，支持指定份数
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: 源任务 ID
	 *     requestBody:
	 *       required: false
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               count:
	 *                 type: integer
	 *                 minimum: 1
	 *                 default: 1
	 *                 description: 复制份数
	 *     responses:
	 *       200:
	 *         description: 返回当前任务列表数量
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: integer
	 *       400:
	 *         description: 请求参数错误
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       404:
	 *         description: 源任务不存在
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	router.post('/api/v1/tasks/:id/copy', optionalAuth, async function (ctx) {
		const id = parseInt(ctx.params.id);
		if (isNaN(id)) {
			ctx.status = 400;
			ctx.body = { error: 'Invalid task id' };
			return;
		}
		const count = ctx.request.body?.count ?? 1;
		if (typeof count !== 'number' || count < 1 || !Number.isInteger(count)) {
			ctx.status = 400;
			ctx.body = { error: 'count must be a positive integer' };
			return;
		}
		const task = ffboxService!.taskList.getById(id);
		if (!task) {
			ctx.status = 404;
			ctx.body = { error: `Task ${id} not found` };
			return;
		}
		await ffboxService!.taskCopy(id, count);
		ctx.body = ffboxService!.taskList.count();
	});

	/**
	 * @openapi
	 * /api/v1/tasks/{id}:
	 *   get:
	 *     summary: 获取单个任务详情
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *     responses:
	 *       200:
	 *         description: 任务详情
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Task'
	 *       400:
	 *         description: 任务未找到
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	router.get('/api/v1/tasks/:id', optionalAuth, async function (ctx) {
		const task = ffboxService!.taskList.getById(+ctx.params.id);
		if (!task) {
			ctx.status = 400;
			ctx.body = { error: 'Task not found' };
			return;
		}
		ctx.body = task;
	});

	/**
	 * @openapi
	 * /api/v1/tasks/{id}/index:
	 *   get:
	 *     summary: 查询任务的全局序号（通过 id 查 index）
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *     responses:
	 *       200:
	 *         description: 任务的全局序号
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 index:
	 *                   type: integer
	 *                   nullable: true
	 *                   description: 任务的全局序号，任务不存在时返回 null
	 */
	router.get('/api/v1/tasks/:id/index', optionalAuth, async function (ctx) {
		const index = ffboxService!.taskList.getIndexById(+ctx.params.id);
		ctx.body = { index: index === -1 ? null : index };
	});

	/**
	 * @openapi
	 * /api/v1/tasks/delete:
	 *   post:
	 *     summary: 批量删除任务
	 *     description: 【initializing / idle / idle_queued / finished / error】 => 【deleted】
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [ids]
	 *             properties:
	 *               ids:
	 *                 type: array
	 *                 items:
	 *                   type: integer
	 *                 description: 任务 ID 数组
	 *     responses:
	 *       200:
	 *         description: 删除成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.post('/api/v1/tasks/delete', optionalAuth, async function (ctx) {
		if (!ctx.request.body || !Array.isArray(ctx.request.body.ids)) {
			ctx.status = 400;
			ctx.body = { error: 'ids must be an array' };
			return;
		}
		ffboxService!.taskDeleteBatch(ctx.request.body.ids);
		ctx.body = { success: true };
	});

	/**
	 * @openapi
	 * /api/v1/tasks/start:
	 *   post:
	 *     summary: 批量启动任务
	 *     description: 【idle / idle_queued / error】 => 【running】 => 【finished / error】
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [ids]
	 *             properties:
	 *               ids:
	 *                 type: array
	 *                 items:
	 *                   type: integer
	 *                 description: 任务 ID 数组
	 *     responses:
	 *       200:
	 *         description: 启动成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.post('/api/v1/tasks/start', optionalAuth, async function (ctx) {
		if (!ctx.request.body || !Array.isArray(ctx.request.body.ids)) {
			ctx.status = 400;
			ctx.body = { error: 'ids must be an array' };
			return;
		}
		ffboxService!.taskStartBatch(ctx.request.body.ids);
		ctx.body = { success: true };
	});

	/**
	 * @openapi
	 * /api/v1/tasks/ready:
	 *   post:
	 *     summary: 批量准备任务（加入队列）
	 *     description: 将任务进入排队状态（不会启动调度系统改变当前的执行/暂停状态）\n【idle / paused】 => 【idle_queued / paused_queued】 => 【running】
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [ids]
	 *             properties:
	 *               ids:
	 *                 type: array
	 *                 items:
	 *                   type: integer
	 *                 description: 任务 ID 数组
	 *     responses:
	 *       200:
	 *         description: 操作成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.post('/api/v1/tasks/ready', optionalAuth, async function (ctx) {
		if (!ctx.request.body || !Array.isArray(ctx.request.body.ids)) {
			ctx.status = 400;
			ctx.body = { error: 'ids must be an array' };
			return;
		}
		ffboxService!.taskReadyBatch(ctx.request.body.ids);
		ctx.body = { success: true };
	});

	/**
	 * @openapi
	 * /api/v1/tasks/pause:
	 *   post:
	 *     summary: 批量暂停任务
	 *     description: 暂停任务\n【running / paused_queued】 => 【paused】
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [ids]
	 *             properties:
	 *               ids:
	 *                 type: array
	 *                 items:
	 *                   type: integer
	 *                 description: 任务 ID 数组
	 *     responses:
	 *       200:
	 *         description: 暂停成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.post('/api/v1/tasks/pause', optionalAuth, async function (ctx) {
		if (!ctx.request.body || !Array.isArray(ctx.request.body.ids)) {
			ctx.status = 400;
			ctx.body = { error: 'ids must be an array' };
			return;
		}
		ffboxService!.taskPauseBatch(ctx.request.body.ids);
		ctx.body = { success: true };
	});

	/**
	 * @openapi
	 * /api/v1/tasks/resume:
	 *   post:
	 *     summary: 批量继续执行任务
	 *     description: 【paused / paused_queued】 => 【running】
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [ids]
	 *             properties:
	 *               ids:
	 *                 type: array
	 *                 items:
	 *                   type: integer
	 *                 description: 任务 ID 数组
	 *     responses:
	 *       200:
	 *         description: 恢复成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.post('/api/v1/tasks/resume', optionalAuth, async function (ctx) {
		if (!ctx.request.body || !Array.isArray(ctx.request.body.ids)) {
			ctx.status = 400;
			ctx.body = { error: 'ids must be an array' };
			return;
		}
		ffboxService!.taskResumeBatch(ctx.request.body.ids);
		ctx.body = { success: true };
	});

	/**
	 * @openapi
	 * /api/v1/tasks/reset:
	 *   post:
	 *     summary: 批量重置任务
	 *     description: 重置任务（收尾/强行，根据状态决定） 【paused / paused_queued / stopping / finished / error】 => 【idle】
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [ids]
	 *             properties:
	 *               ids:
	 *                 type: array
	 *                 items:
	 *                   type: integer
	 *                 description: 任务 ID 数组
	 *     responses:
	 *       200:
	 *         description: 重置成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.post('/api/v1/tasks/reset', optionalAuth, async function (ctx) {
		if (!ctx.request.body || !Array.isArray(ctx.request.body.ids)) {
			ctx.status = 400;
			ctx.body = { error: 'ids must be an array' };
			return;
		}
		await ffboxService!.taskResetBatch(ctx.request.body.ids);
		ctx.body = { success: true };
	});

	/**
	 * @openapi
	 * /api/v1/tasks/parameters:
	 *   put:
	 *     summary: 设置任务参数
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               ids:
	 *                 type: array
	 *                 items:
	 *                   type: integer
	 *               params:
	 *                 type: array
	 *                 items:
	 *                   $ref: '#/components/schemas/OutputParams'
	 *     responses:
	 *       200:
	 *         description: 设置成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.put('/api/v1/tasks/parameters', optionalAuth, async function (ctx) {
		if (!ctx.request.body) {
			ctx.status = 400;
			ctx.body = { error: 'Missing request body' };
			return;
		}
		const { ids, params, fullyReplace } = ctx.request.body;
		ffboxService!.setParameters(ids, params, fullyReplace);
		ctx.body = { success: true };
	});

	/**
	 * @openapi
	 * /api/v1/tasks/output-files:
	 *   post:
	 *     summary: 批量获取任务的输出文件信息（用于批量下载）
	 *     description: 接收任务 ID 和可选的 runIndex 列表，返回每个任务的输出文件路径和参数。runIndex 未指定时默认取最后一个 run。
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               taskRunEntries:
	 *                 type: array
	 *                 items:
	 *                   type: object
	 *                   properties:
	 *                     taskId:
	 *                       type: integer
	 *                     runIndex:
	 *                       type: integer
	 *     responses:
	 *       200:
	 *         description: 输出文件信息列表
	 */
	router.post('/api/v1/tasks/output-files', optionalAuth, async function (ctx) {
		if (!ctx.request.body) {
			ctx.status = 400;
			ctx.body = { error: 'Missing request body' };
			return;
		}
		const { taskRunEntries } = ctx.request.body;
		if (!Array.isArray(taskRunEntries)) {
			ctx.status = 400;
			ctx.body = { error: 'taskRunEntries must be an array' };
			return;
		}
		ctx.body = await ffboxService!.getTaskOutputFiles(taskRunEntries);
	});

	/**
	 * @openapi
	 * /api/v1/tasks/{id}/merge-upload:
	 *   post:
	 *     summary: 合并上传的文件
	 *     description: 对于远程文件，上传完成后调用此函数合并文件\n前端无论检查到已缓存还是未缓存都使用相同的参数调用。前端和后端各自判断文件是否已上传过。若使用过，前端不再上传，后端不再进行分片读取合并
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               hashs:
	 *                 type: array
	 *                 items:
	 *                   type: string
	 *               fileBaseName:
	 *                 type: string
	 *                 description: 文件名参数不包含 hash，仅用于作为 input.files[].filePath 最终文件名的一部分供用户识别。相同 hash 但文件名不同的话，服务器会保留多份
	 *               inputName:
	 *                 type: string
	 *                 description: 在新建任务上传文件之前，或添加输入文件上传之前，hash 尚未得知，因此前端应发起修改输入参数的调用，生成这个上传文件的一个临时占位符。上传完毕后，往 inputName 传入生成的占位符，以便后端将其替换为真实文件名
	 *               fileTime:
	 *                 type: object
	 *     responses:
	 *       200:
	 *         description: 合并成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.post('/api/v1/tasks/:id/merge-upload', optionalAuth, async function (ctx) {
		if (!ctx.request.body) {
			ctx.status = 400;
			ctx.body = { error: 'Missing request body' };
			return;
		}
		const { hashs, fileBaseName, inputName, fileTime } = ctx.request.body;
		await ffboxService!.mergeUploaded(+ctx.params.id, hashs, fileBaseName, inputName, fileTime);
		ctx.body = { success: true };
	});

	/**
	 * @openapi
	 * /api/v1/tasks/{id}/upload-status:
	 *   put:
	 *     summary: 设置上传状态
	 *     description: 切换任务状态的初始化或待命状态\n如果设置为完成，还会进行一次 getFileMetadata
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               isUploading:
	 *                 type: boolean
	 *     responses:
	 *       200:
	 *         description: 设置成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.put('/api/v1/tasks/:id/upload-status', optionalAuth, async function (ctx) {
		if (!ctx.request.body) {
			ctx.status = 400;
			ctx.body = { error: 'Missing request body' };
			return;
		}
		const { isUploading } = ctx.request.body;
		ffboxService!.setUploadStatus(+ctx.params.id, isUploading);
		ctx.body = { success: true };
	});

	/**
	 * 此接口无需进行 openapi 定义
	 */
	router.post('/api/v1/tasks/:id/stop', optionalAuth, async function (ctx) {
		if (!ctx.request.body) {
			ctx.status = 400;
			ctx.body = { error: 'Missing request body' };
			return;
		}
		const { reason } = ctx.request.body;
		ffboxService!.trailLimit_stopTranscoding(+ctx.params.id, reason, true);
		ctx.body = { success: true };
	});

	/**
	 * @openapi
	 * /api/v1/tasks/{id}/frame-info:
	 *   post:
	 *     summary: 扫描视频帧信息
	 *     description: 扫描指定视频流的帧信息，等待扫描完成后返回帧数据数组
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               fileIndex:
	 *                 type: integer
	 *                 description: 输入文件索引
	 *               videoStreamIndex:
	 *                 type: integer
	 *                 description: 视频流索引（第 n 个 type 为 video 的 stream）
	 *               type:
	 *                 type: string
	 *                 enum: [fast, full, stop]
	 *                 default: fast
	 *                 description: 扫描类型
	 *     responses:
	 *       200:
	 *         description: 帧扫描完成，返回帧数据数组
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 type: object
	 *                 properties:
	 *                   n:
	 *                     type: integer
	 *                     description: 帧号
	 *                   pts:
	 *                     type: number
	 *                     description: 时间戳（ffprobe 快速扫描不提供）
	 *                   pts_time:
	 *                     type: number
	 *                     description: 换算为秒的时间戳
	 *                   type:
	 *                     type: string
	 *                     enum: [I, P, B]
	 *                     description: 帧类型
	 *                   mean:
	 *                     type: array
	 *                     items:
	 *                       type: number
	 *                     description: YUV 平均值（可能是 2 或 3 个数字，ffprobe 快速扫描不提供）
	 *                   stdev:
	 *                     type: array
	 *                     items:
	 *                       type: number
	 *                     description: YUV 标准差（可能是 2 或 3 个数字，ffprobe 快速扫描不提供）
	 *       400:
	 *         description: 请求参数缺失/任务或输入文件不存在
	 */
	router.post('/api/v1/tasks/:id/frame-info', optionalAuth, async function (ctx) {
		if (!ctx.request.body) {
			ctx.status = 400;
			ctx.body = { error: 'Missing request body' };
			return;
		}
		const { fileIndex, videoStreamIndex, type } = ctx.request.body;
		if (fileIndex === undefined || videoStreamIndex === undefined) {
			ctx.status = 400;
			ctx.body = { error: 'Missing fileIndex or videoStreamIndex' };
			return;
		}
		const task = ffboxService!.taskList.getById(+ctx.params.id);
		if (!task) {
			ctx.status = 400;
			ctx.body = { error: 'Task not found' };
			return;
		}

		try {
			const frames = await ffboxService!.getMediaFrameInfo(+ctx.params.id, fileIndex, videoStreamIndex, type);
			ctx.body = frames;
		} catch (errorCode) {
			ctx.body = { status: 500, errorCode };
		}
	});

	/**
	 * @openapi
	 * /api/v1/tasks/{id}/thumbnail-stream:
	 *   get:
	 *     summary: 获取视频缩略图流
	 *     description: 生成视频关键帧缩略图的 MP4 流，使用 MSE 兼容的分片格式
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: 任务 ID
	 *       - in: query
	 *         name: fileIndex
	 *         schema:
	 *           type: integer
	 *         description: 输入文件索引
	 *       - in: query
	 *         name: videoStreamIndex
	 *         schema:
	 *           type: integer
	 *         description: 视频流索引（第 n 个 type 为 video 的 stream）
	 *       - in: query
	 *         name: width
	 *         schema:
	 *           type: integer
	 *           default: 768
	 *         description: 缩略图宽度（最大 768，会自动等比缩放）
	 *       - in: query
	 *         name: height
	 *         schema:
	 *           type: integer
	 *           default: 768
	 *         description: 缩略图高度（最大 768，会自动等比缩放）
	 *       - in: query
	 *         name: density
	 *         schema:
	 *           type: string
	 *           enum: [M, H]
	 *           default: M
	 *         description: 缩略图间隔模式（'H' 高密度模式，'M' 中等密度模式）
	 *     responses:
	 *       200:
	 *         description: MP4 视频流
	 *         content:
	 *           video/mp4:
	 *             schema:
	 *               type: string
	 *               format: binary
	 *       400:
	 *         description: 任务不存在或没有输入文件
	 */

	router.get('/api/v1/tasks/:id/thumbnail-stream', optionalAuth, async function (ctx) {
		const width = parseInt(ctx.query.width as string) || undefined;
		const height = parseInt(ctx.query.height as string) || undefined;
		const density = ctx.query.density === 'H' ? 'H' : 'M';

		try {
			const { stream, contentType } = await ffboxService!.getThumbnailStream(+ctx.params.id, +(ctx.query.fileIndex || ''), +(ctx.query.videoStreamIndex || ''), width, height, density);

			// 监听客户端断开连接事件
			ctx.req.on('close', () => {
				if (stream && !stream.destroyed) {
					stream.destroy();
				}
			});

			ctx.set('Content-Type', contentType);
			// ctx.set('Cache-Control', 'no-cache');
			ctx.body = stream;

		} catch (error: any) {
			log.error('缩略图流获取失败', error);
			ctx.status = 500;
			ctx.body = { error: error.message || 'Thumbnail generation failed' };
		}
	});
	// #endregion

	// #region 队列管理模块

	/**
	 * @openapi
	 * /api/v1/queue/start:
	 *   post:
	 *     summary: 启动队列
	 *     description: 首先将【空闲_已排队】【已暂停_已排队】的任务启动，然后将所有【空闲】【已暂停】的任务进入【空闲_已排队】【已暂停_已排队】状态，再次进行任务安排\n也就是优先启动已排队的任务，再将空闲任务加入排队
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: 启动成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.post('/api/v1/queue/start', optionalAuth, async function (ctx) {
		ffboxService!.queueStart();
		ctx.body = { success: true };
	});

	/**
	 * @openapi
	 * /api/v1/queue/pause:
	 *   post:
	 *     summary: 暂停队列
	 *     description: 暂停处理队列，将所有【正在运行】的任务暂停、【空闲_已排队】的任务重置
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: 暂停成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.post('/api/v1/queue/pause', optionalAuth, async function (ctx) {
		ffboxService!.queuePause();
		ctx.body = { success: true };
	});

	// #endregion

	// #region 系统信息模块

	/**
	 * @openapi
	 * /api/v1/system/version:
	 *   get:
	 *     summary: 获取 FFBoxService 版本号
	 *     responses:
	 *       200:
	 *         description: 版本号
	 *         content:
	 *           text/plain:
	 *             schema:
	 *               type: string
	 */
	router.get('/api/v1/system/version', async function (ctx) {
		ctx.body = version;
	});

	/**
	 * @openapi
	 * /api/v1/system/properties:
	 *   get:
	 *     summary: 获取系统属性信息
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: 系统属性
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 os:
	 *                   type: string
	 *                 isSandboxed:
	 *                   type: boolean
	 *                 machineId:
	 *                   type: string
	 *                 functionLevel:
	 *                   type: integer
	 *                 ffmpegInfo:
	 *                   $ref: '#/components/schemas/FFmpegInfo'
	 */
	router.get('/api/v1/system/properties', optionalAuth, async function (ctx) {
		ctx.body = {
			os: getOs(),
			isSandboxed: process.cwd() === '/',
			machineId: ffboxService!.machineId,
			functionLevel: ffboxService!.functionLevel,
			ffmpegInfo: ffboxService!.ffmpegInfo,
		};
	});

	/**
	 * @openapi
	 * /api/v1/system/codecs:
	 *   get:
	 *     summary: 获取已缓存的 ffmpeg 编解码器信息
	 *     description: 如果未扫描并缓存，或者想要刷新，可通过更新服务器配置中的 ffmpeg 路径的方法触发扫描
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: 编解码器、复用器、滤镜列表
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 codecs:
	 *                   type: array
	 *                   items:
	 *                     $ref: '#/components/schemas/FFmpegCodecDetail'
	 *                 formats:
	 *                   type: array
	 *                   items:
	 *                     $ref: '#/components/schemas/FFmpegMuxerDetail'
	 *                 filters:
	 *                   type: array
	 *                   items:
	 *                     $ref: '#/components/schemas/FFmpegFilterDetail'
	 */
	router.get('/api/v1/system/codecs', optionalAuth, async function (ctx) {
		ctx.body = {
			codecs: ffboxService!.ffmpegCodecs,
			formats: ffboxService!.ffmpegFormats,
			filters: ffboxService!.ffmpegFilters,
		};
	});

	/**
	 * @openapi
	 * /api/v1/system/working-status:
	 *   get:
	 *     summary: 获取工作状态与总进度
	 *     description: 返回当前队列的工作状态（idle / running）和总进度 [0, 1]，队列停止时 progress 为 -1
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: 工作状态与总进度
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 workingStatus:
	 *                   type: string
	 *                   enum: [idle, running]
	 *                 progress:
	 *                   type: number
	 *                   minimum: -1
	 *                   maximum: 1
	 */
	router.get('/api/v1/system/working-status', optionalAuth, async function (ctx) {
		ctx.body = ffboxService!.getWorkingStatusInfo();
	});

	/**
	 * @openapi
	 * /api/v1/system/notifications:
	 *   get:
	 *     summary: 获取通知列表
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: 通知列表
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 $ref: '#/components/schemas/Notification'
	 */
	router.get('/api/v1/system/notifications', optionalAuth, async function (ctx) {
		ctx.body = ffboxService!.notifications;
	});

	/**
	 * @openapi
	 * /api/v1/system/notifications/{id}:
	 *   delete:
	 *     summary: 删除通知
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *     responses:
	 *       200:
	 *         description: 删除成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.delete('/api/v1/system/notifications/:id', optionalAuth, async function (ctx) {
		ffboxService!.deleteNotification(+ctx.params.id);
		ctx.body = { success: true };
	});

	/**
	 * @openapi
	 * /api/v1/system/settings/reload:
	 *   post:
	 *     summary: 重新加载服务器配置
	 *     description: 从本地存储初始化设置
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: 重载成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.post('/api/v1/system/settings/reload', optionalAuth, requirePermission(Permission.ServerSettings), async function (ctx) {
		await ffboxService!.initSettings();
		ctx.body = { success: true };
	});

	// #endregion

	// #region 服务器配置与用户管理模块

	/**
	 * @openapi
	 * /api/v1/settings/server:
	 *   get:
	 *     summary: 获取服务器配置
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: 服务器配置
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ServerSettingsData'
	 */
	router.get('/api/v1/settings/server', optionalAuth, async function (ctx) {
		const settings = ffboxService!.settings.get();
		ctx.body = settings;
	});

	/**
	 * @openapi
	 * /api/v1/settings/server:
	 *   put:
	 *     summary: 更新服务器配置
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/ServerSettingsData'
	 *     responses:
	 *       200:
	 *         description: 更新成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       403:
	 *         description: 权限不足
	 */
	router.put('/api/v1/settings/server', optionalAuth, requirePermission(Permission.ServerSettings), async function (ctx) {
		if (!ctx.request.body) {
			ctx.status = 400;
			ctx.body = { error: 'Missing request body' };
			return;
		}
		await ffboxService!.settings.setSettings(ctx.request.body);
		await ffboxService!.initSettings();
		ctx.body = { success: true };
	});

	/**
	 * @openapi
	 * /api/v1/settings/users:
	 *   get:
	 *     summary: 获取用户列表
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: 用户列表
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 $ref: '#/components/schemas/UserConfig'
	 */
	router.get('/api/v1/settings/users', optionalAuth, async function (ctx) {
		const users = await ffboxService!.userManager.getUsers();
		ctx.body = users;
	});

	/**
	 * @openapi
	 * /api/v1/settings/users:
	 *   put:
	 *     summary: 更新用户列表
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: array
	 *             items:
	 *               $ref: '#/components/schemas/UserConfig'
	 *     responses:
	 *       200:
	 *         description: 更新成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 *       400:
	 *         description: 请求参数错误（必须包含管理员账号）
	 *       403:
	 *         description: 权限不足
	 */
	router.put('/api/v1/settings/users', optionalAuth, requirePermission(Permission.UserManagement), async function (ctx) {
		if (!ctx.request.body || !Array.isArray(ctx.request.body)) {
			ctx.status = 400;
			ctx.body = { error: 'Request body must be an array of UserConfig' };
			return;
		}
		const users = ctx.request.body as UserConfig[];
		// 必须包含管理员账号（username 为空字符串）
		if (!users.some((u) => u.username === '')) {
			ctx.status = 400;
			ctx.body = { error: 'Must include admin user (username: "")' };
			return;
		}
		await ffboxService!.userManager.setUsers(users);
		ctx.body = { success: true };
	});

	// #endregion

	// #region 文件传输模块（下载不走此处路由）

	/**
	 * @openapi
	 * /api/v1/upload/check:
	 *   post:
	 *     summary: 批量检查给定 hash 的文件是否已缓存
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               hashs:
	 *                 type: array
	 *                 description: 要检查的文件 hash 数组
	 *                 items:
	 *                   type: string
	 *     responses:
	 *       200:
	 *         description: 检查结果（已缓存返回奇数）
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 type: integer
	 *                 description: 1 代表已缓存，0 代表未缓存
	 */
	router.post('/api/v1/upload/check', optionalAuth, async function (ctx) {
		if (!ctx.request.body || !(ctx.request.body.hashs instanceof Array)) {
			ctx.status = 400;
			ctx.body = { error: 'Invalid request' };
			return;
		}
		log.info('检查文件缓存性', ctx.request.body.hashs);
		const hashs = ctx.request.body.hashs as Array<string>;
		const ret: Array<number> = [];
		for (const hash of hashs) {
			const filePath = uploadDir + '/' + hash;
			if (fs.existsSync(filePath)) {
				ret.push(1);
			} else {
				ret.push(0);
			}
		}
		ctx.body = ret;
	});

	/**
	 * @openapi
	 * /api/v1/upload/file:
	 *   post:
	 *     summary: 上传文件
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         multipart/form-data:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               file:
	 *                 type: string
	 *                 format: binary
	 *               name:
	 *                 type: string
	 *     responses:
	 *       200:
	 *         description: 上传成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.post('/api/v1/upload/file', optionalAuth, async function (ctx) {
		if (!ctx.request.files || !ctx.request.files.file) {
			ctx.status = 400;
			ctx.body = { error: 'Missing file' };
			return;
		}
		const file = ctx.request.files.file as any;
		const body = ctx.request.body;
		log.info('收到文件', file.originalFilename);
		const destPath = uploadDir + '/' + body.name;
		try {
			fs.renameSync(file.filepath, destPath);
			log.info('文件已缓存至', destPath);
			ctx.body = { success: true };
		} catch (error) {
			log.error('文件重命名失败', error);
			ctx.status = 500;
			ctx.body = { error: 'Failed to save file' };
		}
	});

	// #endregion

	// ==================== 人品模块 ====================

	/**
	 * @openapi
	 * /api/v1/activation:
	 *   post:
	 *     summary: 激活 FFBoxService
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               userInput:
	 *                 type: string
	 *     responses:
	 *       200:
	 *         description: 激活结果
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: string
	 *       400:
	 *         description: 激活码无效
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 */
	router.post('/api/v1/activation', async function (ctx) {
		if (!ctx.request.body?.userInput) {
			ctx.status = 400;
			ctx.body = { error: 'Missing activation code' };
			return;
		}
		const userInput = ctx.request.body.userInput;
		const result = await ffboxService!.activate(userInput);
		if (result !== false) {
			// 返回 functionLevel 字符串，前端用 +result 转数字
			ctx.body = String(result);
		} else {
			ctx.status = 400;
			ctx.body = { error: 'Unrecognizable activation code' };
		}
	});

	// #endregion

	// #region 缓存管理模块

	/**
	 * @openapi
	 * /api/v1/cache:
	 *   get:
	 *     summary: 获取上传下载缓存信息
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: 缓存信息
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/CacheInfo'
	 */
	router.get('/api/v1/cache', optionalAuth, async function (ctx) {
		ctx.body = await ffboxService!.getCacheInfo(false);
	});

	/**
	 * @openapi
	 * /api/v1/cache:
	 *   delete:
	 *     summary: 清除上传下载缓存
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: 清除结果
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/CacheInfo'
	 */
	router.delete('/api/v1/cache', optionalAuth, requirePermission(Permission.CacheManagement), async function (ctx) {
		ctx.body = await ffboxService!.getCacheInfo(true);
	});

	// #endregion

	// #region Webhook 模块

	/**
	 * @openapi
	 * /api/v1/webhooks:
	 *   get:
	 *     summary: 获取所有 Webhook
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: Webhook 列表
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 $ref: '#/components/schemas/Webhook'
	 */
	router.get('/api/v1/webhooks', optionalAuth, async function (ctx) {
		const webhooks = webhookManager.getAll();
		// 不返回 secret 字段
		ctx.body = webhooks.map(w => ({ ...w, secret: undefined as string | undefined }));
	});

	/**
	 * @openapi
	 * /api/v1/webhooks:
	 *   post:
	 *     summary: 创建 Webhook
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/CreateWebhookRequest'
	 *     responses:
	 *       200:
	 *         description: 创建成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Webhook'
	 */
	router.post('/api/v1/webhooks', optionalAuth, async function (ctx) {
		if (!ctx.request.body) {
			ctx.status = 400;
			ctx.body = { error: 'Missing request body' };
			return;
		}
		const webhook = webhookManager.create(ctx.request.body as CreateWebhookRequest);
		ctx.body = { ...webhook, secret: undefined as string | undefined };
	});

	/**
	 * @openapi
	 * /api/v1/webhooks/{id}:
	 *   get:
	 *     summary: 获取单个 Webhook
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: Webhook 详情
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Webhook'
	 *       404:
	 *         description: Webhook 未找到
	 */
	router.get('/api/v1/webhooks/:id', optionalAuth, async function (ctx) {
		const webhook = webhookManager.get(ctx.params.id);
		if (!webhook) {
			ctx.status = 404;
			ctx.body = { error: 'Webhook not found' };
			return;
		}
		ctx.body = { ...webhook, secret: undefined as string | undefined };
	});

	/**
	 * @openapi
	 * /api/v1/webhooks/{id}:
	 *   put:
	 *     summary: 更新 Webhook
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/UpdateWebhookRequest'
	 *     responses:
	 *       200:
	 *         description: 更新成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Webhook'
	 *       404:
	 *         description: Webhook 未找到
	 */
	router.put('/api/v1/webhooks/:id', optionalAuth, async function (ctx) {
		if (!ctx.request.body) {
			ctx.status = 400;
			ctx.body = { error: 'Missing request body' };
			return;
		}
		const webhook = webhookManager.update(ctx.params.id, ctx.request.body as UpdateWebhookRequest);
		if (!webhook) {
			ctx.status = 404;
			ctx.body = { error: 'Webhook not found' };
			return;
		}
		ctx.body = { ...webhook, secret: undefined as string | undefined };
	});

	/**
	 * @openapi
	 * /api/v1/webhooks/{id}:
	 *   delete:
	 *     summary: 删除 Webhook
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: 删除成功
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SuccessResponse'
	 */
	router.delete('/api/v1/webhooks/:id', optionalAuth, async function (ctx) {
		const success = webhookManager.delete(ctx.params.id);
		if (!success) {
			ctx.status = 404;
			ctx.body = { error: 'Webhook not found' };
			return;
		}
		ctx.body = { success: true };
	});

	/**
	 * @openapi
	 * /api/v1/webhooks/{id}/test:
	 *   post:
	 *     summary: 测试 Webhook 连通性
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: 测试结果
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 success:
	 *                   type: boolean
	 *                 message:
	 *                   type: string
	 */
	router.post('/api/v1/webhooks/:id/test', optionalAuth, async function (ctx) {
		const result = await webhookManager.test(ctx.params.id);
		ctx.body = result;
	});

	// #endregion

	return router;
}

// #endregion

export default uiBridge;
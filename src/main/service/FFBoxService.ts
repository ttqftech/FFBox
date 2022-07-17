import CryptoJS from 'crypto-js';
import { EventEmitter } from 'events';
import os from 'os';
import fs from 'fs';
import { ServiceTask, TaskStatus, OutputParams, FFBoxServiceEvent, NotificationLevel, FFmpegProgress, WorkingStatus, FFBoxServiceInterface } from '@common/types';
import { getFFmpegParaArray, getFFmpegParaArrayOutputPath } from '@common/getFFmpegParaArray';
import { generator as fGenerator } from '@common/formats';
import { defaultParams } from '@common/defaultParams';
import { getInitialServiceTask, convertAnyTaskToTask, getTimeString, TypedEventEmitter, replaceOutputParams, randomString } from '@common/utils';
import { FFmpeg } from './FFmpegInvoke';
import UIBridge from './uiBridge';

const maxThreads = 2;

export interface FFBoxServerEvent {
	serverReady: () => void;
	serverError: (arg: { error: Error }) => void;
	serverClose: () => void;
}

export class FFBoxService extends (EventEmitter as new () => TypedEventEmitter<FFBoxServiceEvent & FFBoxServerEvent>) implements FFBoxServiceInterface {
	private tasklist: Array<ServiceTask> = [];
	private taskId = 0;
	private workingStatus: WorkingStatus = WorkingStatus.stopped;
	private ffmpegVersion = '';
	private globalTask: ServiceTask;
	private functionLevel = 20;

	constructor() {
		super();
		console.log(getTimeString(new Date()), '正在初始化 FFbox 服务。');
		this.globalTask = getInitialServiceTask('');
		this.tasklist[-1] = this.globalTask;
		setTimeout(() => {
			this.initSettings();
			this.initUIBridge();
			this.initFFmpeg();
		}, 0);
	}

	/**
	 * 初始化服务器
	 */
	private initUIBridge(): void {
		UIBridge.init(this);
		UIBridge.listen();
	}

	/**
	 * 从本地存储初始化设置
	 */
	public initSettings(): void {
		this.globalTask.after = defaultParams;
	}

	/**
	 * 检测 ffmpeg 版本，并调用 getFFmpegVersion
	 * @emits ffmpegVersion
	 */
	public initFFmpeg(): void {
		console.log(getTimeString(new Date()), '检查 FFmpeg 版本。');
		const ffmpeg = new FFmpeg(1);
		ffmpeg.on('data', ({ content }) => {
			this.setCmdText(-1, content);
		});
		ffmpeg.on('version', ({ content }) => {
			if (content) {
				this.ffmpegVersion = content;
			} else {
				this.ffmpegVersion = '';
			}
			this.getFFmpegVersion();
		});
	}

	/**
	 * 直接获取当前 ffmpeg 版本
	 * @emits ffmpegVersion
	 */
	public getFFmpegVersion(): void {
		this.emit('ffmpegVersion', { content: this.ffmpegVersion });
	}

	/**
	 * 新增任务
	 * @param filePath 全访问路径
	 * @param fileName 全文件名
	 * @emits tasklistUpdate
	 */
	public taskAdd(fileBaseName: string, outputParams: OutputParams): Promise<number> {
		const id = this.taskId++;
		// 目前只处理单输入的情况
		const filePath = outputParams.input.files[0].filePath;
		console.log(getTimeString(new Date()), `新增任务：${fileBaseName}（${filePath ? '本地' : '网络'}）。id：${id}。`);
		const task = getInitialServiceTask(fileBaseName, outputParams);
		this.tasklist[id] = task;

		// 更新命令行参数

		if (filePath && filePath.length) {
			task.paraArray = getFFmpegParaArray(task.after, true);
			// 本地文件直接获取媒体信息
			this.getFileMetadata(id, task, filePath);
		} else {
			task.outputFile = fGenerator.concatFilePath(task.after.output, undefined, `${new Date().getTime()}${randomString(3)}`);
			task.paraArray = getFFmpegParaArray(task.after, true, undefined, undefined, task.outputFile);
			// 网络文件等待上传完成后再另行调用获取媒体信息
			task.status = TaskStatus.TASK_INITIALIZING;
			task.remoteTask = true;
		}

		this.emit('tasklistUpdate', { content: Object.keys(this.tasklist).map(Number) });
		return Promise.resolve(id);
	}

	/**
	 * 新增任务时调用 FFmpeg 获取输入文件信息
	 * 多输入任务不调用此函数
	 */
	private getFileMetadata(id: number, task: ServiceTask, filePath: string): void {
		// FFmpeg 读取媒体信息
		const ffmpeg = new FFmpeg(2, ['-hide_banner', '-i', filePath, '-f', 'null']);
		ffmpeg.on('data', ({ content }) => {
			this.setCmdText(id, content);
		});
		ffmpeg.on('metadata', ({ content: input }) => {
			task.before.format = input.format || '-';
			task.before.duration = parseInt(input.duration || '-1');
			task.before.vcodec = input.vcodec || '-';
			task.before.vresolution = (input.vresolution && input.vresolution.replace('x', '<br />')) || '-';
			task.before.vbitrate = parseInt(input.vbitrate || '-1');
			task.before.vframerate = parseInt(input.vframerate || '-1');
			task.before.acodec = input.acodec || '-';
			task.before.abitrate = parseInt(input.abitrate || '-1');
			this.emit('taskUpdate', {
				id,
				content: convertAnyTaskToTask(task),
			});
		});
		ffmpeg.on('critical', ({ content: errors }) => {
			let reason = '';
			errors.forEach((value) => {
				reason += value;
			});
			this.setNotification(id, filePath + '：' + reason, NotificationLevel.warning);
			this.emit('taskNotification', { id, content: filePath + '：' + reason, level: NotificationLevel.warning });
			setTimeout(() => {
				this.taskDelete(id);
			}, 100);
		});
	}

	/**
	 * 对于远程文件，上传完成后调用此函数合并文件
	 * @emits taskUpdate
	 */
	public mergeUploaded(id: number, hashs: Array<string>): void {
		const task = this.tasklist[id];
		if (!task) {
			// 上传完成之前删除了任务
			return;
		}
		const uploadDir = os.tmpdir() + '/FFBoxUploadCache'; // 文件上传目录
		const destPath = uploadDir + '/' + task.fileBaseName;
		task.after.input.files[0].filePath = uploadDir + '/' + hashs[0]; // 暂时不做多输入功能，默认文件 0
		if (hashs.length > 1) {
			// 目前不做分片功能，此处永假
			fs.writeFile(destPath, '', (err) => {
				if (err) {
					this.setNotification(id, task.fileBaseName + '：合并文件写入失败', NotificationLevel.error);
					return;
				}
				for (const hash of hashs) {
					const source = uploadDir + '/' + hash;
					fs.appendFileSync(destPath, fs.readFileSync(source));
					fs.rmSync(source);
				}
			});
		}
		task.status = TaskStatus.TASK_STOPPED;
		this.getFileMetadata(id, task, task.after.input.files[0].filePath || '');
		task.paraArray = getFFmpegParaArray(task.after, true, undefined, undefined, task.outputFile);
		this.setNotification(id, `任务「${task.fileBaseName}」输入文件上传完成`, NotificationLevel.info);
		this.emit('taskUpdate', {
			id,
			content: convertAnyTaskToTask(task),
		});
	}

	/**
	 *  '/
	 * 【TASK_INITIALIZING / TASK_STOPPED】 => 【TASK_DELETED】
	 * @param id 任务 id
	 * @emits tasklistUpdate
	 */
	public taskDelete(id: number): void {
		const task = this.tasklist[id];
		console.log(getTimeString(new Date()), `删除任务：${task.fileBaseName}。id：${id}。`);
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!task || !(task.status === TaskStatus.TASK_INITIALIZING || task.status === TaskStatus.TASK_STOPPED)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：删除`);
		}
		task.status = TaskStatus.TASK_DELETED;
		delete this.tasklist[id];
		this.emit('tasklistUpdate', { content: Object.keys(this.tasklist).map(Number) });
	}

	/**
	 * 启动单个任务
	 * 【TASK_STOPPED】 => 【TASK_RUNNING】 => 【TASK_FINISHED / TASK_ERROR】
	 * @param id 任务 id
	 * @emits taskUpdate
	 */
	public taskStart(id: number): void {
		const task = this.tasklist[id];
		console.log(getTimeString(new Date()), `启动任务：${task.fileBaseName}。id：${id}。`);
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_STOPPED || task.status === TaskStatus.TASK_ERROR)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：启动`);
		}
		task.status = TaskStatus.TASK_RUNNING;
		task.progressLog = {
			time: [],
			frame: [],
			size: [],
			lastStarted: new Date().getTime() / 1000,
			elapsed: 0,
			lastPaused: new Date().getTime() / 1000,
		};
		this.setCmdText(id, '', false);
		if (this.functionLevel < 50) {
			const videoParam = task.after.video;
			if (videoParam.ratecontrol === 'ABR' || videoParam.ratecontrol === 'CBR') {
				if (videoParam.ratevalue > 0.75 || videoParam.ratevalue < 0.25) {
					this.setNotification(
						id,
						`任务「${task.fileBaseName}」设置的视频码率已被限制<br/>` +
							'💔根据您的用户等级，您在 ABR/CBR 模式下，可以使用的视频码率区间是 500Kbps ~ 32Mbps<br/>' +
							'😞很抱歉给您带来的不便，您可以到 FFBox 官网寻求解决方案<br/>' +
							'一般是进行项目捐助，或者下载源码自行编译去除限制，或者直接使用 FFmpeg 进行进阶操作✅',
						NotificationLevel.warning,
					);
					videoParam.ratevalue = videoParam.ratevalue > 0.75 ? 0.75 : 0.25;
				}
			}
		}
		const filePath = task.after.input.files[0].filePath!; // 需要上传完成，状态为 TASK_STOPPED 时才能开始任务，因此 filePath 非空
		let newFFmpeg: FFmpeg;
		if (task.remoteTask) {
			newFFmpeg = new FFmpeg(0, getFFmpegParaArray(task.after, false, undefined, undefined, `${os.tmpdir()}/FFBoxDownloadCache/${task.outputFile}`));
		} else {
			task.outputFile = getFFmpegParaArrayOutputPath(task.after);
			newFFmpeg = new FFmpeg(0, getFFmpegParaArray(task.after, false));
		}
		newFFmpeg.on('finished', () => {
			console.log(getTimeString(new Date()), `任务完成：${task.fileBaseName}。id：${id}。`);
			task.status = TaskStatus.TASK_FINISHED;
			this.setNotification(id, `任务「${task.fileBaseName}」已转码完成`, NotificationLevel.ok);
			this.emit('taskUpdate', {
				id,
				content: convertAnyTaskToTask(task),
			});

			this.queueAssign(Object.keys(this.tasklist).findIndex((key) => parseInt(key) === id) + 1);
		});
		newFFmpeg.on('status', (status: FFmpegProgress) => {
			for (const parameter of ['time', 'frame', 'size']) {
				const _parameter = parameter as 'time' | 'frame' | 'size';
				task.progressLog[_parameter].push([new Date().getTime() / 1000, status[_parameter]]);
				task.progressLog[_parameter].splice(0, task.progressLog[_parameter].length - 5); // 限制列表最大长度为 5
			}
			if (this.functionLevel < 50) {
				if (task.progressLog.time[task.progressLog.time.length - 1][1] > 671 || task.progressLog.elapsed + new Date().getTime() / 1000 - task.progressLog.lastStarted > 671) {
					this.trailLimit_stopTranscoding(id);
					return;
				}
			}
			this.emit('progressUpdate', {
				id,
				content: task.progressLog,
			});
		});
		newFFmpeg.on('data', ({ content }) => {
			this.setCmdText(id, content);
		});
		// newFFmpeg.on('error', ({ error }) => {
		// 	task.errorInfo.push(error.description);
		// });
		newFFmpeg.on('warning', (warning) => {
			this.setNotification(id, task.fileBaseName + '：' + warning.content, NotificationLevel.warning);
		});
		newFFmpeg.on('critical', ({ content: errors }) => {
			console.log(getTimeString(new Date()), `任务出错：${task.fileBaseName}。id：${id}。`);
			task.status = TaskStatus.TASK_ERROR;
			this.setNotification(id, '任务「' + task.fileBaseName + '」转码失败。' + [...errors].join('') + '请到左侧的指令面板查看详细原因。', NotificationLevel.error);
			this.emit('taskUpdate', {
				id,
				content: convertAnyTaskToTask(task),
			});
			this.queueAssign(Object.keys(this.tasklist).findIndex((key) => parseInt(key) === id) + 1);
		});
		newFFmpeg.on('escaped', () => {
			console.log(getTimeString(new Date()), `任务异常终止：${task.fileBaseName}。id：${id}。`);
			task.status = TaskStatus.TASK_ERROR;
			this.setNotification(id, '任务「' + task.fileBaseName + '」异常终止。请到左侧的指令面板查看详细原因。', NotificationLevel.error);
			this.emit('taskUpdate', {
				id,
				content: convertAnyTaskToTask(task),
			});
			this.queueAssign(Object.keys(this.tasklist).findIndex((key) => parseInt(key) === id) + 1);
		});
		for (const parameter of ['time', 'frame', 'size']) {
			const _parameter = parameter as 'time' | 'frame' | 'size';
			task.progressLog[_parameter].push([new Date().getTime() / 1000, 0]);
		}
		task.progressLog.lastStarted = new Date().getTime() / 1000;
		task.ffmpeg = newFFmpeg;
		this.emit('taskUpdate', {
			id,
			content: convertAnyTaskToTask(task),
		});
	}

	/**
	 * 暂停单个任务
	 * 【TASK_RUNNING】 => 【TASK_PAUSED】
	 * @param id 任务 id
	 * @param startFromBehind 是否继续安排后面未开始的任务，默认为 true
	 * @emits taskUpdate
	 */
	public taskPause(id: number, startFromBehind = true): void {
		const task = this.tasklist[id];
		console.log(getTimeString(new Date()), `暂停任务：${task.fileBaseName}。id：${id}。`);
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_RUNNING || !task.ffmpeg)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：暂停`);
		}
		task.status = TaskStatus.TASK_PAUSED;
		task.ffmpeg!.pause();
		task.progressLog.lastPaused = new Date().getTime() / 1000;
		task.progressLog.elapsed += task.progressLog.lastPaused - task.progressLog.lastStarted;
		this.emit('taskUpdate', {
			id,
			content: convertAnyTaskToTask(task),
		});
		if (startFromBehind) {
			this.queueAssign(Object.keys(this.tasklist).findIndex((key) => parseInt(key) === id) + 1);
		}
	}

	/**
	 * 继续执行单个任务
	 * 【TASK_PAUSED】 => 【TASK_RUNNING】
	 * @param id 任务 id
	 * @emits taskUpdate
	 */
	public taskResume(id: number): void {
		const task = this.tasklist[id];
		console.log(getTimeString(new Date()), `继续任务：${task.fileBaseName}。id：${id}。`);
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_PAUSED || !task.ffmpeg)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：继续`);
		}
		task.status = TaskStatus.TASK_RUNNING;
		const nowRealTime = new Date().getTime() / 1000;
		const passedTime = nowRealTime - task.progressLog.lastPaused;
		for (const parameter of ['time', 'frame', 'size']) {
			const _parameter = parameter as 'time' | 'frame' | 'size';
			for (const logLine of task.progressLog[_parameter]) {
				logLine[0] += passedTime;
			}
		}
		task.progressLog.lastStarted = nowRealTime;
		task.ffmpeg!.resume();
		this.emit('taskUpdate', {
			id,
			content: convertAnyTaskToTask(task),
		});
	}

	/**
	 * 重置任务（收尾/强行，根据状态决定）
	 * 【TASK_PAUSED / TASK_STOPPING / TASK_FINISHED / TASK_ERROR】 => 【TASK_STOPPED】
	 * @param id 任务 id
	 * @emits taskUpdate
	 */
	public taskReset(id: number): void {
		const task = this.tasklist[id];
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (
			!(
				task.status === TaskStatus.TASK_PAUSED ||
				task.status === TaskStatus.TASK_RUNNING ||
				task.status === TaskStatus.TASK_STOPPING ||
				task.status === TaskStatus.TASK_FINISHED ||
				task.status === TaskStatus.TASK_ERROR
			)
		) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：重置`);
		}
		// if 语句两个分支的代码重合度很高，区分的原因是因为暂停状态下重置是异步的
		if (task.status === TaskStatus.TASK_PAUSED || task.status === TaskStatus.TASK_RUNNING) {
			// 暂停状态下重置或运行状态下达到限制停止工作
			console.log(getTimeString(new Date()), `停止任务：${task.fileBaseName}。id：${id}。`);
			task.status = TaskStatus.TASK_STOPPING;
			task.ffmpeg!.exit(() => {
				task.status = TaskStatus.TASK_STOPPED;
				task.ffmpeg = null;
				this.emit('taskUpdate', {
					id,
					content: convertAnyTaskToTask(task),
				});
				this.queueCheck();
			});
		} else if (task.status === TaskStatus.TASK_STOPPING) {
			// 正在停止状态下强制重置
			console.log(getTimeString(new Date()), `强制停止任务：${task.fileBaseName}。id：${id}。`);
			task.status = TaskStatus.TASK_STOPPED;
			task.ffmpeg!.forceKill(() => {
				task.ffmpeg = null;
				this.emit('taskUpdate', {
					id,
					content: convertAnyTaskToTask(task),
				});
				this.queueCheck();
			});
		} else if (task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR) {
			// 完成状态下重置
			console.log(getTimeString(new Date()), `重置任务：${task.fileBaseName}。id：${id}。`);
			task.status = TaskStatus.TASK_STOPPED;
		}
		this.queueCheck();
		this.emit('taskUpdate', {
			id,
			content: convertAnyTaskToTask(task),
		});
	}

	/**
	 * 获取任务 ID 列表
	 */
	public getTaskList(): void {
		this.emit('tasklistUpdate', { content: Object.keys(this.tasklist).map(Number) });
	}

	/**
	 * 获取单个任务
	 * @param id 任务 id
	 */
	public getTask(id: number): void {
		const task = this.tasklist[id];
		if (!task) {
			console.warn('尝试读取不存在的任务：' + id);
			return;
		}
		this.emit('taskUpdate', {
			id,
			content: convertAnyTaskToTask(task),
		});
	}

	/**
	 * 获取【正在运行】的任务数
	 */
	private getWorkingTaskCount(): number {
		let count = 0;
		for (const task of Object.values(this.tasklist)) {
			if (task.status === TaskStatus.TASK_RUNNING) {
				count++;
			}
		}
		return count;
	}

	/**
	 * 获取【正在运行】、【已暂停】、【正在停止】、【正在结束】的任务数
	 */
	private getQueueTaskCount(): number {
		let count = 0;
		for (const task of Object.values(this.tasklist)) {
			if (task.status === TaskStatus.TASK_RUNNING || task.status === TaskStatus.TASK_PAUSED || task.status === TaskStatus.TASK_STOPPING || task.status === TaskStatus.TASK_FINISHING) {
				count++;
			}
		}
		return count;
	}

	/**
	 * workingStatus 的 setter，仅应被 queueAssign 和 queuePause 调用
	 * @param value WorkingStatus
	 */
	private setWorkingStatus(value: WorkingStatus): void {
		this.workingStatus = value;
		this.emit('workingStatusUpdate', { value });
	}

	/**
	 * 开始处理队列
	 * @param startFrom
	 */
	public queueAssign(startFrom = 0): void {
		while (this.getWorkingTaskCount() < maxThreads) {
			let started_thisTime = false;
			let count = 0;
			for (const [id, task] of Object.entries(this.tasklist)) {
				if (id === '-1' || count++ < startFrom) {
					continue;
				}
				if (task.status === TaskStatus.TASK_STOPPED) {
					// 从还没开始干活的抽一个出来干
					this.taskStart(parseInt(id));
					started_thisTime = true;
					break;
				} else if (task.status === TaskStatus.TASK_PAUSED) {
					// 从暂停开始干活的抽一个出来干
					this.taskResume(parseInt(id));
					started_thisTime = true;
					break;
				}
			}
			if (!started_thisTime) {
				// 遍历完了，没有可以继续开始的任务，停止安排新工作
				break;
			}
		}
		this.queueCheck();
	}

	/**
	 * 检查队列状态，以此更新 workingStatus
	 */
	private queueCheck(): void {
		let newWorkingStatus: WorkingStatus;
		if (this.getQueueTaskCount() === 0) {
			// 没有一个待处理任务
			newWorkingStatus = WorkingStatus.stopped;
		} else if (this.getWorkingTaskCount() === 0) {
			// 有待处理任务，但没有开始
			newWorkingStatus = WorkingStatus.paused;
		} else {
			newWorkingStatus = WorkingStatus.running;
		}
		if (this.workingStatus !== newWorkingStatus) {
			this.setWorkingStatus(newWorkingStatus);
		}
	}

	/**
	 * 暂停处理队列
	 */
	public queuePause(): void {
		this.setWorkingStatus(WorkingStatus.paused);
		for (const [id, task] of Object.entries(this.tasklist)) {
			if (task.status === TaskStatus.TASK_RUNNING) {
				this.taskPause(parseInt(id), false);
			}
		}
	}

	/**
	 * 删除相应通知
	 * @emits taskUpdate
	 */
	public deleteNotification(taskId: number, index: number): void {
		const task = this.tasklist[taskId];
		if (!task) {
			throw Error(`任务不存在！任务 id：${taskId}`);
		}
		task.notifications.splice(index, 1);
		this.emit('taskUpdate', {
			id: taskId,
			content: convertAnyTaskToTask(task),
		});
	}

	/**
	 * 批量设置任务的输出参数，将算出的 paraArray 通过 taskUpdate 传回（这样对性能不太好）
	 * @emits taskUpdate
	 *
	 */
	public setParameter(ids: Array<number>, param: OutputParams): void {
		for (const id of ids) {
			const task = this.tasklist[id];
			task.after = replaceOutputParams(param, task.after);
			const filePath = task.after.input.files[0].filePath;
			if (task.remoteTask) {
				// 如果修改了输出格式，需要重新计算 outputFile
				task.outputFile = fGenerator.concatFilePath(task.after.output, undefined, `${new Date().getTime()}${randomString(3)}`);
				task.paraArray = getFFmpegParaArray(task.after, true, undefined, undefined, task.outputFile);
			} else {
				task.paraArray = getFFmpegParaArray(task.after, true);
			}
			this.getTask(id);
		}
	}

	/**
	 * 收到 cmd 内容通用回调
	 * @param id 任务 id
	 * @param content 文本
	 * @param append 附加到末尾，默认 true
	 */
	private setCmdText(id: number, content: string, append = true): void {
		const task = this.tasklist[id];
		if (!append) {
			task.cmdData = content;
		} else {
			if (content.length) {
				if (task.cmdData.slice(-1) !== '\n' && task.cmdData.length) {
					task.cmdData += '\n';
				}
				task.cmdData += content;
			}
		}
		this.emit('cmdUpdate', {
			id,
			content,
			append,
		});
	}

	/**
	 * 任务通知，emit 事件并存储到任务中
	 * @param id
	 * @param content
	 * @param level
	 */
	private setNotification(id: number, content: string, level: NotificationLevel): void {
		this.emit('taskNotification', {
			id,
			content,
			level,
		});
		const task = this.tasklist[id];
		task.notifications.push({
			time: new Date().getTime(),
			content,
			level,
		});
	}

	public activate(machineCode: string, activationCode: string): boolean {
		const fixedCode = 'be6729be8279be40';
		const key = machineCode + fixedCode;
		const decrypted = CryptoJS.AES.decrypt(activationCode, key);
		const decryptedString = CryptoJS.enc.Utf8.stringify(decrypted);
		if (parseInt(decryptedString).toString() === decryptedString) {
			this.functionLevel = parseInt(decryptedString);
			return true;
		} else {
			return false;
		}
	}

	public trailLimit_stopTranscoding(id: number): void {
		const task = this.tasklist[id];
		this.setNotification(
			id,
			`任务「${task.fileBaseName}」转码被中止了<br/>` +
				'💔根据您的用户等级，只能处理最多 11:11 的媒体时长和花费最多 11:11 的处理耗时<br/>' +
				'😞很抱歉给您带来的不便，您可以到 FFBox 官网寻求解决方案<br/>' +
				'一般是进行项目捐助，或者下载源码自行编译去除限制，或者直接使用 FFmpeg 进行进阶操作✅',
			NotificationLevel.error,
		);
		task.status = TaskStatus.TASK_STOPPING;
		task.ffmpeg!.exit(() => {
			task.status = TaskStatus.TASK_ERROR;
			task.ffmpeg = null;
			this.emit('taskUpdate', {
				id,
				content: convertAnyTaskToTask(task),
			});
			this.queueAssign(Object.keys(this.tasklist).findIndex((key) => parseInt(key) === id) + 1);
		});
	}
}

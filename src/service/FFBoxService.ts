import { ServiceTask, TaskStatus, OutputParams, FFBoxServiceEvent, Notification, NotificationLevel, FFmpegProgress, WorkingStatus, Task, FFBoxServiceInterface } from "../types/types";
import { getFFmpegParaArray } from "../common/getFFmpegParaArray";
import { FFmpeg } from './FFmpegInvoke'
import { defaultParams } from "../common/defaultParams";
import { getInitialServiceTask, getTimeString, TypedEventEmitter } from "@/common/utils";
import { convertAnyTaskToTask } from "./netApi";
import { EventEmitter } from "events";
import UIBridge from "./uiBridge";
import CryptoJS from "crypto-js";

const maxThreads = 2;

export interface FFBoxServerEvent {
	serverReady: () => void;
	serverError: (arg: { error: Error }) => void;
	serverClose: () => void;
}

export class FFBoxService extends (EventEmitter as new () => TypedEventEmitter<FFBoxServiceEvent & FFBoxServerEvent>) implements FFBoxServiceInterface {
	private tasklist: Array<ServiceTask> = [];
	private taskId: number = 0;
	private newlyAddedTaskIds: Array<number> = [];
	private workingStatus: WorkingStatus = WorkingStatus.stopped;
	private ffmpegVersion: string = '';
	private globalTask: ServiceTask;
	private functionLevel: number = 20;
	
	constructor() {
		super();
		console.log(getTimeString(new Date()), '正在初始化 FFbox 服务。');
		this.globalTask = getInitialServiceTask('', '');
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
		let ffmpeg = new FFmpeg(1);
		ffmpeg.on('data', (data: string) => {
			this.setCmdText(-1, data);
		});
		ffmpeg.on('version', (data: string) => {
			if (data[0]) {
				this.ffmpegVersion = data;
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
	public taskAdd(filePath: string, fileName: string, outputParams?: OutputParams): void {
		let id = this.taskId++;
		console.log(getTimeString(new Date()), `新增任务：${fileName}。id：${id}。`);
		let task = getInitialServiceTask(fileName, filePath, outputParams);

		// 更新命令行参数
		task.paraArray = getFFmpegParaArray(task.filePath, task.after.input, task.after.video, task.after.audio, task.after.output, true);

		// FFmpeg 读取媒体信息
		let ffmpeg = new FFmpeg(2, ['-hide_banner', '-i', filePath, '-f', 'null']);
		ffmpeg.on('data', (data: string) => {
			this.setCmdText(id, data);
		});
		ffmpeg.on('metadata', (input: any) => {
			task.before.format = input.format;
			task.before.duration = input.duration;
			task.before.vcodec = input.vcodec === undefined ? '-' : input.vcodec;
			task.before.vresolution = input.vcodec === undefined ? '-' : input.vresolution.replace('x', '<br />');
			task.before.vbitrate = input.vbitrate === undefined ? '-' : input.vbitrate;
			task.before.vframerate = input.vframerate === undefined ? '-' : input.vframerate;
			task.before.format = input.format;
			task.before.acodec = input.acodec === undefined ? '-' : input.acodec;
			task.before.abitrate = input.abitrate === undefined ? '-' : input.abitrate;
			this.emit('taskUpdate', {
				id,
				content: convertAnyTaskToTask(task),
			});
		})
		ffmpeg.on('critical', (errors: Array<string>) => {
			let reason = '';
			errors.forEach((value) => {
				reason += value;
			})
			this.setNotification(
				id,
				filePath + '：' + reason,
				NotificationLevel.warning,
			);
			this.emit('taskNotification', { id, content: filePath + '：' + reason, level: NotificationLevel.warning });
			setTimeout(() => {
				this.taskDelete(id);
			}, 100);
		})

		this.tasklist[id] = task;
		this.emit('tasklistUpdate', { content: Object.keys(this.tasklist).map(Number) });

		this.newlyAddedTaskIds.push(id);
	}

	/**
	 * 每次批量添加完成任务后调用此函数，获取距离上一次添加所新增的任务 id
	 * @emits newlyAddedTask
	 */
	public getNewlyAddedTaskIds(): void {
		this.emit('newlyAddedTaskIds', { content: this.newlyAddedTaskIds });
		this.newlyAddedTaskIds = [];
	}

	/**
	 * 删除任务
	 * 【TASK_STOPPED / TASK_FINISHED / TASK_ERROR】 => 【TASK_DELETED】
	 * @param id 任务 id
	 * @emits tasklistUpdate
	 */
	public taskDelete(id: number): void {
		let task = this.tasklist[id];
		console.log(getTimeString(new Date()), `删除任务：${task.fileName}。id：${id}。`);
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!task || !(task.status === TaskStatus.TASK_STOPPED || task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR)) {
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
		let task = this.tasklist[id];
		console.log(getTimeString(new Date()), `启动任务：${task.fileName}。id：${id}。`);
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_STOPPED || task.status === TaskStatus.TASK_ERROR)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：启动`);
		}
		task.status = TaskStatus.TASK_RUNNING;
		task.progressHistory = {
			normal: [],
			size: [],
			lastStarted: new Date().getTime() / 1000,
			elapsed: 0,
			lastPaused: new Date().getTime() / 1000,
		};
		this.setCmdText(id, '', false);
		if (this.functionLevel < 50) {
			let videoParam = task.after.video;
			if (videoParam.ratecontrol === 'ABR' || videoParam.ratecontrol === 'CBR') {
				if (videoParam.ratevalue > 0.75 || videoParam.ratevalue < 0.25) {
					this.setNotification(
						id,
						`文件「${task.fileName}」设置的视频码率已被限制<br/>` + 
						'💔根据您的用户等级，您在 ABR/CBR 模式下，可以使用的视频码率区间是 500Kbps ~ 32Mbps<br/>' +
						'😞很抱歉给您带来的不便，您可以到 FFBox 官网寻求解决方案<br/>' +
						'一般是进行项目捐助，或者下载源码自行编译去除限制，或者直接使用 FFmpeg 进行进阶操作✅',
						NotificationLevel.warning,
					);
					videoParam.ratevalue = videoParam.ratevalue > 0.75 ? 0.75 : 0.25;
				}
			}
		}
		let newFFmpeg = new FFmpeg(0, getFFmpegParaArray(task.filePath, task.after.input, task.after.video, task.after.audio, task.after.output));
		newFFmpeg.on('finished', () => {
			console.log(getTimeString(new Date()), `任务完成：${task.fileName}。id：${id}。`);
			task.status = TaskStatus.TASK_FINISHED;
			this.setNotification(
				id,
				`文件「${task.fileName}」已转码完成`,
				NotificationLevel.ok,
			);
			this.emit('taskUpdate', {
				id,
				content: convertAnyTaskToTask(task),
			});
			
			this.queueAssign(Object.keys(this.tasklist).findIndex((key) => parseInt(key) === id) + 1);
		});
		newFFmpeg.on('status', (status: FFmpegProgress) => {
			task.progressHistory.normal.push({
				realTime: new Date().getTime() / 1000, 
				mediaTime: status.time,
				frame: status.frame,
			});
			// size 每隔一段体积才更新一次，所以单独对待
			if (status.size !== task.progressHistory.size.slice(-1)[0].size) {
				task.progressHistory.size.push({
					realTime: new Date().getTime() / 1000,
					size: status.size,
				});
			}
			// 限制列表最大长度为 6
			task.progressHistory.normal.splice(0, task.progressHistory.normal.length - 6);
			task.progressHistory.size.splice(0, task.progressHistory.size.length - 6);
			if (this.functionLevel < 50) {
				if (task.progressHistory.normal.slice(-1)[0].mediaTime > 671 ||
					task.progressHistory.elapsed + new Date().getTime() / 1000 - task.progressHistory.lastStarted > 671) {
					this.trailLimit_stopTranscoding(id);
					return;
				}
			}
			this.emit('progressUpdate', {
				id,
				content: task.progressHistory,
			});
		});
		newFFmpeg.on('data', (data: string) => {
			this.setCmdText(id, data);
		});
		newFFmpeg.on('error', (error: any) => {
			task.errorInfo.push(error.description);
		});
		newFFmpeg.on('warning', (warning: any) => {
			this.setNotification(
				id,
				task.fileName + '：' + warning.description,
				NotificationLevel.warning,
			);
		});
		newFFmpeg.on('critical', (errors: Array<string>) => {
			console.log(getTimeString(new Date()), `任务出错：${task.fileName}。id：${id}。`);
			task.status = TaskStatus.TASK_ERROR;
			this.setNotification(
				id,
				'文件「' + task.fileName + '」转码失败。' + [...errors].join('') + '请到左侧的指令面板查看详细原因。',
				NotificationLevel.error,
			);
			this.emit('taskUpdate', {
				id,
				content: convertAnyTaskToTask(task),
			});
			this.queueAssign(Object.keys(this.tasklist).findIndex((key) => parseInt(key) === id) + 1);
		});
		task.progressHistory.normal.push({
			realTime: new Date().getTime() / 1000,
			mediaTime: 0,
			frame: 0
		});
		task.progressHistory.size.push({
			realTime: new Date().getTime() / 1000,
			size: 0
		});
		task.progressHistory.lastStarted = new Date().getTime() / 1000;
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
	public taskPause(id: number, startFromBehind: boolean = true): void {
		let task = this.tasklist[id];
		console.log(getTimeString(new Date()), `暂停任务：${task.fileName}。id：${id}。`);
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_RUNNING || !task.ffmpeg)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：暂停`);
		}
		task.status = TaskStatus.TASK_PAUSED;
		task.ffmpeg!.pause();
		task.progressHistory.lastPaused = new Date().getTime() / 1000;
		task.progressHistory.elapsed += task.progressHistory.lastPaused - task.progressHistory.lastStarted;
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
		let task = this.tasklist[id];
		console.log(getTimeString(new Date()), `继续任务：${task.fileName}。id：${id}。`);
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_PAUSED || !task.ffmpeg)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：继续`);
		}
		task.status = TaskStatus.TASK_RUNNING;
		let nowRealTime = new Date().getTime() / 1000;
		let passedTime = nowRealTime - task.progressHistory.lastPaused;
		for (const item of task.progressHistory.normal) {
			item.realTime += passedTime;
		}
		for (const item of task.progressHistory.size) {
			item.realTime += passedTime;
		}
		task.progressHistory.lastStarted = nowRealTime;
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
		let task = this.tasklist[id];
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_PAUSED || task.status === TaskStatus.TASK_RUNNING || task.status === TaskStatus.TASK_STOPPING || task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：重置`);
		}
		// if 语句两个分支的代码重合度很高，区分的原因是因为暂停状态下重置是异步的
		if (task.status === TaskStatus.TASK_PAUSED || task.status === TaskStatus.TASK_RUNNING) {	// 暂停状态下重置或运行状态下达到限制停止工作
			console.log(getTimeString(new Date()), `停止任务：${task.fileName}。id：${id}。`);
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
		} else if (task.status === TaskStatus.TASK_STOPPING) {		// 正在停止状态下强制重置
		console.log(getTimeString(new Date()), `强制停止任务：${task.fileName}。id：${id}。`);
		task.status = TaskStatus.TASK_STOPPED;
			task.ffmpeg!.forceKill(() => {
				task.ffmpeg = null;
				this.emit('taskUpdate', {
					id,
					content: convertAnyTaskToTask(task),
				});
				this.queueCheck();
			});
		} else if (task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR) {		// 完成状态下重置
			console.log(getTimeString(new Date()), `重置任务：${task.fileName}。id：${id}。`);
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
		let task = this.tasklist[id];
		if (!task) {
			console.warn('尝试读取不存在的任务：' + id)
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
		let count: number = 0;
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
	public queueAssign(startFrom: number = 0): void {
		while (this.getWorkingTaskCount() < maxThreads) {
			let started_thisTime: boolean = false;
			let count: number = 0;
			for (const [id, task] of Object.entries(this.tasklist)) {
				if (id === '-1' || count++ < startFrom) {
					continue;
				}
				if (task.status === TaskStatus.TASK_STOPPED) {			// 从还没开始干活的抽一个出来干
					this.taskStart(parseInt(id));
					started_thisTime = true;
					break;
				} else if (task.status === TaskStatus.TASK_PAUSED) {	// 从暂停开始干活的抽一个出来干
					this.taskResume(parseInt(id));
					started_thisTime = true;
					break;
				}
			}
			if (!started_thisTime) {			// 遍历完了，没有可以继续开始的任务，停止安排新工作
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
		if (this.getQueueTaskCount() === 0) {			// 没有一个待处理任务
			newWorkingStatus = WorkingStatus.stopped;
		} else if (this.getWorkingTaskCount() === 0) {	// 有待处理任务，但没有开始
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
		let task = this.tasklist[taskId];
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
			let task = this.tasklist[id];
			task.after = param;
			task.paraArray = getFFmpegParaArray(task.filePath, task.after.input, task.after.video, task.after.audio, task.after.output, true);
			this.getTask(id);
		}
	}
	
	/**
	 * 收到 cmd 内容通用回调
	 * @param id 任务 id
	 * @param content 文本
	 * @param append 附加到末尾，默认 true
	 */
	private setCmdText(id: number, content: string, append: boolean = true): void {
		let task = this.tasklist[id];
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
		let task = this.tasklist[id];
		task.notifications.push({
			time: new Date().getTime(),
			content,
			level,
		});
	}

	public activate(machineCode: string, activationCode: string): boolean {
		let fixedCode = 'be6729be8279be40';
		let key = machineCode + fixedCode;
		let decrypted = CryptoJS.AES.decrypt(activationCode, key)
		let decryptedString = CryptoJS.enc.Utf8.stringify(decrypted);
		if (parseInt(decryptedString).toString() === decryptedString) {
			this.functionLevel = parseInt(decryptedString);
			return true;
		} else {
			return false;
		}
	}

	public trailLimit_stopTranscoding(id: number): void {
		let task = this.tasklist[id];
		this.setNotification(
			id,
			`文件「${task.fileName}」转码被中止了<br/>` +
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
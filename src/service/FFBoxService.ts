import { ServiceTask, TaskStatus, OutputParams, FFBoxServiceEvent, Notification, NotificationLevel, FFmpegProgress, WorkingStatus, Task } from "../types/types";
import { getFFmpegParaArray } from "../common/getFFmpegParaArray";
import { EventEmitter } from "events";
import { FFmpeg } from './FFmpegInvoke'
import { defaultParams } from "../common/defaultParams";
import { getInitialServiceTask, TypedEventEmitter } from "@/common/utils";
import { convertAnyTaskToTask } from "./netApi";

const maxThreads = 2;

export class FFBoxService extends (EventEmitter as new () => TypedEventEmitter<FFBoxServiceEvent>) {
	private tasklist: Array<ServiceTask> = [];
	private taskId: number = 0;
	private workingStatus: WorkingStatus = WorkingStatus.stopped;
	private ffmpegVersion: string = '';
	private globalTask: ServiceTask;
	
	constructor() {
		super();
		this.globalTask = getInitialServiceTask('', '');
		this.tasklist[-1] = this.globalTask;
		console.log('Welcome, FFbox.');
		setTimeout(() => {
			this.initSettings();
			this.initFFmpeg();
		}, 0);
	}

	/**
	 * 从本地存储初始化设置
	 */
	public initSettings(): void {
		this.globalTask.after = defaultParams;
	}

	/**
	 * 检测 ffmpeg 版本
	 */
	public initFFmpeg(): void {
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
			this.emit('ffmpegVersion', { content: data });
		})
	}

	/**
	 * 新增任务
	 * @param filePath 全访问路径
	 * @param fileName 全文件名
	 * @returns 任务 id
	 */
	public taskAdd(filePath: string, fileName: string, outputParams?: OutputParams): number {
		let id = this.taskId++;

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
			this.emit('taskUpdate', { id, content: task });
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
		return id;
	}

	/**
	 * 删除任务
	 * 【TASK_STOPPED / TASK_FINISHED / TASK_ERROR】 => 【TASK_DELETED】
	 * @param id 任务 id
	 */
	public taskDelete(id: number): void {
		let task = this.tasklist[id];
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
	 */
	public taskStart(id: number): void {
		let task = this.tasklist[id];
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_STOPPED || task.status === TaskStatus.TASK_ERROR)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：启动`);
		}
		task.status = TaskStatus.TASK_RUNNING;
		task.taskProgress = {
			normal: [],
			size: [],
		};
		this.setCmdText(id, '', false);
		let newFFmpeg = new FFmpeg(0, getFFmpegParaArray(task.filePath, task.after.input, task.after.video, task.after.audio, task.after.output));
		newFFmpeg.on('finished', () => {
			task.status = TaskStatus.TASK_FINISHED;
			this.setNotification(
				id,
				`文件「${task.fileName}」已转码完成`,
				NotificationLevel.ok,
			);
			this.emit('taskUpdate', {
				id,
				content: task,
			});
			
			this.queueAssign(Object.keys(this.tasklist).findIndex((key) => parseInt(key) === id) + 1);
		});
		newFFmpeg.on('status', (status: FFmpegProgress) => {
			task.taskProgress.normal.push({
				realTime: new Date().getTime() / 1000, 
				mediaTime: status.time,
				frame: status.frame,
			});
			// size 每隔一段体积才更新一次，所以单独对待
			if (status.size !== task.taskProgress.size.slice(-1)[0].size) {
				task.taskProgress.size.push({
					realTime: new Date().getTime() / 1000,
					size: status.size,
				});
			}
			// 限制列表最大长度为 6
			task.taskProgress.normal.splice(0, task.taskProgress.normal.length - 6);
			task.taskProgress.size.splice(0, task.taskProgress.size.length - 6);
			this.emit('progressUpdate', {
				id,
				content: task.taskProgress,
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
			task.status = TaskStatus.TASK_ERROR;
			this.setNotification(
				id,
				'文件「' + task.fileName + '」转码失败。' + [...errors].join('') + '请到左侧的指令面板查看详细原因。',
				NotificationLevel.error,
			);
			this.emit('taskUpdate', {
				id,
				content: task,
			});
			this.queueAssign(Object.keys(this.tasklist).findIndex((key) => parseInt(key) === id) + 1);
		});
		task.taskProgress.normal.push({
			realTime: new Date().getTime() / 1000,
			mediaTime: 0,
			frame: 0
		});
		task.taskProgress.size.push({
			realTime: new Date().getTime() / 1000,
			size: 0
		});
		task.ffmpeg = newFFmpeg;

		this.emit('taskUpdate', {
			id,
			content: task,
		});
	}

	/**
	 * 暂停单个任务
	 * 【TASK_RUNNING】 => 【TASK_PAUSED】
	 * @param id 任务 id
	 * @param startFromBehind 是否继续安排后面未开始的任务，默认为 true
	 */
	public taskPause(id: number, startFromBehind: boolean = true): void {
		let task = this.tasklist[id];
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_RUNNING || !task.ffmpeg)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：暂停`);
		}
		task.status = TaskStatus.TASK_PAUSED;
		task.ffmpeg!.pause();
		task.lastPaused = new Date().getTime() / 1000;
		this.emit('taskUpdate', {
			id,
			content: task,
		});
		if (startFromBehind) {
			this.queueAssign(Object.keys(this.tasklist).findIndex((key) => parseInt(key) === id) + 1);
		}
	}

	/**
	 * 继续执行单个任务
	 * 【TASK_PAUSED】 => 【TASK_RUNNING】
	 * @param id 任务 id
	 */
	public taskResume(id: number): void {
		let task = this.tasklist[id];
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_PAUSED || !task.ffmpeg)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：继续`);
		}
		task.status = TaskStatus.TASK_RUNNING;
		let nowRealTime = new Date().getTime() / 1000;
		for (const item of task.taskProgress.normal) {
			item.realTime += nowRealTime - task.lastPaused;
		}
		for (const item of task.taskProgress.size) {
			item.realTime += nowRealTime - task.lastPaused;
		}
		task.ffmpeg!.resume();
		this.emit('taskUpdate', {
			id,
			content: task,
		});
	}

	/**
	 * 重置任务（收尾/强行，根据状态决定）
	 * 【TASK_PAUSED / TASK_STOPPING / TASK_FINISHED / TASK_ERROR】 => 【TASK_STOPPED】
	 * @param id 任务 id
	 */
	public taskReset(id: number) {
		let task = this.tasklist[id];
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_PAUSED || task.status === TaskStatus.TASK_STOPPING || task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：重置`);
		}
		// if 语句两个分支的代码重合度很高，区分的原因是因为暂停状态下重置是异步的
		if (task.status === TaskStatus.TASK_PAUSED) {				// 暂停状态下重置
			task.status = TaskStatus.TASK_STOPPING;
			task.ffmpeg!.exit(() => {
				task.status = TaskStatus.TASK_STOPPED;
				task.ffmpeg = null;
				this.emit('taskUpdate', {
					id,
					content: task,
				});
				this.queueCheck();
			});
		} else if (task.status === TaskStatus.TASK_STOPPING) {		// 正在停止状态下强制重置
			task.status = TaskStatus.TASK_STOPPED;
			task.ffmpeg!.forceKill(() => {
				task.ffmpeg = null;
				this.emit('taskUpdate', {
					id,
					content: task,
				});
				this.queueCheck();
			});
		} else if (task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR) {		// 完成状态下重置
			task.status = TaskStatus.TASK_STOPPED;
		}
		this.queueCheck();
		this.emit('taskUpdate', {
			id,
			content: task,
		});
	}

	/**
	 * 获取任务 ID 列表
	 */
	public getTaskList(): Array<number> {
		return Object.keys(this.tasklist).map(Number);
	}
	
	/**
	 * 获取单个任务
	 * @param id 任务 id
	 */
	public getTask(id: number): Task | null {
		let task = this.tasklist[id];
		if (!task) {
			return null;
		}
		return convertAnyTaskToTask(task);
	}

	/**
	 * 获取【正在运行】的任务数
	 */
	public getWorkingTaskCount(): number {
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
	public getQueueTaskCount(): number {
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
	public queuePause() {
		this.setWorkingStatus(WorkingStatus.paused);
		for (const [id, task] of Object.entries(this.tasklist)) {
			if (task.status === TaskStatus.TASK_RUNNING) {
				this.taskPause(parseInt(id), false);
			}
		}
	}

	/**
	 * 获取所有通知（按时间排序）
	 */
	public getAllNotifications(): Array<Notification & { id: number }> {
		let allNotifications: Array<Notification & { id: number }> = [];
		Object.entries(this.tasklist).forEach(([id, task]) => {
			task.notifications.forEach((value) => {
				allNotifications.push({ id: parseInt(id), ...value });
			})
		});
		allNotifications.sort((a, b) => {
			return a.time - b.time;
		})
		return allNotifications;
	}

	/**
	 * 批量设置任务的输出参数
	 */
	public setParameter(ids: Array<number>, param: OutputParams): Array<Array<any>> {
		let ret = [];
		for (const id of ids) {
			let task = this.tasklist[id];
			task.after = param;
			task.paraArray = getFFmpegParaArray(task.filePath, task.after.input, task.after.video, task.after.audio, task.after.output, true);
			ret.push(task.paraArray);
		}
		return ret;
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
}
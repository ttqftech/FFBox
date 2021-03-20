import { ServiceTask, TaskStatus, outputParams, FFBoxServiceEvent, Notification, NotificationLevel, FFmpegProgress, WorkingStatus } from "@/types/types";
import { getFFmpegParaArray } from "../common/getFFmpegParaArray";
import { EventEmitter } from "events";
import { FFmpeg } from './FFmpegInvoke'
import { Bridge } from "./bridge";
import { defaultParams } from "../common/defaultParams";

const maxThreads = 2;

export class FFBoxService extends EventEmitter {
	private tasklist: {[key: number]: ServiceTask} = {};
	private taskId: number = 0;
	private workingStatus: WorkingStatus = WorkingStatus.stopped;
	private ffmpegVersion: string = '';
	private globalTask: ServiceTask;
	
	constructor() {
		super();
		this.globalTask = {
			filename: '',
			filepath: '',
			before: {
				format: '',
				duration: '',
				vcodec: '',
				acodec: '',
				vresolution: '',
				vframerate: '',
				vbitrate: '',
				abitrate: '',
			},
			after: defaultParams,
			paraArray: [],
			ffmpeg: null,
			status: TaskStatus.TASK_PENDING,
			taskProgress: {
				normal: [],
				size: [],
			},
			lastPaused: NaN,
			cmdData: '',
			notifications: [],
			errorInfo: [],

		};
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
		var ffmpeg = new FFmpeg(1);
		ffmpeg.on("data", (data: string) => {
			this.setCmdText(-1, data);
		});
		ffmpeg.on("version", (data: string) => {
			if (data[0] != null) {
				this.ffmpegVersion = data;
			} else {
				this.ffmpegVersion = '';
			}
			this.emit(FFBoxServiceEvent.ffmpegVersion, { content: data });
		})
	}

	/**
	 * 新增任务
	 * @param filePath 全访问路径
	 * @param fileName 全文件名
	 * @returns 任务 id
	 */
	public taskAdd(filePath: string, fileName: string): number {
		var id = this.taskId++;

		var task: ServiceTask = {
			filename: fileName,
			filepath: filePath,
			before: {
				format: '读取中',
				duration: '--:--:--.--',
				vcodec: '读取中',
				acodec: '读取中',
				vresolution: '读取中',
				vframerate: '读取中',
				vbitrate: '读取中',
				abitrate: '读取中',
			},
			after: this.globalTask.after,
			// computedAfter: {},					// 一些用于给 taskitem 显示的数据，没有其他用途。尽量不往 taskitem 引入那么多需要它自己计算的东西了
			paraArray: [],
			ffmpeg: null,
			status: TaskStatus.TASK_STOPPED,
			taskProgress: {
				normal: [],
				size: [],
			},
			lastPaused: new Date().getTime() / 1000,	// 用于暂停后恢复时计算速度
			cmdData: '',
			notifications: [],
			errorInfo: [],
		}

		// 更新命令行参数
		task.paraArray = getFFmpegParaArray(task.filepath, task.after.input, task.after.video, task.after.audio, task.after.output, true)

		// FFmpeg 读取媒体信息
		var ffmpeg = new FFmpeg(2, ["-hide_banner", "-i", filePath, "-f", "null"])
		ffmpeg.on("data", (data: string) => {
			this.setCmdText(id, data);
		});
		ffmpeg.on('metadata', (input: any) => {
			task.before.format = input.format;
			task.before.duration = input.duration;
			task.before.vcodec = input.vcodec === undefined ? "-" : input.vcodec;
			task.before.vresolution = input.vcodec === undefined ? "-" : input.vresolution.replace("x", "<br />");
			task.before.vbitrate = input.vbitrate === undefined ? "-" : input.vbitrate;
			task.before.vframerate = input.vframerate === undefined ? "-" : input.vframerate;
			task.before.format = input.format;
			task.before.acodec = input.acodec === undefined ? "-" : input.acodec;
			task.before.abitrate = input.abitrate === undefined ? "-" : input.abitrate;
		})
		ffmpeg.on("critical", (errors: Array<string>) => {
			var reason = '';
			errors.forEach((value) => {
				reason += value;
			})
			this.setNotification(
				id,
				filePath + '：' + reason,
				NotificationLevel.warning,
			);
			setTimeout(() => {
				this.taskDelete(id);
			}, 100);
		})

		this.tasklist[id] = task;
		return id;
	}

	/**
	 * 删除任务
	 * 【TASK_STOPPED / TASK_FINISHED / TASK_ERROR】 => 【TASK_DELETED】
	 * @param id 任务 id
	 */
	public taskDelete(id: number): void {
		var task = this.tasklist[id];
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!task || !(task.status === TaskStatus.TASK_STOPPED || task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：删除`);
		}
		task.status = TaskStatus.TASK_DELETED;
		delete this.tasklist[id];
		this.emit(FFBoxServiceEvent.tasklistUpdate, { content: this.tasklist });
	}

	/**
	 * 启动单个任务
	 * 【TASK_STOPPED / TASK_ERROR】 => 【TASK_RUNNING】 => 【TASK_FINISHED / TASK_ERROR】
	 * @param id 任务 id
	 */
	public taskStart(id: number): void {
		var task = this.tasklist[id];
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_STOPPED || task.status === TaskStatus.TASK_ERROR)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：启动`);
		}
		var task = this.tasklist[id];
		task.status = TaskStatus.TASK_RUNNING;
		task.taskProgress = {
			normal: [],
			size: [],
		};
		var newFFmpeg = new FFmpeg(0, getFFmpegParaArray(task.filepath, task.after.input, task.after.video, task.after.audio, task.after.output));
		newFFmpeg.on('finished', () => {
			task.status = TaskStatus.TASK_FINISHED;
			this.setNotification(
				id,
				`文件【${task.filename}】已转码完成`,
				NotificationLevel.ok,
			);
			this.emit(FFBoxServiceEvent.taskUpdate, {
				id,
				content: task,
			});
	
			var pos = 0
			for (const id_ of Object.keys(this.tasklist)) {	// 开始下一个任务，但是不要开始上一个任务
				if (id_ === id.toString()) {
					break;
				} else {
					pos++;
				}
			}
			this.queueAssign(pos);
		});
		newFFmpeg.on('status', (status: FFmpegProgress) => {
			task.taskProgress.normal.push({
				realTime: new Date().getTime() / 1000, 
				mediaTime: status.time,
				frame: status.frame,
			});
			if (status.size != task.taskProgress.size.slice(-1)[0].size) {
				task.taskProgress.size.push({
					realTime: new Date().getTime() / 1000, 
					size: status.size,
				});
			}
			this.emit(FFBoxServiceEvent.progressUpdate, {
				id,
				content: task.taskProgress,
			});
		});
		newFFmpeg.on('data', (data: string) => {
			this.emit(FFBoxServiceEvent.cmdUpdate, {
				id,
				content: data,
			});
		});
		newFFmpeg.on('error', (error: any) => {
			task.errorInfo.push(error.description);
		});
		newFFmpeg.on('warning', (warning: any) => {
			this.setNotification(
				id,
				task.filename + '：' + warning.description,
				NotificationLevel.warning,
			);
		});
		newFFmpeg.on('critical', (errors: Array<string>) => {
			task.status = TaskStatus.TASK_ERROR;
			this.setNotification(
				id,
				'文件【' + task.filename + '】转码失败。' + [...errors].join('') + '请到左侧的指令面板查看详细原因。',
				NotificationLevel.error,
			);
			this.emit(FFBoxServiceEvent.taskUpdate, {
				id,
				content: task,
			});
			this.queueAssign();
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

		this.emit(FFBoxServiceEvent.taskUpdate, {
			id,
			content: task,
		});
	}

	/**
	 * 暂停单个任务
	 * 【TASK_RUNNING】 => 【TASK_PAUSED】
	 * @param id 任务 id
	 */
	public taskPause(id: number): void {
		var task = this.tasklist[id];
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_RUNNING || !task.ffmpeg)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：暂停`);
		}
		task.status = TaskStatus.TASK_PAUSED;
		task.ffmpeg!.pause();
		task.lastPaused = new Date().getTime() / 1000;
		this.emit(FFBoxServiceEvent.taskUpdate, {
			id,
			content: task,
		});
	}

	/**
	 * 继续执行单个任务
	 * 【TASK_PAUSED】 => 【TASK_RUNNING】
	 * @param id 任务 id
	 */
	public taskResume(id: number): void {
		var task = this.tasklist[id];
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_PAUSED || !task.ffmpeg)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：继续`);
		}
		task.status = TaskStatus.TASK_RUNNING;
		var nowRealTime = new Date().getTime() / 1000;
		for (const item of task.taskProgress.normal) {
			item.realTime += nowRealTime - task.lastPaused;
		}
		for (const item of task.taskProgress.size) {
			item.realTime += nowRealTime - task.lastPaused;
		}
		task.ffmpeg!.resume();
		this.emit(FFBoxServiceEvent.taskUpdate, {
			id,
			content: task,
		});
	}

	// 【TASK_PAUSED / TASK_STOPPING / TASK_FINISHED】 => 【TASK_STOPPED】
	/**
	 * 重置任务（收尾/强行，根据状态决定）
	 * @param id 任务 id
	 */
	public taskReset (id: number) {
		var task = this.tasklist[id];
		if (!task) {
			throw Error(`任务不存在！任务 id：${id}`);
		} else if (!(task.status === TaskStatus.TASK_PAUSED || task.status === TaskStatus.TASK_STOPPING || task.status === TaskStatus.TASK_FINISHED)) {
			throw Error(`状态机执行异常！任务 id：${id}，操作：重置`);
		}
		// if 语句两个分支的代码重合度很高，区分的原因是因为暂停状态下重置是异步的
		if (task.status === TaskStatus.TASK_PAUSED) {				// 暂停状态下重置
			task.status = TaskStatus.TASK_STOPPING;
			task.ffmpeg!.exit(() => {
				task.status = TaskStatus.TASK_STOPPED;
				task.ffmpeg = null;
				this.emit(FFBoxServiceEvent.taskUpdate, {
					id,
					content: task,
				});
			});
		} else if (task.status === TaskStatus.TASK_STOPPING) {		// 正在停止状态下强制重置
			task.status = TaskStatus.TASK_STOPPED;
			task.ffmpeg!.forceKill(() => {
				task.ffmpeg = null;
				this.emit(FFBoxServiceEvent.taskUpdate, {
					id,
					content: task,
				});
			});
		} else if (task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR) {		// 完成状态下重置
			task.status = TaskStatus.TASK_STOPPED;
		}
		this.emit(FFBoxServiceEvent.taskUpdate, {
			id,
			content: task,
		});
	}

	/**
	 * 获取【正在运行】的任务数
	 */
	public getWorkingTaskCount (): number {
		let count: number = 0;
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
	public getQueueTaskCount (): number {
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
		this.emit(FFBoxServiceEvent.workingStatusUpdate, { value });
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
				if (count++ < startFrom) {
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
		if (this.getQueueTaskCount() === 0) {			// 遍历完了也没有开始新任务，此处 queueTaskCount 用于代替 started_atLeast
			this.setWorkingStatus(WorkingStatus.stopped);
		}
	}

	/**
	 * 暂停处理队列
	 */
	public queuePause() {
		for (const [id, task] of Object.entries(this.tasklist)) {
			if (task.status === TaskStatus.TASK_RUNNING) {
				this.taskPause(parseInt(id));
			}
		}
	}

	/**
	 * 获取所有通知（按时间排序）
	 */
	public getAllNotifications(): Array<Notification & { id: number }> {
		let allNotifications: Array<Notification & { id: number }> = [];
		this.globalTask.notifications.forEach((value) => {
			allNotifications.push({ id: -1, ...value });
		});
		Object.entries(this.tasklist).forEach(([id, task]) => {
			task.notifications.forEach((value) => {
				allNotifications.push({ id: parseInt(id), ...value });
			})
		});
		allNotifications.sort((a, b) => {
			return a.time > b.time ? 1 : -1;
		})
		return allNotifications;
	}
	

	/**
	 * 收到 cmd 内容通用回调
	 * @param id 任务 id
	 * @param text 文本
	 * @param append 附加到末尾，默认 true
	 */
	private setCmdText(id: number, text: string, append: boolean = true): void {
		let task: ServiceTask;
		if (id === -1) {
			task = this.globalTask;
		} else {
			task = this.tasklist[id];
		}
		if (!append) {
			task.cmdData = text;
		} else {
			if (text.length) {
				if (task.cmdData.slice(-1) != '\n') {
					task.cmdData.concat('\n');
				}
				task.cmdData.concat(text);
			}
		}
		this.emit(FFBoxServiceEvent.cmdUpdate, {
			id: 0,
			content: text,
		});
	}

	/**
	 * 任务通知，emit 事件并存储到任务中
	 * @param id 
	 * @param content 
	 * @param level 
	 */
	private setNotification(id: number, content: string, level: NotificationLevel): void {
		this.emit(FFBoxServiceEvent.taskNotification, {
			id,
			content,
			level,
		});
		let task: ServiceTask;
		if (id === -1) {
			task = this.globalTask;
		} else {
			task = this.tasklist[id];
		}
		task.notifications.push({
			time: new Date().getTime(),
			content,
			level,
		});
	}


}
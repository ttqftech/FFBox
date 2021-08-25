import { ServiceBridge } from '@/electron/bridge/serviceBridge'
import { FFmpeg } from '../service/FFmpegInvoke'

export interface FFBoxServiceInterface {
	initFFmpeg(): void;
	getFFmpegVersion(): void;
	taskAdd(filePath: string, fileName: string, outputParams?: OutputParams): void;
	getNewlyAddedTaskIds(): void;
	taskDelete(id: number): void;
	taskStart(id: number): void;
	taskPause(id: number, startFromBehind?: boolean): void;
	taskResume(id: number): void;
	taskReset(id: number): void;
	getTaskList(): void;
	getTask(id: number): void;
	queueAssign(startFrom?: number): void;
	queuePause(): void;
	deleteNotification(taskId: number, index: number): void;
	setParameter(ids: Array<number>, param: OutputParams): void;
	activate(machineCode: string, activationCode: string): boolean | void;
	trailLimit_stopTranscoding(id: number): void;
}

export interface FFBoxServiceEventParam {
	ffmpegVersion: { content: string };
	newlyAddedTaskIds: { content: Array<number> };
	workingStatusUpdate: { value: WorkingStatus };
	tasklistUpdate: { content: Array<number> };
	taskUpdate: { id: number; content: Task };
	cmdUpdate: { id: number, content: string, append: boolean };
	progressUpdate: { id: number, content: any };
	taskNotification: { id: number, content: string, level: NotificationLevel };
}

export type FFBoxServiceEvent = {
	[K in keyof FFBoxServiceEventParam]: (arg: FFBoxServiceEventParam[K]) => void;
}

export type FFBoxServiceEventApi = {
	event: keyof FFBoxServiceEventParam,
	payload: FFBoxServiceEventParam[keyof FFBoxServiceEventParam],
}

export interface FFBoxServiceFunctionApi {
	function: keyof FFBoxServiceInterface;
	args: Parameters<FFBoxServiceInterface[keyof FFBoxServiceInterface]>;	// 数组形式，按顺序传入参数
}

export interface OutputParams {
	input: any;
	video: any;
	audio: any;
	output: any;
}

export enum TaskStatus {
	TASK_DELETED = -2,
	TASK_PENDING = -1,
	TASK_STOPPED = 0,
	TASK_RUNNING = 1,
	TASK_PAUSED = 2,
	TASK_STOPPING = 3,
	TASK_FINISHING = 4,
	TASK_FINISHED = 5,
	TASK_ERROR = 6,
}

export interface FFmpegProgress {
	frame: number;
	fps: number;
	q: number;
	size: number;		// kB
	time: number;		// 秒
	bitrate: number;	// kbps
	speed: number;
}

export enum NotificationLevel {
	info = 0,
	ok = 1,
	warning = 2,
	error = 3,
}

export interface Notification {
	time: number;
	content: string;
	level: NotificationLevel;
}

export interface Task {
	fileName: string;
	filePath: string;
	before: {
		format: string;
		duration: number;
		vcodec: string;
		acodec: string;
		vresolution: string;
		vframerate: number;
		vbitrate: number;
		abitrate: number;
	};
	after: OutputParams;
	paraArray: Array<string>;
	status: TaskStatus;
	progressHistory: {
		normal: Array<{
			realTime: number;
			mediaTime: number;
			frame: number;
		}>
		size: Array<{
			realTime: number;
			size: number;
		}>
		// 涉及到的时间单位均为 s
		lastStarted: number;
		elapsed: number;		// 暂停才更新一次，因此记录的并不是实时的任务时间
		lastPaused: number;		// 既用于暂停后恢复时计算速度，也用于统计任务耗时
	};
	cmdData: string;
	errorInfo: Array<string>;
	notifications: Array<Notification>;
}

export interface ServiceTask extends Task {
	ffmpeg: FFmpeg | null;
}

export interface UITask extends Task {
	progress: {
		progress: number;
		bitrate: number;
		speed: number;
		time: number;
		frame: number;
	};
	progress_smooth: {
		progress: number;
		bitrate: number;
		speed: number;
		time: number;
		frame: number;
	};
	dashboardTimer: number;
}

export enum WorkingStatus {
	paused = -1,
	stopped = 0,
	running = 1,
}

export interface Server {
	tasks: Array<UITask>;
	ffmpegVersion: string;
	workingStatus: WorkingStatus;
	progress: number;	// 由每个任务更新时计算出来
}

export interface StoreState {
	// 界面类
	showSponsorCenter: boolean;
	showInfoCenter: boolean;
	listSelected: number;
	paraSelected: number;
	draggerPos: number;
	// 非界面类
	notifications: Array<Notification>;
	unreadNotificationCount: number;
	servers: {[key: string]: Server};
	serviceBridges: {[key: string]: ServiceBridge};
	currentServerName: string;
	selectedTask: Set<string>;
	globalParams: OutputParams;
	overallProgressTimerID: any;
	machineCode: string;
	functionLevel: number;
}

export interface BaseComboItem {
	sName: string;
	lName: string;
	imageName?: string;
	imageOffset?: number;
	description?: string;
}

export type Parameter = {
	mode: 'slider',
	parameter: string,
	display: string,
	step: number,	// 档位数量，无档置 0
	tags: Map<number, string>,	// 刻度
	valueToText: (value: any) => string,	// 将值转换为供 UI 显示的文字
	valueProcess: (value: any) => number,	// 调整滑块时作为中间过程调用，一般用于吸附、档位等功能
	valueToParam: (value: any) => string,	// 将值转换为供 ffmpeg 识别的参数值
} | {
	mode: 'combo',
	parameter: string,
	display: string,
	items: Array<BaseComboItem>,
}

export interface NormalApiWrapper<T> {
	status: number;
	message: string;
	data: T;
}

export interface FFBoxVersion {
	version: string;
	buildNumber: number;
}

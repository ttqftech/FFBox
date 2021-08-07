import { FFmpeg } from '../service/FFmpegInvoke'

export enum FFBoxServiceEvent {
	ffmpegVersion = 'ffmpegVersion',	// content: string
	workingStatusUpdate = 'workingStatusUpdate',	// value: WorkingStatus
	tasklistUpdate = 'tasklistUpdate',	// content: Array<number>
	taskUpdate = 'taskUpdate',	// id: number, content: ServiceTask
	cmdUpdate = 'cmdUpdate',	// id: number, content: string
	progressUpdate = 'progressUpdate',		// id: number, content: {...}
	taskNotification = 'taskNotification',	// id: number, content: string, level: NotificationLevel
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

export interface ServiceTask {
	// 服务端与客户端保持同步
	fileName: string;
	filePath: string;
	before: {
		format: string;
		duration: string;
		vcodec: string;
		acodec: string;
		vresolution: string;
		vframerate: string;
		vbitrate: string;
		abitrate: string;
	};
	after: any;
	paraArray: Array<string>;
	status: TaskStatus;
	taskProgress: {
		normal: Array<{
			realTime: number;
			mediaTime: number;
			frame: number;
		}>
		size: Array<{
			realTime: number;
			size: number;
		}>
	};
	cmdData: string;
	errorInfo: Array<string>;
	lastPaused: number;		// 用于暂停后恢复时计算速度
	notifications: Array<Notification>;
	// 仅存在于服务端
	ffmpeg?: FFmpeg | null;
	// 仅存在于客户端
	progress?: {
		progress: number;
		bitrate: number;
		speed: number;
		time: number;
		frame: number;
	};
	progress_smooth?: {
		progress: number;
		bitrate: number;
		speed: number;
		time: number;
		frame: number;
	};
	dashboardTimer?: number;
}

export enum WorkingStatus {
	paused = -1,
	stopped = 0,
	running = 1,
}

export interface Server {
	tasks: Array<ServiceTask>;
	ffmpegVersion: string;
	workingStatus: WorkingStatus;
	progress: 0.0;	// 由每个任务更新时计算出来
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
	servers: {[key: string]: Server};
	currentServerName: string;
	selectedTask: Set<string>;
	globalParams: OutputParams;
	overallProgressTimerID: any;
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
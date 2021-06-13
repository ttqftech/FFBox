import { FFmpeg } from './FFmpegInvoke'

export enum FFBoxServiceEvent {
	ffmpegVersion = 'ffmpegVersion',	// content: string
	tasklistUpdate = 'tasklistUpdate',	// content: Array<number>
	taskUpdate = 'taskUpdate',	// id: number, content: ServiceTask
	cmdUpdate = 'cmdUpdate',	// id: number, content: string
	progressUpdate = 'progressUpdate',		// id: number, content: {...}
	taskNotification = 'taskNotification',	// id: number, content: string, level: NotificationLevel
	workingStatusUpdate = 'workingStatusUpdate',	// value: WorkingStatus
}

export interface outputParams {
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

export interface Notification {
	time: number;
	content: string;
	level: NotificationLevel;
}

export interface ServiceTask {
	filename: string,
	filepath: string,
	before: {
		format: string,
		duration: string,
		vcodec: string,
		acodec: string,
		vresolution: string,
		vframerate: string,
		vbitrate: string,
		abitrate: string,
	},
	after: any,
	paraArray: Array<string>,
	ffmpeg: FFmpeg | null,
	status: TaskStatus,
	taskProgress: {
		normal: Array<{
			realTime: number,
			mediaTime: number,
			frame: number;
		}>
		size: Array<{
			realTime: number,
			size: number;
		}>
	},
	lastPaused: number,		// 用于暂停后恢复时计算速度
	cmdData: string,
	notifications: Array<Notification>;
	errorInfo: Array<string>,
}

export enum NotificationLevel {
	info = 0,
	ok = 1,
	warning = 2,
	error = 3,
}

export enum WorkingStatus {
	paused = -1,
	stopped = 0,
	running = 1,
}
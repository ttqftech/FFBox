// import { ServiceBridge } from '@renderer/bridge/serviceBridge';
// import { FFmpeg } from '@main/service/FFmpegInvoke';

export interface FFBoxServiceInterface {
	initFFmpeg(): void;
	getFFmpegVersion(): void;
	taskAdd(fileBaseName: string, outputParams?: OutputParams): Promise<number>;
	mergeUploaded(id: number, hashs: Array<string>): void;
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
	workingStatusUpdate: { value: WorkingStatus };
	tasklistUpdate: { content: Array<number> };
	taskUpdate: { id: number; content: Task };
	cmdUpdate: { id: number; content: string; append: boolean };
	progressUpdate: { id: number; content: any };
	taskNotification: { id: number; content: string; level: NotificationLevel };
}

export type FFBoxServiceEvent = {
	[K in keyof FFBoxServiceEventParam]: (arg: FFBoxServiceEventParam[K]) => void;
};

export type FFBoxServiceEventApi = {
	event: keyof FFBoxServiceEventParam;
	payload: FFBoxServiceEventParam[keyof FFBoxServiceEventParam];
};

export interface FFBoxServiceFunctionApi {
	function: keyof FFBoxServiceInterface;
	args: Parameters<FFBoxServiceInterface[keyof FFBoxServiceInterface]>;	// 数组形式，按顺序传入参数
}

export interface OutputParams {
	input: OutputParams_input;
	video: OutputParams_video;
	audio: OutputParams_audio;
	output: OutputParams_output;
}

export type OutputParams_input = {
	mode: 'standalone';
	// 暂定 begin end 仅支持在独立模式下切割时长
	begin?: string;
	end?: string;
} & {
	files: Array<InputFile>;
	hwaccel: string;
};

export type OutputParams_video = {
	vcodec: string;
	vencoder: string;
	resolution: string;
	framerate: string;
	ratecontrol: string;
	ratevalue: number;
	detail: Record<string, unknown>;
}

export type OutputParams_audio = {
	acodec: string;
	aencoder: string;
	ratecontrol: string;
	ratevalue: number;
	vol: number;
	detail: Record<string, unknown>;
};

export type OutputParams_output = {
	format: string;
	moveflags: boolean;
	filename: string;
};

export interface InputFile {
	filePath?: string;		// 本地模式下直接是文件全路径，网络模式下 merge 之后获得的文件名填充到此处
}

export enum TaskStatus {
	TASK_DELETED = -2,
	TASK_INITIALIZING = -1,
	TASK_STOPPED = 0,
	TASK_RUNNING = 1,
	TASK_PAUSED = 2,
	TASK_STOPPING = 3,
	TASK_FINISHING = 4,
	TASK_FINISHED = 5,
	TASK_ERROR = 6,
}

export enum TransferStatus {
	normal = 'normal',
	uploading = 'uploading',
	downloading = 'downloading',
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

export type SingleProgressLog = Array<[number, number]>;

/**
 * 文件路径处理规则：
 * 添加任务时调用 mainVue 的 addTask，传入 baseName，并且把输入添加到 input.files 中。但此项中的 filePath 属性，本地任务直接添加绝对路径，远程任务则留空
 * FFBoxService 收到指令后直接加入到任务列表。然后，本地任务直接 gen 一个 paraArray，远程任务需要马上 gen 一个 outputFile，然后才 gen paraArray
 * 远程任务上传完成后调用 mergeUploaded，然后把刚才留空的路径用 hash 补上。
 * 此时，任务均具有 fileBaseName 属性。对于本地任务，input.files 具有绝对路径，outputFile 暂时留空；对于远程任务，input.files 具有绝对路径（但文件名是 hash），outputFile 具有绝对路径（但文件名是 hash.[ext]）
 * 任务开始时，本地任务根据输出参数 gen 一个 outputFile（不参与到 paraArray 中，只是为了后续打开文件），远程任务直接使用之前计算的 outputFile 对 paraArray 进行 override
 * 任务结束后，双击任务时，本地任务直接打开 outputFile 的文件，远程任务则弹出文件保存窗口，然后通过 IPC 触发 webContents.downloadURL，继而触发 will-download 事件
 */
export interface Task {
	fileBaseName: string;
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
	progressLog: {
		time: SingleProgressLog;
		frame: SingleProgressLog;
		size: SingleProgressLog;
		// 涉及到的时间单位均为 s
		lastStarted: number;
		elapsed: number;		// 暂停才更新一次，因此记录的并不是实时的任务时间
		lastPaused: number;		// 既用于暂停后恢复时计算速度，也用于统计任务耗时
	};
	cmdData: string;
	errorInfo: Array<string>;
	notifications: Array<Notification>;
	outputFile: string;		// 对于本地任务，表示生成文件的绝对路径；对于远程任务，省略文件夹名 mergeUploaded 后生成。如无则为 ''
}

export interface ServiceTask extends Task {
	// ffmpeg: FFmpeg | null;
	// TODO
	ffmpeg: any | null;
	remoteTask: boolean;	// 本地/远程任务对于 service 来说，对输出文件名的处理方式不同；对于 UI 来说，只需要判断 IP 是否为 localhost 即决定是下载还是直接打开了
}

export interface UITask extends Task {
	dashboard: {
		progress: number;
		bitrate: number;
		speed: number;
		time: number;
		frame: number;
		transferred: number;
		transferSpeed: number;
	};
	dashboard_smooth: {
		progress: number;
		bitrate: number;
		speed: number;
		time: number;
		frame: number;
		transferred: number;
		transferSpeed: number;
	};
	dashboardTimer: number;
	transferStatus: TransferStatus;
	transferProgressLog: {
		transferred: SingleProgressLog;
		total: number;
		// 涉及到的时间单位均为 s
		// lastStarted: number;
		// elapsed: number;		// 暂停才更新一次，因此记录的并不是实时的任务时间
		// lastPaused: number;		// 既用于暂停后恢复时计算速度，也用于统计任务耗时
	};
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
	overallProgressTimerID: any;
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
	// serviceBridges: { [key: string]: ServiceBridge };
	serviceBridges: { [key: string]: any };
	currentServerName: string;
	selectedTask: Set<string>;
	globalParams: OutputParams;
	downloadMap: Map<string, { serverName: string, taskId: number }>;
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
};

export interface NormalApiWrapper<T> {
	status: number;
	message: string;
	data: T;
}

export interface FFBoxVersion {
	version: string;
	buildNumber: number;
}

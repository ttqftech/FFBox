import { Task, TransferStatus, SingleProgressLog, WorkingStatus, Notification } from '@common/types';
import { ServiceBridge } from '@renderer/bridges/serviceBridge'

export interface UITask extends Task {
	dashboard: {
		progress: number;
		bitrate: number;
		speed: number;
		time: number;
		frame: number;
		size: number;
		transferred: number;
		transferSpeed: number;
	};
	dashboard_smooth: {
		progress: number;
		bitrate: number;
		speed: number;
		time: number;
		frame: number;
		size: number;
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

export interface ServerData {
	id: string;			// 仅供前端一次性使用
	name: string;		// 默认为空
	nickName?: string;	// 暂不支持
	tasks: UITask[];
	notifications: Notification[];
	ffmpegVersion: string;
	workingStatus: WorkingStatus;
	progress: number;	// 由每个任务更新时计算出来
	overallProgressTimerID: any;
}

export interface Server {
	data: ServerData;
	entity: ServiceBridge;
}

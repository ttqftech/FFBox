import CryptoJS from 'crypto-js';
import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import os from 'os';
import fs from 'fs';
import fsPromise from 'fs/promises';
import { utimes } from 'utimes';
import path from 'path';
import { ServiceTask, Task, TaskStatus, OutputParams, FFBoxServiceEvent, Notification, NotificationLevel, FFmpegProgress, WorkingStatus, FFBoxServiceInterface, FFmpegInfo, EncoderDetail, FFmpegCodecDetail, FFmpegFilterDetail, FFmpegMuxerDetail, FFmpegDemuxerDetail, Frame, Run } from '@common/types';
import { validUntil } from '@common/constants';
import { TaskList } from './TaskList';
import i11n from '@common/i11n/i11n';
import { genTaskOutputFiles, getFFmpegParaArray } from '@common/getFFmpegParaArray';
import localConfig from '@common/localConfig';
import { parseFFmpegCodecsToCodecsList, parseFFmpegMuDeMuxersToList } from '@common/params/parser';
import { getInitialServiceTask, TypedEventEmitter, replaceOutputParams, getOutputDuration, getOutputFileTime, getTaskLatestOutputParams, getNewRun, getTimeString } from '@common/utils';
import { getOutputFileBaseName } from '@common/params/formats';
import { getMachineId, log } from './utils';
import { getLimitaion } from '@common/limitaions';
import { isV2Code, isLegacyCode, verifyActivationCode } from '@common/activation';
import { FFmpeg } from './FFmpegInvoke';
import { YieldManager } from './YieldManager';
import { webhookManager } from './webhookManager';
import { UserManager } from './userManager';
import { ServerSettingsManager } from './serverSettingsManager';

const yieldThreshold = 50;

export interface FFBoxServerEvent {
	serverReady: () => void;
	serverError: (arg: { error: Error }) => void;
	serverClose: () => void;
}

export class FFBoxService extends (EventEmitter as new () => TypedEventEmitter<FFBoxServiceEvent & FFBoxServerEvent>) implements FFBoxServiceInterface {
	public taskList: TaskList = new TaskList();
	public yieldManager: YieldManager = new YieldManager();
	private asyncList: Set<{ type: string }> = new Set();
	public workingStatus: WorkingStatus = WorkingStatus.idle;
	public ffmpegPath = '';
	public ffprobePath = '';
	public ffmpegInfo: FFmpegInfo = { version: '', scanning: false, videoEncodersCount: 0, audioEncodersCount: 0, filtersCount: 0, muxersCount: 0, demuxersCount: 0 };
	public ffmpegCodecs: { video: FFmpegCodecDetail[], audio: FFmpegCodecDetail[]; } | null = null;
	public ffmpegFormats: { muxer: FFmpegMuxerDetail[], demuxer: FFmpegDemuxerDetail[]; } | null = null;
	public ffmpegFilters: FFmpegFilterDetail[] = [];
	public notifications: Notification[] = [];
	private latestNotificationId = 0;
	public functionLevel = 20;
	public machineId: string | undefined;
	// 管理器
	public userManager: UserManager = new UserManager();
	public settings: ServerSettingsManager = new ServerSettingsManager();
	// 帧扫描状态跟踪：key = `${id}_${fileIndex}_${videoStreamIndex}_${filePath}`
	private frameScanStatus: Map<string, {
		status: 'scanning' | 'completed' | 'stopped';
		type: 'fast' | 'full';
		promise?: Promise<Frame[]>;
		process?: ChildProcess;
		frames?: Frame[];
	}> = new Map();
	// 缩略图缓存跟踪：key = `${id}_${fileIndex}_${videoStreamIndex}_${filePath}`
	private thumbnailCache: Map<string, {
		status: 'generating' | 'completed' | 'stopped';
		promise?: Promise<Buffer>;
		process?: ChildProcess;
		data?: Buffer;
		contentType?: string;
		params: {
			width: number;
			height: number;
			density: 'H' | 'M';
		};
	}> = new Map();

	constructor() {
		super();
		log.info('正在初始化 FFBox 服务。');
		setTimeout(async () => {
			this.initActivationInfo();
			await this.initSettings();
			webhookManager.load();
			// this.initFFmpeg();	// 在 initSetting 中已调用
		}, 0);
	}

	private asyncListTimer: number | null = null;
	private asyncListOp(op: '+' | '-', entry: { type: string }) {
		if (op === '+') {
			this.asyncList.add(entry);
		} else {
			this.asyncList.delete(entry);
		}
		if (!this.asyncListTimer) {
			this.emit('asyncListUpdate', { list: [...this.asyncList] });
			const lastAsyncCount = this.asyncList.size;
			this.asyncListTimer = setTimeout(() => {
				this.asyncListTimer = null;
				if (lastAsyncCount !== this.asyncList.size) this.emit('asyncListUpdate', { list: [...this.asyncList] });
			}, 100) as any;
		}
	}

	private async initActivationInfo() {
		this.machineId = getMachineId();
		if (validUntil !== undefined && new Date() > validUntil) {
			this.setNotification(undefined, 'FFBox 内部版本已过期，当前版本功能受限，请更新版本后使用。', NotificationLevel.warning);
			log.warn('FFBox 内部版本已过期，当前版本功能受限，请更新版本后使用。');
			this.functionLevel = 0;
		} else {
			const activationCode = await localConfig.get('userInfo.activationCode') as string;
			if (activationCode) {
				const result = await this.activate(activationCode);
				if (result !== false) {
					log.info(`已读取激活信息，人品值=${result}`);
				} else {
					log.warn('激活信息无效');
				}
			} else {
				log.info('未读取到激活信息');
			}
		}
	}

	/**
	 * 从本地存储初始化设置
	 */
	public async initSettings(): Promise<void> {
		const settings = await this.settings.refresh();
		log.info(`转码设置已读取`);

		this.initFFmpeg();

		// TODO
		const lastStatusTasks = await localConfig.get('lastStatus.tasks') as { taskName: string; after: OutputParams; }[];
		if (settings.preserveUnfinishedTasks) {
			try {
				if (lastStatusTasks.length) {
					this.setNotification(undefined, `服务器上次退出时有未完成任务 ${lastStatusTasks.length} 个，正在重新添加到任务列表`, NotificationLevel.info);
				}
				log.info(`正在恢复上次退出时未完成的 ${lastStatusTasks.length} 个任务`);
				for (const task of lastStatusTasks) {
					this.taskAdd(task.taskName, task.after);
				}
				await localConfig.set('lastStatus.tasks', []);
			} catch (error) {}
		} else {
			try {
				if (lastStatusTasks.length) {
					await localConfig.set('lastStatus.tasks', []);
				}
			} catch (error) {}
		}
	}

	/**
	 * 检测 ffmpeg 版本，并 emit ffmpegInfo
	 * @emits ffmpegInfo
	 */
	public async initFFmpeg(): Promise<void> {
		function resolveFFmpegPaths(inputPath: string): { ffmpegPath: string; ffprobePath: string } {
			const ext = process.platform === 'win32' ? '.exe' : '';
			let isDir = false;
			try {
				isDir = fs.statSync(inputPath).isDirectory();
			} catch {
				if (!path.extname(inputPath) && fs.existsSync(inputPath + ext)) {
					// 无扩展名但加上 .exe 后存在，则视为文件（Windows 的 spawn 会自动补全 .exe）
					isDir = false;
				} else if (path.dirname(inputPath) === '.') {
					// 裸文件名（`ffmpeg`）交给 spawn 解析
					isDir = false;
				} else {
					// 路径不存在时，但又能解析出 dirname，则通过扩展名判断是否为目录
					isDir = !path.extname(inputPath);
				}
			}
			if (isDir) {
				return {
					ffmpegPath: path.join(inputPath, `ffmpeg${ext}`),
					ffprobePath: path.join(inputPath, `ffprobe${ext}`),
				};
			} else {
				const ffmpegPath = path.extname(inputPath) ? inputPath : inputPath + ext;
				return {
					ffmpegPath,
					ffprobePath: path.join(path.dirname(ffmpegPath), `ffprobe${ext}`),
				};
			}
		}

		let asyncEntry = { type: `检查 ffmpeg 版本` };
		this.asyncListOp('+', asyncEntry);
		if (this.settings.get().customFFmpegPath) {
			log.info(`已手动指定 ffmpeg 路径为 ${this.settings.get().customFFmpegPath}，检查版本。`);
			const resolved = resolveFFmpegPaths(this.settings.get().customFFmpegPath);
			this.ffmpegPath = resolved.ffmpegPath;
			this.ffprobePath = resolved.ffprobePath;
		} else {
			log.info('检查 FFmpeg 路径和版本。');
			this.ffmpegPath = 'ffmpeg';
			if (process.platform === 'darwin') {
				await fsPromise.access(path.join(process.execPath, '../ffmpeg'), fs.constants.X_OK).then((result) => {
					// 【程序目录】沙箱运行模式，service 与 ffmpeg 处在同一层级（此时 execPath 就是 FFBox.app 所在的绝对路径）
					this.ffmpegPath = path.join(process.execPath, '../ffmpeg');
				}).catch(() => {});
				await fsPromise.access('/usr/local/bin/ffmpeg', fs.constants.X_OK).then((result) => {
					// 【系统目录】macOS 只允许用户往 /usr/local/bin/ 放东西（而不能是 /usr/bin/），且此种情况下需要完整路径才能引用
					this.ffmpegPath = '/usr/local/bin/ffmpeg';
				}).catch(() => {});
			}
			if (process.platform === 'linux') {
				await fsPromise.access(path.join(process.execPath, '../ffmpeg'), fs.constants.X_OK).then((result) => {
					// 【程序目录】deb 沙箱运行模式。service 与 ffmpeg 处在同一目录（此时 execPath 是 /opt/FFBox/FFBoxService，cwd 是 /home/[用户名]）
					this.ffmpegPath = path.join(process.execPath, '../ffmpeg');
				}).catch(() => {});
				await fsPromise.access(path.join(process.cwd(), 'ffmpeg'), fs.constants.X_OK).then((result) => {
					// 【程序目录】AppImage 沙箱运行模式，读取 .AppImage 同级目录（此时 execPath 是 /tmp/.mount_FFBox_[hash]/FFBoxService，cwd 就是终端的 pwd）
					this.ffmpegPath = path.join(process.cwd(), 'ffmpeg');
				}).catch(() => {});
				// 【系统目录】Linux 下 /usr/local/bin/ 和 /usr/bin/ 里的东西均能被直接引用，包括终端执行和沙箱执行，因此此处不需要进行处理
				// console.log('路径', process.execPath, process.cwd(), __dirname, this.ffmpegPath);
				// this.ffmpegVersion = `路径 ${process.execPath}, ${process.cwd()}, ${__dirname}, ${this.ffmpegPath}`;
			}
			const resolved = resolveFFmpegPaths(this.ffmpegPath);
			this.ffmpegPath = resolved.ffmpegPath;
			this.ffprobePath = resolved.ffprobePath;
		}

		const ffmpegVersion = await new Promise<string>(async (resolve) => {
			for (let i = 0, ok = false; i < 3 && !ok; i++) {
				const ffmpeg = new FFmpeg(this.ffmpegPath, 1);
				ffmpeg.on('version', async ({ content }) => {
					ok = true;
					resolve(content || '');
				});
				// ffmpeg.once('closed', () => { 
				// });
				await new Promise((r) => setTimeout(() => {
					if (!ok) {
						log.error(`在检查 ffmpeg 版本时，ffmpeg 成功启动，但 stdio 中没有接收到任何消息。重试。`);
						r(0);
					}
				}, 1500));
			}
			// 连续 3 次都不 OK，返回空字符串
			resolve('');
		});
		if (ffmpegVersion) {
			this.ffmpegInfo.version = ffmpegVersion;
			this.emitFFmpegInfo();
			const lastFFmpegVersion = await localConfig.get('ffmpegInfo.version');
			if (lastFFmpegVersion === ffmpegVersion) {
				try {
					const storedFFmpegInfo = await localConfig.get('ffmpegInfo') as any;
					this.ffmpegInfo.audioEncodersCount = storedFFmpegInfo.audioEncodersCount ?? 0;
					this.ffmpegInfo.videoEncodersCount = storedFFmpegInfo.videoEncodersCount ?? 0;
					this.ffmpegInfo.muxersCount = storedFFmpegInfo.muxersCount ?? 0;
					this.ffmpegInfo.demuxersCount = storedFFmpegInfo.demuxersCount ?? 0;
					this.ffmpegInfo.filtersCount = storedFFmpegInfo.filtersCount ?? 0;
					this.ffmpegCodecs = {
						video: JSON.parse(storedFFmpegInfo.videoCodecs),
						audio: JSON.parse(storedFFmpegInfo.audioCodecs),
					};
					parseFFmpegCodecsToCodecsList(this.ffmpegCodecs);
					this.ffmpegFormats = {
						muxer: JSON.parse(storedFFmpegInfo.muxers),
						demuxer: JSON.parse(storedFFmpegInfo.demuxers),
					};
					parseFFmpegMuDeMuxersToList(this.ffmpegFormats);
					this.ffmpegFilters = JSON.parse(storedFFmpegInfo.filters) || [];
					log.info(`已获取 FFmpeg 路径 ${this.ffmpegPath} 版本 ${ffmpegVersion}。已从缓存中加载编码器和滤镜。`);
					this.emitFFmpegInfo();
				} catch (error) {
					log.info(`已获取 FFmpeg 路径 ${this.ffmpegPath} 版本 ${ffmpegVersion}。缓存中的编码器和滤镜不可用，即将获取编码器信息。`);
					setTimeout(() => {
						this.getFFmpegCodecsAndFilters();
					}, 100);
				}
			} else {
				log.info(`已获取 FFmpeg 路径 ${this.ffmpegPath} 版本 ${ffmpegVersion}。即将获取编码器信息。`);
				setTimeout(() => {
					this.getFFmpegCodecsAndFilters();
				}, 100);
			}
		} else {
			this.ffmpegInfo.version = '';
			this.emitFFmpegInfo();
		}
		this.asyncListOp('-', asyncEntry);
	}

	public async getFFmpegCodecsAndFilters(): Promise<void> {
		while (this.ffmpegInfo.scanning) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		this.ffmpegInfo.scanning = true;
		this.emitFFmpegInfo();

		const ffmpegPath = this.ffmpegPath;
		await new Promise((resolve, reject) => {
			// 获取 codecs
			const asyncEntryEncoders = { type: `获取 ffmpeg 编码器` };
			this.asyncListOp('+', asyncEntryEncoders);
			const ffmpeg = new FFmpeg(ffmpegPath, 3, ['-codecs']);
			ffmpeg.on('codecs', async (codecsResult) => {
				if (!codecsResult) { debugger; throw 'ub'; }
				log.info(`编码器概览扫描完成，支持视频编码 ${codecsResult.videoCodecs.length} 个、音频编码 ${codecsResult.audioCodecs.length} 个。即将扫描详细信息。`);
				// console.log(codecsResult);
				const videoFinalResult: FFmpegCodecDetail[] = [];
				const audioFinalResult: FFmpegCodecDetail[] = [];
				let videoEncodersCount = 0;
				let audioEncodersCount = 0;
				const asyncEntryVideoEncoder = { type: `获取 ffmpeg 视频编码器（${codecsResult.videoCodecs.length} 个）详细参数` };
				this.asyncListOp('+', asyncEntryVideoEncoder);
				for (const codec of codecsResult.videoCodecs) {
					const encoderNames = codec.encoders.length ? codec.encoders : [codec.name];
					const encoderDetails: (EncoderDetail & { name: string; })[] = [];
					videoEncodersCount += encoderNames.length;
					for (const encoderName of encoderNames) {
						if (this.ffmpegPath !== ffmpegPath) {
							this.asyncListOp('-', asyncEntryVideoEncoder);
							return;
						}
						// console.log(`正在读取 ${codec.name} ${encoder}`);
						await new Promise((resolve, _) => {
							const ffmpeg2 = new FFmpeg(ffmpegPath, 3, ['-hide_banner', '-h', `encoder=${encoderName}`]);
							ffmpeg2.on('codecs', (_, codecResult) => {
								// console.log(codecResult);
								encoderDetails.push({ name: encoderName, ...codecResult! });
								resolve(0);
							});
						});
					}
					videoFinalResult.push({
						name: codec.name,
						description: codec.description,
						encoders: encoderDetails,
					});
				}
				this.asyncListOp('-', asyncEntryVideoEncoder);
				log.info('视频编码器扫描结果', videoFinalResult);
				this.ffmpegInfo.videoEncodersCount = videoEncodersCount;
				this.emitFFmpegInfo();
				const asyncEntryAudioEncoder = { type: `获取 ffmpeg 音频编码器（${codecsResult.audioCodecs.length} 个）详细参数` };
				this.asyncListOp('+', asyncEntryAudioEncoder);
				for (const codec of codecsResult.audioCodecs) {
					const encoderNames = codec.encoders.length ? codec.encoders : [codec.name];
					const encoderDetails: (EncoderDetail & { name: string; })[] = [];
					audioEncodersCount += encoderNames.length;
					for (const encoderName of encoderNames) {
						if (this.ffmpegPath !== ffmpegPath) {
							this.asyncListOp('-', asyncEntryAudioEncoder);
							return;
						}
						// console.log(`正在读取 ${codec.name} ${encoder}`);
						await new Promise((resolve, _) => {
							const ffmpeg2 = new FFmpeg(ffmpegPath, 3, ['-hide_banner', '-h', `encoder=${encoderName}`]);
							ffmpeg2.on('codecs', (_, codecResult) => {
								// console.log(codecResult);
								encoderDetails.push({ name: encoderName, ...codecResult! });
								resolve(0);
							});
						});
					}
					audioFinalResult.push({
						name: codec.name,
						description: codec.description,
						encoders: encoderDetails,
					});
				}
				this.asyncListOp('-', asyncEntryAudioEncoder);
				log.info('音频编码器扫描结果', audioFinalResult);
				this.ffmpegInfo.audioEncodersCount = audioEncodersCount;
				this.emitFFmpegInfo();
				this.ffmpegCodecs = { video: videoFinalResult, audio: audioFinalResult };
				parseFFmpegCodecsToCodecsList(this.ffmpegCodecs);
				resolve(0);
			});
			ffmpeg.once('closed', () => { 
				this.asyncListOp('-', asyncEntryEncoders);
			});	
		});
		if (this.ffmpegPath !== ffmpegPath) {
			this.ffmpegInfo.scanning = false;
			return;
		}
		await new Promise((resolve, reject) => {
			// 获取 muxers/demuxers
			const asyncEntryFormats = { type: `获取 ffmpeg 复用器、解复用器` };
			this.asyncListOp('+', asyncEntryFormats);
			const ffmpeg = new FFmpeg(ffmpegPath, 4, ['-formats']);
			ffmpeg.on('formats', async (formatsResult) => {
				if (!formatsResult) { debugger; throw 'ub'; }
				log.info(`格式概览扫描完成，支持复用器 ${formatsResult.muxers.length} 个、解复用器 ${formatsResult.demuxers.length} 个。即将扫描详细信息。`);
				// console.log(formatsResult);
				const muxerFinalResult: FFmpegMuxerDetail[] = [];
				const demuxerFinalResult: FFmpegDemuxerDetail[] = [];
				const asyncEntryMuxer = { type: `获取 ffmpeg 复用器（${formatsResult.muxers.length} 个）详细参数` };
				this.asyncListOp('+', asyncEntryMuxer);
				for (const muxer of formatsResult.muxers) {
					// console.log(`正在读取 ${filter.name}`);
					if (this.ffmpegPath !== ffmpegPath) {
						this.ffmpegInfo.scanning = false;
						this.asyncListOp('-', asyncEntryMuxer);
						return;
					}
					await new Promise((resolve, _) => {
						const ffmpeg2 = new FFmpeg(ffmpegPath, 4, ['-hide_banner', '-h', `muxer=${muxer.name}`]);
						ffmpeg2.on('formats', (_, formatResult) => {
							if (!formatResult) { debugger; throw 'ub'; }
							muxerFinalResult.push({
								name: muxer.name,
								description: muxer.description,
								extensions: formatResult.commonExtensions || [],
								defaultVideoCodec: formatResult.defaultVideoCodec,
								defaultAudioCodec: formatResult.defaultAudioCodec,
								options: formatResult.options,
							});
							resolve(0);
						});
					});
				}
				this.asyncListOp('-', asyncEntryMuxer);
				log.info('复用器扫描结果', muxerFinalResult);
				this.ffmpegInfo.muxersCount = muxerFinalResult.length;
				this.emitFFmpegInfo();
				const asyncEntryDemuxer = { type: `获取 ffmpeg 解复用器（${formatsResult.demuxers.length} 个）详细参数` };
				this.asyncListOp('+', asyncEntryDemuxer);
				for (const demuxer of formatsResult.demuxers) {
					if (this.ffmpegPath !== ffmpegPath) {
						this.ffmpegInfo.scanning = false;
						this.asyncListOp('-', asyncEntryDemuxer);
						return;
					}
					// console.log(`正在读取 ${filter.name}`);
					await new Promise((resolve, _) => {
						const ffmpeg2 = new FFmpeg(ffmpegPath, 4, ['-hide_banner', '-h', `demuxer=${demuxer.name}`]);
						ffmpeg2.on('formats', (_, formatResult) => {
							if (!formatResult) { debugger; throw 'ub'; }
							demuxerFinalResult.push({
								name: demuxer.name,
								description: demuxer.description,
								extensions: formatResult.commonExtensions || [],
								isDevice: demuxer.isDevice,
								options: formatResult.options,
							});
							resolve(0);
						});
					});
				}
				this.asyncListOp('-', asyncEntryDemuxer);
				log.info('解复用器扫描结果', demuxerFinalResult);
				this.ffmpegInfo.demuxersCount = demuxerFinalResult.length;
				this.emitFFmpegInfo();
				this.ffmpegFormats = { muxer: muxerFinalResult, demuxer: demuxerFinalResult };
				parseFFmpegMuDeMuxersToList(this.ffmpegFormats);
				resolve(0);
			});
			ffmpeg.once('closed', () => { 
				this.asyncListOp('-', asyncEntryFormats);
			});
		});
		if (this.ffmpegPath !== ffmpegPath) {
			this.ffmpegInfo.scanning = false;
			return;
		}
		await new Promise((resolve, reject) => {
			// 获取 filters
			const asyncEntryFilters = { type: `获取 ffmpeg 滤镜` };
			this.asyncListOp('+', asyncEntryFilters);
			const ffmpeg = new FFmpeg(ffmpegPath, 5, ['-filters']);
			ffmpeg.on('filters', async (filtersResult) => {
				if (!filtersResult) { debugger; throw 'ub'; }
				log.info(`滤镜概览扫描完成，支持滤镜 ${filtersResult.length} 个。即将扫描详细信息。`);
				// console.log(filtersResult);
				const result: FFmpegFilterDetail[] = [];
				const asyncEntryFilterDetail = { type: `获取 ffmpeg 滤镜（${filtersResult.length} 个）详细参数` };
				this.asyncListOp('+', asyncEntryFilterDetail);
				for (const filter of filtersResult) {
					if (this.ffmpegPath !== ffmpegPath) {
						this.ffmpegInfo.scanning = false;
						this.asyncListOp('-', asyncEntryFilterDetail);
						return;
					}
					// console.log(`正在读取 ${filter.name}`);
					await new Promise((resolve, _) => {
						const ffmpeg2 = new FFmpeg(ffmpegPath, 5, ['-hide_banner', '-h', `filter=${filter.name}`]);
						ffmpeg2.on('filters', (_, codecResult) => {
							if (!codecResult) { debugger; throw 'ub'; }
							result.push({
								name: filter.name,
								description: filter.description,
								inputType: filter.inputType,
								outputType: filter.outputType,
								options: codecResult.options,
							});
							resolve(0);
						});
					});
				}
				this.asyncListOp('-', asyncEntryFilterDetail);
				log.info('滤镜扫描结果', result);
				this.ffmpegFilters = result;
				this.ffmpegInfo.scanning = false;
				this.ffmpegInfo.filtersCount = result.length;
				this.emitFFmpegInfo();
				resolve(0);
			});	
			ffmpeg.once('closed', () => { 
				this.asyncListOp('-', asyncEntryFilters);
			});
		});
		localConfig.set('ffmpegInfo', {
			version: this.ffmpegInfo.version,
			audioEncodersCount: this.ffmpegInfo.audioEncodersCount,
			videoEncodersCount: this.ffmpegInfo.videoEncodersCount,
			muxersCount: this.ffmpegInfo.muxersCount,
			demuxersCount: this.ffmpegInfo.demuxersCount,
			filtersCount: this.ffmpegInfo.filtersCount,
			videoCodecs: JSON.stringify(this.ffmpegCodecs!.video),
			audioCodecs: JSON.stringify(this.ffmpegCodecs!.audio),
			muxers: JSON.stringify(this.ffmpegFormats!.muxer),
			demuxers: JSON.stringify(this.ffmpegFormats!.demuxer),
			filters: JSON.stringify(this.ffmpegFilters),
		});
	}

	/**
	 * 向所有客户端更新当前 ffmpeg 版本
	 * @emits ffmpegInfo
	 */
	private emitFFmpegInfo(): void {
		this.emit('ffmpegInfo', this.ffmpegInfo);
	}

	/**
	 * 计算总进度
	 * 返回 [0, 1] 之间的值；无任务时返回 -1
	 */
	private calcOverallProgress(): number {
		let totalTime = 0.000001;
		let totalProcessedTime = 0;
		let notIdleTaskCount = 0;
		for (const status of [TaskStatus.idle_queued, TaskStatus.running, TaskStatus.paused, TaskStatus.paused_queued, TaskStatus.stopping, TaskStatus.finishing, TaskStatus.finished]) {
			for (const taskId of this.taskList.statusSets[status]) {
				notIdleTaskCount++;
				const task = this.taskList.getById(taskId);
				if (!task || !task.before[0]?.duration) continue;
				const outputDuration = getOutputDuration(task as any);
				// NaN 规则：如果 outputDuration 为 NaN，直接跳过此任务；如果只有 taskProgress 为 NaN，统计这个任务进度为 0
				if (outputDuration <= 0 || isNaN(outputDuration)) continue;
				totalTime += outputDuration;

				let taskProgress: number;
				if (status === TaskStatus.finished || status === TaskStatus.error) {
					taskProgress = 1;
				} else {
					const activeRun = task.runs[task.runs.length - 1];
					const currentTime = activeRun.progressLog.time.length > 0
						? activeRun.progressLog.time[activeRun.progressLog.time.length - 1][1]	// 有可能是 NaN
						: 0;
					taskProgress = Math.max(0, Math.min(1, currentTime / outputDuration));
					if (isNaN(taskProgress)) taskProgress = 0;
				}
				totalProcessedTime += taskProgress * outputDuration;
			}
		}
		const progress = notIdleTaskCount === 0 ? -1 : totalProcessedTime / totalTime;
		return progress;
	}
	private workingStatusUpdateThrottleTimer: number | null = null;
	private lastProgress = -1;	// 由于总体进度和 status 合并，queueStart 时第一个消息的进度是不对的，所以需要缓存
	/**
	 * 返回当前 workingStatus 与总进度信息（用于 API 请求和事件通知）
	 * 如果运行状态为停止（没有要继续完成的任务），progress 为 -1
	 */
	public getWorkingStatusInfo(): { workingStatus: WorkingStatus; progress: number } {
		const progress = this.calcOverallProgress();
		this.lastProgress = progress;
		return { workingStatus: this.workingStatus, progress };
	}
	/**
	 * 发送 workingStatus 事件（携带状态与进度信息）
	 * 如果运行状态为停止（没有要继续完成的任务），progress 为 -1
	 * @param workingStatus 队列状态变化时携带，仅状态变化时传入
	 * @emits workingStatus
	 */
	private emitWorkingStatusUpdate(workingStatus?: 'start' | 'stop' | 'pause'): void {
		// 有 workingStatus 传入，状态变化时，马上发送一个不计算进度的消息，否则进行节流
		if (workingStatus) {
			this.workingStatusUpdateThrottleTimer = null;
			this.emit('workingStatusUpdate', { workingStatus, progress: workingStatus === 'stop' ? -1 : this.lastProgress });
			return;
		}
		if (this.workingStatusUpdateThrottleTimer) {
			return;
		} else {
			this.workingStatusUpdateThrottleTimer = setTimeout(() => {
				this.workingStatusUpdateThrottleTimer = null;
			}, 150) as any
		}
		const progress = this.calcOverallProgress();
		this.lastProgress = progress;
		this.emit('workingStatusUpdate', { workingStatus, progress });
	}

	/**
	 * 向所有客户端更新单个任务
	 * runs 剥离 progressLog 和 cmdData 以减少数据量，它们分别由 progressUpdate 和 cmdUpdate 事件增量更新
	 * @param id 任务 id
	 * @param task 直接传入 task 可减少一次内存查找
	 */
	private emitTaskUpdate(id: number, task?: ServiceTask): void {
		const _task = task || this.taskList.getById(id);
		if (_task) {
			this.emit('taskUpdate', {
				taskId: id,
				task: {
					id: _task.id,
					taskName: _task.taskName,
					before: _task.before,
					status: _task.status,
					runs: _task.runs.map((run) => ({
						after: run.after,
						paraArray: run.paraArray,
						outputFiles: run.outputFiles,
						status: run.status,
						errorInfo: run.errorInfo,
						lastStarted: run.lastStarted,
						elapsed: run.elapsed,
						lastPaused: run.lastPaused,
					})),
				},
			});
		}
	}

	/**
	 * 新增单个任务（内部方法，由 taskAddBatch 和 taskCopy 调用）
	 * @param useManagedFilePaths true = 使用文件上传/改写路径模式（无 FileSystem 权限时，输出用 override、输入走上传缓存）；false = 直接使用 OutputParams 中的原路径（有 FileSystem 权限时）
	 * @param silent 为 true 时不 emit tasklistUpdate、不触发 webhook，供批量调用使用
	 * @param skipMetadataScan 为 true 时跳过 getFileMetadata，供批量调用由调度器统一处理
	 * @emits tasklistUpdate（当 silent 为 false 时）
	 */
	private taskAdd(taskName: string, outputParams: OutputParams, useManagedFilePaths?: boolean, silent?: boolean, skipMetadataScan?: boolean): number | null {
		const maxTaskCount = getLimitaion('maxTaskListCount', this.functionLevel)!;
		if (this.taskList.count() >= maxTaskCount) {
			if (!silent) {
				this.setNotification(
					undefined,
					i11n.service.功能限制_任务数上限(maxTaskCount, false),
					NotificationLevel.warning,
				);
			}
			return null;
		}

		const firstFilePath = outputParams.input.files?.[0]?.filePath;
		const task = getInitialServiceTask(taskName, outputParams);
		const id = this.taskList.add(task);

		// 更新命令行参数（写入 runs[1]，即首个运行条目）
		const taskIndex = this.taskList.getIndexById(id);
		const run = task.runs[1];
		if (useManagedFilePaths) {
			run.outputFiles = genTaskOutputFiles(run.after, ``, { taskId: id, taskIndex, runIndex: 1 });
			run.paraArray = getFFmpegParaArray({ outputParams: run.after, withQuotes: true, overrideFilePaths: run.outputFiles, taskId: id, taskIndex, runIndex: 1 });
			this.taskList.setStatus(id, TaskStatus.initializing);
			task.remoteTask = true;
		} else {
			run.paraArray = getFFmpegParaArray({ outputParams: run.after, withQuotes: true, taskId: id, taskIndex, runIndex: 1 });
			if (firstFilePath?.length && !skipMetadataScan) {
				this.getFileMetadata(id, task);
			}
		}

		log.info(`[任务 ${id}] 新增任务：${taskName}（${firstFilePath ? '单输入普通任务' : '多输入/网络任务'}）。`);
		if (!silent) {
			this.emit('tasklistUpdate', { added: [{ taskId: id, index: this.taskList.count() - 1 }], removed: [], totalCount: this.taskList.count() });
			webhookManager.triggerTaskEvent('task.created', id, { taskId: id, task }).catch(() => {});
			webhookManager.triggerGlobalEvent('tasklist.added', { added: [{ taskId: id, index: this.taskList.count() - 1, task }] }).catch(() => {});
		}

		return id;
	}

	/**
	 * 批量新增任务
	 * 后端负责从文件路径计算任务名称，前端无需传入 taskName
	 * @param filePaths 文件路径数组，每个路径创建一个任务。路径为空字符串时使用默认名称
	 * @param outputParams 输出参数模板，每个任务的 input.files[0].filePath 会被替换
	 * @param useManagedFilePaths true = 使用文件上传/改写路径模式；false = 直接使用 OutputParams 中的原路径
	 * @returns 所有新创建的任务 ID
	 */
	public async taskAddBatch(filePaths: string[], outputParams: OutputParams, useManagedFilePaths?: boolean): Promise<number[]> {
		const maxTaskCount = getLimitaion('maxTaskListCount', this.functionLevel)!;
		const remaining = maxTaskCount - this.taskList.count();
		if (filePaths.length > remaining) {
			this.setNotification(
				undefined,
				i11n.service.功能限制_任务数上限(maxTaskCount, false),
				NotificationLevel.warning,
			);
			filePaths = filePaths.slice(0, remaining);
			if (filePaths.length === 0) {
				return Promise.resolve([]);
			}
		}

		const asyncEntry = { type: `添加 ${filePaths.length} 个任务` };
		this.asyncListOp('+', asyncEntry);
	
		const addedItems: { taskId: number; index: number }[] = [];
		const ids: number[] = [];
		const isBatch = true || filePaths.length > 1;

		for (const filePath of filePaths) {
			// 计算任务名：从文件路径提取不带扩展名的文件名
			let taskName = filePath ? path.parse(filePath).name : `新任务 ${new Date().toISOString()}`;
			if (taskName.startsWith('[uploading] ')) taskName = taskName.slice(12);
			// 多路径时对每个任务替换输入文件路径
			const params = isBatch ? JSON.parse(JSON.stringify(outputParams)) : outputParams;
			if (isBatch && params.input.files.length > 0) {
				params.input.files[0].filePath = filePath || undefined;
			}
			// 本地批量任务跳过 getFileMetadata，由 scanTracker 统一调度
			const id = this.taskAdd(taskName, params, useManagedFilePaths, true, !useManagedFilePaths)!;
			ids.push(id);
			addedItems.push({ taskId: id, index: this.taskList.getIndexById(id) });
		}

		// 一次性发送列表更新
		this.emit('tasklistUpdate', { added: addedItems, removed: [], totalCount: this.taskList.count() });
		// 一次性触发 webhook
		const webhookAdded = addedItems.map(({ taskId, index }) => ({ taskId, index, task: this.taskList.getById(taskId)! }));
		webhookManager.triggerGlobalEvent('tasklist.added', { added: webhookAdded }).catch(() => {});
		for (const { taskId } of addedItems) {
			const task = this.taskList.getById(taskId)!;
			webhookManager.triggerTaskEvent('task.created', taskId, { taskId, task }).catch(() => {});
		}

		this.asyncListOp('-', asyncEntry);

		// 对本地批量任务，低优先级进行媒体信息扫描
		if (!useManagedFilePaths && addedItems.length > 0) {
			(async () => {
				const asyncEntry2 = { type: `批量任务媒体信息扫描 ${addedItems.length} 个任务` };
				this.asyncListOp('+', asyncEntry2);

				for (const item of addedItems) {
					const task = this.taskList.getById(item.taskId);
					if (!task) continue;	// 可能是被删除了，下一个
					try {
						await this.yieldManager.yield({ type: 'getFileMetadata', taskIds: new Set([item.taskId]) });
					} catch (error) {
						break;
					}
					await Promise.allSettled(this.getFileMetadata(task.id, task));
				}
				this.asyncListOp('-', asyncEntry2);
			})();
		}
		return Promise.resolve(ids);
	}

	/**
	 * 复制任务
	 * 从已有任务复制参数创建新任务，支持指定份数
	 */
	public async taskCopy(id: number, count: number = 1): Promise<void> {
		const task = this.taskList.getById(id);
		if (!task) {
			log.error(`taskCopy：任务 ${id} 不存在！`);
			return;
		}
		const asyncEntry = { type: `复制任务 ${id} ${count} 份` };
		this.asyncListOp('+', asyncEntry);

		for (let i = 0; i < count; i++) {
			if (i % yieldThreshold === 0) await this.yieldManager.yield({ type: 'taskAdd' });
			const newId = this.taskAdd(task.taskName, getTaskLatestOutputParams(task), task.remoteTask, false, true);
			if (task.status === TaskStatus.idle) this.taskList.getById(newId!)!.status = TaskStatus.idle;	// 修复远程任务停留在 initialize 状态的问题
		}
		this.asyncListOp('-', asyncEntry);
		return;
	}

	/**
	 * 新增任务时调用 FFmpeg 获取输入文件信息、文件时间（仅本地模式在此处读取时间，远程模式在 mergeUploaded 接收时间）
	 * @param signal 可选的 AbortSignal，用于中止正在执行的 ffmpeg 进程
	 */
	private getFileMetadata(id: number, task: ServiceTask, signal?: AbortSignal): Promise<any>[] {
		// FFmpeg 读取媒体信息
		log.info(`[任务 ${id}] 读取输入媒体信息。`);
		let ffmpegProcess: FFmpeg | null = null;
		const after = getTaskLatestOutputParams(task);
		const filePromises = (after.input.files || []).map((file, inputIndex) => {
			const filePath = file.filePath;
			if (!filePath) return Promise.resolve(0);
			if (signal?.aborted) return Promise.resolve(0);
			const realFilePath = task.remoteTask ? `${os.tmpdir()}/FFBoxUploadCache/${filePath}` : filePath;
			const promise1 = new Promise((resolve) => {
				const ffmpeg = new FFmpeg(this.ffmpegPath, 2, ['-hide_banner', '-i', realFilePath, '-f', 'null']);
				ffmpegProcess = ffmpeg;
				let firstDataArrived = false;
				ffmpeg.on('data', ({ content }) => {
					if (!firstDataArrived) {
						firstDataArrived = true;
						task.runs[0].cmdData = `ℹ️ 媒体信息获取于 ${getTimeString(new Date())}。`;
						this.setCmdText(task, content, true, 0);	// getFileMetadata 写入 runs[0]
					}
					this.setCmdText(task, content, true, 0);	// getFileMetadata 写入 runs[0]
				});
				ffmpeg.on('metadata', ({ content }) => {
					task.before[inputIndex] = { ...task.before[inputIndex], ...content[0] };	// 目前的逻辑是即使是多输入也是逐个输入跑 metadata
					resolve(0);
				});
			})
			const promise2 = new Promise(async (resolve) => {
				if (!task.remoteTask) {
					try {
						await fsPromise.access(realFilePath, fs.constants.R_OK);
						const { atime, birthtime, mtime } = fs.statSync(realFilePath);
						task.before[inputIndex] = {
							...task.before[inputIndex],
							accessTime: atime.getTime(),
							createTime: birthtime.getTime(),
							modifyTime: mtime.getTime(),
						};
					} catch {}
					resolve(0);
				}
				resolve(0);
			});
			return new Promise((resolve) => {
				Promise.allSettled([promise1, promise2]).then(() => resolve(0));
			})
		});

		// 注册 abort 回调，中止所有正在运行的 ffmpeg 进程
		if (signal) {
			const onAbort = () => {
				ffmpegProcess?.kill(() => {});
			};
			if (signal.aborted) {
				onAbort();
			} else {
				signal.addEventListener('abort', onAbort, { once: true });
			}
		}

		Promise.allSettled(filePromises).then(() => this.emitTaskUpdate(id, task));
		return filePromises;
	}

	/**
	 * 对于远程文件，上传完成后调用此函数合并文件
	 * 前端无论检查到已缓存还是未缓存都使用相同的参数调用。前端和后端各自判断文件是否已上传过。若使用过，前端不再上传，后端不再进行分片读取合并
	 * @param fileBaseName 文件名参数不包含 hash，仅用于作为 input.files[].filePath 最终文件名的一部分供用户识别。相同 hash 但文件名不同的话，服务器会保留多份
	 * @param inputName 【占位符】在新建任务上传文件之前，或添加输入文件上传之前，hash 尚未得知，因此前端应发起修改输入参数的调用，生成这个上传文件的一个临时占位符。上传完毕后，往 inputName 传入生成的占位符，以便后端将其替换为真实文件名
	 * @emits taskUpdate
	 */
	public async mergeUploaded(id: number, hashs: string[], fileBaseName: string, inputName: string, fileTime?: { accessTime: number, createTime: number, modifyTime: number }): Promise<void> {
		const task = this.taskList.getById(id);
		if (!task) {
			// 上传完成之前删除了任务
			return;
		}
		const uploadDir = os.tmpdir() + '/FFBoxUploadCache'; // 文件上传目录
		const concatedHash = CryptoJS.enc.Utf8.parse(hashs.join(''));
		const fileHash = CryptoJS.SHA1(concatedHash).toString();
		const destName = `${fileBaseName}⬝${fileHash}`;
		const destPath = `${uploadDir}/${destName}`;
		let fileExists = false;
		try {
			await fs.accessSync(destPath, fs.constants.R_OK);
			fileExists = true;
		} catch (error) {}
		if (!fileExists) {
			// 将分片合并为一个文件（无论分片数量均会执行此逻辑，因此即使 1 个分片，最终文件名也是按分片 hash 的 hash 命名）
			try {
				await fs.promises.writeFile(destPath, '');
				for (const hash of hashs) {
					const source = uploadDir + '/' + hash;
					await fs.promises.appendFile(destPath, await fs.promises.readFile(source));
					await fs.promises.rm(source);
				}
			} catch (error) {
				this.setNotification(id, task.taskName + '：合并文件写入失败', NotificationLevel.error);
				log.error(`[任务 ${id}] 文件合并失败：${error}`);
			}
		}
		// 将 inputName 占位符改成 destName 真实文件名
		const after = getTaskLatestOutputParams(task);
		const inputIndex = after.input.files.findIndex((file) => file.filePath === inputName);
		if (inputIndex >= 0) {
			after.input.files[inputIndex].filePath = destName;	// 远程任务隐藏目录结构，运行时才 override 输入参数
			// 记录由前端传过来的文件时间（远程文件时间不能由后端读取，而是由前端传入）
			if (fileTime) {
				task.before[inputIndex] = {
					accessTime: fileTime.accessTime,
					createTime: fileTime.createTime,
					modifyTime: fileTime.modifyTime,
				} as any;	// 看看这样会不会出 bug
			}
		}
		const latestRun = task.runs[task.runs.length - 1];
		latestRun.paraArray = getFFmpegParaArray({ outputParams: after, withQuotes: true, overrideFilePaths: latestRun.outputFiles, taskId: id, taskIndex: this.taskList.getIndexById(id), runIndex: task.runs.length - 1 });
		this.setNotification(id, `任务「${task.taskName}」输入文件「${fileBaseName}」上传完成`, NotificationLevel.info);
		this.emitTaskUpdate(id, task);
	}

	/**
	 * 切换任务状态的初始化或待命状态
	 */
	public async setUploadStatus(id: number, isUploading: boolean): Promise<void> {
		const task = this.taskList.getById(id)!;
		if (isUploading && task.status === TaskStatus.idle) {
			this.taskList.setStatus(id, TaskStatus.initializing);
			this.emitTaskUpdate(id, task);
		} else if (!isUploading && task.status === TaskStatus.initializing) {
			this.taskList.setStatus(id, TaskStatus.idle);
			this.emitTaskUpdate(id, task);
			this.getFileMetadata(id, task);
		}
	}

	/**
	 * 获取、清除指定目录的缓存大小和文件数量（不递归）
	 */
	public async getCacheInfo(needDelete: boolean) {
		const uploadDir = path.join(os.tmpdir(), 'FFBoxUploadCache');
		const downloadDir = path.join(os.tmpdir(), 'FFBoxDownloadCache');
		let uploadSize = 0, uploadCount = 0;
		let downloadSize = 0, downloadCount = 0;
		try {
			const uploadFiles = await fs.promises.readdir(uploadDir);
			for (const file of uploadFiles) {
				const filePath = path.join(uploadDir, file);
				const stat = await fs.promises.stat(filePath);
				if (stat.isFile()) {
					uploadSize += stat.size;
					uploadCount++;
					if (needDelete) await fs.promises.unlink(filePath);
				}
			}
		} catch (err) {
			log.error(err);	// ENOENT 不存在
		}
		try {
			const downloadFiles = await fs.promises.readdir(downloadDir);
			for (const file of downloadFiles) {
				const filePath = path.join(downloadDir, file);
				const stat = await fs.promises.stat(filePath);
				if (stat.isFile()) {
					downloadSize += stat.size;
					downloadCount++;
					if (needDelete) await fs.promises.unlink(filePath);
				}
			}
		} catch (err) {
			log.error(err);
		}
		return { uploadCount, uploadSize, downloadCount, downloadSize };
	}

	/**
	 * 批量删除任务
	 * 【initializing / idle / idle_queued / finished / error】 => 【deleted】
	 * @param ids 任务 id 数组
	 * @emits tasklistUpdate
	 */
	public async taskDeleteBatch(ids: number[]): Promise<void> {
		this.yieldManager.kill((metadata) => ids.some((id) => metadata.taskIds?.has(id)));
		const asyncEntry = { type: `删除任务 ${ids.length} 个` };
		this.asyncListOp('+', asyncEntry);

		const removedItems: { taskId: number }[] = [];
		for (const id of ids) {
			const task = this.taskList.getById(id);
			if (!task) {
				log.error(`[任务 ${id}] 删除：任务不存在！`);
				continue;
			}
			if (!([TaskStatus.initializing, TaskStatus.idle, TaskStatus.idle_queued, TaskStatus.finished, TaskStatus.error].includes(task.status))) {
				log.error(`[任务 ${id}] 删除：任务当前状态为 ${task.status}，操作不合法但允许执行！`);
			} else {
				log.info(`[任务 ${id}] 删除任务。`);
			}
			this.taskList.setStatus(id, TaskStatus.deleted);
			task.ffmpeg?.forceKill(() => {
				// this.queueAssign();
				// this.storeUnfinishedTask();
			});
			this.taskList.remove(id);

			// 清理帧扫描状态（同时停止正在进行的扫描）
			for (const [key, scan] of this.frameScanStatus) {
				if (key.startsWith(`${id}_`)) {
					if (scan.status === 'scanning') {
						scan.status = 'stopped';
						scan.process?.kill();
					}
					this.frameScanStatus.delete(key);
				}
			}
			// 清理缩略图缓存
			for (const [key, cache] of this.thumbnailCache) {
				if (key.startsWith(`${id}_`)) {
					if (cache.status === 'generating') {
						cache.status = 'stopped';
						cache.process?.kill();
					}
					this.thumbnailCache.delete(key);
				}
			}

			removedItems.push({ taskId: id });
			webhookManager.triggerTaskEvent('task.deleted', id, { taskId: id });
		}
		this.emit('tasklistUpdate', { added: [], removed: removedItems, totalCount: this.taskList.count() });
		webhookManager.triggerGlobalEvent('tasklist.removed', { removed: removedItems });
		this.asyncListOp('-', asyncEntry);
	}

	/**
	 * 启动单个任务（内部方法，由 taskStartBatch 和 queueAssign 调用）
	 * 【idle / idle_queued / error】 => 【running】 => 【finished / error】
	 * @param id 任务 id
	 * @emits taskUpdate
	 */
	private taskStart(id: number): void {
		const task = this.taskList.getById(id);
		if (!task) {
			log.error(`[任务 ${id}] 启动：任务不存在！`);
			return;
		}
		if (!([TaskStatus.idle, TaskStatus.idle_queued, TaskStatus.error].includes(task.status))) {
			log.error(`[任务 ${id}] 启动：任务当前状态为 ${task.status}，操作不合法但允许执行！`);
		} else {
			log.info(`[任务 ${id}] 启动。`);
		}
		// 确定要运行的 run（使用最新条目）
		const runIndex = task.runs.length - 1;
		const run = task.runs[runIndex];
		this.taskList.setStatus(id, TaskStatus.running);
		run.lastStarted = new Date().getTime() / 1000;
		run.elapsed = 0;
		run.lastPaused = new Date().getTime() / 1000;
		run.progressLog = {
			time: [],
			frame: [],
			size: [],
		};
		this.emit('progressUpdate', {
			taskId: id,
			runIndex,
			time: new Date().getTime() / 1000,
		});
		task.runs[runIndex].cmdData = `▶️ 任务已于 ${getTimeString(new Date(), true)} 开始运行。`;
		this.setCmdText(task, '', true, runIndex);
		let newFFmpeg: FFmpeg;
		const taskIndex = this.taskList.getIndexById(id);
		if (task.remoteTask) {
			newFFmpeg = new FFmpeg(
				this.ffmpegPath,
				0,
				getFFmpegParaArray({ outputParams: run.after, inputDir: `${os.tmpdir()}/FFBoxUploadCache`, overrideFilePaths: run.outputFiles.map((fileBaseName) => `${os.tmpdir()}/FFBoxDownloadCache/${fileBaseName}`), taskId: id, taskIndex, runIndex })
			);
		} else {
			run.outputFiles = genTaskOutputFiles(run.after, undefined, { taskId: id, taskIndex, runIndex });	// 本地任务的 outputFiles 在任务开始时才生成，而远程任务则是在添加和修改参数时就刷新
			newFFmpeg = new FFmpeg(this.ffmpegPath, 0, getFFmpegParaArray({ outputParams: run.after, taskId: id, taskIndex, runIndex }));
		}
		newFFmpeg.on('closed', async (errorCode, runningResult) => {
			if (errorCode) {
				const errorMessages = newFFmpeg.messages.filter((message) => message.type === 'error').map((message) =>
					`\n${message.sender ? `【${message.sender}】` : ''}${message.translatedMessage ?? message.message}`
				);
				if (runningResult === 'failed') {
					log.error(`[任务 ${id}] 出错：${task.taskName}。`);
					this.setNotification(
						id,
						'任务「' + task.taskName + '」转码失败。' + errorMessages,
						NotificationLevel.error,
					);
				} else if (task.status == TaskStatus.stopping) {
					this.setNotification(id, '任务「' + task.taskName + '」已强制结束。', NotificationLevel.warning);
				} else {
					log.error(`[任务 ${id}] 异常终止：${task.taskName}。`);
					this.setNotification(id, '任务「' + task.taskName + '」异常终止。' + errorMessages, NotificationLevel.error);
				}
				this.setCmdText(task, `❌️ ffmpeg 已于 ${getTimeString(new Date(), true)} 退出，错误码 ${errorCode}。`, true);
				this.taskList.setStatus(id, TaskStatus.error);
				run.errorInfo = errorMessages;

				webhookManager.triggerTaskEvent('task.error', id, { taskId: id, task: task as any, error: errorMessages.join('\n') });
			} else {
				if (task.status !== TaskStatus.stopping) {
					log.info(`[任务 ${id}] 完成：${task.taskName}。`);
					this.setCmdText(task, `✅️ 任务已于 ${getTimeString(new Date(), true)} 完成。`, true);

					const hasTimeError: string[] = [];
					// 对每个输出文件进行时间修改。但暂不支持多输入，会按第一个输入进行修改
					for (let i = 0; i < (task.remoteTask ? 0 : run.after.outputs.length); i++) {
						const output = run.after.outputs[i];
						const mux = output.mux;
						const outputFilePath = run.outputFiles[i];
						if (mux.keepFileTime) {
							try {
								// 如果输入文件不可读取，或者 utimes 失败，或者 FFBox 无法正确计算文件时间，都会产生 hasTimeError
								const { accessTime, createTime, modifyTime, ok } = getOutputFileTime(task, i);
								if (ok) {
									log.info(`[任务 ${id}] 将按照首个输入文件的时间修改任务时间。新创建时间 ${new Date(createTime || 0).toISOString()}；新修改时间 ${new Date(modifyTime || 0).toISOString()}；新访问时间 ${new Date(accessTime || 0).toISOString()}。`);
									await utimes(outputFilePath, { btime: createTime, mtime: modifyTime, atime: accessTime });
								} else {
									hasTimeError.push(i + 1 + '');
								}
							} catch (error) {
								hasTimeError.push(i + 1 + '');
							}
						}
					}
					this.taskList.setStatus(id, TaskStatus.finished);
					run.elapsed = new Date().getTime() / 1000 - run.lastStarted;
					if (hasTimeError.length) {
						this.setNotification(id, `任务「${task.taskName}」已转码完成，但修改第 ${hasTimeError.join(' ')} 个文件时间失败。`, NotificationLevel.warning);
					} else {
						this.setNotification(id, `任务「${task.taskName}」已转码完成`, NotificationLevel.ok);
					}

					webhookManager.triggerTaskEvent('task.completed', id, { taskId: id, task: task as any });

					if (this.settings.get().deleteFinishedTasks) {
						setTimeout(() => {
							this.taskDeleteBatch([id]);
						}, 0);
					}
				} else {
					this.setNotification(id, '任务「' + task.taskName + '」已正常中止。', NotificationLevel.warning);
				}
			}
			this.emitTaskUpdate(id, task);
			this.queueAssign();
			this.storeUnfinishedTask();
		});
		newFFmpeg.on('status', (status: FFmpegProgress) => {
			// 检查最新记录是否与前面一条完全一致
			if (
				run.progressLog.time.length > 1 &&
				run.progressLog.frame.length > 1 &&
				run.progressLog.size.length > 1 &&
				run.progressLog.time[run.progressLog.time.length - 1][1] === status.time &&
				run.progressLog.frame[run.progressLog.frame.length - 1][1] === status.frame &&
				run.progressLog.size[run.progressLog.size.length - 1][1] === status.size
			) return;

			const time = new Date().getTime() / 1000 - run.lastStarted + run.elapsed;
			run.progressLog.time.push([time, status.time]);
			run.progressLog.frame.push([time, status.frame]);
			run.progressLog.size.push([time, status.size]);
			this.trailLimit_checkIsMediaWorkingTimeExceeded(id, task);
			this.emit('progressUpdate', {
				taskId: id,
				runIndex,
				time,
				status,
			});
			this.emitWorkingStatusUpdate();
			webhookManager.triggerTaskEvent('task.progress', id, { taskId: id, progress: status });
		});
		newFFmpeg.on('data', ({ content }) => {
			this.setCmdText(task, content, true, runIndex);
		});
		newFFmpeg.on('warning', (warning) => {
			this.setNotification(id, task.taskName + '：' + warning.content, NotificationLevel.warning);
		});
		for (const parameter of ['time', 'frame', 'size']) {
			const _parameter = parameter as 'time' | 'frame' | 'size';
			run.progressLog[_parameter].push([new Date().getTime() / 1000 - run.lastStarted, 0]);
		}
		task.ffmpeg = newFFmpeg;
		this.emitTaskUpdate(id, task);

		webhookManager.triggerTaskEvent('task.started', id, { taskId: id, task });

		if (this.workingStatus === WorkingStatus.idle) {
			this.workingStatus = WorkingStatus.running;
			this.emitWorkingStatusUpdate('start');
			webhookManager.triggerGlobalEvent('queue.started', { timestamp: Date.now() });
		}
		this.storeUnfinishedTask();
	}

	/**
	 * 批量启动任务
	 * 【idle / idle_queued / error】 => 【running】 => 【finished / error】
	 * @param ids 任务 id 数组
	 * @emits taskUpdate
	 */
	public async taskStartBatch(ids: number[]): Promise<void> {
		const asyncEntry = { type: `启动任务 ${ids.length} 个` };
		this.asyncListOp('+', asyncEntry);

		for (let i = 0; i < ids.length;) {
			const batchIds = [];
			for (let j = 0; i < ids.length && j < yieldThreshold;) {
				batchIds.push(ids[i]);
				j++; i++;
			}
			try {
				await this.yieldManager.yield({ type: 'taskStart', taskIds: new Set(batchIds) });
			} catch (error) {
				break;
			}
			for (const taskId of batchIds) {
				this.taskStart(taskId);
			}
		}
		this.asyncListOp('-', asyncEntry);
	}

	/**
	 * 批量将任务进入排队状态（不会启动调度系统改变当前的执行/暂停状态）
	 * 【idle / paused】 => 【idle_queued / paused_queued】 => 【running】
	 * @param ids 任务 id 数组
	 */
	public async taskReadyBatch(ids: number[]): Promise<void> {
		this.yieldManager.kill((metadata) => ids.some((id) => metadata.taskIds?.has(id)));
		const asyncEntry = { type: `准备任务 ${ids.length} 个` };
		this.asyncListOp('+', asyncEntry);

		for (let i = 0; i < ids.length;) {
			const batchIds = [];
			for (let j = 0; i < ids.length && j < yieldThreshold;) {
				batchIds.push(ids[i]);
				j++; i++;
			}
			try {
				await this.yieldManager.yield({ type: 'taskReady', taskIds: new Set(batchIds) });
			} catch (error) {
				break;
			}
			for (const taskId of batchIds) {
				const task = this.taskList.getById(taskId);
				if (!task) {
					log.error(`[任务 ${taskId}] 准备启动：任务不存在！`);
					continue;
				}
				if (!([TaskStatus.idle, TaskStatus.paused].includes(task.status))) {
					log.error(`[任务 ${taskId}] 准备启动：任务当前状态为 ${task.status}，操作不合法但允许执行！`);
				} else {
					log.info(`[任务 ${taskId}] 准备启动。`);
				}
				if (task.status === TaskStatus.idle) {
					this.taskList.setStatus(taskId, TaskStatus.idle_queued);
				} else if (task.status === TaskStatus.paused) {
					this.taskList.setStatus(taskId, TaskStatus.paused_queued);
				}
				this.emitTaskUpdate(taskId, task);
			}
		}
		this.asyncListOp('-', asyncEntry);
	}

	/**
	 * 暂停单个任务（内部方法，由 taskPauseBatch 和 queuePause 调用）
	 * 【running / paused_queued】 => 【paused】
	 * @param id 任务 id
	 * @emits taskUpdate
	 */
	private taskPause(id: number, dontAssign = false): void {
		const task = this.taskList.getById(id);
		if (!task) {
			log.error(`[任务 ${id}] 暂停：任务不存在！`);
			return;
		}
		if (!task.ffmpeg) {
			// ffmpeg 已退出，不应调用 pause
			log.error(`[任务 ${id}] 暂停：操作不合法！`);
			return;
		}
		if (!([TaskStatus.running, TaskStatus.paused_queued].includes(task.status))) {
			log.error(`[任务 ${id}] 暂停：任务当前状态为 ${task.status}，操作不合法但允许执行！`);
		} else {
			log.info(`[任务 ${id}] 暂停。`);
		}
		this.setCmdText(task, `⏸️ 任务已于 ${getTimeString(new Date(), true)} 暂停。`, true);
		this.taskList.setStatus(id, TaskStatus.paused);
		task.ffmpeg!.pause();
		const activeRun = task.runs[task.runs.length - 1];
		if (activeRun) {
			activeRun.lastPaused = new Date().getTime() / 1000;
			activeRun.elapsed += activeRun.lastPaused - activeRun.lastStarted;
		}
		this.emitTaskUpdate(id, task);

		webhookManager.triggerTaskEvent('task.paused', id, { taskId: id, task: task as any });

		if (!dontAssign) this.queueAssign();
	}

	/**
	 * 批量暂停任务
	 * 【running / paused_queued】 => 【paused】
	 * @param ids 任务 id 数组
	 * @emits taskUpdate
	 */
	public async taskPauseBatch(ids: number[]): Promise<void> {
		this.yieldManager.kill((metadata) => ids.some((id) => metadata.taskIds?.has(id)));
		const asyncEntry = { type: `暂停任务 ${ids.length} 个` };
		this.asyncListOp('+', asyncEntry);

		for (let i = 0; i < ids.length;) {
			const batchIds = [];
			for (let j = 0; i < ids.length && j < yieldThreshold;) {
				batchIds.push(ids[i]);
				j++; i++;
			}
			try {
				await this.yieldManager.yield({ type: 'taskPause', taskIds: new Set(batchIds) });
			} catch (error) {
				break;
			}
			for (const id of batchIds) {
				this.taskPause(id, true);
			}
		}
		this.queueAssign();
		this.asyncListOp('-', asyncEntry);
	}

	/**
	 * 继续执行单个任务（内部方法，由 taskResumeBatch 和 queueAssign 调用）
	 * 【paused / paused_queued】 => 【running】
	 * @param id 任务 id
	 * @emits taskUpdate
	 */
	private taskResume(id: number): void {
		const task = this.taskList.getById(id);
		if (!task) {
			log.error(`[任务 ${id}] 继续：任务不存在！`);
			return;
		}
		if (!([TaskStatus.paused, TaskStatus.paused_queued].includes(task.status))) {
			log.error(`[任务 ${id}] 继续：任务当前状态为 ${task.status}，操作不合法但允许执行！`);
		} else {
			log.info(`[任务 ${id}] 继续。`);
		}
		if (this.trailLimit_checkIsMediaWorkingTimeExceeded(id, task)) {
			this.taskList.setStatus(id, TaskStatus.paused);
			this.emitTaskUpdate(id, task);
			return;
		}

		this.setCmdText(task, `▶️ 任务已于 ${getTimeString(new Date(), true)} 继续。`, true);
		this.taskList.setStatus(id, TaskStatus.running);
		const nowRealTime = new Date().getTime() / 1000;
		const activeRun = task.runs[task.runs.length - 1];
		if (activeRun) {
			activeRun.lastStarted = nowRealTime;
		}
		task.ffmpeg!.resume();
		this.emitTaskUpdate(id, task);

		webhookManager.triggerTaskEvent('task.resumed', id, { taskId: id, task: task as any });

		if (this.workingStatus === WorkingStatus.idle) {
			this.workingStatus = WorkingStatus.running;
			this.emitWorkingStatusUpdate('start');
			webhookManager.triggerGlobalEvent('queue.started', { timestamp: Date.now() });
		}
	}

	/**
	 * 批量继续执行任务
	 * 【paused / paused_queued】 => 【running】
	 * @param ids 任务 id 数组
	 * @emits taskUpdate
	 */
	public async taskResumeBatch(ids: number[]): Promise<void> {
		this.yieldManager.kill((metadata) => ids.some((id) => metadata.taskIds?.has(id)));
		const asyncEntry = { type: `继续任务 ${ids.length} 个` };
		this.asyncListOp('+', asyncEntry);

		for (let i = 0; i < ids.length;) {
			const batchIds = [];
			for (let j = 0; i < ids.length && j < yieldThreshold;) {
				batchIds.push(ids[i]);
				j++; i++;
			}
			try {
				await this.yieldManager.yield({ type: 'taskResume', taskIds: new Set(batchIds) });
			} catch (error) {}
			for (const id of batchIds) {
				this.taskResume(id);
			}
		}
		this.asyncListOp('-', asyncEntry);
	}

	/**
	 * 重置单个任务（收尾/强行，根据状态决定）（内部方法，由 taskResetBatch 调用）
	 * 【paused / paused_queued / stopping / finished / error】 => 【idle】
	 * @param id 任务 id
	 * @emits taskUpdate
	 */
	private taskReset(id: number): void {
		const task = this.taskList.getById(id);
		if (!task) {
			log.error(`[任务 ${id}] 重置：任务不存在！`);
			return;
		}
		const taskIndex = this.taskList.getIndexById(id);

		function createNewRun(task: ServiceTask) {
			const latestRun = task.runs[task.runs.length - 1];
			const newRun = getNewRun(JSON.parse(JSON.stringify(latestRun.after)));
			task.runs.push(newRun);
			if (task.remoteTask) {
				newRun.outputFiles = genTaskOutputFiles(newRun.after, ``, { taskId: id, taskIndex, runIndex: task.runs.length - 1 });
				newRun.paraArray = getFFmpegParaArray({ outputParams: newRun.after, withQuotes: true, overrideFilePaths: newRun.outputFiles, taskId: id, taskIndex, runIndex: task.runs.length - 1 });
			} else {
				newRun.paraArray = getFFmpegParaArray({ outputParams: newRun.after, withQuotes: true, taskId: id, taskIndex, runIndex: task.runs.length - 1 });
			}
		}

		if ([TaskStatus.paused, TaskStatus.paused_queued, TaskStatus.running].includes(task.status)) {
			log.info(`[任务 ${id}] 重置——软停止。`);
			this.setCmdText(task, `🛑 任务已于 ${getTimeString(new Date(), true)} 软停止。`, true);
			this.taskList.setStatus(id, TaskStatus.stopping);
			task.ffmpeg!.exit(() => {
				this.setCmdText(task, `🛑 ffmpeg 进程已于 ${getTimeString(new Date(), true)} 结束。`, true);
				this.taskList.setStatus(id, TaskStatus.idle);
				task.ffmpeg = null;
				createNewRun(task);
				this.emitTaskUpdate(id, task);
				this.queueAssign();
				this.storeUnfinishedTask();
			});
		} else if (task.status === TaskStatus.stopping) {
			log.info(`[任务 ${id}] 重置——硬停止。`);
			this.setCmdText(task, `⛔ 任务已于 ${getTimeString(new Date(), true)} 硬停止。`, true);
			this.taskList.setStatus(id, TaskStatus.stopping);
			task.ffmpeg!.forceKill(() => {
				this.setCmdText(task, `⛔ ffmpeg 进程已于 ${getTimeString(new Date(), true)} 结束。`, true);
				this.taskList.setStatus(id, TaskStatus.idle);
				task.ffmpeg = null;
				createNewRun(task);
				this.emitTaskUpdate(id, task);
				this.queueAssign();
				this.storeUnfinishedTask();
			});
		} else if ([TaskStatus.idle_queued].includes(task.status)) {
			log.info(`[任务 ${id}] 取消排队。`);
			this.taskList.setStatus(id, TaskStatus.idle);
			this.queueAssign();
		} else if ([TaskStatus.finished, TaskStatus.error].includes(task.status)) {
			log.info(`[任务 ${id}] 重置到新运行记录初始状态。`);
			createNewRun(task);
			this.taskList.setStatus(id, TaskStatus.idle);
			this.queueAssign();
		} else {
			log.error(`[任务 ${id}] 重置：任务当前状态为 ${task.status}，操作不合法！`);
		}
		this.emitTaskUpdate(id, task);
	}

	/**
	 * 批量重置任务（收尾/强行，根据状态决定）
	 * 【paused / paused_queued / stopping / finished / error】 => 【idle】
	 * @param ids 任务 id 数组
	 * @emits taskUpdate
	 */
	public async taskResetBatch(ids: number[]): Promise<void> {
		this.yieldManager.kill((metadata) => ids.some((id) => metadata.taskIds?.has(id)));
		const asyncEntry = { type: `重置任务 ${ids.length} 个` };
		this.asyncListOp('+', asyncEntry);

		for (let i = 0; i < ids.length;) {
			const batchIds = [];
			for (let j = 0; i < ids.length && j < yieldThreshold;) {
				batchIds.push(ids[i]);
				j++; i++;
			}
			try {
				await this.yieldManager.yield({ type: 'taskReset', taskIds: new Set(batchIds) });
			} catch (error) {}
			for (const id of batchIds) {
				this.taskReset(id);
			}
		}
		this.asyncListOp('-', asyncEntry);
	}

	private storeUnfinishedTask(): void {
		if (!this.settings.get().preserveUnfinishedTasks) {
			return;
		}
		const tasks: { taskName: string; after: OutputParams; }[] = [];
		// 收集正在运行或排队中的任务（使用状态集合避免遍历全部任务）
		const unfinishedStatuses = [TaskStatus.running, TaskStatus.paused, TaskStatus.idle_queued, TaskStatus.paused_queued, TaskStatus.stopping, TaskStatus.finishing];
		for (const status of unfinishedStatuses) {
			for (const taskId of this.taskList.statusSets[status]) {
				const task = this.taskList.getById(taskId);
				if (task) {
					tasks.push({
						taskName: task.taskName,
						after: getTaskLatestOutputParams(task),
					});
				}
			}
		}
		clearTimeout((global as any).saveStatusTimer);
		(global as any).saveStatusTimer = setTimeout(() => {
			localConfig.set('lastStatus.tasks', tasks);
			log.info(`任务状态已保存。`, tasks);
		}, 700);
	}

	/**
	 * 简述：挑选正在排队的任务开始执行。每当任务状态更新时都应调用此函数
	 * 如果当前 workingStatus 为 running，那么挑选处于【空闲_已排队】【已暂停_已排队】的任务进入【正在运行】状态，直到【正在运行】的数量达到最大
	 * 如果安排完成后【正在运行】的任务数量依然为 0，说明所有任务均已处理完毕，workingStatus 进入 idle 状态
	 */
	private async queueAssign(dontStop?: boolean): Promise<void> {
		if (this.workingStatus === WorkingStatus.running) {
			const asyncEntry = { type: `排队任务分配执行` };
			this.asyncListOp('+', asyncEntry);

			const maxThreads = Math.min(this.settings.get().maxThreads, getLimitaion('maxThreads', this.functionLevel)!);
			let runningCount = this.taskList.getTaskCountByStatus(TaskStatus.running);

			// 根据 runningCount 分配任务
			let block = this.taskList.firstBlock;
			let i = 0;
			while (block) {
				if (runningCount >= maxThreads) break;

				for (const taskId of block.taskIds) {
					if (runningCount >= maxThreads) break;

					const task = this.taskList.getById(taskId);
					if (!task) { debugger; throw 'ub'; }
					
					if (task.status === TaskStatus.idle_queued) {
						this.taskStart(task.id);
						runningCount++;
					}
					if (task.status === TaskStatus.paused_queued) {
						this.taskResume(task.id);
						// @ts-ignore
						if (task.status === TaskStatus.running) runningCount++;
					}
				}
				if (i % yieldThreshold === 0) {
					try {
						await this.yieldManager.yield({ type: 'queueAssign' });
					} catch (error) {
						break;
					}
				}
				i++;
				block = block.next;
			}

			this.asyncListOp('-', asyncEntry);
		}
		if (!dontStop) {
			// 通过 runningCount 和 stillHaveTask 区分此时是暂停还是停止
			const runningCount = this.taskList.getTaskCountByStatus(TaskStatus.running);
			if (!runningCount) {
				this.workingStatus = WorkingStatus.idle;
				webhookManager.triggerGlobalEvent('queue.paused', { timestamp: Date.now() });
				let stillHaveTask = false;
				for (const status of [TaskStatus.idle_queued, TaskStatus.running, TaskStatus.paused, TaskStatus.paused_queued, TaskStatus.stopping, TaskStatus.finishing]) {
					if (this.taskList.statusSets[status].size > 0) {
						stillHaveTask = true;
						break;
					}
				}
				this.emitWorkingStatusUpdate(stillHaveTask ? 'pause' : 'stop');
			}
		}
	}

	/**
	 * 开始处理队列
	 * 首先通过 queueAssign 将【空闲_已排队】【已暂停_已排队】的任务启动，然后将所有【空闲】【已暂停】的任务进入【空闲_已排队】【已暂停_已排队】状态，再次调用 queueAssign 进行任务安排
	 * 也就是优先启动已排队的任务，再将空闲任务加入排队
	 */
	public async queueStart(): Promise<void> {
		this.yieldManager.kill((metadata) => ['queueStart'].includes(metadata.type));
		const asyncEntry = { type: `启动任务队列` };
		this.asyncListOp('+', asyncEntry);

		this.workingStatus = WorkingStatus.running;
		this.emitWorkingStatusUpdate('start');
		webhookManager.triggerGlobalEvent('queue.started', { timestamp: Date.now() });

		// 启动此前已排队的任务
		this.queueAssign(true);

		// 将未启动和暂停任务纳入排队
		const idleIds = [...this.taskList.statusSets[TaskStatus.idle]];
		const pausedIds = [...this.taskList.statusSets[TaskStatus.paused]];
		const allIds = [...idleIds, ...pausedIds];
		for (let i = 0; i < allIds.length; i++) {
			const taskId = allIds[i];
			const task = this.taskList.getById(taskId);
			if (!task) continue;

			if (task.status === TaskStatus.idle) {
				this.taskList.setStatus(taskId, TaskStatus.idle_queued);
				this.emitTaskUpdate(task.id, task);
			} else if (task.status === TaskStatus.paused) {
				this.taskList.setStatus(taskId, TaskStatus.paused_queued);
				this.emitTaskUpdate(task.id, task);
			}
			if (i % yieldThreshold === 0) {
				try {
					await this.yieldManager.yield({ type: 'queueStart' });
				} catch (error) {
					break;
				}
			}
		}

		// 再次分配任务，达到最大可运行数
		await this.queueAssign();
		if (!this.taskList.statusSets[TaskStatus.running].size) {
			this.workingStatus = WorkingStatus.idle;
			this.emitWorkingStatusUpdate('stop');
			webhookManager.triggerGlobalEvent('queue.paused', { timestamp: Date.now() });
		}
		this.asyncListOp('-', asyncEntry);
	}

	/**
	 * 暂停处理队列，将所有【正在运行】的任务暂停、【空闲_已排队】的任务重置
	 */
	public async queuePause(): Promise<void> {
		this.yieldManager.kill((metadata) => ['queuePause', 'queueAssign', 'queueStart'].includes(metadata.type));

		if (this.workingStatus === WorkingStatus.running) {
			this.emitWorkingStatusUpdate('pause');
			webhookManager.triggerGlobalEvent('queue.paused', { timestamp: Date.now() });
		}
		this.workingStatus = WorkingStatus.idle;
		// 暂停正在运行的任务、重置排队中的任务
		const runningIds = [...this.taskList.statusSets[TaskStatus.running]];
		const pausedQueuedIds = [...this.taskList.statusSets[TaskStatus.paused_queued]];
		const idleQueuedIds = [...this.taskList.statusSets[TaskStatus.idle_queued]];
		for (const id of runningIds) {
			this.taskPause(id);
		}
		for (const id of pausedQueuedIds) {
			this.taskPause(id);
		}
		for (const id of idleQueuedIds) {
			this.taskReset(id);
		}
	}

	/**
	 * 删除相应通知
	 * @emits taskUpdate
	 */
	public async deleteNotification(notificationId: number): Promise<void> {
		delete this.notifications[notificationId];
		this.emit('notificationUpdate', { notificationId });
		// 此事件不需要触发 Webhook
	}

	/**
	 * 批量设置任务最新运行记录的输出参数，将算出的 paraArray 通过 taskUpdate 传回（这样对性能不太好）
	 * 当最新运行记录状态为【初始化】【空闲】【空闲_已排队】时，cmdData 为空，修改当前任务参数
	 * 当最新运行记录状态为【已完成】【错误】时，cmdData 有数据，创建新的 run，再修改任务参数
	 * 当最新运行记录状态为【正在运行】【已暂停】【已暂停_已排队】【正在停止】【正在完成】时，cmdData 有数据，但不允许修改参数
	 * @param ids 任务 ID 列表
	 * @param params 统一的输出参数配置
	 * @param fullyReplace 是否全量替换（true 为单个任务修改，false 为批量修改）
	 * @emits taskUpdate
	 */
	public async setParameters(ids: number[], params: OutputParams, fullyReplace: boolean): Promise<void> {
		const asyncEntry = { type: `设置任务参数 ${ids.length} 个` };
		this.asyncListOp('+', asyncEntry);

		for (const id of ids) {
			const task = this.taskList.getById(id)!;
			const latestRun = task.runs[task.runs.length - 1];
			const isRunning = [TaskStatus.running, TaskStatus.paused, TaskStatus.paused_queued, TaskStatus.stopping, TaskStatus.finishing].includes(task.status);
			if (isRunning) continue;

			// 若最新条目已运行过（cmdData 非空且非占位符），创建新条目
			if (latestRun.cmdData) {
				const newRun = getNewRun(JSON.parse(JSON.stringify(latestRun.after)));
				task.runs.push(newRun);
				this.taskList.setStatus(id, TaskStatus.idle);	// 重置外层 status
			}
			const targetRun = task.runs[task.runs.length - 1];
			targetRun.after = replaceOutputParams(params, targetRun.after, fullyReplace);
			const taskIndex = this.taskList.getIndexById(id);
			if (task.remoteTask) {
				targetRun.outputFiles = genTaskOutputFiles(targetRun.after, ``, { taskId: id, taskIndex, runIndex: task.runs.length - 1 });
				targetRun.paraArray = getFFmpegParaArray({ outputParams: targetRun.after, withQuotes: true, overrideFilePaths: targetRun.outputFiles, taskId: id, taskIndex, runIndex: task.runs.length - 1 });
			} else {
				targetRun.paraArray = getFFmpegParaArray({ outputParams: targetRun.after, withQuotes: true, taskId: id, taskIndex, runIndex: task.runs.length - 1 });
			}
			this.emitTaskUpdate(id, task);
		}
		this.asyncListOp('-', asyncEntry);
	}

	private cmdUpdateThrottleTimers: Map<number, { start: number, timer: number }> = new Map();
	/**
	 * 收到 cmd 内容通用回调
	 * @param task 任务对象
	 * @param content 文本
	 * @param append 附加到末尾，默认 true
	 * @param runIndex 目标 run 索引，默认使用最新条目。getFileMetadata 调用时传入 0
	 */
	private setCmdText(task: ServiceTask, content: string, append = true, runIndex?: number): void {
		const taskId = task.id;
		const targetIndex = runIndex ?? task.runs.length - 1;
		const targetRun = task.runs[targetIndex];
		if (!targetRun) return;
		if (!append) {
			targetRun.cmdData = content;
		} else {
			if (content.length) {
				// 若前面没结尾换行符，则先插入一个 \n，再插入内容
				if (targetRun.cmdData.slice(-1) !== '\n' && targetRun.cmdData.length) {
					content = '\n' + content;
				}
				targetRun.cmdData += content;
			} else {
				// 空行
				content = '\n';
				targetRun.cmdData += content;
			}
		}
		if (!append) {
			// 清空事件不走 throttle
			this.emit('cmdUpdate', { taskId, runIndex: targetIndex, content, append });
			clearTimeout(this.cmdUpdateThrottleTimers.get(taskId)?.timer);
			this.cmdUpdateThrottleTimers.delete(taskId);
			return;
		}
		const throttleTimer = this.cmdUpdateThrottleTimers.get(taskId);
		// 第一次直接发送，记录发送后的起点，并添加计时器
		// 后续发送时，计时器未消失，则无需动作，等待计时器结束
		// 计时器结束时，如果有新消息，则发送从起点开始的消息，否则不动作
		if (!throttleTimer) {
			this.emit('cmdUpdate', { taskId, runIndex: targetIndex, content, append });

			const start = targetRun.cmdData.length;
			const timerFunc = () => {
				const newContent = targetRun.cmdData.slice(start);
				if (newContent.length) {
					this.emit('cmdUpdate', {
						taskId,
						runIndex: targetIndex,
						content: targetRun.cmdData.slice(start),
						append,
					});
				}
				this.cmdUpdateThrottleTimers.delete(taskId);
			};
			this.cmdUpdateThrottleTimers.set(taskId, { start, timer: setTimeout(timerFunc, 120) as any })
		}
	}

	/**
	 * 任务通知，emit 事件并存储到任务中
	 * @param taskId
	 * @param content
	 * @param level
	 */
	public setNotification(taskId: number | undefined, content: string, level: NotificationLevel): void {
		const notificationId = this.latestNotificationId++;
		const notification = {
			time: new Date().getTime(),
			taskId,
			content,
			level,
		};
		this.emit('notificationUpdate', {
			notificationId,
			notification,
		});
		webhookManager.triggerGlobalEvent('notification', { notificationId, notification });
		this.notifications[notificationId] = notification;
	}

	/**
	 * 激活 FFBox 服务。
	 * - 新版激活码（称作“解锢密令”）（facv2.*）：公钥验签 + machineId 匹配 + 流速衰减
	 * - 旧版激活码（U2FsdGVkX1*）：不生效，setNotification 提示用户到激活面板升级
	 * 返回 functionLevel（衰减后），或 false 表示激活失败。
	 */
	public async activate(activationCode: string): Promise<number | false> {
		if (validUntil !== undefined && new Date() > validUntil) {
			this.setNotification(undefined, 'FFBox 内部版本已过期，当前版本功能受限，请更新版本后使用。', NotificationLevel.warning);
			this.functionLevel = 0;
			return false;
		}
		if (!this.machineId) return false;

		// 新版激活码：验签 + machineId 匹配 + 流速衰减
		if (isV2Code(activationCode)) {
			const r = await verifyActivationCode(activationCode, true);
			if (r.ok && r.machineId === this.machineId) {
				this.functionLevel = r.functionLevel!;
				await localConfig.set('userInfo.activationCode', activationCode);
				return r.functionLevel!;
			}
			return false;
		}

		// 旧版激活码：不生效，提示升级
		if (isLegacyCode(activationCode)) {
			this.setNotification(undefined, '感谢您使用以前版本的 FFBox！❤️\n旧版本的激活码机制在当前版本已不再支持。请您依据前端界面的指示，更换为“解锢密令”🙇', NotificationLevel.warning);
			return false;
		}

		return false;
	}

	private trailLimit_checkIsMediaWorkingTimeExceeded(id: number, task: ServiceTask): boolean {
		const activeRun = task.runs[task.runs.length - 1];
		if (!activeRun) return false;
		const progressLog = activeRun.progressLog;
		if (this.functionLevel < 50) {
			if (progressLog.time[progressLog.time.length - 1][1] > getLimitaion('maxMediaDuration', this.functionLevel)!) {
				this.trailLimit_stopTranscoding(id, 'media');
				return true;
			}
		}
		const maxWorkingDuration = getLimitaion('maxWorkingDuration', this.functionLevel)!;
		if (activeRun.elapsed + new Date().getTime() / 1000 - activeRun.lastStarted > maxWorkingDuration) {
			this.trailLimit_stopTranscoding(id, 'working');
			return true;
		}
		return false;
	}

	public async trailLimit_stopTranscoding(id: number, reason: 'media' | 'working', byFrontend = false): Promise<void> {
		const task = this.taskList.getById(id)!;
		if (task.status === TaskStatus.running) {
			this.setNotification(
				id,
				i11n.service.功能限制_暂停转码(task.taskName, byFrontend, reason),
				NotificationLevel.warning,
			);
			this.taskPause(id);
		} else if ([TaskStatus.paused, TaskStatus.paused_queued].includes(task.status)) {
			this.setNotification(
				id,
				i11n.service.功能限制_不能继续(task.taskName, byFrontend, reason, task.ffmpeg!.process!.pid!),
				NotificationLevel.warning,
			);
		}
	}

	/**
	 * 任务区段查询：返回 [offset, offset+size) 范围内的任务列表或 ID 列表
	 */
	public async getTaskList(offset: number, size: number): Promise<Task[]>;
	public async getTaskList(offset: number, size: number, idOnly: true): Promise<number[]>;
	public async getTaskList(offset: number, size: number, idOnly?: boolean): Promise<Task[] | number[]> {
		if (idOnly) {
			return this.taskList.getRangeIds(offset, size);
		}
		return this.taskList.getRange(offset, size);
	}

	/**
	 * 按状态筛选任务 ID 列表
	 */
	public getTaskIdsByStatus(status: TaskStatus): number[] {
		return this.taskList.getIdsByStatus(status);
	}

	/**
	 * 任务列表摘要：一次遍历返回总数 + 各状态统计（含前 sampleSize 个样本的 id 和 index）
	 * 若任务总数超过 TASK_COUNT_LIMIT，直接返回 tooManyTasks，不遍历。
	 */
	public static readonly TASK_COUNT_LIMIT = 1000000;
	public getTaskSummary(sampleSize = 50): {
		tooManyTasks?: boolean;
		totalCount: number;
		statusStats: Record<string, { count: number; samples: Array<{ id: number; index: number }> }>;
	} {
		const totalCount = this.taskList.count();
		if (totalCount > FFBoxService.TASK_COUNT_LIMIT) {
			return { tooManyTasks: true, totalCount, statusStats: {} };
		}
		const statusStats: Record<string, { count: number; samples: Array<{ id: number; index: number }> }> = {};
		for (const status of Object.values(TaskStatus)) {
			if (status === TaskStatus.deleted) continue;
			const set = this.taskList.statusSets[status];
			const samples: Array<{ id: number; index: number }> = [];
			let count = 0;
			for (const id of set) {
				count++;
				if (samples.length < sampleSize) {
					samples.push({ id, index: this.taskList.getIndexById(id) });
				}
			}
			statusStats[status] = { count, samples };
		}
		return { totalCount, statusStats };
	}

	/**
	 * 按全局序号批量获取任务简介
	 * @returns 每个序号对应的 { index, taskId?, taskName?, status? } 或 { index, error }
	 */
	public getTaskBriefsByIndexes(indexes: number[]): Array<{ taskIndex: number; taskId?: number; taskName?: string; status?: TaskStatus; lastRunIndex?: number; error?: string }> {
		return indexes.map((taskIndex) => {
			const task = this.taskList.getByOffset(taskIndex);
			if (!task) return { taskIndex, error: '序号超出范围' };
			return {
				taskIndex,
				taskId: task.id,
				taskName: task.taskName,
				status: task.status,
				lastRunIndex: task.runs.length - 1,
			};
		});
	}

	/**
	 * 按 taskId 批量获取任务简介（不含 runs，避免传输大量数据）
	 * @returns 每个 taskId 对应的 { taskId, taskName?, status?, index? } 或 { taskId, error }
	 */
	public getTaskBriefsByIds(taskIds: number[]): Array<{ taskId: number; taskIndex?: number; taskName?: string; status?: TaskStatus; lastRunIndex?: number; error?: string }> {
		return taskIds.map(taskId => {
			const task = this.taskList.getById(taskId);
			if (!task) return { taskId, error: '任务不存在' };
			return {
				taskId,
				taskIndex: this.taskList.getIndexById(taskId),
				taskName: task.taskName,
				status: task.status,
				lastRunIndex: task.runs.length - 1,
			};
		});
	}

	/**
	 * 批量获取任务的输出文件信息（用于批量下载）
	 * @param taskRunEntries 每个任务的 { taskId, runIndex? }。runIndex 未指定时默认取最后一个 run
	 * @returns 每个输出文件的 { taskId, taskIndex, runIndex, outputIndex, filePath, fileBaseName, fileTime? }
	 *          在后端预先组装好文件名与时间信息，避免向前端传输完整的任务配置对象。
	 */
	public async getTaskOutputFiles(taskRunEntries: { taskId: number; runIndex?: number }[]): Promise<{ taskId: number; taskIndex: number; runIndex: number; outputIndex: number; filePath: string; fileBaseName: string; fileTime?: { accessTime: number; createTime: number; modifyTime: number } }[]> {
		const result: { taskId: number; taskIndex: number; runIndex: number; outputIndex: number; filePath: string; fileBaseName: string; fileTime?: { accessTime: number; createTime: number; modifyTime: number } }[] = [];
		for (const entry of taskRunEntries) {
			const task = this.taskList.getById(entry.taskId);
			if (!task) continue;
			const runIndex = entry.runIndex ?? task.runs.length - 1;
			const run = task.runs[runIndex];
			if (!run) continue;
			// 如果 outputFiles 为空（本地任务尚未启动），不要即时计算，而是跳过
			let outputFiles = run.outputFiles;
			if (!outputFiles || outputFiles.length === 0) {
				continue;
			}
			const taskIndex = this.taskList.getIndexById(entry.taskId);
			const after = run.after;
			for (let outputIndex = 0; outputIndex < outputFiles.length; outputIndex++) {
				const filePath = outputFiles[outputIndex];
				if (!filePath) continue;
				const output = after.outputs[outputIndex];
				if (!output) continue;
				const fileBaseName = getOutputFileBaseName(output.mux, {
					fileName: task.taskName,
					taskId: task.id,
					taskIndex,
					runIndex,
					outputIndex,
				});
				let fileTime: { accessTime: number | undefined; createTime: number | undefined; modifyTime: number | undefined } | undefined = undefined;
				if (output.mux.keepFileTime && task.before && task.before.length > 0) {
					const { accessTime, createTime, modifyTime, ok } = getOutputFileTime(task, outputIndex, runIndex);
					if (ok) fileTime = { accessTime, createTime, modifyTime };
				}
				result.push({
					taskId: task.id,
					taskIndex,
					runIndex,
					outputIndex,
					filePath,
					fileBaseName,
					fileTime,
				});
			}
		}
		return result;
	}

	/**
	 * 扫描指定视频流的帧信息
	 * @param id 任务 ID
	 * @param fileIndex 输入文件索引（对应 Task.before[fileIndex]）
	 * @param videoStreamIndex 视频流索引（第 n 个 type 为 video 的 stream）
	 * @param type 扫描类型：'fast' 快速扫描（ffprobe）、'full' 完整扫描（ffmpeg）、'stop' 停止扫描
	 */
	public async getMediaFrameInfo(id: number, fileIndex: number, videoStreamIndex: number, type: 'fast' | 'full' | 'stop' = 'fast'): Promise<Frame[]> {
		const task = this.taskList.getById(id);
		if (!task) {
			log.error(`[任务 ${id}] 获取帧信息：任务不存在！`);
			return [];
		}
		const inputInfo = task.before[fileIndex];
		if (!inputInfo) {
			log.error(`[任务 ${id}] 获取帧信息：输入文件索引 ${fileIndex} 不存在！`);
			return [];
		}
		const videoStreams = inputInfo.streams.filter(s => s.type === 'Video');
		const targetStream = videoStreams[videoStreamIndex];
		if (!targetStream) {
			log.error(`[任务 ${id}] 获取帧信息：视频流索引 ${videoStreamIndex} 不存在！`);
			return [];
		}
		const filePath = getTaskLatestOutputParams(task).input.files?.[fileIndex]?.filePath;
		if (!filePath) {
			log.error(`[任务 ${id}] 获取帧信息：输入文件路径为空！`);
			return [];
		}

		// 停止扫描
		if (type === 'stop') {
			for (const [key, scan] of this.frameScanStatus) {
				if (key.startsWith(`${id}_`) && scan.status === 'scanning') {
					scan.status = 'stopped';
					scan.process?.kill();
					log.info(`[任务 ${id}] 停止帧扫描：${key}`);
				}
			}
			return [];
		}

		// 检查扫描状态
		const scanKey = `${id}_${fileIndex}_${videoStreamIndex}_${filePath}`;
		const existingScan = this.frameScanStatus.get(scanKey);
		if (existingScan) {
			if (existingScan.status === 'scanning' && existingScan.promise) {
				return existingScan.promise;	// 正在扫描，等待完成
			}
			// if (existingScan.status === 'stopped') {
			// 	return [];	// 正在停止，不启动新扫描
			// }
			if (existingScan.status === 'completed') {
				if (type === 'fast' || existingScan.type === 'full') {
					return existingScan.frames || [];	// 快速扫描已完成 或 已完成完整扫描 → 返回缓存
				}
				// 请求 full 但只有 fast → 继续执行完整扫描覆盖
			}
		}

		const realFilePath = task.remoteTask ? `${os.tmpdir()}/FFBoxUploadCache/${filePath}` : filePath;
		const streamIndex = inputInfo.streams.indexOf(targetStream);	// 该 stream 在原始 streams 数组中的索引（用于 -map）

		if (type === 'fast') {
			// 快速扫描
			log.info(`[任务 ${id}] 开始快速帧扫描：${realFilePath}`);

			if (!this.ffprobePath) {
				log.error(`[任务 ${id}] 快速帧扫描失败：ffprobe 路径未配置。`);
				this.setNotification(id, `任务「${task.taskName}」快速帧扫描失败：ffprobe 未找到`, NotificationLevel.error);
				return [];
			}

			const process = spawn(this.ffprobePath, [
				'-v', 'error',
				'-show_packets',
				'-select_streams', `${streamIndex}`,
				'-show_entries', 'packet=pts_time,flags',
				'-of', 'json',
				realFilePath,
			]);

			let stdout = '';
			process.stdout!.on('data', (data) => { stdout += data.toString(); });
			process.stderr!.on('data', (data) => { log.dev(`[任务 ${id}] ffprobe stderr:`, data.toString()); });

			const scanPromise = new Promise<Frame[]>((resolve, reject) => {
				process.on('close', (code) => {
					if (this.frameScanStatus.get(scanKey)?.status === 'stopped') {
						this.frameScanStatus.delete(scanKey);
						log.info(`[任务 ${id}] 快速帧扫描已停止。`);
						resolve([]);
						return;
					}
					if (code !== 0) {
						this.frameScanStatus.delete(scanKey);
						log.error(`[任务 ${id}] 快速帧扫描失败，退出码：${code}`);
						this.setNotification(id, `任务「${task.taskName}」快速帧扫描失败`, NotificationLevel.error);
						reject(code);
						return;
					}
					try {
						const output = JSON.parse(stdout);
						const packets = output.packets as { flags: string; pts_time: string }[] | undefined;
						if (!Array.isArray(packets)) {
							log.error(`[任务 ${id}] ffprobe 输出格式异常：packets 不是数组`);
							this.frameScanStatus.delete(scanKey);
							reject(new Error('ffprobe output format error'));
							return;
						}
						const frames = packets
							.map((p, index) => ({
								n: index,
								pts_time: parseFloat(p.pts_time),
								type: (p.flags?.[0] === 'K' ? 'I' : 'P') as 'I' | 'P',
							}))
							.filter((f) => !Number.isNaN(f.pts_time));
						log.info(`[任务 ${id}] 快速帧扫描完成，共 ${frames.length} 帧。`);
						this.frameScanStatus.set(scanKey, { status: 'completed', type: 'fast', frames });
						resolve(frames);
					} catch (e) {
						this.frameScanStatus.delete(scanKey);
						log.error(`[任务 ${id}] ffprobe JSON 解析失败: ${e}`);
						reject(e);
					}
				});
			});

			this.frameScanStatus.set(scanKey, { status: 'scanning', type: 'fast', promise: scanPromise, process });
			return scanPromise;
		} else {
			// 完整扫描
			log.info(`[任务 ${id}] 开始完整帧扫描：${realFilePath}`);

			// 构造 FFmpeg 命令
			const ffmpeg = new FFmpeg(this.ffmpegPath, 6, [
				'-hide_banner',
				'-nostats',
				'-hwaccel', 'auto',
				'-i', realFilePath,
				'-map', `0:${streamIndex}`,
				'-vf', 'scale=h=160:w=-1:flags=neighbor,showinfo',
				'-f', 'null',
				'-'
			]);

			ffmpeg.on('frameInfo', ({ frames }) => {
				const existing = this.frameScanStatus.get(scanKey);
				if (existing) {
					existing.frames = frames;
				}
				log.info(`[任务 ${id}] 完整帧扫描完成，共 ${frames.length} 帧。`);
			});

			// 创建扫描 Promise 并记录状态
			const scanPromise = new Promise<Frame[]>((resolve, reject) => {
				ffmpeg.on('closed', (errorCode, runningResult) => {
					if (this.frameScanStatus.get(scanKey)?.status === 'stopped') {
						this.frameScanStatus.delete(scanKey);
						log.info(`[任务 ${id}] 完整帧扫描已停止。`);
						resolve([]);
						return;
					}
					if (errorCode || runningResult === 'failed') {
						this.frameScanStatus.delete(scanKey); // 失败时删除状态，允许重试
						log.error(`[任务 ${id}] 完整帧扫描失败。`);
						this.setNotification(id, `任务「${task.taskName}」帧扫描失败`, NotificationLevel.error);
						reject(errorCode);
					} else {
						const completedScan = this.frameScanStatus.get(scanKey);
						if (completedScan) {
							completedScan.status = 'completed';
							completedScan.type = 'full';
						}
						resolve(completedScan?.frames || []);
					}
				});
			});

			this.frameScanStatus.set(scanKey, { status: 'scanning', type: 'full', promise: scanPromise });
			return scanPromise;
		}
	}

	/**
	 * 获取缩略图视频流（缓存版本）
	 * @param id 任务ID
	 * @param width 请求宽度（可选，默认 768，最大 768）
	 * @param height 请求高度（可选，默认 768，最大 768）
	 * @param density 密度模式 'H' 或 'M'（可选，默认 'M'）
	 * @returns 返回包含流和内容类型的对象
	 */
	public async getThumbnailStream(id: number, fileIndex: number, videoStreamIndex: number, width?: number, height?: number, density?: 'H' | 'M'): Promise<{ stream: import('stream').PassThrough; contentType: string }> {
		const task = this.taskList.getById(id);
		if (!task) {
			throw new Error(`Task ${id} not found`);
		}

		const filePath = getTaskLatestOutputParams(task).input.files[fileIndex]?.filePath;
		if (!filePath) {
			throw new Error('No input file');
		}

		const realFilePath = task.remoteTask
			? `${os.tmpdir()}/FFBoxUploadCache/${filePath}`
			: filePath;

		// 参数处理（与 uiBridge.ts 保持一致）
		const MAX_DIM = 768;
		let thumbW = width || MAX_DIM;
		let thumbH = height || MAX_DIM;
		// 确保不超过最大限制
		if (thumbW > MAX_DIM || thumbH > MAX_DIM) {
			const scale = Math.min(MAX_DIM / thumbW, MAX_DIM / thumbH);
			thumbW = Math.round(thumbW * scale);
			thumbH = Math.round(thumbH * scale);
		}
		// 确保为偶数（libx264 要求）
		thumbW = thumbW % 2 === 0 ? thumbW : thumbW - 1;
		thumbH = thumbH % 2 === 0 ? thumbH : thumbH - 1;

		const thumbDensity = density || 'M';
		const duration = task.before?.[0]?.duration || 0;
		const interval = thumbDensity === 'H'
			? Math.max(duration * 0.001, 1)	// 最多生成 1000 个缩略图帧，最小帧间隔 1s
			: Math.max(duration * 0.002, 2);	// 最多生成 500 个缩略图帧，最小帧间隔 2s

		const cacheKey = `${id}_${fileIndex}_${videoStreamIndex}_${filePath}`;
		let matchedCache = this.thumbnailCache.get(cacheKey);

		// 检查参数是否匹配：请求参数 ≤ 缓存参数
		if (
			matchedCache &&
			thumbW <= matchedCache.params.width &&
			thumbH <= matchedCache.params.height &&
			(thumbDensity === 'M' || matchedCache.params.density === 'H')
		) {} else {
			matchedCache = undefined;
		}

		if (matchedCache) {
			if (matchedCache.status === 'completed' && matchedCache.data) {
				// 返回缓存数据
				const stream = new (require('stream').PassThrough)();
				stream.end(matchedCache.data);
				return {
					stream,
					contentType: matchedCache.contentType || 'video/mp4'
				};
			} else if (matchedCache.status === 'generating' && matchedCache.promise) {
				// 正在生成中，等待完成
				let data: Buffer<ArrayBufferLike>;
				const stream = new (require('stream').PassThrough)();
				try {
					data = await matchedCache.promise;
					stream.end(data);
				} catch (e) {}
				return {
					stream,
					contentType: matchedCache.contentType || 'video/mp4'
				};
			}
			// stopped 状态或其他情况，继续重新生成
		}

		// 开始新的生成
		const ffmpegArgs = [
			'-skip_frame', 'nokey',
			'-i', realFilePath,
			'-vf', `select='isnan(prev_selected_t)+gte(t-prev_selected_t\\,${interval})',scale=${thumbW}:${thumbH}`,
			'-vsync', 'vfr',
			'-c:v', 'libx264',
			'-preset', 'ultrafast',
			'-crf', '24',
			'-g', '1',
			'-an',
			'-movflags', '+frag_keyframe+empty_moov+default_base_moof',
			'-f', 'mp4',
			'-',
		];
		log.dev(`[任务 ${id}] 缩略图流 ffmpeg 启动，分辨率 ${thumbW}×${thumbH}，最低帧间隔 ${interval}`, ffmpegArgs.join(' '));

		// 创建流收集器
		const PassThrough = require('stream').PassThrough;
		const passThrough = new PassThrough();
		const chunks: Buffer[] = [];

		passThrough.on('data', (chunk: Buffer) => chunks.push(chunk));

		// 启动 FFmpeg 进程
		const ffmpegProc = spawn(this.ffmpegPath, ffmpegArgs);

		// 设置缓存项
		const cacheItem = {
			status: 'generating',
			data: null,
			params: {
				width: thumbW,
				height: thumbH,
				density: thumbDensity,
			},
			contentType: 'video/mp4'
		} as any;

		// 创建 Promise
		const generationPromise = new Promise<Buffer>((resolve, reject) => {
			ffmpegProc.stdout.pipe(passThrough);

			ffmpegProc.on('error', (err: Error) => {
				log.error(`[任务 ${id}] 缩略图流 ffmpeg 错误`, err);
				this.thumbnailCache.delete(cacheKey);
				resolve(null);
			});

			ffmpegProc.on('close', (code: number) => {
				if (code === 0) {
					// 生成成功，缓存数据
					const finalData = Buffer.concat(chunks);
					cacheItem.data = finalData;
					cacheItem.status = 'completed';
					log.info(`[任务 ${id}] 缩略图生成完成，大小 ${finalData.length} 字节`);
					resolve(finalData);
				} else {
					// 生成失败
					log.warn(`[任务 ${id}] 缩略图生成中断，退出码 ${code}`);
					this.thumbnailCache.delete(cacheKey);
					resolve(null);
				}
			});

			passThrough.on('close', () => {
				// 客户端断开连接
				if (ffmpegProc.exitCode === null) {
					log.info(`[任务 ${id}] 缩略图生成中断或结束`);
					// FFmpeg 仍在运行，杀死进程
					ffmpegProc.kill();
					cacheItem.status = 'stopped';
				}
			});
		});

		// 存储到缓存
		this.thumbnailCache.set(cacheKey, {
			...cacheItem,
			promise: generationPromise,
			process: ffmpegProc
		});

		// 返回流供客户端使用
		return {
			stream: passThrough,
			contentType: 'video/mp4'
		};
	}
}
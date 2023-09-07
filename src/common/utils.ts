/* eslint-disable no-fallthrough */
// #region 格式转换区

import { OutputParams, ServiceTask, Task, TaskStatus, TransferStatus } from '@common/types';
import { UITask } from '@renderer/types';

/**
 * 传入 "xxx kbps"，返回比特率（Kbps）
 */
export function getKbpsValue(text: string): number {
	return parseInt(text.slice(0, -5));
}

/**
 * 传入比特率（Kbps），返回 "xxx kbps" 或 "xxx Mbps"
 */
export function getFormattedBitrate(Kbps: number): string {
	return Kbps < 1000 ? Kbps + ' kbps' : (Kbps / 1000).toFixed(1) + ' Mbps';
}

/**
 * 传入秒数，返回 --:--:--.--
 */
export function stringifyTimeValue(timeValue: number): string {
	if (!isNaN(timeValue) && timeValue !== -1) {
		const Hour = Math.floor(timeValue / 3600);
		const Minute = Math.floor((timeValue - Hour * 3600) / 60);
		const Second = timeValue - Hour * 3600 - Minute * 60;
		return ('0' + Hour).slice(-2) + ':' + ('0' + Minute).slice(-2) + ':' + ('0' + Second.toFixed(2)).slice(-5);
	} else {
		return '时长未知';
	}
}

/**
 * 传入 ffmpeg 支持的时间格式（如 --:--:--.-- 或 ---.--），返回秒数（如格式错误则返回 -1）
 */
export function parseTimeString(timeString: string): number {
	if (timeString === 'N/A') {
		return -1;
	}
	let exp: RegExpExecArray;
	if (exp = /^(\d+):([0-5]?[0-9]):([0-5]?[0-9])(.\d+)?$/.exec(timeString)) {
		// (时):(分):(秒)(.小)
		const hour = Number(exp[1]);
		const minute = Number(exp[2]);
		const second = Number(exp[3]);
		const mili = Number(exp[4] ?? '0');
		if (minute >= 60 || second >= 60) {
			return -1;
		}
		return hour * 3600 + minute * 60 + second + Number(mili);
	} else if (exp = /^([0-5]?[0-9]):([0-5]?[0-9])(.\d+)?$/.exec(timeString)) {
		// (分):(秒)(.小)
		const minute = Number(exp[1]);
		const second = Number(exp[2]);
		const mili = Number(exp[3] ?? '0');
		if (minute >= 60 || second >= 60) {
			return -1;
		}
		return minute * 60 + second + Number(mili);
	} else if (/^(\d+)(.\d+)?$/.test(timeString)) {
		// (秒)(.小)
		return Number(timeString);
	}
	return -1;
}

// #endregion

// #region 字符串转换区

/**
 * 传入头尾字符串，抽取字符串中间的部分，并返回字符串和抽取后的位置
 * @param {string} text  输入字符串
 * @param {string} pre   要识别的前缀
 * @param {string} post  要识别的后缀
 * @param {number} begin 识别开始的位置
 * @param {boolean} includePostLength   返回的识别结束后的位置是否包含后缀长度
 * @returns {text: string, pos: number} 抽取的部分和抽取后的位置
 */
export function selectString(text: string, pre: string, post = '', begin = 0, includePostLength = false) {
	let outText;
	let outPos = -1;
	const prePos = text.indexOf(pre, begin);
	if (prePos !== -1) {
		let postPos;
		if (post === '') {
			postPos = text.length;
		} else {
			postPos = text.indexOf(post, prePos + pre.length);
		}
		if (postPos !== -1) {
			outText = text.slice(prePos + pre.length, postPos);
			outPos = postPos;
			if (includePostLength) {
				outPos += post.length;
			}
		}
	}
	return { text: outText, pos: outPos };
}

/**
 * 带初始位置和结束位置的 replace
 * @param {string} text  输入字符串
 * @param {string} searchValue  要搜索的部分
 * @param {string} replaceValue 搜索到的内容替换为此部分
 * @param {number} start 识别开始的位置
 * @param {number} end   识别结束的位置
 * @returns {string} 替换后的字符串
 */
export function replaceString(text: string, searchValue: string, replaceValue: string, start: number, end: number): string {
	const front = text.slice(0, start);
	let mid = text.slice(start, end);
	while (mid.indexOf(searchValue) != -1) {
		mid = mid.replace(searchValue, replaceValue);
	}
	const rear = text.slice(end);
	return front + mid + rear;
}

/**
 * 仿 scanf 的功能，结果以数组形式返回
 * 注意其与 C 语言的 scanf 表现有所不同：%d %f 被视为同一类型；可自定义分隔符作为字符串的结束，空格和换行在格式和输入数字的前方忽略；格式中不支持转义符
 * @param {string} input  输入字符串
 * @param {string} format 格式
 * @param {string} splitter 用于作为 %s 结束标记的分隔符
 */
export function scanf(input: string, format: string, splitter = ' '): Array<any> {
	let i = 0, j = 0;
	let c = '', f = '';		// c：正在匹配的输入字符		f：正在匹配的格式字符
	let status = 0;			// 0：正常逐位匹配		1：正在匹配字符串		2：正在匹配数字		4：匹配结束
	let str = '';			// 字符串或数字匹配过程中的字符串
	const returnList: Array<any> = [];
	while (status != 4) {
		switch (status) {
			case 0:			// 正常逐位匹配
				f = format[j++];
				switch (f) {
					case '%':		// 读到 %，再读取一次已确定进入何种状态
						f = format[j++];
						switch (f) {
							case 's':		// 进入字符串匹配
								status = 1;
								break;
							case 'd': case 'f':	// 进入数字匹配
								status = 2;
								break;
							case 'c':		// 字符匹配，直接再读取一次
								c = input[i++];
								if (c != undefined) {
									returnList.push(c.charCodeAt(0));
								} else {
									status = 4;
								}
								break;
							default:		// 格式错误或为空
								status = 4;
								break;
						}
						break;
					case ' ':		// 忽略空格
						break;
					case undefined:	// 为空
						status = 4;
						break;
					default:		// 逐位匹配
						while (true) {		// 清除输入前置空白符
							c = input[i++];
							if (c != ' ' && c != '\n') { break }
						}
						if (f != c) {
							status = 4;
						}
						break;
				}
				break;
			case 1:			// 字符串匹配
				while (true) {	// 清除输入前置空白符
					c = input[i++];
					if (c != ' ' && c != '\n') {
						i--;
						break;
					}
				}
				while (status == 1) {
					c = input[i++];
					switch (c) {
						case splitter:
							returnList.push(str);
							str = '';
							status = 0;
							i--;
							break;
						case undefined:
							status = 4;
							break;
						default:
							str += c;
							break;
					}
				}
			case 2:			// 数字匹配
				while (true) {	// 清除前置空白符
					c = input[i++];
					if (c != ' ' && c != '\n') {
						i--;
						break;
					}
				}
				while (status == 2) {
					c = input[i++];
					switch (c) {
						case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': case '.':
							str += c;
							break;
						case '-':		// 如果负号在开头
							if (str == '') {
								str += c;
								break;
							}
						case 'N':		// NaN | N/A
							str += c + input[i] + input[i + 1]
							if (str == 'NaN' || str == 'N/A') {
								returnList.push(NaN);
								str = "";
								status = 0;
								i++;
								i++;
							}
							break;
						default:		// 否则当作非数字处理，input 回退一位
							if (str == '') {
								status = 4;
								break;
							} else {
								if (str.includes('.')) {
									returnList.push(parseFloat(str));
								} else {
									returnList.push(parseInt(str));
								}
								str = "";
								status = 0;
								i--;
							}
							break;
					}
				}
			default:
				break;
		}
	}
	return returnList;
}

/**
 * 获取随机字符串
 */
export function randomString(length = 6, dictionary = 'abcdefghijklmnopqrstuvwxyz'): string {
	let result = '';
	for (let i = length; i > 0; --i) result += dictionary[Math.floor(Math.random() * dictionary.length)];
	return result;
}

// #endregion

// #region 任务转换区

export function getInitialTask(fileBaseName: string, outputParams?: OutputParams): Task {
	const task: Task = {
		fileBaseName: fileBaseName,
		before: {
			format: '读取中',
			duration: NaN,
			vcodec: '读取中',
			acodec: '读取中',
			vresolution: '读取中',
			vframerate: NaN,
			vbitrate: NaN,
			abitrate: NaN,
		},
		after: {
			input: {
				mode: 'standalone',
				hwaccel: '',
				files: [],
			},
			video: {
				vcodec: '',
				vencoder: '',
				resolution: '',
				framerate: '',
				ratecontrol: '',
				ratevalue: NaN,
				detail: {}
			},
			audio: {
				acodec: '',
				aencoder: '',
				ratecontrol: '',
				ratevalue: NaN,
				vol: NaN,
				detail: {}
			},
			output: {
				format: '',
				moveflags: false,
				filename: '',
			},
		},
		paraArray: [],
		status: TaskStatus.TASK_STOPPED,
		progressLog: {
			time: [],
			frame: [],
			size: [],
			lastStarted: new Date().getTime() / 1000,
			elapsed: 0,
			lastPaused: new Date().getTime() / 1000,	// 用于暂停后恢复时计算速度
		},
		cmdData: '',
		errorInfo: [],
		// notifications: [],
		outputFile: '',
	}
	if (outputParams) {
		Object.assign(task, { after: outputParams });
	}
	return task;
}

export function getInitialServiceTask(fileName: string, outputParams?: OutputParams): ServiceTask {
	const task: ServiceTask = {
		...getInitialTask(fileName, outputParams),
		...{
			ffmpeg: null,
			remoteTask: false,
		},
	};
	return task;
}

export function getInitialUITask(fileName: string, outputParams?: OutputParams): UITask {
	const task: UITask = {
		...getInitialTask(fileName, outputParams),
		...{
			dashboard: {
				progress: 0,
				bitrate: 0,
				speed: 0,
				time: 0,
				frame: 0,
				size: 0,
				transferred: 0,
				transferSpeed: 0,
			},
			dashboard_smooth: {
				progress: 0,
				bitrate: 0,
				speed: 0,
				time: 0,
				frame: 0,
				size: 0,
				transferred: 0,
				transferSpeed: 0,
			},
			dashboardTimer: NaN,
			transferStatus: TransferStatus.normal,
			transferProgressLog: {
				transferred: [],
				total: NaN,
			},
		},
	};
	return task;
}

/**
 * 任务信息在进行网络传送前调用此函数，过滤掉仅存在于 ServiceTask | UITask 的属性
 */
export function convertAnyTaskToTask(task: ServiceTask | UITask): Task {
	return {
		fileBaseName: task.fileBaseName,
		before: task.before,
		after: task.after,
		paraArray: task.paraArray,
		status: task.status,
		progressLog: task.progressLog,
		cmdData: task.cmdData,
		errorInfo: task.errorInfo,
		// notifications: task.notifications,
		outputFile: task.outputFile,
	};
}

/**
 * 来自 FFBoxService 的任务信息自网络接收后与现存的 UITask 进行合并
 */
export function mergeTaskFromService(self: UITask, remote: Task): UITask {
    const ret = self;
    Object.assign(ret, JSON.parse(JSON.stringify(remote)));
    return ret;
}

/**
 * 在不影响原有任务特有参数（如文件列表）的情况下替换 OutputParams，用于取代 JSON.parse(JSON.stringify())
 * @param from 新的参数列表
 * @param to 任务原有的参数列表
 */
export function replaceOutputParams(from: OutputParams, to: OutputParams) {
	const ret: OutputParams = {
		input: JSON.parse(JSON.stringify(from.input)),
		video: JSON.parse(JSON.stringify(from.video)),
		audio: JSON.parse(JSON.stringify(from.audio)),
		output: JSON.parse(JSON.stringify(from.output)),
	};
	// 以下参数更改为任务原有的参数
	ret.input.mode = to.input.mode;
	ret.input.files = to.input.files;
	return ret;
}

// #endregion

// #region 实用功能

/**
 * 拷贝自 https://www.npmjs.com/package/typed-emitter
 */
export type Arguments<T> = [T] extends [(...args: infer U) => any]
	? U
	: [T] extends [void] ? [] : [T];

export interface TypedEventEmitter<Events> {
	addListener<E extends keyof Events>(event: E, listener: Events[E]): this
	on<E extends keyof Events>(event: E, listener: Events[E]): this
	once<E extends keyof Events>(event: E, listener: Events[E]): this
	prependListener<E extends keyof Events>(event: E, listener: Events[E]): this
	prependOnceListener<E extends keyof Events>(event: E, listener: Events[E]): this

	off<E extends keyof Events>(event: E, listener: Events[E]): this
	removeAllListeners<E extends keyof Events>(event?: E): this
	removeListener<E extends keyof Events>(event: E, listener: Events[E]): this

	emit<E extends keyof Events>(event: E, ...args: Arguments<Events[E]>): boolean
	eventNames(): (keyof Events | string | symbol)[]
	// eslint-disable-next-line @typescript-eslint/ban-types
	rawListeners<E extends keyof Events>(event: E): Function[];
	// eslint-disable-next-line @typescript-eslint/ban-types
	listeners<E extends keyof Events>(event: E): Function[];
	listenerCount<E extends keyof Events>(event: E): number;

	getMaxListeners(): number;
	setMaxListeners(maxListeners: number): this;
}

export function getTimeString(date: Date, showMs = true): string {
	return `${date.getFullYear()}-${(date.getMonth() + 1 + '').padStart(2, '0')}-${(date.getDate() + '').padStart(2, '0')} ${(date.getHours() + '').padStart(2, '0')}:${(date.getMinutes() + '').padStart(2, '0')}:${(date.getSeconds() + '').padStart(2, '0')}${showMs ? '.' + (date.getMilliseconds() + '').padStart(3, '0') : ''}`;
}

/**
 * 获取当前运行环境
 * 注：若 nodeIntegration 关闭，则渲染进程会获得“browser”
 */
export function getEnv(): 'browser' | 'node' | 'electron-renderer' | 'electron-main' {
	if (typeof process !== 'undefined') {
		if (process.env.IS_ELECTRON) {
			if (typeof window !== 'undefined') {
				return 'electron-renderer';
			} else {
				return 'electron-main';
			}
		} else {
			return 'node';
		}
	} else {
		return 'browser';
	}
}

// #endregion

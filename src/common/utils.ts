// #region 格式转换区

import { OutputParams, ServiceTask, TaskStatus } from "@/types/types";

/** 
 * 传入 "xxx kbps"，返回比特率（Kbps）
 */
export function getKbpsValue (text: string): number {	
	return parseInt(text.slice(0, -5));
}

/**
 * 传入比特率（Kbps），返回 "xxx kbps" 或 "xxx Mbps"
 */
export function getFormattedBitrate (Kbps: number): string {
	return Kbps < 1000 ? Kbps + " kbps" : (Kbps / 1000).toFixed(1) + " Mbps";
}

/**
 * 传入秒数，返回 --:--:--.--
 */
export function getFormattedTime (timeValue: number): string {
	if (timeValue !== -1) {
		let Hour = Math.floor(timeValue / 3600);
		let Minute = Math.floor((timeValue - Hour * 3600) / 60);
		let Second = timeValue - Hour * 3600 - Minute * 60;
		return ("0" + Hour).slice(-2) + ":" + ("0" + Minute).slice(-2) + ":" + ("0" + Second.toFixed(2)).slice(-5);
	} else {
		return "时长未知";
	}
}

/**
 * 传入 --:--:--.--，返回秒数
 */
export function getTimeValue (timeString: string): number {
	if (timeString !== "N/A") {
		let seconds = parseInt(timeString.slice(0, 2)) * 3600 + parseInt(timeString.slice(3, 5)) * 60 - (-timeString.slice(6));
		if (seconds > 0) {
			return seconds;
		} else {
			return -1;
		}
	} else {
		return -1;
	}
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
export function selectString (text: string, pre: string, post = '', begin = 0, includePostLength = false) {
	let outText;
	let outPos = -1;
	let prePos = text.indexOf(pre, begin);
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
	return {text: outText, pos: outPos};
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
export function replaceString (text: string, searchValue: string, replaceValue: string, start: number, end: number): string {
	let front = text.slice(0, start);
	let mid = text.slice(start, end);
	while (mid.indexOf(searchValue) != -1) {
		mid = mid.replace(searchValue, replaceValue);
	}
	let rear = text.slice(end);
	return front + mid + rear;
}

/**
 * 仿 scanf 的功能，结果以数组形式返回
 * 注意其与 C 语言的 scanf 表现有所不同：%d %f 被视为同一类型；可自定义分隔符作为字符串的结束，空格和换行在格式和输入数字的前方忽略；格式中不支持转义符
 * @param {string} input  输入字符串
 * @param {string} format 格式
 * @param {string} splitter 用于作为 %s 结束标记的分隔符
 */
export function scanf (input: string, format: string, splitter = ' '): Array<any> {
	let i = 0, j = 0;
	let c = '', f = '';		// c：正在匹配的输入字符		f：正在匹配的格式字符
	let status = 0;			// 0：正常逐位匹配		1：正在匹配字符串		2：正在匹配数字		4：匹配结束
	let str = "";			// 字符串或数字匹配过程中的字符串
	let returnList: Array<any> = [];
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
export function randomString (length = 6, dictionary = 'abcdefghijklmnopqrstuvwxyz'): string {
	let result = '';
	for (let i = length; i > 0; --i) result += dictionary[Math.floor(Math.random() * dictionary.length)];
	return result;
}

// #endregion

// #region 初始值区

export function getInitialTask(fileName: string, filePath: string, mode: 'client' | 'server' | '' = '', outputParams?: OutputParams): ServiceTask {
	let ret: ServiceTask = {
		fileName: fileName,
		filePath: filePath,
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
		after: {},
		paraArray: [],
		status: TaskStatus.TASK_STOPPED,
		taskProgress: {
			normal: [],
			size: [],
		},
		cmdData: '',
		errorInfo: [],
		lastPaused: new Date().getTime() / 1000,	// 用于暂停后恢复时计算速度
		notifications: [],
	}
	if (mode === 'client') {
		Object.assign(ret, {
			progress: {
				progress: 0,
				bitrate: 0,
				speed: 0,
				time: 0,
				frame: 0,
			},
			progress_smooth: {
				progress: 0,
				bitrate: 0,
				speed: 0,
				time: 0,
				frame: 0,
			},
			dashboardTimer: NaN,
		});
	} else if (mode === 'server') {
		Object.assign(ret, { ffmpeg: null });
	}
	if (outputParams) {
		Object.assign(ret, { after: outputParams });
	}
	return ret;
}

// #endregion

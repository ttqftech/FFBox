// 传入 "xxx kbps"，返回 xxx
function getKbpsValue (text) {	
	return parseInt(text.slice(0, -5));
}

// 传入 xxx，返回 "xxx kbps" 或 "xxx Mbps"
function getFormattedBitrate (Kbps) {
	return Kbps < 1000 ? Kbps + " kbps" : (Kbps / 1000).toFixed(1) + " Mbps";
}

// 传入秒数，返回 --:--:--.--
function getFormattedTime (timeValue) {
	if (timeValue != -1) {
		var Hour = parseInt(timeValue / 3600);
		var Minute = parseInt((timeValue - Hour * 3600) / 60);
		var Second = timeValue - Hour * 3600 - Minute * 60;
		return ("0" + Hour).slice(-2) + ":" + ("0" + Minute).slice(-2) + ":" + ("0" + Second.toFixed(2)).slice(-5);	
	} else {
		return "时长未知"
	}
}

// 传入 --:--:--.--，返回秒数
function getTimeValue (timeString) {
	if (timeString != "N/A") {
		var seconds = timeString.slice(0, 2) * 3600 + timeString.slice(3, 5) * 60 - (-timeString.slice(6));
		if (seconds > 0) {
			return seconds;
		} else {
			return -1;
		}
	} else {
		return -1;
	}
}


/**
 * 传入头尾字符串，抽取字符串中间的部分，并返回字符串和抽取后的位置
 * @param {string} text  输入字符串
 * @param {string} pre   要识别的前缀
 * @param {string} post  要识别的后缀
 * @param {number} begin 识别开始的位置
 * @param {boolean} includePostLength   返回的识别结束后的位置是否包含后缀长度
 * @returns {text: string, pos: number} 抽取的部分和抽取后的位置
 */
function selectString (text, pre, post = '', begin = 0, includePostLength = false) {
	var outText;
	var outPos = -1;
	var prePos = text.indexOf(pre, begin);
	if (prePos != -1) {
		if (post == '') {
			var postPos = text.length;
		} else {
			var postPos = text.indexOf(post, prePos + pre.length);
		}
		if (postPos != -1) {
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
function replaceString (text, searchValue, replaceValue, start, end) {
	var front = text.slice(0, start);
	var mid = text.slice(start, end);
	while (mid.indexOf(searchValue) != -1) {
		mid = mid.replace(searchValue, replaceValue);
	}
	var rear = text.slice(end);
	return front + mid + rear;
}

/**
 * 仿 scanf 的功能，结果以数组形式返回
 * 注意其与 C 语言的 scanf 表现有所不同：%d %f 被视为同一类型；可自定义分隔符作为字符串的结束，空格和换行在格式和输入数字的前方忽略；格式中不支持转义符
 * @param {string} input  输入字符串
 * @param {string} format 格式
 * @param {string} splitter 用于作为 %s 结束标记的分隔符
 */
function scanf (input, format, splitter = ' ') {
	var i = 0, j = 0;
	var c = '', f = '';		// c：正在匹配的输入字符		f：正在匹配的格式字符
	var status = 0;			// 0：正常逐位匹配		1：正在匹配字符串		2：正在匹配数字		4：匹配结束
	var str = "";			// 字符串或数字匹配过程中的字符串
	var returnList = [];
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
									returnList.push[c.charCodeAt()];
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

// 去除路径名中的文件名后缀
function getFilePathWithoutPostfix (path) {
	var lastPoint = path.lastIndexOf(".");
	if (lastPoint != -1) {							// 路径名有点
		if (lastPoint > path.lastIndexOf("\\")) {	// 文件名有点
			return path.slice(0, lastPoint);
		} else {
			return path;							// 路径有点，但不在文件名里
		}
	} else {										// 路径名里一个点也没有，全数返回
		return path;
	}
}

if (typeof window !== 'undefined') {
	// Browser Env
}
if (typeof global !== 'undefined') {
	// Node Env
	exports.getKbpsValue = getKbpsValue
	exports.getFormattedBitrate = getFormattedBitrate
	exports.getFormattedTime = getFormattedTime
	exports.getTimeValue = getTimeValue
	exports.selectString = selectString
	exports.replaceString = replaceString
	exports.scanf = scanf
	exports.getFilePathWithoutPostfix = getFilePathWithoutPostfix
	// 下面这句作用相同
	// module.exports = { getKbpsValue, getFormattedBitrate, getFormattedTime, getTimeValue, selectString, replaceString, scanf, getFilePathWithoutPostfix }
}
// 如果必定是经过 babel 编译后执行，则可以用下面的这句，而不用 module.exports，作用相同。主要是 export 要求必定在顶层，不能套在 if 里面，因此不使用这种方法
// export { getKbpsValue, getFormattedBitrate, getFormattedTime, getTimeValue, selectString, replaceString, scanf, getFilePathWithoutPostfix }


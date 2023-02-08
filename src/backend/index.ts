import { FFBoxService } from './FFBoxService';
// import { getEnv } from "@common/utils";

/**
 * 解析当前程序的命令行参数（GNU 风格）
 * @param argName 需要获取的参数名，如“-h”、“--help”
 * @returns 若该参数的下一个值存在，且不以“-”或“--”开头，则返回该参数值，否则返回 true。若参数不存在，返回 undefined
 */
export function getSingleArgvValue(argName: string, ignoreCase = false) {
	const args = process.argv;
	const argNameIndex = args.findIndex(arg => ignoreCase ? argName.toLowerCase() === arg.toLowerCase() : argName === arg);
	if (argNameIndex >= 0 && argNameIndex < args.length) {
		const nextValue = args[argNameIndex + 1];
		if (nextValue === undefined || nextValue.startsWith('-') || nextValue.startsWith('--')) {
			return true;
		}
		return nextValue;
	}
	return undefined;
}
  
let time = 0;

const service = new FFBoxService();
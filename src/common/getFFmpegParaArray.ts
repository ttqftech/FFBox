import { generator as fGenerator } from "./formats";
import { generator as vGenerator } from "./vcodecs";
import { generator as aGenerator } from "./acodecs";
import upath from 'upath'
import { OutputParams } from "@/types/types";

/**
 * 获取命令行参数
 * 如果不提供 outputBaseName 或 outputDir，则自动从 outputParams.input.files[0].filePath 中提取
 */
export function getFFmpegParaArray(outputParams: OutputParams, withQuotes: boolean = false, outputBaseName?: string, outputDir?: string, overrideFilePath?: string) {
	let ret = [];
	let inputFilePath = outputParams.input.files[0] && outputParams.input.files[0].filePath;
	outputBaseName = outputBaseName || upath.trimExt(upath.basename(inputFilePath || '[输出文件名]'));
	outputDir = outputDir || upath.dirname(inputFilePath || '[输出目录]');
	ret.push('-hide_banner');
	ret.push(...fGenerator.getInputParam(outputParams.input, withQuotes));
	ret.push(...vGenerator.getVideoParam(outputParams.video));
	ret.push(...aGenerator.getAudioParam(outputParams.audio));
	ret.push(...fGenerator.getOutputParam(outputParams.output, outputDir, outputBaseName, withQuotes, overrideFilePath));
	ret.push('-y');
	return ret;
}

export function getFFmpegParaArrayOutputPath(outputParams: OutputParams) {
	let inputFilePath = outputParams.input.files[0] && outputParams.input.files[0].filePath;
	const outputBaseName = upath.trimExt(upath.basename(inputFilePath || '[输出文件名]'));
	const outputDir = upath.dirname(inputFilePath || '[输出目录]');
	return fGenerator.concatFilePath(outputParams.output, outputDir, outputBaseName);
}
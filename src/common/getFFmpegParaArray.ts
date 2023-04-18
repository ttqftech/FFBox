import { generator as fGenerator } from './params/formats';
import { generator as vGenerator } from './params/vcodecs';
import { generator as aGenerator } from './params/acodecs';
import { OutputParams } from '@common/types';
import path from './path';

const { trimExt, dirname, basename } = path;

/**
 * 获取命令行参数
 * 如果不提供 outputBaseName 或 outputDir，则自动从 outputParams.input.files[0].filePath 中提取
 */
export function getFFmpegParaArray(outputParams: OutputParams, withQuotes = false, outputBaseName?: string, outputDir?: string, overrideFilePath?: string) {
	const ret: Array<string> = [];
	const inputFilePath = outputParams.input.files[0] && outputParams.input.files[0].filePath;
	outputBaseName = outputBaseName || trimExt(basename(inputFilePath || '[输出文件名]'));
	outputDir = outputDir || dirname(inputFilePath || '[输出目录]');
	ret.push('-hide_banner');
	ret.push(...fGenerator.getInputParam(outputParams.input, withQuotes));
	ret.push(...vGenerator.getVideoParam(outputParams.video));
	ret.push(...aGenerator.getAudioParam(outputParams.audio));
	ret.push(...fGenerator.getOutputParam(outputParams.output, outputDir, outputBaseName, withQuotes, overrideFilePath));
	ret.push('-y');
	return ret;
}

export function getFFmpegParaArrayOutputPath(outputParams: OutputParams) {
	const inputFilePath = outputParams.input.files[0] && outputParams.input.files[0].filePath;
	const outputBaseName = trimExt(basename(inputFilePath || '[输出文件名]'));
	const outputDir = dirname(inputFilePath || '[输出目录]');
	return fGenerator.concatFilePath(outputParams.output, outputDir, outputBaseName);
}

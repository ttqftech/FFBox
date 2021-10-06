import { generator as fGenerator } from "./formats";
import { generator as vGenerator } from "./vcodecs";
import { generator as aGenerator } from "./acodecs";
import upath from 'upath'
import { OutputParams } from "@/types/types";

export function getFFmpegParaArray(outputParams: OutputParams, withQuotes: boolean = false, outputBaseName?: string, outputDir?: string) {
	let ret = [];
	let inputFilePath = outputParams.input.files[0] && outputParams.input.files[0].filePath;
	outputBaseName = outputBaseName || upath.trimExt(upath.basename(inputFilePath || '[输出文件名]'));
	outputDir = outputDir || upath.dirname(inputFilePath || '[输出目录]');
	ret.push('-hide_banner');
	ret.push(...fGenerator.getInputParam(outputParams.input, withQuotes));
	ret.push(...vGenerator.getVideoParam(outputParams.video));
	ret.push(...aGenerator.getAudioParam(outputParams.audio));
	ret.push(...fGenerator.getOutputParam(outputParams.output, outputDir, outputBaseName, withQuotes));
	ret.push('-y');
	return ret;
}

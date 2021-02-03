import { generator as fGenerator } from "./formats";
import { generator as vGenerator } from "./vcodecs";
import { generator as aGenerator } from "./acodecs";
import upath from 'upath'

export function getFFmpegParaArray (filepath: string, iParams: any, vParams: any, aParams: any, oParams: any, withQuotes: boolean = false) {
	var ret = []
	ret.push('-hide_banner')
	ret.push(...fGenerator.getInputParam(iParams))
	ret.push('-i')
	ret.push((withQuotes ? '"' : '') + filepath + (withQuotes ? '"' : ''))
	ret.push(...vGenerator.getVideoParam(vParams))
	ret.push(...aGenerator.getAudioParam(aParams))
	ret.push(...fGenerator.getOutputParam(oParams, upath.dirname(filepath), upath.trimExt(upath.basename(filepath)), withQuotes))
	ret.push('-y')
	return ret
}

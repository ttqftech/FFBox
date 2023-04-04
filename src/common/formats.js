const formats = [
	{
		sName: 'MP4',
		lName: 'MP4',
		imageName: 'format_format',
		imageOffset: 9,
		description: 'MP4 - MP4 即 MPEG-4 Part 14 是一种标准的数字多媒体容器格式。',
		extension: 'mp4'
	},
	{
		sName: 'MKV',
		lName: 'MKV',
		imageName: 'format_format',
		imageOffset: 7,
		description: 'MKV - MKV 即 Matroska Video File 是一种开放源代码的多媒体封装格式。',
		extension: 'mkv'
	},
	{
		sName: 'MOV',
		lName: 'MOV',
		imageName: 'format_format',
		imageOffset: 6,
		description: 'MOV - MOV 为 QuickTime Movie 的文件扩展名。QuickTime 是由苹果公司所开发的一种多媒体框架。',
		extension: 'mov'
	},
	{
		sName: 'FLV',
		lName: 'FLV',
		imageName: 'format_format',
		imageOffset: 8,
		description: 'FLV - FLV 即 Flash Video，是一种网络视频格式，用作流媒体格式。',
		extension: 'flv'
	},
	{
		sName: 'TS',
		lName: 'TS',
		imageName: 'format_format',
		imageOffset: 5,
		description: 'TS - TS 即 MPEG2-TS 传输流（MPEG-2 Transport Stream；又称 MPEG-TS、MTS）是一种传输和存储包含视频、音频与通信协议各种数据的标准格式，用于数字电视广播系统。',
		extension: 'ts'
	},
	{
		sName: '3GP',
		lName: '3GP',
		imageName: 'format_format',
		imageOffset: 4,
		description: '3GP - 3GP 是 MPEG-4 Part 14（MP4）的一种简化版本，减少了存储空间和较低的带宽需求，让手机上有限的存储空间可以使用。',
		extension: '3gp'
	},
	{
		sName: 'RM',
		lName: 'RM (RMVB)',
		imageName: 'format_format',
		imageOffset: 3,
		description: 'RM - RM 即 RealMedia。RealVideo 是由 RealNetworks 开发的一种专用视频压缩格式。',
		extension: 'rm'
	},
	{
		sName: 'WMV',
		lName: 'WMV',
		imageName: 'format_format',
		imageOffset: 2,
		description: 'WMV - WMV 即 Windows Media Video 是微软公司开发的一组数字影片编解码格式的通称，它是 Windows Media 架构下的一部分。',
		extension: 'wmv'
	},
	{
		sName: 'AVI',
		lName: 'AVI',
		imageName: 'format_format',
		imageOffset: 1,
		description: 'AVI - AVI 即 Audio Video Interleave 是由微软在 1992 年 11 月推出的一种多媒体文件格式。',
		extension: 'avi'
	},
	{
		sName: '无',
		lName: '无',
		imageName: '',
		imageOffset: 0,
		description: '不设置输出格式，用于测试性能',
		extension: '-'
	},
]

const hwaccels = [
	{
		sName: '不使用',
		lName: '不使用',
		imageName: '',
		imageOffset: 0,
		description: '不使用硬件解码。',
		hwaccel: '-'
	},
	{
		sName: '自动',
		lName: '自动',
		imageName: '',
		imageOffset: 0,
		description: '自动选择硬件解码器。',
		hwaccel: 'auto'
	},
	{
		sName: 'dxva2',
		lName: 'dxva2',
		imageName: '',
		imageOffset: 0,
		description: 'Direct-X Video Acceleration API 2 - Windows 和 Xbox360 上的通用硬件解码器，支持包括 H.264, MPEG-2, VC-1, WMV 3 在内的视频解码。（解码所用的设备与您的主显示器连接的 GPU 有关）',
		hwaccel: 'dxva2'
	},
	{
		sName: 'd3d11va',
		lName: 'd3d11va',
		imageName: '',
		imageOffset: 0,
		description: 'd3d11va',
		hwaccel: 'd3d11va'
	},
	{
		sName: 'cuda',
		lName: 'cuda',
		imageName: '',
		imageOffset: 0,
		description: 'NVIDIA 显卡的 cuda 解码器。',
		hwaccel: 'cuda'
	},
	{
		sName: 'cuvid',
		lName: 'cuvid/nvenc',
		imageName: '',
		imageOffset: 0,
		description: 'NVIDIA 显卡的专用视频解码器。',
		hwaccel: 'cuvid'
	},
	{
		sName: 'qsv',
		lName: 'qsv',
		imageName: '',
		imageOffset: 0,
		description: 'Intel 显卡的 Quick Sync Video 解码。',
		hwaccel: 'qsv'
	},
]

const generator = {
	/**
	 * 连接并补充扩展名的文件名（fileDir 为空则仅输出带扩展名的文件名）
	 */
	concatFilePath: function (outputParams, fileDir, fileBasename) {
		let extension;
		if (outputParams.format.length && outputParams.format !== '无') {
			let format = formats.find((value) => {
				return value.sName === outputParams.format;
			});
			if (format) {
				extension = format.extension;
			} else {	// 用户手动输入的格式
				extension = outputParams.format;
			}
		}
		let filePath = '';
		if (fileDir) {
			filePath += `${fileDir}${fileDir.endsWith('/') ? '' : '/'}`;
		}
		filePath += fileBasename;
		if (extension) {
			filePath += `.${extension}`;
		}
		return filePath;
	},
	getOutputParam: function (outputParams, filedir, filebasename, withQuotes = false, overrideFilePath) {
		let ret = [];
		if (outputParams.format.length && outputParams.format !== '无') {
			let format = formats.find((value) => {
				return value.sName == outputParams.format;
			});
			let extension;
			if (format) {
				extension = format.extension;
			} else {	// 用户手动输入的格式
				extension = outputParams.format;
			}
			if (outputParams.moveflags) {
				ret.push('-movflags')
				ret.push('+faststart')
			}
			if (outputParams.begin) {
				ret.push('-ss')
				ret.push(outputParams.begin)
			}
			if (outputParams.end) {
				ret.push('-to')
				ret.push(outputParams.end)
			}
			let outputFileName;
			if (overrideFilePath) {
				outputFileName = overrideFilePath;
			} else {
				outputFileName = outputParams.filename;
				outputFileName = outputFileName.replace(/\[filedir\]/g, filedir);
				outputFileName = outputFileName.replace(/\[filebasename\]/g, filebasename);
				outputFileName = outputFileName.replace(/\[fileext\]/g, extension);
			}
			if (withQuotes) {
				outputFileName = '"' + outputFileName + '"';
			}
			ret.push(outputFileName);
		} else {
			ret.push('-f')
			ret.push('null')
			ret.push('-')
			// ret.push('-benchmark')   // 可有可无
		}
		return ret;
	},
	getInputParam: function (inputParams, withQuotes = false) {
		let ret = [];
		if (inputParams.hwaccel.length && inputParams.hwaccel !== '不使用') {
			ret.push('-hwaccel');
			let hwaccel = hwaccels.find((value) => {
				return value.sName == inputParams.hwaccel
			})?.hwaccel;
			ret.push(hwaccel);
		}
		if (inputParams.mode === 'standalone') {
			if (inputParams.begin) {
				ret.push('-ss');
				ret.push(inputParams.begin);
			}
			if (inputParams.end) {
				ret.push('-to');
				ret.push(inputParams.end);
			}
			ret.push('-i');
			let quoteStr = withQuotes ? `"` : '';
			let filePath = inputParams.files.length && inputParams.files[0].filePath || '[输入文件路径]';
			ret.push(quoteStr + filePath + quoteStr);
		}
		return ret;
	}
}
export { formats, hwaccels, generator }

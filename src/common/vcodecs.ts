import { OutputParams_video } from "./types";

const VALUE = Symbol()

type strict2 = { strict2?: boolean };
export interface BasicMenuOption {
	sName: string;
	lName: string;
	imageName?: string;
	imageOffset?: number;
	description?: string;
	strict2?: boolean;
}
export interface ComboOptions {
	items: BasicMenuOption[];
}
export interface SliderOptions {
	step: number;	// 步长，如不需要则传 0
	tags: Map<number, string>;
	valueToText: (value: number) => string;	// 显示在滑杆旁边的文字
	valueProcess: (value: number) => number;	// 进行吸附、整数化处理
	valueToParam: (value: number) => string | number; // 输出到 ffmpeg 参数的文字
}
export interface BasicParameter {
	parameter: string;	// 实际传给 ffmpeg 的参数
	display: string;	// 显示于表单标题
}
export type Parameter = BasicParameter & (
	({ mode: 'combo' } & ComboOptions) |
	({ mode: 'slider' } & SliderOptions)
);
export type RateControl = BasicMenuOption & { cmd: (string | Symbol)[] } & SliderOptions;
export interface VEncoder extends BasicMenuOption {
	codecName: string;	// 实际传给 ffmpeg 的编码器
	parameters?: Parameter[];
	ratecontrol?: RateControl[];
}
export interface VCodec extends BasicMenuOption {
	codecName: string;
	encoders?: VEncoder[];
}

const 自动 = {
	sName: '自动',
	lName: '自动',
	imageName: '',
	imageOffset: 0,
	description: '自动',
}
const strict2 = {
	strict2: true
}

// #region 预置码率控制模式 combo

const CRF = {
	sName: 'CRF',
	lName: 'CRF',
	imageName: 'video_ratecontrol',
	imageOffset: 1,
	description: 'Constant Rate Factor - 恒定速率因子：根据画面内容决定码率大小，画质恒定。如果您想获得最佳编码质量而不关心文件大小，请使用此模式。',
	cmd: ['-crf', VALUE]
}
const CQP = {
	sName: 'CQP',
	lName: 'CQP',
	imageName: 'video_ratecontrol',
	imageOffset: 2,
	description: 'Constant Quantization Parameter - 恒定量化参数：与 CRF 类似，最简单的码率控制方式，相同码率下画质较 CRF 低，一般仅在显卡编码时使用。',
	cmd: ['-qp', VALUE]
}
/*
const VBR = {
	sName: 'VBR',
	lName: 'VBR',
	imageName: 'video_ratecontrol',
	imageOffset: 3,
	description: 'Variable Bit Rate - 可变码率：根据画面内容决定码率大小。',
	cmd: ['-b:v', VALUE]
}
*/
const CBR = {
	sName: 'CBR',
	lName: 'CBR',
	imageName: 'video_ratecontrol',
	imageOffset: 4,
	description: 'Constant Bit Rate - 恒定码率：将码率恒定在一个值。',
	cmd: ['-b:v', VALUE]
}
const ABR = {
	sName: 'ABR',
	lName: 'ABR',
	imageName: 'video_ratecontrol',
	imageOffset: 6,
	description: 'Average Bit Rate - 平均码率：根据画面内容决定大致码率大小，将码率控制在指定值附近。',
	cmd: ['-b:v', VALUE]
}
const Q = {
	sName: 'Q',
	lName: 'Q',
	imageName: 'video_ratecontrol',
	imageOffset: 6,
	description: 'Q - 质量：指定画质，具体值对应的画质由具体编码器决定。',
	cmd: ['-q:v', VALUE]
}

// #endregion

// #region 预置 slider

function approximation (number: number, numList: number[], threshould = 0.01) {
	for (const num of numList) {
		if (Math.abs(num - number) < threshould) {
			number = num;
		}
	}
	return number;
}

// valueToText：显示在滑杆旁边的文字　　valueProcess：进行吸附、整数化处理　　valueToParam：输出到 ffmpeg 参数的文字

const H264265crfSlider: SliderOptions = {
	step: 51,
	tags: new Map([
		[0.000, '51（最低画质）'],
		[0.411, '30（低画质）'],
		[0.529, '24（中画质）'],
		[0.647, '18（高画质）'],
		[0.765, '12（肉眼无损）'],
		[1.000, '0（无损）']
	]),
	valueToText: function (value) {
		return String(51 - Math.round(value * 51));
	},
	valueProcess: function (value) {
		return Math.round(value * 51) / 51;
	},
	valueToParam: function (value) {
		return 51 - Math.round(value * 51);
	}
}
const crf63slider: SliderOptions = {
	step: 63,
	tags: new Map([
		[0.000, '63（最低画质）'],
		[1.000, '0（无损）']
	]),
	valueToText: function (value) {
		return String(63 - Math.round(value * 63));
	},
	valueProcess: function (value) {
		return Math.round(value * 63) / 63;
	},
	valueToParam: function (value) {
		return 63 - Math.round(value * 63);
	}
}
const crf51slider: SliderOptions = {
	step: 51,
	tags: new Map([
		[0.000, '51（最低画质）'],
		[1.000, '0（无损）']
	]),
	valueToText: function (value) {
		return String(51 - Math.round(value * 51));
	},
	valueProcess: function (value) {
		return Math.round(value * 51) / 51;
	},
	valueToParam: function (value) {
		return 51 - Math.round(value * 51);
	}
}
const qp70slider: SliderOptions = {
	step: 70,
	tags: new Map([
		[0.000, '70（最低画质）'],
		[1.000, '0（无损）']
	]),
	valueToText: function (value) {
		return String(70 - Math.round(value * 70));
	},
	valueProcess: function (value) {
		return Math.round(value * 70) / 70;
	},
	valueToParam: function (value) {
		return 70 - Math.round(value * 70);
	}
}
const qp51slider: SliderOptions = {
	step: 51,
	tags: new Map([
		[0.000, '51（最低画质）'],
		[1.000, '0（无损）']
	]),
	valueToText: function (value) {
		return String(51 - Math.round(value * 51));
	},
	valueProcess: function (value) {
		return Math.round(value * 51) / 51;
	},
	valueToParam: function (value) {
		return 51 - Math.round(value * 51);
	}
}
const vbitrateSlider: SliderOptions = {
	step: 0,
	tags: new Map([
		[0.000, '62.5 Kbps'],
		[0.250, '500 Kbps'],
		[0.500, '4 Mbps'],
		[0.750, '32 Mbps'],
		[1.000, '256 Mbps']
	]),
	valueToText: function (value) {
		var kbps = Math.round(62.5 * Math.pow(2, value * 12))
		if (kbps >= 10000) {
			return (kbps / 1000).toFixed(1) + ' Mbps'
		} else {
			return kbps + ' kbps'
		}
	},
	valueProcess: function (value) {
		return approximation(value,
			[0, 0.0833, 0.1667, 0.25, 0.3333, 0.4167, 0.5, 0.5833, 0.6667, 0.75, 0.8333, 0.9167, 1]);
		//	 62.5k 125k  250k   500k    1M      2M     4M    8M      16M    32M    64M   128M  256M
	},
	valueToParam: function (value) {
		return Math.round(62.5 * Math.pow(2, value * 12)) + "k"
	}
}
const q100slider: SliderOptions = {
	step: 0,
	tags: new Map([
		[0.000, '0'],
		[1.000, '100']
	]),
	valueToText: function (value) {
		return (value * 100).toFixed(0)
	},
	valueProcess: function (value) {
		return Math.round(value * 100) / 100
	},
	valueToParam: function (value) {
		return (value * 100).toFixed(0)
	}
}
const H264265presetSlider: SliderOptions = {
	step: 9,
	tags: new Map([
		[0 / 9, 'ultrafast'],
		[1 / 9, 'superfast'],
		[2 / 9, 'veryfast'],
		[3 / 9, 'faster'],
		[4 / 9, 'fast'],
		[5 / 9, 'medium'],
		[6 / 9, 'slow'],
		[7 / 9, 'slower'],
		[8 / 9, 'veryslow'],
		[9 / 9, 'placebo'],
	]),
	valueToText: function (value) {
		value = Math.round(value * 9)
		return ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow', 'placebo'][value]
	},
	valueProcess: function (value) {
		return Math.round(value * 9) / 9
	},
	valueToParam: function (value) {
		value = Math.round(value * 9)
		return ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow', 'placebo'][value]
	}
}
const qsvPresetSlider: SliderOptions = {
	step: 6,
	tags: new Map([
		[0 / 6, 'veryfast'],
		[1 / 6, 'faster'],
		[2 / 6, 'fast'],
		[3 / 6, 'medium'],
		[4 / 6, 'slow'],
		[5 / 6, 'slower'],
		[6 / 6, 'veryslow'],
	]),
	valueToText: function (value) {
		value = Math.round(value * 6)
		return ['veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'][value]
	},
	valueProcess: function (value) {
		return Math.round(value * 6) / 6
	},
	valueToParam: function (value) {
		value = Math.round(value * 6)
		return ['veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'][value]
	}
}

// #endregion

// #region 预置 preset

const 默认 = {
	sName: '默认',
	lName: '默认',
	imageName: '',
	imageOffset: 0,
	description: '默认',
}
const psnr = {
	sName: 'psnr',
	lName: 'psnr',
	imageName: '',
	imageOffset: 0,
	description: '优化 PSNR',
}
const ssim = {
	sName: 'ssim',
	lName: 'ssim',
	imageName: '',
	imageOffset: 0,
	description: '优化 SSIM',
}
const fastdecode = {
	sName: 'fastdecode',
	lName: 'fastdecode',
	imageName: '',
	imageOffset: 0,
	description: '快速解码',
}
const zerolatency = {
	sName: 'zerolatency',
	lName: 'zerolatency',
	imageName: '',
	imageOffset: 0,
	description: '低延迟编码',
}
const film = {
	sName: 'film',
	lName: 'film',
	imageName: '',
	imageOffset: 0,
	description: '电影',
}
const animation = {
	sName: 'animation',
	lName: 'animation',
	imageName: '',
	imageOffset: 0,
	description: '动画',
}
const grain = {
	sName: 'grain',
	lName: 'grain',
	imageName: '',
	imageOffset: 0,
	description: '保留噪点',
}
const stillimage = {
	sName: 'stillimage',
	lName: 'stillimage',
	imageName: '',
	imageOffset: 0,
	description: '静态图像',
}
const nvencPreset = [
	{
		sName: '自动',
		lName: '自动',
		imageName: '',
		imageOffset: 0,
		description: '自动',
	},
	{
		sName: 'slow',
		lName: 'slow',
		imageName: '',
		imageOffset: 0,
		description: 'hq 2 passes',
	},
	{
		sName: 'medium',
		lName: 'medium',
		imageName: '',
		imageOffset: 0,
		description: 'hq 1 pass',
	},
	{
		sName: 'fast',
		lName: 'fast',
		imageName: '',
		imageOffset: 0,
		description: 'hp 1 pass',
	},
	{
		sName: 'hq',
		lName: 'hq',
		imageName: '',
		imageOffset: 0,
		description: '',
	},
	{
		sName: 'bd',
		lName: 'bd',
		imageName: '',
		imageOffset: 0,
		description: '',
	},
	{
		sName: 'll',
		lName: 'll',
		imageName: '',
		imageOffset: 0,
		description: 'low latency',
	},
	{
		sName: 'llhq',
		lName: 'llhq',
		imageName: '',
		imageOffset: 0,
		description: 'low latency hq',
	},
	{
		sName: 'llhp',
		lName: 'llhp',
		imageName: '',
		imageOffset: 0,
		description: 'low latency hp',
	},
	{
		sName: 'lossless',
		lName: 'lossless',
		imageName: '',
		imageOffset: 0,
		description: '',
	},
	{
		sName: 'losslesshp',
		lName: 'losslesshp',
		imageName: '',
		imageOffset: 0,
		description: '',
	},
]

// #endregion

// #region 预置 level

const h264Level = [
	{
		sName: '自动',
		lName: '自动',
		imageName: '',
		imageOffset: 0,
		description: '自动',
	},
	{
		sName: '1',
		lName: '1',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />128×96@30<br />176×144@15',
	},
	{
		sName: '1b',
		lName: '1b',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />128×96@30<br />176×144@15',
	},
	{
		sName: '1.1',
		lName: '1.1',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />128×96@60<br />176×144@30<br />352×288@7.5',
	},
	{
		sName: '1.2',
		lName: '1.2',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />128×96@120<br />176×144@60<br />352×288@15',
	},
	{
		sName: '1.3',
		lName: '1.3',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />128×96@172<br />176×144@120<br />352×288@30',
	},
	{
		sName: '2',
		lName: '2',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />128×96@172<br />176×144@120<br />352×288@30',
	},
	{
		sName: '2.1',
		lName: '2.1',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />176×144@172<br />352×240@60<br />352×288@50<br />352×480@30<br />352×576@25',
	},
	{
		sName: '2.2',
		lName: '2.2',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />176×144@172<br />352×480@30<br />352×576@25<br />720×480@15<br />720×576@12.5',
	},
	{
		sName: '3',
		lName: '3',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />176×144@172<br />352×240@120<br />352×480@60<br />720×480@30<br />720×576@25',
	},
	{
		sName: '3.1',
		lName: '3.1',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />352×288@172<br />352×576@130<br />640×480@90<br />720×576@60<br />1280×720@30',
	},
	{
		sName: '3.2',
		lName: '3.2',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />640×480@172<br />720×480@160<br />720×576@130<br />1280×720@60',
	},
	{
		sName: '4',
		lName: '4',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />720×480@172<br />720×576@150<br />1280×720@60<br />2048×1024@30',
	},
	{
		sName: '4.1',
		lName: '4.1',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />720×480@172<br />720×576@150<br />1280×720@60<br />2048×1024@30',
	},
	{
		sName: '4.2',
		lName: '4.2',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />720×576@172<br />1280×720@140<br />2048×1080@60',
	},
	{
		sName: '5',
		lName: '5',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />1024×768@172<br />1280×720@160<br />2048×1080@60<br />2560×1920@30<br />3680×1536@25',
	},
	{
		sName: '5.1',
		lName: '5.1',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />1280×720@172<br />1920×1080@120<br />2048×1536@80<br />4096×2048@30',
	},
	{
		sName: '5.2',
		lName: '5.2',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />1920×1080@172<br />2048×1536@160<br />4096×2048@60',
	},
	{
		sName: '6',
		lName: '6',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />2048×1536@300<br />4096×2160@120<br />8192×4320@30',
	},
	{
		sName: '6.1',
		lName: '6.1',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />2048×1536@300<br />4096×2160@240<br />8192×4320@60',
	},
	{
		sName: '6.2',
		lName: '6.2',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />4096×2304@300<br />8192×4320@120',
	},
]
const hevcLevel = [
	{
		sName: '自动',
		lName: '自动',
		imageName: '',
		imageOffset: 0,
		description: '自动',
	},
	{
		sName: '1',
		lName: '1',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />128×96@33.7<br />176×144@15.0',
	},
	{
		sName: '2',
		lName: '2',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />176×144@100.0<br />320×240@45.0<br />352×240@37.5<br />352×288@30.0',
	},
	{
		sName: '2.1',
		lName: '2.1',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />320×240@90.0<br />352×240@75.0<br />352×288@60.0<br />352×480@37.5<br />352×576@33.3<br />640×360@30.0',
	},
	{
		sName: '3',
		lName: '3',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />352×480@84.3<br />352×576@75.0<br />640×360@67.5<br />720×480@42.1<br />720×576@37.5<br />960×540@30.0',
	},
	{
		sName: '3.1',
		lName: '3.1',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />720×480@84.3<br />720×576@75.0<br />960×540@60.0<br />1280×720@33.7',
	},
	{
		sName: '4',
		lName: '4',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />1280×720@68.0<br />1280×1024@51.0<br />1920×1080@32.0<br />2048×1080@30.0',
	},
	{
		sName: '4.1',
		lName: '4.1',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />1280×720@136.0<br />1280×1024@102.0<br />1920×1080@64.0<br />2048×1080@60.0',
	},
	{
		sName: '5',
		lName: '5',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />1920×1080@128.0<br />2048×1024@127.5<br />2048×1080@120.0<br />2048×1536@85.0<br />2560×1920@54.4<br />3672×1536@46.8<br />3840×2160@32.0<br />4096×2160@30.0',
	},
	{
		sName: '5.1',
		lName: '5.1',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />1920×1080@256.0<br />2048×1024@255.0<br />2048×1080@240.0<br />2048×1536@170.0<br />2560×1920@108.8<br />3672×1536@93.7<br />3840×2160@64.0<br />4096×2160@60.0',
	},
	{
		sName: '5.2',
		lName: '5.2',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />1920×1080@300.0<br />2048×1024@300.0<br />2048×1080@300.0<br />2048×1536@300.0<br />2560×1920@217.6<br />3672×1536@187.5<br />3840×2160@128.0<br />4096×2160@120.0',
	},
	{
		sName: '6',
		lName: '6',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />3840×2160@128.0<br />4096×2048@127.5<br />4096×2160@120.0<br />4096×2304@113.3<br />7680×4320@32.0<br />8192×4320@30.0',
	},
	{
		sName: '6.1',
		lName: '6.1',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />3840×2160@256.0<br />4096×2048@255.0<br />4096×2160@240.0<br />4096×2304@226.6<br />7680×4320@64.0<br />8192×4320@60.0',
	},
	{
		sName: '6.2',
		lName: '6.2',
		imageName: '',
		imageOffset: 0,
		description: '高清晰度@最高帧率：<br />3840×2160@300.0<br />4096×2048@300.0<br />4096×2160@300.0<br />4096×2304@300.0<br />7680×4320@128.0<br />8192×4320@120.0',
	},
]

// #endregion

// #region 预置 profile

const baseline = {
	sName: 'baseline',
	lName: 'baseline',
	imageName: '',
	imageOffset: 0,
	description: 'baseline',
}
const constrained_baseline = {
	sName: 'constrained_baseline',
	lName: 'constrained_baseline',
	imageName: '',
	imageOffset: 0,
	description: 'constrained_baseline',
}
const main = {
	sName: 'main',
	lName: 'main',
	imageName: '',
	imageOffset: 0,
	description: 'main',
}
const main10 = {
	sName: 'main10',
	lName: 'main10',
	imageName: '',
	imageOffset: 0,
	description: 'main10',
}
const mainsp = {
	sName: 'mainsp',
	lName: 'mainsp',
	imageName: '',
	imageOffset: 0,
	description: 'mainsp',
}
const rext = {
	sName: 'rext',
	lName: 'rext',
	imageName: '',
	imageOffset: 0,
	description: 'rext',
}
const high = {
	sName: 'high',
	lName: 'high',
	imageName: '',
	imageOffset: 0,
	description: 'high',
}
const high10 = {
	sName: 'high10',
	lName: 'high10',
	imageName: '',
	imageOffset: 0,
	description: 'high10',
}
const constrained_high = {
	sName: 'constrained_high',
	lName: 'constrained_high',
	imageName: '',
	imageOffset: 0,
	description: 'constrained_high',
}
const high422p = {
	sName: 'high422p',
	lName: 'high422p',
	imageName: '',
	imageOffset: 0,
	description: 'high422p',
}
const high422 = {
	sName: 'high422',
	lName: 'high422',
	imageName: '',
	imageOffset: 0,
	description: 'high422',
}
const high444p = {
	sName: 'high444p',
	lName: 'high444p',
	imageName: '',
	imageOffset: 0,
	description: 'high444p',
}
const high444 = {
	sName: 'high444',
	lName: 'high444',
	imageName: '',
	imageOffset: 0,
	description: 'high444',
}


// #endregion

// #region 预置 pixel format

const yuv420p = {
	sName: 'yuv420p',
	lName: 'yuv420p',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuv422p = {
	sName: 'yuv422p',
	lName: 'yuv422p',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuv440p = {
	sName: 'yuv440p',
	lName: 'yuv440p',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuv444p = {
	sName: 'yuv444p',
	lName: 'yuv444p',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuva420p = {
	sName: 'yuva420p',
	lName: 'yuva420p',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuvj420p = {
	sName: 'yuvj420p',
	lName: 'yuvj420p',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuvj422p = {
	sName: 'yuvj422p',
	lName: 'yuvj422p',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuvj444p = {
	sName: 'yuvj444p',
	lName: 'yuvj444p',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const nv12 = {
	sName: 'nv12',
	lName: 'nv12',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const nv16 = {
	sName: 'nv16',
	lName: 'nv16',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const nv21 = {
	sName: 'nv21',
	lName: 'nv21',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const gbrp = {
	sName: 'gbrp',
	lName: 'gbrp',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuv420p10le = {
	sName: 'yuv420p10le',
	lName: 'yuv420p10le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuv422p10le = {
	sName: 'yuv422p10le',
	lName: 'yuv422p10le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuv440p10le = {
	sName: 'yuv440p10le',
	lName: 'yuv440p10le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuv444p10le = {
	sName: 'yuv444p10le',
	lName: 'yuv444p10le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuv420p12le = {
	sName: 'yuv420p12le',
	lName: 'yuv420p12le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuv422p12le = {
	sName: 'yuv422p12le',
	lName: 'yuv422p12le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuv440p12le = {
	sName: 'yuv440p12le',
	lName: 'yuv440p12le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuv444p12le = {
	sName: 'yuv444p12le',
	lName: 'yuv444p12le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const yuv444p16le = {
	sName: 'yuv444p16le',
	lName: 'yuv444p16le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const nv20le = {
	sName: 'nv20le',
	lName: 'nv20le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const gbrp10le = {
	sName: 'gbrp10le',
	lName: 'gbrp10le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const gbrp12le = {
	sName: 'gbrp12le',
	lName: 'gbrp12le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const gray = {
	sName: 'gray',
	lName: 'gray',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const gray10le = {
	sName: 'gray10le',
	lName: 'gray10le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const p010le = {
	sName: 'p010le',
	lName: 'p010le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const p016le = {
	sName: 'p016le',
	lName: 'p016le',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const qsv = {
	sName: 'qsv',
	lName: 'qsv',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const bgr0 = {
	sName: 'bgr0',
	lName: 'bgr0',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const rgb0 = {
	sName: 'rgb0',
	lName: 'rgb0',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const bgr24 = {
	sName: 'bgr24',
	lName: 'bgr24',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const rgb24 = {
	sName: 'rgb24',
	lName: 'rgb24',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const cuda = {
	sName: 'cuda',
	lName: 'cuda',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const d3d11 = {
	sName: 'd3d11',
	lName: 'd3d11',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const dxva2_vld = {
	sName: 'dxva2_vld',
	lName: 'dxva2_vld',
	imageName: '',
	imageOffset: 0,
	description: '',
}
const rgb555le = {
	sName: 'rgb555le',
	lName: 'rgb555le',
	imageName: '',
	imageOffset: 0,
	description: '',
}

// #endregion

const 默认编码器 = {
	sName: '默认',
	lName: '默认',
	imageName: 'video_vcodec',
	imageOffset: 0,
	description: '使用默认编码器',
	codecName: '-',
}

const vcodecs: VCodec[] = [
	{
		sName: '禁用视频',
		lName: '禁用视频',
		imageName: 'video_vcodec',
		imageOffset: 0,
		description: '不输出视频',
		codecName: '-',
		encoders: [
			默认编码器
		],
	},
	{
		sName: '不重新编码',
		lName: '不重新编码',
		imageName: 'video_vcodec',
		imageOffset: 1,
		description: '复制源码流，不重新编码。',
		codecName: 'copy',
		encoders: [
			默认编码器
		],
	},
	{
		sName: '自动',
		lName: '自动',
		imageName: 'video_vcodec',
		imageOffset: 0,
		description: '自动选择编码',
		codecName: '-',
		encoders: [
			默认编码器
		],
	},
	{
		sName: 'AV1',
		lName: 'AV1',
		imageName: 'video_vcodec',
		imageOffset: 2,
		description: 'AV1 - AV1 即 AOMedia Video 1 是一个开放、免专利的影片编码格式，专为通过网络进行流传输而设计。',
		codecName: 'av1',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, yuv422p, yuv444p, yuv420p10le, yuv422p10le, yuv444p10le, yuv420p12le, yuv422p12le, yuv444p12le ]
					},
				],
				ratecontrol: [
					{
						...CRF,
						...crf63slider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
			{
				sName: 'libaom-av1',
				lName: 'libaom-av1',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: '',
				codecName: 'libaom-av1',
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, yuv422p, yuv444p, yuv420p10le, yuv422p10le, yuv444p10le, yuv420p12le, yuv422p12le, yuv444p12le ]
					},
				],
				ratecontrol: [
					{
						...CRF,
						...crf63slider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
		],
		...strict2
	},
	{
		sName: 'HEVC',
		lName: 'HEVC (H.265)',
		imageName: 'video_vcodec',
		imageOffset: 3,
		description: 'HEVC - HEVC 即高效率视频编码（High Efficiency Video Coding），又称为 H.265 和 MPEG-H 第 2 部分，是一种视频压缩标准，被视为是 ITU-T H.264/MPEG-4 AVC 标准的继任者。',
		codecName: 'hevc',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "slider", parameter: "preset", display: "编码质量",
						...H264265presetSlider,
					},
					{
						mode: "combo", parameter: "tune", display: "编码倾重",
						items: [ 默认, psnr, ssim, fastdecode, zerolatency ]
					},
					{
						mode: "combo", parameter: "level", display: "级别",
						items: [ ...hevcLevel ]
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, yuv422p, yuv444p, gbrp, yuv420p10le, yuv422p10le, yuv444p10le, gbrp10le, gray, gray10le ]
					},
				],
				ratecontrol: [
					{
						...CRF,
						...H264265crfSlider
					},
					{
						...CQP,
						...qp70slider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
			{
				sName: 'libx265',
				lName: 'libx265',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: '',
				codecName: 'libx265',
				parameters: [
					{
						mode: "slider", parameter: "preset", display: "编码质量",
						...H264265presetSlider,
					},
					{
						mode: "combo", parameter: "tune", display: "编码倾重",
						items: [ 默认, psnr, ssim, fastdecode, zerolatency ]
					},
					{
						mode: "combo", parameter: "level", display: "级别",
						items: [ ...hevcLevel ]
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, yuv422p, yuv444p, gbrp, yuv420p10le, yuv422p10le, yuv444p10le, gbrp10le, gray, gray10le ]
					},
				],
				ratecontrol: [
					{
						...CRF,
						...H264265crfSlider
					},
					{
						...CQP,
						...qp70slider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
			{
				sName: 'hevc_qsv',
				lName: 'hevc_qsv',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: 'Intel 硬件加速编码器',
				codecName: 'hevc_qsv',
				parameters: [
					{
						mode: "slider", parameter: "preset", display: "编码质量",
						...qsvPresetSlider,
					},
					{
						mode: "combo", parameter: 'profile', display: '规格',
						items: [ 自动, main, main10, mainsp ]
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, nv12, p010le, qsv ]
					},
				],
				ratecontrol: [
					{
						...CQP, cmd: ['-q', VALUE],
						...qp51slider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
			{
				sName: 'hevc_nvenc',
				lName: 'hevc_nvenc',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: 'NVIDIA 硬件加速编码器',
				codecName: 'hevc_nvenc',
				parameters: [
					{
						mode: "combo", parameter: "preset", display: "编码质量",
						items: [ ...nvencPreset ],
					},
					{
						mode: "combo", parameter: "tune", display: "编码倾重",
						items: [ 默认, psnr, ssim, fastdecode, zerolatency ]
					},
					{
						mode: "combo", parameter: "profile", display: "规格",
						items: [ 自动, main, main10, rext ]
					},
					{
						mode: "combo", parameter: "level", display: "级别",
						items: [ ...hevcLevel ]
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, nv12, p016le, yuv444p, p010le, yuv444p16le, bgr0, rgb0, cuda, d3d11 ]
					},
				],
				ratecontrol: [
					{
						...CRF, cmd: ['-cq', VALUE],
						...crf51slider
					},
					{
						...CQP,
						...qp51slider
					},
					{
						...CBR, cmd: ['-cbr', 'true', '-b:v', VALUE],
						...vbitrateSlider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
			{
				sName: 'hevc_amf',
				lName: 'hevc_amf',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: 'AMD 硬件加速编码器',
				codecName: 'hevc_amf',
				parameters: [
					{
						mode: "slider", parameter: "preset", display: "编码质量",
						step: 2,
						tags: new Map([
							[0 / 2, 'speed'],
							[1 / 2, 'balanced'],
							[2 / 2, 'quality'],
						]),
						valueToText: function (value) {
							value = Math.round(value * 2)
							return ['speed', 'balanced', 'quality'][value]
						},
						valueProcess: function (value) {
							return Math.round(value * 2) / 2
						},
						valueToParam: function (value) {
							value = Math.round(value * 2)
							return ['speed', 'balanced', 'quality'][value]
						}
					},
					{
						mode: "combo", parameter: "tune", display: "编码倾重",
						items: [
							自动,
							{
								sName: 'transcoding',
								lName: 'transcoding（默认）',
								imageName: '',
								imageOffset: 0,
								description: '转码',
							},
							{
								sName: 'ultralowlatency',
								lName: 'ultralowlatency',
								imageName: '',
								imageOffset: 0,
								description: '超低延迟',
							},
							{
								sName: 'webcam',
								lName: 'webcam',
								imageName: '',
								imageOffset: 0,
								description: '网络摄像头',
							},
						]
					},
					{
						mode: "combo", parameter: "profile", display: "规格",
						items: [ 自动, main, high ]
					},
					{
						mode: "combo", parameter: "level", display: "级别",
						items: [ ...hevcLevel ]
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, nv12, d3d11, dxva2_vld ]
					},
				],
				ratecontrol: [
					{
						...CQP, cmd: ['-qp_i', VALUE, '-qp_p', VALUE],
						...qp51slider
					},
					{
						...CBR, cmd: ['-rc', 'cbr', '-b:v', VALUE],
						...vbitrateSlider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
		]
	},
	{
		sName: 'H.264',
		lName: 'H.264 (AVC)',
		imageName: 'video_vcodec',
		imageOffset: 4,
		description: 'H.264 - H.264 又称为 MPEG-4 第 10 部分，高级视频编码（MPEG-4 Part 10, Advanced Video Coding，缩写为 MPEG-4 AVC）是一种面向块，基于运动补偿的视频编码标准。到 2014 年，它已经成为高精度视频录制、压缩和发布的最常用格式之一。',
		codecName: 'h264',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "slider", parameter: "preset", display: "编码质量",
						...H264265presetSlider,
					},
					{
						mode: "combo", parameter: "tune", display: "编码倾重",
						items: [ 默认, film, animation, grain, stillimage, psnr, ssim, fastdecode, zerolatency ]
					},
					{
						mode: "combo", parameter: "profile", display: "规格",
						items: [ 自动, baseline, main, high, high422, high444 ]
					},
					{
						mode: "combo", parameter: "level", display: "级别",
						items: [ ...h264Level ]
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, yuvj420p, yuv422p, yuvj422p, yuv444p, yuvj444p, nv12, nv16, nv21, yuv420p10le, yuv422p10le, yuv444p10le, nv20le, gray, gray10le ]
					},
				],
				ratecontrol: [
					{
						...CRF,
						...H264265crfSlider
					},
					{
						...CQP,
						...qp70slider
					},
					{
						...CBR, cmd: ['-b:v', VALUE, '-minrate', VALUE, '-maxrate', VALUE],
						...vbitrateSlider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
			{
				sName: 'libx264',
				lName: 'libx264',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: '',
				codecName: 'libx264',
				parameters: [
					{
						mode: "slider", parameter: "preset", display: "编码质量",
						...H264265presetSlider,
					},
					{
						mode: "combo", parameter: "tune", display: "编码倾重",
						items: [ 默认, film, animation, grain, stillimage, psnr, ssim, fastdecode, zerolatency ]
					},
					{
						mode: "combo", parameter: "profile", display: "规格",
						items: [ 自动, baseline, main, high, high422, high444 ]
					},
					{
						mode: "combo", parameter: "level", display: "级别",
						items: [ ...h264Level ]
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, yuvj420p, yuv422p, yuvj422p, yuv444p, yuvj444p, nv12, nv16, nv21, yuv420p10le, yuv422p10le, yuv444p10le, nv20le, gray, gray10le ]
					},
				],
				ratecontrol: [
					{
						...CRF,
						...H264265crfSlider
					},
					{
						...CQP,
						...qp70slider
					},
					{
						...CBR, cmd: ['-b:v', VALUE, '-minrate', VALUE, '-maxrate', VALUE],
						...vbitrateSlider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
			{
				sName: 'libx264rgb',
				lName: 'libx264rgb',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: '',
				codecName: 'libx264rgb',
				parameters: [
					{
						mode: "slider", parameter: "preset", display: "编码质量",
						...H264265presetSlider,
					},
					{
						mode: "combo", parameter: "tune", display: "编码倾重",
						items: [ 默认, film, animation, grain, stillimage, psnr, ssim, fastdecode, zerolatency ]
					},
					{
						mode: "combo", parameter: "level", display: "级别",
						items: [ ...h264Level ]
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, bgr0, bgr24, rgb24 ]
					},
				],
				ratecontrol: [
					{
						...CRF,
						...H264265crfSlider
					},
					{
						...CQP,
						...qp70slider
					},
					{
						...CBR, cmd: ['-b:v', VALUE, '-minrate', VALUE, '-maxrate', VALUE],
						...vbitrateSlider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
			{
				sName: 'h264_qsv',
				lName: 'h264_qsv',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: 'Intel 硬件加速编码器',
				codecName: 'h264_qsv',
				parameters: [
					{
						mode: "slider", parameter: "preset", display: "编码质量",
						...qsvPresetSlider,
					},
					{
						mode: "combo", parameter: 'profile', display: '规格',
						items: [ 自动, baseline, main, high ]
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, nv12, p010le, qsv ]
					},
				],
				ratecontrol: [
					{
						...CQP, cmd: ['-q', VALUE],
						...qp51slider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
			{
				sName: 'h264_nvenc',
				lName: 'h264_nvenc',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: 'NVIDIA 硬件加速编码器',
				codecName: 'h264_nvenc',
				parameters: [
					{
						mode: "combo", parameter: "preset", display: "编码质量",
						items: [ ...nvencPreset ],
					},
					{
						mode: "combo", parameter: "tune", display: "编码倾重",
						items: [ 默认, psnr, ssim, fastdecode, zerolatency ]
					},
					{
						mode: "combo", parameter: "profile", display: "规格",
						items: [ 自动, baseline, main, high, high444p ]
					},
					{
						mode: "combo", parameter: "level", display: "级别",
						items: [ ...hevcLevel ]
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, nv12, p016le, yuv444p, p010le, yuv444p16le, bgr0, rgb0, cuda, d3d11 ]
					},
				],
				ratecontrol: [
					{
						...CRF, cmd: ['-cq', VALUE],
						...crf51slider
					},
					{
						...CQP,
						...qp51slider
					},
					{
						...CBR, cmd: ['-cbr', 'true', '-b:v', VALUE],
						...vbitrateSlider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
			{
				sName: 'h264_amf',
				lName: 'h264_amf',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: 'AMD 硬件加速编码器',
				codecName: 'h264_amf',
				parameters: [
					{
						mode: "slider", parameter: "preset", display: "编码质量",
						step: 2,
						tags: new Map([
							[0 / 2, 'speed'],
							[1 / 2, 'balanced'],
							[2 / 2, 'quality'],
						]),
						valueToText: function (value) {
							value = Math.round(value * 2)
							return ['speed', 'balanced', 'quality'][value]
						},
						valueProcess: function (value) {
							return Math.round(value * 2) / 2
						},
						valueToParam: function (value) {
							value = Math.round(value * 2) / 2
							return ['speed', 'balanced', 'quality'][value]
						}
					},
					{
						mode: "combo", parameter: "tune", display: "编码倾重",
						items: [
							{
								sName: 'transcoding',
								lName: 'transcoding（默认）',
								imageName: '',
								imageOffset: 0,
								description: '转码',
							},
							{
								sName: 'ultralowlatency',
								lName: 'ultralowlatency',
								imageName: '',
								imageOffset: 0,
								description: '超低延迟',
							},
							{
								sName: 'webcam',
								lName: 'webcam',
								imageName: '',
								imageOffset: 0,
								description: '网络摄像头',
							},
						]
					},
					{
						mode: "combo", parameter: "profile", display: "规格",
						items: [ 自动, main, high, constrained_baseline, constrained_high ]
					},
					{
						mode: "combo", parameter: "level", display: "级别",
						items: [ ...hevcLevel ]
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, nv12, d3d11, dxva2_vld ]
					},
				],
				ratecontrol: [
					{
						...CQP, cmd: ['-qp_i', VALUE, '-qp_p', VALUE],
						...qp51slider
					},
					{
						...CBR, cmd: ['-rc', 'cbr', '-b:v', VALUE],
						...vbitrateSlider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
		]
	},
	{
		sName: 'H.263',
		lName: 'H.263',
		imageName: 'video_vcodec',
		imageOffset: 5,
		description: 'H.263 - H.263 是由 ITU-T 用于视频会议的低码率影像编码标准，属于影像编解码器。',
		codecName: 'h263p',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			}
		]
	},
	{
		sName: 'H.261',
		lName: 'H.261',
		imageName: 'video_vcodec',
		imageOffset: 6,
		description: 'H.261 - H.261 是 1990 年ITU-T 制定的一个影片编码标准，属于影片编解码器。',
		codecName: 'h261',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			}
		]
	},
	{
		sName: 'VP9',
		lName: 'VP9',
		imageName: 'video_vcodec',
		imageOffset: 7,
		description: 'VP9 - VP9 是谷歌公司为了替换老旧的 VP8 影像编码格式并与动态专家图像组（MPEG）主导的高效率视频编码（H.265/HEVC）竞争所开发的免费、开源的影像编码格式。',
		codecName: 'vp9',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "slider", parameter: "quality", display: "编码质量",
						step: 2,
						tags: new Map([
							[0 / 2, 'realtime'],
							[1 / 2, 'good'],
							[2 / 2, 'best'],
						]),
						valueToText: function (value) {
							value = Math.round(value * 2)
							return ['realtime', 'good', 'best'][value]
						},
						valueProcess: function (value) {
							return Math.round(value * 2) / 2
						},
						valueToParam: function (value) {
							value = Math.round(value * 2)
							return ['realtime', 'good', 'best'][value]
						}
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, yuv422p, yuv440p, yuv444p, yuv420p10le, yuv422p10le, yuv440p10le, yuv444p10le, yuv420p12le, yuv422p12le, yuv440p12le, yuv444p12le, gbrp, gbrp10le, gbrp12le ]
					},
				],
				ratecontrol: [
					{
						...CRF,
						...crf63slider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
			{
				sName: 'libvpx-vp9',
				lName: 'libvpx-vp9',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: '',
				codecName: 'libvpx-vp9',		
				parameters: [
					{
						mode: "slider", parameter: "quality", display: "编码质量",
						step: 2,
						tags: new Map([
							[0 / 2, 'realtime'],
							[1 / 2, 'good'],
							[2 / 2, 'best'],
						]),
						valueToText: function (value) {
							value = Math.round(value * 2)
							return ['realtime', 'good', 'best'][value]
						},
						valueProcess: function (value) {
							return Math.round(value * 2) / 2
						},
						valueToParam: function (value) {
							value = Math.round(value * 2)
							return ['realtime', 'good', 'best'][value]
						}
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, yuv422p, yuv440p, yuv444p, yuv420p10le, yuv422p10le, yuv440p10le, yuv444p10le, yuv420p12le, yuv422p12le, yuv440p12le, yuv444p12le, gbrp, gbrp10le, gbrp12le ]
					},
				],
				ratecontrol: [
					{
						...CRF,
						...crf63slider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
		]
	},
	{
		sName: 'VP8',
		lName: 'VP8',
		imageName: 'video_vcodec',
		imageOffset: 8,
		description: 'VP8 - VP8 是一个由 On2 Technologies 开发并由 Google 发布的开放的影像压缩格式。',
		codecName: 'vp8',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "slider", parameter: "quality", display: "编码质量",
						step: 2,
						tags: new Map([
							[0 / 2, 'realtime'],
							[1 / 2, 'good'],
							[2 / 2, 'best'],
						]),
						valueToText: function (value) {
							value = Math.round(value * 2)
							return ['realtime', 'good', 'best'][value]
						},
						valueProcess: function (value) {
							return Math.round(value * 2) / 2
						},
						valueToParam: function (value) {
							value = Math.round(value * 2) / 2
							return ['realtime', 'good', 'best'][value]
						}
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, yuva420p ]
					},
				],
				ratecontrol: [
					{
						...CRF,
						...crf63slider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
			{
				sName: 'libvpx',
				lName: 'libvpx',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: '',
				codecName: 'libvpx',		
				parameters: [
					{
						mode: "slider", parameter: "quality", display: "编码质量",
						step: 2,
						tags: new Map([
							[0 / 2, 'realtime'],
							[1 / 2, 'good'],
							[2 / 2, 'best'],
						]),
						valueToText: function (value) {
							value = Math.round(value * 2)
							return ['realtime', 'good', 'best'][value]
						},
						valueProcess: function (value) {
							return Math.round(value * 2) / 2
						},
						valueToParam: function (value) {
							value = Math.round(value * 2) / 2
							return ['realtime', 'good', 'best'][value]
						}
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, yuva420p ]
					},
				],
				ratecontrol: [
					{
						...CRF,
						...crf63slider
					},
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
		]
	},
	{
		sName: 'MPEG-4',
		lName: 'MPEG-4 (Part 2)',
		imageName: 'video_vcodec',
		imageOffset: 9,
		description: 'MPEG-4 Part 2 - MPEG-4 是一套用于音频、视频信息的压缩编码标准，由国际标准化组织（ISO）和国际电工委员会（IEC）下属的“动态影像专家组”（Moving Picture Experts Group，即 MPEG）制定。该标准的第二部分为视频编解码器。',
		codecName: 'mpeg4',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				sName: 'mpeg4',
				lName: 'mpeg4',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: '',
				codecName: 'mpeg4',
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				sName: 'libxvid',
				lName: 'libxvid',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: '',
				codecName: 'libxvid',
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
		]
	},
	{
		sName: 'MPEG-2',
		lName: 'MPEG-2 (Part 2)',
		imageName: 'video_vcodec',
		imageOffset: 10,
		description: 'MPEG-2 Part 2 - MPEG-2 是 MPEG 工作组于 1994 年发布的视频和音频压缩国际标准。MPEG-2 通常用来为广播信号提供视频和音频编码，包括卫星电视、有线电视等。MPEG-2 经过少量修改后，也成为 DVD 产品的核心技术。',
		codecName: 'mpeg2video',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, yuv422p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				sName: 'mpeg2video',
				lName: 'mpeg2video',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: '',
				codecName: 'mpeg2video',
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, yuv422p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				sName: 'mpeg2_qsv',
				lName: 'mpeg2_qsv',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: 'Intel 硬件加速编码器',
				codecName: 'mpeg2_qsv',
				parameters: [
					{
						mode: "slider", parameter: "preset", display: "编码质量",
						...qsvPresetSlider,
					},
					{
						mode: "combo", parameter: 'profile', display: '规格',
						items: [ 自动, main, main10, mainsp ]
					},
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, nv12, qsv ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
		]
	},
	{
		sName: 'MPEG-1',
		lName: 'MPEG-1',
		imageName: 'video_vcodec',
		imageOffset: 11,
		description: 'MPEG-1 - MPEG-1 是 MPEG 组织制定的第一个视频和音频有损压缩标准，也是最早推出及应用在市场上的 MPEG 技术。它采用了块方式的运动补偿、离散余弦变换（DCT）、量化等技术，并为 1.2Mbps 传输速率进行了优化，被 Video CD 采用作为核心技术。',
		codecName: 'mpeg1video',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p, yuv422p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
		]
	},
	{
		sName: 'MJPEG',
		lName: 'MJPEG',
		imageName: 'video_vcodec',
		imageOffset: 2,
		description: 'MJPEG - MJPEG 即 Motion JPEG（Motion Joint Photographic Experts Group）是一种影像压缩格式，其中每一帧图像都分别使用 JPEG 编码。',
		codecName: 'mjpeg',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuvj420p, yuvj422p, yuvj444p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				sName: 'mjpeg',
				lName: 'mjpeg',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: '',
				codecName: 'mjpeg',	
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuvj420p, yuvj422p, yuvj444p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				sName: 'mjpeg_qsv',
				lName: 'mjpeg_qsv',
				imageName: 'video_vcodec',
				imageOffset: 0,
				description: 'INTEL 硬件加速编码器',
				codecName: 'mjpeg_qsv',
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, nv12, qsv ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
				]
			},
		]
	},
	{
		sName: 'WMV2',
		lName: 'WMV2 (WMV v8)',
		imageName: 'video_vcodec',
		imageOffset: 13,
		description: 'WMV2 - WMV（Windows Media Video）是微软公司开发的一组数字影片编解码格式的通称，它是 Windows Media 架构下的一部分。WMV2 即 Windows Media Video v8',
		codecName: 'wmv2',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			}
		]
	},
	{
		sName: 'WMV1',
		lName: 'WMV1 (WMV v7)',
		imageName: 'video_vcodec',
		imageOffset: 14,
		description: 'WMV1 - WMV（Windows Media Video）是微软公司开发的一组数字影片编解码格式的通称，它是 Windows Media 架构下的一部分。WMV1 即 Windows Media Video v7',
		codecName: 'wmv1',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			}
		]
	},
	{
		sName: 'RV20',
		lName: 'RV20',
		imageName: 'video_vcodec',
		imageOffset: 15,
		description: 'RV20 - RealVideo 是由 RealNetworks 于 1997 年所开发的一种专用视频压缩格式。RV20 使用 H.263 编码器。',
		codecName: 'rv20',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			}
		]
	},
	{
		sName: 'RV10',
		lName: 'RV10',
		imageName: 'video_vcodec',
		imageOffset: 16,
		description: 'RV10 - RealVideo 是由 RealNetworks 于 1997 年所开发的一种专用视频压缩格式。RV10 使用 H.263 编码器。',
		codecName: 'rv10',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, yuv420p ]
					},
				],
				ratecontrol: [
					{
						...ABR,
						...vbitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			}
		]
	},
	{
		sName: 'msvideo1',
		lName: 'Microsoft Video 1',
		imageName: 'video_vcodec',
		imageOffset: 17,
		description: 'Microsoft Video 1 - Microsoft Video 1 is a vector quantizer video codec with frame differencing that operates in either a palettized 8-bit color space or a 16-bit RGB color space.',
		codecName: 'msvideo1',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "pix_fmt", display: "像素格式",
						items: [ 自动, rgb555le ]
					},
				],
				ratecontrol: []
			}
		]
	},
]

const resolution = [
	{
		sName: '不改变',
		lName: '不改变',
		imageName: 'video_resolution',
		imageOffset: 1,
		description: '不改变分辨率',
		resolution: '-',
	},
	{
		sName: '7680x4320',
		lName: '7680x4320',
		imageName: 'video_resolution',
		imageOffset: 58,
		description: '16:9 - UHD 8K',
		resolution: '7680x4320',
	},
	{
		sName: '5120x2880',
		lName: '5120x2880',
		imageName: 'video_resolution',
		imageOffset: 56,
		description: '16:9 - 5K',
		resolution: '5120x2880',
	},
	{
		sName: '3840x2160',
		lName: '3840x2160',
		imageName: 'video_resolution',
		imageOffset: 53,
		description: '16:9 - UHD 4K',
		resolution: '3840x2160',
	},
	{
		sName: '2560x1440',
		lName: '2560x1440',
		imageName: 'video_resolution',
		imageOffset: 48,
		description: '16:9 - QHD 2K',
		resolution: '2560x1440',
	},
	{
		sName: '1920x1080',
		lName: '1920x1080',
		imageName: 'video_resolution',
		imageOffset: 45,
		description: '16:9 - FHD',
		resolution: '1920x1080',
	},
	{
		sName: '1280x720',
		lName: '1280x720',
		imageName: 'video_resolution',
		imageOffset: 28,
		description: '16:9 - HD',
		resolution: '1280x720',
	},
	{
		sName: '960x540',
		lName: '960x540',
		imageName: 'video_resolution',
		imageOffset: 19,
		description: '16:9 - qHD',
		resolution: '960x540',
	},
	{
		sName: '640x360',
		lName: '640x360',
		imageName: 'video_resolution',
		imageOffset: 0,
		description: '16:9',
		resolution: '640x360',
	},
]

const framerate = [
	{
		sName: '不改变',
		lName: '不改变',
		imageName: '',
		imageOffset: 0,
		description: '按源平均帧率输出',
		framerate: '不改变',
	},
	{
		sName: '960',
		lName: '960',
		imageName: '',
		imageOffset: 0,
		description: '960p',
		framerate: '960',
	},
	{
		sName: '480',
		lName: '480',
		imageName: '',
		imageOffset: 0,
		description: '480p',
		framerate: '480',
	},
	{
		sName: '240',
		lName: '240',
		imageName: '',
		imageOffset: 0,
		description: '240p',
		framerate: '240',
	},
	{
		sName: '144',
		lName: '144',
		imageName: '',
		imageOffset: 0,
		description: '144p',
		framerate: '144',
	},
	{
		sName: '120',
		lName: '120',
		imageName: '',
		imageOffset: 0,
		description: '120p',
		framerate: '120',
	},
	{
		sName: '90',
		lName: '90',
		imageName: '',
		imageOffset: 0,
		description: '90p',
		framerate: '90',
	},
	{
		sName: '75',
		lName: '75',
		imageName: '',
		imageOffset: 0,
		description: '75p',
		framerate: '75',
	},
	{
		sName: '60',
		lName: '60',
		imageName: '',
		imageOffset: 0,
		description: '60p（常见屏幕刷新率）',
		framerate: '60',
	},
	{
		sName: '50',
		lName: '50',
		imageName: '',
		imageOffset: 0,
		description: '50p',
		framerate: '50',
	},
	{
		sName: '30',
		lName: '30',
		imageName: '',
		imageOffset: 0,
		description: '30p',
		framerate: '30',
	},
	{
		sName: '29.97',
		lName: '29.97',
		imageName: '',
		imageOffset: 0,
		description: '邪教（NTSC 标准）',
		framerate: '29.97',
	},
	{
		sName: '25',
		lName: '25',
		imageName: '',
		imageOffset: 0,
		description: '25p（PAL 标准）',
		framerate: '25',
	},
	{
		sName: '24',
		lName: '24',
		imageName: '',
		imageOffset: 0,
		description: '24p（常见电影制作标准）',
		framerate: '24',
	},
	{
		sName: '23.976',
		lName: '23.976',
		imageName: '',
		imageOffset: 0,
		description: '邪教',
		framerate: '23.976',
	},
	{
		sName: '15',
		lName: '15',
		imageName: '',
		imageOffset: 0,
		description: '15p',
		framerate: '15',
	},
	{
		sName: '12',
		lName: '12',
		imageName: '',
		imageOffset: 0,
		description: '12p',
		framerate: '12',
	},
	{
		sName: '10',
		lName: '10',
		imageName: '',
		imageOffset: 0,
		description: '卡成 PPT',
		framerate: '10',
	},
	{
		sName: '5',
		lName: '5',
		imageName: '',
		imageOffset: 0,
		description: '卡成 WPS Presentation',
		framerate: '5',
	},
	{
		sName: '3',
		lName: '3',
		imageName: '',
		imageOffset: 0,
		description: '三帧极致',
		framerate: '3',
	},
	{
		sName: '2',
		lName: '2',
		imageName: '',
		imageOffset: 0,
		description: '二帧流畅',
		framerate: '2',
	},
	{
		sName: '1',
		lName: '1',
		imageName: '',
		imageOffset: 0,
		description: '一帧能玩',
		framerate: '1',
	},

]


const generator = {
	getVideoParam: function (videoParams: OutputParams_video) {
		const ret = [];
		let strict2 = false;
		if (videoParams.vcodec === '禁用视频') {
			ret.push('-vn');
		} else if (videoParams.vcodec === '不重新编码') {
			ret.push('-vcodec');
			ret.push('copy');
		} else if (videoParams.vcodec !== '自动') {
			const vcodec = vcodecs.find((value) => value.sName == videoParams.vcodec);
			const vencoder = vcodec?.encoders.find((value) => value.sName == videoParams.vencoder);
			if (vcodec && vencoder) {
				// 不是用户手动填的 vcodec 和 vencoder
				if (videoParams.vencoder === "默认") {
					// 使用默认编码器，返回 vcodec.codecName
					ret.push('-vcodec');
					ret.push(vcodec.codecName);
				} else {
					// 使用特定编码器，返回 vcodev.encoder[].codecName
					ret.push('-vcodec');
					ret.push(vencoder.codecName);
				}
				if (vcodec.strict2 || vencoder.strict2) {
					strict2 = true;
				}
				for (const parameter of vencoder.parameters) {
					// 逐个遍历详细参数
					if (parameter.mode === 'combo') {
						if (videoParams.detail[parameter.parameter] != '默认' && videoParams.detail[parameter.parameter] != '自动') {
							ret.push('-' + parameter.parameter);
							ret.push(videoParams.detail[parameter.parameter]);
						}
						// 检查参数项是否有 strict2 标记
						const item = parameter.items.find((value) => value.sName === videoParams.detail[parameter.parameter]);
						if (item?.strict2) {
							strict2 = true;
						}
					} else if (parameter.mode == 'slider') {
						ret.push('-' + parameter.parameter);
						const floatValue = videoParams.detail[parameter.parameter];
						const value = parameter.valueToParam(floatValue);
						ret.push(value);
					}
				}
								// 调试用↓
								// ret.push('-threads')
								// ret.push('1')
								// 调试用↑
				const ratecontrol = vencoder.ratecontrol.find((value) => value.sName === videoParams.ratecontrol);
				if (ratecontrol !== null) {
					// 计算值
					const floatValue = videoParams.ratevalue;
					const value = ratecontrol.valueToParam(floatValue);
					// 将值插入参数列表中
					for (const item of ratecontrol.cmd) {
						if (item === VALUE) {
							ret.push(value);
						} else {
							ret.push(item);
						}
					}
				}
				if (strict2) {
					ret.push('-strict');
					ret.push('-2');
				}
				// 设置通用参数
				if (videoParams.resolution != '不改变') {
					ret.push('-s');
					ret.push(videoParams.resolution);
				}
				if (videoParams.framerate != '不改变') {
					ret.push('-r');
					ret.push(videoParams.framerate);
				}
			} else if (vcodec) {
				// 用户手动填入的 vencoder
				ret.push('-vcodec');
				ret.push(videoParams.vencoder);
			} else {
				// 用户手动填入的 vcodec
				ret.push('-vcodec');
				ret.push(videoParams.vcodec);
			}
		} // 如果编码为自动，则不设置 vcodec 参数，返回空 Array
		return ret;
	},
	// 获取 ratecontrol 方面的参数，主要是给 taskitem 用
	getRateControlParam: function (videoParams: OutputParams_video) {
		var ret = {
			mode: '-',
			value: '-'
		}
		if (videoParams.vcodec == '禁用视频' || videoParams.vcodec == '不重新编码' || videoParams.vcodec == '自动') {
			return ret
		} else {
			var vcodec = vcodecs.find((value) => {
				return value.sName == videoParams.vcodec
			})
			if (!vcodec) {
				return ret
			}
			var vencoder = vcodec.encoders.find((value) => {
				return value.sName == videoParams.vencoder
			})
			if (!vencoder || vencoder.ratecontrol == null) {
				return ret
			}
			// 找到 ratecontrol 参数
			var ratecontrol = vencoder.ratecontrol.find(value => {
				return value.sName == videoParams.ratecontrol
			})
			if (ratecontrol != null) {
				// 计算值
				var floatValue = videoParams.ratevalue
				var value = ratecontrol.valueToText(floatValue)
				ret = {
					mode: ratecontrol.sName,
					value
				}
			}
			return ret
		}
	}
}
export { vcodecs, resolution, framerate, generator }

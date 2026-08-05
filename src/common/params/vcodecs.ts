import { getMenuItemByValue, MenuItem, NarrowedMenuItem } from '@common/menu';
import formatUtils from '@common/formatUtils';
import { OutputParams_video } from "../types";
import { SliderOptions, Parameter, RateControl } from './parameter';

const AUTO_RATECONTROLs = [
	{
		type: 'normal',
		value: '自动',
		label: '自动',
		tooltip: '不指定码率控制，由编码器自行决定',
		extra: {
			detailToSliderValue: () => undefined,
			sliderParamToDetail: () => ['', 0],
			paramNames: [],
			defaultDetail: {},
			min: 0, max: 1,
			valueToDisplay: { type: 'integer' },
		},
	},
	{ type: 'separator' },
] satisfies MenuItem<RateControl>[];

export interface VCodecDetail {
	rateControl: MenuItem<RateControl>[];
	parameters: Parameter[];
	strict2?: true;
}

const 自动: NarrowedMenuItem = {
	type: 'normal',
	value: '自动',
	label: '自动',
	tooltip: '不指定，由 FFmpeg 自动选择',
}

// #region 预置码率控制模式 combo

const CRF51 = {
	type: 'normal',
	value: 'CRF',
	label: '恒定质量 CRF',
	tooltip: 'Constant Rate Factor - 恒定速率因子\n指定视觉画质，而码率因画面内容而异，性价比最高。\n如果您对输出文件大小没有明确的目标，使用此项可获得视觉上最稳定的画质。相较于 CQP，CRF 会考虑帧间的动态关系，在人眼更容易捕捉的静态画面分配更低的 QP，从而节省码率并且获得更好的视觉效果。',
	extra: {
		min: 0,
		max: 51,
		tags: new Map([
			[0, '51（最低画质）'],
			[51, '0（最高画质）'],
		]),
		adsorption: 'int',
		detailToSliderValue: (detail) => {
			const crf = detail['crf'];
			return Number.isFinite(+crf) ? 51 - crf : undefined;
		},
		valueToDisplay: { type: 'revertInteger' },
		valueToParam: (value) => 51 - +value + '',
		sliderParamToDetail: (sliderValue) => ({
			'crf': 51 - sliderValue,
		}),
		paramNames: ['crf'],
		defaultDetail: {
			'crf': 24,
		},
	},
} satisfies MenuItem<RateControl>;
const CRF63 = {
	type: 'normal',
	value: 'CRF',
	label: '恒定质量 CRF',
	tooltip: 'Constant Rate Factor - 恒定速率因子\n指定视觉画质，而码率因画面内容而异，性价比最高。\n如果您对输出文件大小没有明确的目标，使用此项可获得视觉上最稳定的画质。相较于 CQP，CRF 会考虑帧间的动态关系，在人眼更容易捕捉的静态画面分配更低的 QP，从而节省码率并且获得更好的视觉效果。',
	extra: {
		min: 0,
		max: 63,
		tags: new Map([
			[0, '63（最低画质）'],
			[63, '0（最高画质）'],
		]),
		adsorption: 'int',
		detailToSliderValue: (detail) => {
			const crf = detail['crf'];
			return Number.isFinite(+crf) ? 63 - crf : undefined;
		},
		valueToDisplay: { type: 'revertInteger' },
		valueToParam: (value) => 63 - +value + '',
		sliderParamToDetail: (sliderValue) => ({
			'crf': 63 - sliderValue,
		}),
		paramNames: ['crf'],
		defaultDetail: {
			'crf': 30,
		},
	},
} satisfies MenuItem<RateControl>;
const QP70 = {
	type: 'normal',
	value: 'CQP',
	label: '恒定量化 CQP',
	tooltip: 'Constant Quantization Parameter - 恒定量化参数\n指定每帧的画质，而码率因画面内容而异，可作为 CRF 的备选方案。\n如果您对输出文件大小没有明确的目标，使用此项可获得最稳定的画质。相较于 CRF，CQP 的 QP 是恒定的，每帧的画质相同，因此相同码率下视觉画质较 CRF 低，一般仅在显卡编码时使用。',
	extra: {
		min: 0,
		max: 70,
		tags: new Map([
			[0, '70（最低画质）'],
			[70, '0（最高画质）'],
		]),
		adsorption: 'int',
		detailToSliderValue: (detail) => {
			const qp = detail['qp'];
			return Number.isFinite(+qp) ? 70 - qp : undefined;
		},
		valueToDisplay: { type: 'revertInteger' },
		valueToParam: (value) => 70 - +value + '',
		sliderParamToDetail: (sliderValue) => ({
			'qp': 70 - sliderValue,
		}),
		paramNames: ['qp'],
		defaultDetail: {
			'qp': 34,
		},
	},
} satisfies MenuItem<RateControl>;
const QP63 = {
	type: 'normal',
	value: 'CQP',
	label: '恒定量化 CQP',
	tooltip: 'Constant Quantization Parameter - 恒定量化参数\n指定每帧的画质，而码率因画面内容而异，可作为 CRF 的备选方案。\n如果您对输出文件大小没有明确的目标，使用此项可获得最稳定的画质。相较于 CRF，CQP 的 QP 是恒定的，每帧的画质相同，因此相同码率下视觉画质较 CRF 低，一般仅在显卡编码时使用。',
	extra: {
		min: 0,
		max: 63,
		tags: new Map([
			[0, '63（最低画质）'],
			[62, '1（最高画质）'],
			[63, '0（自动）'],
		]),
		adsorption: 'int',
		detailToSliderValue: (detail) => {
			const qp = detail['qp'];
			return Number.isFinite(+qp) ? 63 - qp : undefined;
		},
		valueToDisplay: { type: 'revertInteger' },
		valueToParam: (value) => 63 - +value + '',
		sliderParamToDetail: (sliderValue) => ({
			'qp': 63 - sliderValue,
		}),
		paramNames: ['qp'],
		defaultDetail: {
			'qp': 30,
		},
	},
} satisfies MenuItem<RateControl>;
const QP51 = {
	type: 'normal',
	value: 'CQP',
	label: '恒定量化 CQP',
	tooltip: 'Constant Quantization Parameter - 恒定量化参数\n指定每帧的画质，而码率因画面内容而异，可作为 CRF 的备选方案。\n如果您对输出文件大小没有明确的目标，使用此项可获得最稳定的画质。相较于 CRF，CQP 的 QP 是恒定的，每帧的画质相同，因此相同码率下视觉画质较 CRF 低，一般仅在显卡编码时使用。',
	extra: {
		min: 0,
		max: 51,
		tags: new Map([
			[0, '51（最低画质）'],
			[51, '0（最高画质）'],
		]),
		adsorption: 'int',
		detailToSliderValue: (detail) => {
			const qp = detail['qp'];
			return Number.isFinite(+qp) ? 51 - qp : undefined;
		},
		valueToDisplay: { type: 'revertInteger' },
		valueToParam: (value) => 51 - +value + '',
		sliderParamToDetail: (sliderValue) => ({
			'qp': 51 - sliderValue,
		}),
		paramNames: ['qp'],
		defaultDetail: {
			'qp': 28,
		},
	},
} satisfies MenuItem<RateControl>;
const VBRnvenc = {
	type: 'normal',
	value: 'VBR',
	label: '动态码率 VBR',
	tooltip: 'Variable Bit Rate - 可变码率\n指定画质参数，控制比特率范围，可作为 CRF 的备选方案。',
	extra: {
		min: 0,
		max: 51,
		tags: new Map([
			[0, '51（最低画质）'],
			[11, '40（低画质）'],	// VMAF 78.36
			[17, '34（一般画质）'],	// VMAF 87.03
			[23, '28（良画质）'],	// VMAF 93.03
			[31, '20（高画质）'],	// VMAF 96.86
			[51, '0（自动）'],
		]),
		adsorption: 'int',
		detailToSliderValue: (detail) => {
			const cq = detail['cq'];
			return Number.isFinite(+cq) ? 51 - cq : undefined;
		},
		valueToDisplay: { type: 'revertInteger' },
		valueToParam: (value) => 51 - +value + '',
		sliderParamToDetail: (sliderValue) => ({
			'rc': 'vbr',
			'cq': 51 - sliderValue,
			'maxrate': 700000000,
		}),
		paramNames: ['cq', 'rc', 'maxrate'],
		defaultDetail: {
			'rc': 'vbr',
			'cq': 28,
			'maxrate': 700000000,
		},
	},
} satisfies MenuItem<RateControl>;
const VBRnvencHQ = {
	type: 'normal',
	value: 'VBR_HQ',
	label: '动态码率 VBR_HQ',
	tooltip: 'Variable Bit Rate - 可变码率\n指定画质参数，控制比特率范围，可作为 CRF 的备选方案。该项是老 NVIDIA 特有选项，在编码时间几乎不变的情况下略微提高质量。此选项在 ffmpeg 9.0 已被废弃。',
	extra: {
		...VBRnvenc.extra,
		sliderParamToDetail: (sliderValue) => ({
			'rc': 'vbr_hq',
			'cq': 51 - sliderValue,
			'maxrate': 700000000,
		}),
		defaultDetail: {
			'rc': 'vbr_hq',
			'cq': 28,
			'maxrate': 700000000,
		},
	},
} satisfies MenuItem<RateControl>;
const Qav1qsv = {
	type: 'normal',
	value: 'Q',
	label: '指定质量 Q',
	tooltip: 'Q - 质量\n指定画质，具体值对应的画质由具体编码器决定。',
	extra: {
		min: 0,
		max: 255,
		tags: new Map([
			[0, '255（最低画质）'],
			[79, '176（很低画质）'],
			[123, '132（低画质）'],
			[167, '88（中画质）'],
			[211, '44（高画质）'],
			[255, '0（最高画质）'],
		]),
		adsorption: 'int',
		detailToSliderValue: (detail) => {
			const q = detail['q'];
			return Number.isFinite(+q) ? 255 - q : undefined;
		},
		valueToDisplay: { type: 'revertInteger' },
		valueToParam: (value) => 255 - +value + '',
		sliderParamToDetail: (sliderValue) => ({
			'q': 255 - sliderValue,
		}),
		paramNames: ['q'],
		defaultDetail: {
			'q': 88,
		},
	},
} satisfies MenuItem<RateControl>;
const Q100 = {
	type: 'normal',
	value: 'Q',
	label: '指定质量 Q',
	tooltip: 'Q - 质量\n指定画质，具体值对应的画质由具体编码器决定。',
	extra: {
		min: 0,
		max: 100,
		tags: new Map([
			[100, '0'],
			[0, '100'],
		]),
		adsorption: 'int',
		detailToSliderValue: (detail) => {
			const q = detail['q'];
			return Number.isFinite(+q) ? 100 - q : undefined;
		},
		valueToDisplay: { type: 'revertInteger' },
		valueToParam: (value) => 100 - +value + '',
		sliderParamToDetail: (sliderValue) => ({
			'q': 100 - sliderValue,
		}),
		paramNames: ['q'],
		defaultDetail: {
			'q': 50,
		},
	},
} satisfies MenuItem<RateControl>;
const ABR = {
	type: 'normal',
	value: 'ABR',
	label: '平均码率 ABR',
	tooltip: 'Average Bit Rate - 平均码率\n将码率控制在指定值左右，一般应用于限定文件大小但又不希望像 CBR 那样死板的场景。',
	extra: {
		min: 0,
		max: 12,
		arrowKeyStep: 24,
		tags: new Map([
			[0, '62.5 Kbps'],
			[3, '500 Kbps'],
			[6, '4 Mbps'],
			[9, '32 Mbps'],
			[12, '256 Mbps'],
		]),
		detailToSliderValue: (detail) => {
			const bitrate = detail['b:v'];
			return Number.isFinite(+bitrate) ? Math.log(+bitrate / 62500) / Math.log(2) : undefined;
		},
		valueToDisplay: { base: 62500, type: 'bitrate' },
		valueToParam: (value) => {
			return Math.round(62500 * Math.pow(2, +value));
		},
		sliderParamToDetail: (sliderValue) => ({
			'b:v': Math.round(62500 * Math.pow(2, +sliderValue)),
		}),
		paramNames: ['b:v'],
		defaultDetail: {
			'b:v': 4000000,
		},
	},
} satisfies MenuItem<RateControl>;
const CBR = {
	...ABR,
	value: 'CBR',
	label: '固定码率 CBR',
	tooltip: 'Constant Bit Rate - 恒定码率\n将码率恒定在指定值，仅允许极小或没有波动，性价比最低，一般仅应用于直播等需要数据速率固定的场景。',
} satisfies MenuItem<RateControl>;
const CBRlibx264x265 = {
	...CBR,
	extra: {
		...CBR.extra,
		sliderParamToDetail: (sliderValue) => ({
			'b:v': Math.round(62500 * Math.pow(2, +sliderValue)),
			'minrate': Math.round(62500 * Math.pow(2, +sliderValue)),
			'maxrate': Math.round(62500 * Math.pow(2, +sliderValue)),
		}),
		paramNames: ['b:v', 'minrate', 'maxrate'],
		defaultDetail: {
			'b:v': 4000000,
			'minrate': 4000000,
			'maxrate': 4000000,
		},
	},
} satisfies MenuItem<RateControl>;

// #endregion

// #region 预置 slider

// valueToText：显示在滑杆旁边的文字　　valueProcess：进行吸附、整数化处理　　valueToParam：输出到 ffmpeg 参数的文字

const H264265presetSlider: SliderOptions = {
	max: 9,
	tags: new Map([
		[0, 'ultrafast'],
		[1, 'superfast'],
		[2, 'veryfast'],
		[3, 'faster'],
		[4, 'fast'],
		[5, 'medium'],
		[6, 'slow'],
		[7, 'slower'],
		[8, 'veryslow'],
		[9, 'placebo'],
	]),
	sliderMode: 'string',
	default: 'medium',
	valueToParam: (value) => value,
}
const qsvPresetSlider: SliderOptions = {
	max: 6,
	tags: new Map([
		[0, 'veryfast'],
		[1, 'faster'],
		[2, 'fast'],
		[3, 'medium'],
		[4, 'slow'],
		[5, 'slower'],
		[6, 'veryslow'],
	]),
	sliderMode: 'string',
	default: 'medium',
	valueToParam: (value) => value,
}

// #endregion

// #region 预置 preset

const 默认: NarrowedMenuItem = {
	type: 'normal',
	value: '默认',
	label: '默认',
	tooltip: '默认',
}
const psnr: NarrowedMenuItem = {
	type: 'normal',
	value: 'psnr',
	label: 'psnr',
	tooltip: '优化 PSNR',
}
const ssim: NarrowedMenuItem = {
	type: 'normal',
	value: 'ssim',
	label: 'ssim',
	tooltip: '优化 SSIM',
}
const fastdecode: NarrowedMenuItem = {
	type: 'normal',
	value: 'fastdecode',
	label: 'fastdecode',
	tooltip: '快速解码',
}
const zerolatency: NarrowedMenuItem = {
	type: 'normal',
	value: 'zerolatency',
	label: 'zerolatency',
	tooltip: '低延迟编码',
}
const film: NarrowedMenuItem = {
	type: 'normal',
	value: 'film',
	label: 'film',
	tooltip: '电影',
}
const animation: NarrowedMenuItem = {
	type: 'normal',
	value: 'animation',
	label: 'animation',
	tooltip: '动画',
}
const grain: NarrowedMenuItem = {
	type: 'normal',
	value: 'grain',
	label: 'grain',
	tooltip: '保留噪点',
}
const stillimage: NarrowedMenuItem = {
	type: 'normal',
	value: 'stillimage',
	label: 'stillimage',
	tooltip: '静态图像',
}
const nvencPreset: NarrowedMenuItem[] = [
	{
		type: 'normal',
		value: '自动',
		label: '自动',
		tooltip: '自动',
	},
	{
		type: 'normal',
		value: 'slow',
		label: 'slow',
		tooltip: 'hq 2 passes',
	},
	{
		type: 'normal',
		value: 'medium',
		label: 'medium',
		tooltip: 'hq 1 pass',
	},
	{
		type: 'normal',
		value: 'fast',
		label: 'fast',
		tooltip: 'hp 1 pass',
	},
	{
		type: 'normal',
		value: 'hq',
		label: 'hq',
		tooltip: '',
	},
	{
		type: 'normal',
		value: 'bd',
		label: 'bd',
		tooltip: '',
	},
	{
		type: 'normal',
		value: 'll',
		label: 'll',
		tooltip: 'low latency',
	},
	{
		type: 'normal',
		value: 'llhq',
		label: 'llhq',
		tooltip: 'low latency hq',
	},
	{
		type: 'normal',
		value: 'llhp',
		label: 'llhp',
		tooltip: 'low latency hp',
	},
	{
		type: 'normal',
		value: 'lossless',
		label: 'lossless',
		tooltip: '',
	},
	{
		type: 'normal',
		value: 'losslesshp',
		label: 'losslesshp',
		tooltip: '',
	},
	{
		type: 'normal',
		value: 'p1',
		label: 'p1',
		tooltip: 'fastest (lowest quality)',
	},
	{
		type: 'normal',
		value: 'p2',
		label: 'p2',
		tooltip: 'faster (lower quality)',
	},
	{
		type: 'normal',
		value: 'p3',
		label: 'p3',
		tooltip: 'fast (low quality)',
	},
	{
		type: 'normal',
		value: 'p4',
		label: 'p4',
		tooltip: 'medium (default)',
	},
	{
		type: 'normal',
		value: 'p5',
		label: 'p5',
		tooltip: 'slow (good quality)',
	},
	{
		type: 'normal',
		value: 'p6',
		label: 'p6',
		tooltip: 'slower (better quality)',
	},
	{
		type: 'normal',
		value: 'p7',
		label: 'p7',
		tooltip: 'slowest (best quality)',
	},
]

// #endregion

// #region 预置 level

const h264Level: NarrowedMenuItem[] = [
	{
		type: 'normal',
		value: '自动',
		label: '自动',
		tooltip: '自动',
	},
	{
		type: 'normal',
		value: '1',
		label: '1',
		tooltip: '高清晰度@最高帧率：\n128×96@30\n176×144@15',
	},
	{
		type: 'normal',
		value: '1b',
		label: '1b',
		tooltip: '高清晰度@最高帧率：\n128×96@30\n176×144@15',
	},
	{
		type: 'normal',
		value: '1.1',
		label: '1.1',
		tooltip: '高清晰度@最高帧率：\n128×96@60\n176×144@30\n352×288@7.5',
	},
	{
		type: 'normal',
		value: '1.2',
		label: '1.2',
		tooltip: '高清晰度@最高帧率：\n128×96@120\n176×144@60\n352×288@15',
	},
	{
		type: 'normal',
		value: '1.3',
		label: '1.3',
		tooltip: '高清晰度@最高帧率：\n128×96@172\n176×144@120\n352×288@30',
	},
	{
		type: 'normal',
		value: '2',
		label: '2',
		tooltip: '高清晰度@最高帧率：\n128×96@172\n176×144@120\n352×288@30',
	},
	{
		type: 'normal',
		value: '2.1',
		label: '2.1',
		tooltip: '高清晰度@最高帧率：\n176×144@172\n352×240@60\n352×288@50\n352×480@30\n352×576@25',
	},
	{
		type: 'normal',
		value: '2.2',
		label: '2.2',
		tooltip: '高清晰度@最高帧率：\n176×144@172\n352×480@30\n352×576@25\n720×480@15\n720×576@12.5',
	},
	{
		type: 'normal',
		value: '3',
		label: '3',
		tooltip: '高清晰度@最高帧率：\n176×144@172\n352×240@120\n352×480@60\n720×480@30\n720×576@25',
	},
	{
		type: 'normal',
		value: '3.1',
		label: '3.1',
		tooltip: '高清晰度@最高帧率：\n352×288@172\n352×576@130\n640×480@90\n720×576@60\n1280×720@30',
	},
	{
		type: 'normal',
		value: '3.2',
		label: '3.2',
		tooltip: '高清晰度@最高帧率：\n640×480@172\n720×480@160\n720×576@130\n1280×720@60',
	},
	{
		type: 'normal',
		value: '4',
		label: '4',
		tooltip: '高清晰度@最高帧率：\n720×480@172\n720×576@150\n1280×720@60\n2048×1024@30',
	},
	{
		type: 'normal',
		value: '4.1',
		label: '4.1',
		tooltip: '高清晰度@最高帧率：\n720×480@172\n720×576@150\n1280×720@60\n2048×1024@30',
	},
	{
		type: 'normal',
		value: '4.2',
		label: '4.2',
		tooltip: '高清晰度@最高帧率：\n720×576@172\n1280×720@140\n2048×1080@60',
	},
	{
		type: 'normal',
		value: '5',
		label: '5',
		tooltip: '高清晰度@最高帧率：\n1024×768@172\n1280×720@160\n2048×1080@60\n2560×1920@30\n3680×1536@25',
	},
	{
		type: 'normal',
		value: '5.1',
		label: '5.1',
		tooltip: '高清晰度@最高帧率：\n1280×720@172\n1920×1080@120\n2048×1536@80\n4096×2048@30',
	},
	{
		type: 'normal',
		value: '5.2',
		label: '5.2',
		tooltip: '高清晰度@最高帧率：\n1920×1080@172\n2048×1536@160\n4096×2048@60',
	},
	{
		type: 'normal',
		value: '6',
		label: '6',
		tooltip: '高清晰度@最高帧率：\n2048×1536@300\n4096×2160@120\n8192×4320@30',
	},
	{
		type: 'normal',
		value: '6.1',
		label: '6.1',
		tooltip: '高清晰度@最高帧率：\n2048×1536@300\n4096×2160@240\n8192×4320@60',
	},
	{
		type: 'normal',
		value: '6.2',
		label: '6.2',
		tooltip: '高清晰度@最高帧率：\n4096×2304@300\n8192×4320@120',
	},
]
const hevcLevel: NarrowedMenuItem[] = [
	{
		type: 'normal',
		value: '自动',
		label: '自动',
		tooltip: '自动',
	},
	{
		type: 'normal',
		value: '1',
		label: '1',
		tooltip: '高清晰度@最高帧率：\n128×96@33.7\n176×144@15.0',
	},
	{
		type: 'normal',
		value: '2',
		label: '2',
		tooltip: '高清晰度@最高帧率：\n176×144@100.0\n320×240@45.0\n352×240@37.5\n352×288@30.0',
	},
	{
		type: 'normal',
		value: '2.1',
		label: '2.1',
		tooltip: '高清晰度@最高帧率：\n320×240@90.0\n352×240@75.0\n352×288@60.0\n352×480@37.5\n352×576@33.3\n640×360@30.0',
	},
	{
		type: 'normal',
		value: '3',
		label: '3',
		tooltip: '高清晰度@最高帧率：\n352×480@84.3\n352×576@75.0\n640×360@67.5\n720×480@42.1\n720×576@37.5\n960×540@30.0',
	},
	{
		type: 'normal',
		value: '3.1',
		label: '3.1',
		tooltip: '高清晰度@最高帧率：\n720×480@84.3\n720×576@75.0\n960×540@60.0\n1280×720@33.7',
	},
	{
		type: 'normal',
		value: '4',
		label: '4',
		tooltip: '高清晰度@最高帧率：\n1280×720@68.0\n1280×1024@51.0\n1920×1080@32.0\n2048×1080@30.0',
	},
	{
		type: 'normal',
		value: '4.1',
		label: '4.1',
		tooltip: '高清晰度@最高帧率：\n1280×720@136.0\n1280×1024@102.0\n1920×1080@64.0\n2048×1080@60.0',
	},
	{
		type: 'normal',
		value: '5',
		label: '5',
		tooltip: '高清晰度@最高帧率：\n1920×1080@128.0\n2048×1024@127.5\n2048×1080@120.0\n2048×1536@85.0\n2560×1920@54.4\n3672×1536@46.8\n3840×2160@32.0\n4096×2160@30.0',
	},
	{
		type: 'normal',
		value: '5.1',
		label: '5.1',
		tooltip: '高清晰度@最高帧率：\n1920×1080@256.0\n2048×1024@255.0\n2048×1080@240.0\n2048×1536@170.0\n2560×1920@108.8\n3672×1536@93.7\n3840×2160@64.0\n4096×2160@60.0',
	},
	{
		type: 'normal',
		value: '5.2',
		label: '5.2',
		tooltip: '高清晰度@最高帧率：\n1920×1080@300.0\n2048×1024@300.0\n2048×1080@300.0\n2048×1536@300.0\n2560×1920@217.6\n3672×1536@187.5\n3840×2160@128.0\n4096×2160@120.0',
	},
	{
		type: 'normal',
		value: '6',
		label: '6',
		tooltip: '高清晰度@最高帧率：\n3840×2160@128.0\n4096×2048@127.5\n4096×2160@120.0\n4096×2304@113.3\n7680×4320@32.0\n8192×4320@30.0',
	},
	{
		type: 'normal',
		value: '6.1',
		label: '6.1',
		tooltip: '高清晰度@最高帧率：\n3840×2160@256.0\n4096×2048@255.0\n4096×2160@240.0\n4096×2304@226.6\n7680×4320@64.0\n8192×4320@60.0',
	},
	{
		type: 'normal',
		value: '6.2',
		label: '6.2',
		tooltip: '高清晰度@最高帧率：\n3840×2160@300.0\n4096×2048@300.0\n4096×2160@300.0\n4096×2304@300.0\n7680×4320@128.0\n8192×4320@120.0',
	},
]

// #endregion

// #region 预置 profile

const baseline: NarrowedMenuItem = {
	type: 'normal',
	value: 'baseline',
	label: 'baseline',
	tooltip: 'baseline',
}
const constrained_baseline: NarrowedMenuItem = {
	type: 'normal',
	value: 'constrained_baseline',
	label: 'constrained_baseline',
	tooltip: 'constrained_baseline',
}
const main: NarrowedMenuItem = {
	type: 'normal',
	value: 'main',
	label: 'main',
	tooltip: 'main',
}
const main10: NarrowedMenuItem = {
	type: 'normal',
	value: 'main10',
	label: 'main10',
	tooltip: 'main10',
}
const mainsp: NarrowedMenuItem = {
	type: 'normal',
	value: 'mainsp',
	label: 'mainsp',
	tooltip: 'mainsp',
}
const rext: NarrowedMenuItem = {
	type: 'normal',
	value: 'rext',
	label: 'rext',
	tooltip: 'rext',
}
const high: NarrowedMenuItem = {
	type: 'normal',
	value: 'high',
	label: 'high',
	tooltip: 'high',
}
const high10: NarrowedMenuItem = {
	type: 'normal',
	value: 'high10',
	label: 'high10',
	tooltip: 'high10',
}
const constrained_high: NarrowedMenuItem = {
	type: 'normal',
	value: 'constrained_high',
	label: 'constrained_high',
	tooltip: 'constrained_high',
}
const high422p: NarrowedMenuItem = {
	type: 'normal',
	value: 'high422p',
	label: 'high422p',
	tooltip: 'high422p',
}
const high422: NarrowedMenuItem = {
	type: 'normal',
	value: 'high422',
	label: 'high422',
	tooltip: 'high422',
}
const high444p: NarrowedMenuItem = {
	type: 'normal',
	value: 'high444p',
	label: 'high444p',
	tooltip: 'high444p',
}
const high444: NarrowedMenuItem = {
	type: 'normal',
	value: 'high444',
	label: 'high444',
	tooltip: 'high444',
}
const extended: NarrowedMenuItem = {
	type: 'normal',
	value: 'extended',
	label: 'extended',
	tooltip: 'extended',
}


// #endregion

// #region 预置 pixel format

const [ yuv420p ,  yuv422p ,  yuv440p ,  yuv444p ,  yuva420p ,  yuvj420p ,  yuvj422p ,  yuvj444p ,  nv12 ,  nv16 ,  nv21 ,  gbrp ,  yuv420p10le ,  yuv422p10le ,  yuv440p10le ,  yuv444p10le ,  yuv420p12le ,  yuv422p12le ,  yuv440p12le ,  yuv444p12le ,  yuv444p16le ] =
	  ['yuv420p', 'yuv422p', 'yuv440p', 'yuv444p', 'yuva420p', 'yuvj420p', 'yuvj422p', 'yuvj444p', 'nv12', 'nv16', 'nv21', 'gbrp', 'yuv420p10le', 'yuv422p10le', 'yuv440p10le', 'yuv444p10le', 'yuv420p12le', 'yuv422p12le', 'yuv440p12le', 'yuv444p12le', 'yuv444p16le'].map((n) => ({
		type: 'normal' as const,
		value: n, label: n,
		tooltip: '',
	  }));
const [ nv20le ,  gbrp10le ,  gbrp12le ,  gray ,  gray10le ,  p010le ,  p016le ,  qsv ,  bgr0 ,  rgb0 ,  bgr24 ,  rgb24 ,  bgra ,  cuda ,  d3d11 ,  dxva2_vld ,  videotoolbox_vld ,  rgb555le ] =
	  ['nv20le', 'gbrp10le', 'gbrp12le', 'gray', 'gray10le', 'p010le', 'p016le', 'qsv', 'bgr0', 'rgb0', 'bgr24', 'rgb24', 'bgra', 'cuda', 'd3d11', 'dxva2_vld', 'videotoolbox_vld', 'rgb555le'].map((n) => ({
		type: 'normal' as const,
		value: n, label: n,
		tooltip: '',
	  }));

// #endregion

const builtInH26xMpegVcodecs: MenuItem<VCodecDetail>[] = [
	{
		type: 'submenu',
		label: 'H.266 · VVC',
		tooltip: '一种由 ITU-T 和 MPEG 联合制定的，用于取代 H.265/MPEG-4 HEVC 的新一代视频编码。\n\n- ITU-T 命名：H.266\n- MPEG 命名：VVC (Versatile Video Coding) (MPEG-I Part-3)\n- 发布日期：2020-07-06',
		subMenu: [
			{
				type: 'normal',
				value: 'libvvenc',
				label: '【默认】libvvenc',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{
							...QP63,
							extra: {
								...QP63.extra,
								tags: new Map([
									[0, '63（最低画质）'],
									[25, '38（低画质）'],	// VMAF 75.95
									[31, '32（一般画质）'],	// VMAF 85.58
									[37, '26（良画质）'],	// VMAF 93.13
									[43, '20（高画质）'],	// VMAF 97.35
									[63, '0（最高画质）'],
								]),
								defaultDetail: {
									'qp': 26,
								},
							},
						},
						{ ...ABR },
					],
					parameters: [
						{
							mode: "slider", parameter: "preset", display: "速度/质量",
							max: 4,
							tags: new Map([
								[0, 'faster'],
								[1, 'fast'],
								[2, 'medium'],
								[3, 'slow'],
								[4, 'slower'],
							]),
							sliderMode: 'string',
							default: 'faster',
							valueToParam: (value) => value,
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p10le ],
						},	
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'H.265 · HEVC',
		tooltip: '一种由 ITU-T 和 MPEG 联合制定的，用于取代 H.264/MPEG-4 AVC 的新一代视频编码。\n其已被广泛应用于各个领域，具有比 H.264/AVC 高约三分之一的压缩效率，硬件编解码器支持完善，视频转码的推荐之选。\n\n- ITU-T 命名：H.265\n- MPEG 命名：HEVC (High Efficiency Video Coding) (MPEG-H Part-2)\n- 发布日期：2013-04-13\n\nffmpeg 内置的编码器实现了 HEVC/H.265 的首个标准版本。截至 2026 年 1 月，HEVC/H.265 具有 11 个版本。',
		subMenu: [
			{
				type: 'normal',
				value: 'libx265',
				label: '【默认】libx265',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{
							...CRF51,
							extra: {
								...CRF51.extra,
								tags: new Map([
									[0, '51（最低画质）'],
									[15, '36（低画质）'],	// VMAF 76.66
									[21, '30（一般画质）'],	// VMAF 87.19
									[27, '24（良画质）'],	// VMAF 93.44
									[33, '18（高画质）'],	// VMAF 96.86
									[39, '12（肉眼无损）'],
									[51, '0（最高画质）'],
								]),
								defaultDetail: {
									'crf': 24,
								},
							},
						},
						{ ...QP70 },
						{ ...ABR },
						{ ...CBRlibx264x265 },
					],
					parameters: [
						{
							mode: "slider", parameter: "preset", display: "速度/质量",
							...H264265presetSlider,
						},
						{
							mode: "combo", parameter: "tune", display: "编码倾重",
							items: [ 默认, psnr, ssim, fastdecode, zerolatency ],
						},
						{
							mode: "combo", parameter: "level", display: "级别",
							items: [ ...hevcLevel ],
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, yuv422p, yuv444p, gbrp, yuv420p10le, yuv422p10le, yuv444p10le, gbrp10le, gray, gray10le ],
						},	
					],
				},
			},
			{
				type: 'normal',
				value: 'hevc_qsv',
				label: 'hevc_qsv',
				tooltip: 'Intel 硬件加速编码器',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Qav1qsv },	// 应该是 qp63，但目前暂未验证
						{ ...ABR },
					],
					parameters: [
						{
							mode: "slider", parameter: "preset", display: "速度/质量",
							...qsvPresetSlider,
						},
						{
							mode: "combo", parameter: 'profile:v', display: '规格',
							items: [ 自动, main, main10, mainsp ],
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, nv12, p010le, qsv ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'hevc_nvenc',
				label: 'hevc_nvenc',
				tooltip: 'NVIDIA 硬件加速编码器',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...VBRnvencHQ },
						{ ...VBRnvenc },
						{ ...QP51 },
						{
							...CBR,
							extra: {
								...CBR.extra,
								sliderParamToDetail: (sliderValue) => ({
									'cbr': 'true',
									'b:v': Math.round(62500 * Math.pow(2, +sliderValue)),
								}),
								paramNames: ['cbr', 'b:v'],
								defaultDetail: {
									'cbr': 'true',
									'b:v': 4000000,
								},
							},
						},
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "preset", display: "速度/质量",
							items: [ ...nvencPreset ],
						},
						{
							mode: "combo", parameter: "tune", display: "编码倾重",
							items: [ 默认, psnr, ssim, fastdecode, zerolatency ],
						},
						{
							mode: "combo", parameter: 'profile:v', display: "规格",
							items: [ 自动, main, main10, rext ],
						},
						{
							mode: "combo", parameter: "level", display: "级别",
							items: [ ...hevcLevel ],
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, nv12, p016le, yuv444p, p010le, yuv444p16le, bgr0, rgb0, cuda, d3d11 ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'hevc_amf',
				label: 'hevc_amf',
				tooltip: 'AMD 硬件加速编码器',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{
							...QP51,
							extra: {
								...QP51.extra,
								detailToSliderValue: (detail) => {
									const qp = detail['qp_i'] || detail['qp_p'] || detail['qp'];
									return Number.isFinite(+qp) ? 51 - qp : undefined;
								},
								sliderParamToDetail: (sliderValue) => ({
									'qp_i': 51 - sliderValue,
									'qp_p': 51 - sliderValue,
								}),
								paramNames: ['qp_i', 'qp_p'],
								defaultDetail: {
									'qp_i': 28,
									'qp_p': 28,
								},
							},
						},
						{
							...CBR,
							extra: {
								...CBR.extra,
								sliderParamToDetail: (sliderValue) => ({
									'rc': 'vbr',
									'b:v': Math.round(62500 * Math.pow(2, +sliderValue)),
								}),
								paramNames: ['rc', 'b:v'],
								defaultDetail: {
									'rc': 'vbr',
									'b:v': 4000000,
								},
							},
						},
						{ ...ABR },
					],
					parameters: [
						{
							mode: "slider", parameter: "preset", display: "速度/质量",
							max: 2,
							tags: new Map([
								[0, 'speed'],
								[1, 'balanced'],
								[2, 'quality'],
							]),
							sliderMode: 'string',
							default: 'balanced',
							valueToParam: (value) => value,
						},
						{
							mode: "combo", parameter: "tune", display: "编码倾重",
							items: [
								自动,
								{
									type: 'normal',
									value: 'transcoding',
									label: 'transcoding（默认）',
									tooltip: '转码',
								},
								{
									type: 'normal',
									value: 'ultralowlatency',
									label: 'ultralowlatency',
									tooltip: '超低延迟',
								},
								{
									type: 'normal',
									value: 'webcam',
									label: 'webcam',
									tooltip: '网络摄像头',
								},
							],
						},
						{
							mode: "combo", parameter: 'profile:v', display: "规格",
							items: [ 自动, main, high ]
						},
						{
							mode: "combo", parameter: "level", display: "级别",
							items: [ ...hevcLevel ]
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, nv12, d3d11, dxva2_vld ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'hevc_videotoolbox',
				label: 'hevc_videotoolbox',
				tooltip: '苹果硬件加速编码器',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: 'profile:v', display: "规格",
							items: [ 自动, main, main10 ],
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, videotoolbox_vld, nv12, yuv420p, bgra, p010le ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'H.264 · AVC',
		tooltip: '一种由 ITU-T 和 MPEG 联合制定的视频编码，是迄今为止最常用的视频内容录制、压缩和分发格式。\n现代的播放器几乎全部支持 H.264/AVC，它相比前代具有明显更优的压缩效果。当您需要考虑兼容性时，选择此编码。\n\n- ITU-T 命名：H.264\n- MPEG 命名：AVC (Advanced Video Coding) (MPEG-4 Part-10)\n- 发布日期：2003-05-30\n\nH.264/AVC 截至 2026 年 6 月具有 16 个版本。目前最常见的 H.264 AVC High Profile Level 4.1 来自 2005 年第 3 版。',
		subMenu: [
			{
				type: 'normal',
				value: 'libx264',
				label: '【默认】libx264',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{
							...CRF51,
							extra: {
								...CRF51.extra,
								tags: new Map([
									[0, '51（最低画质）'],
									[15, '36（低画质）'],	// VMAF 75.77
									[21, '30（一般画质）'],	// VMAF 86.96
									[27, '24（良画质）'],	// VMAF 93.68
									[33, '18（高画质）'],	// VMAF 97.15
									[39, '12（肉眼无损）'],
									[51, '0（最高画质）'],
								]),
								defaultDetail: {
									'crf': 24,
								},
							},
						},
						{ ...QP70 },
						{ ...ABR },
						{ ...CBRlibx264x265 },
					],
					parameters: [
						{
							mode: "slider", parameter: "preset", display: "速度/质量",
							...H264265presetSlider,
						},
						{
							mode: "combo", parameter: "tune", display: "编码倾重",
							items: [ 默认, film, animation, grain, stillimage, psnr, ssim, fastdecode, zerolatency ],
						},
						{
							mode: "combo", parameter: 'profile:v', display: "规格",
							items: [ 自动, baseline, main, high, high422, high444 ],
						},
						{
							mode: "combo", parameter: "level", display: "级别",
							items: [ ...h264Level ],
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, yuvj420p, yuv422p, yuvj422p, yuv444p, yuvj444p, nv12, nv16, nv21, yuv420p10le, yuv422p10le, yuv444p10le, nv20le, gray, gray10le ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'libx264rgb',
				label: 'libx264rgb',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{
							...CRF51,
							extra: {
								...CRF51.extra,
								tags: new Map([
									[0, '51（最低画质）'],
									[15, '36（低画质）'],
									[21, '30（一般画质）'],
									[27, '24（良画质）'],
									[33, '18（高画质）'],
									[39, '12（肉眼无损）'],
									[51, '0（最高画质）'],
								]),
								defaultDetail: {
									'crf': 24,
								},
							},						
						},
						{ ...QP70 },
						{ ...CBRlibx264x265 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "slider", parameter: "preset", display: "速度/质量",
							...H264265presetSlider,
						},
						{
							mode: "combo", parameter: "tune", display: "编码倾重",
							items: [ 默认, film, animation, grain, stillimage, psnr, ssim, fastdecode, zerolatency ],
						},
						{
							mode: "combo", parameter: "level", display: "级别",
							items: [ ...h264Level ],
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, bgr0, bgr24, rgb24 ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'h264_qsv',
				label: 'h264_qsv',
				tooltip: 'Intel 硬件加速编码器',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "slider", parameter: "preset", display: "速度/质量",
							...qsvPresetSlider,
						},
						{
							mode: "combo", parameter: 'profile:v', display: '规格',
							items: [ 自动, baseline, main, high ],
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, nv12, qsv ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'h264_nvenc',
				label: 'h264_nvenc',
				tooltip: 'NVIDIA 硬件加速编码器',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...VBRnvencHQ },
						{ ...VBRnvenc },
						{ ...QP51 },
						{
							...CBR,
							extra: {
								...CBR.extra,
								sliderParamToDetail: (sliderValue) => ({
									'cbr': 'true',
									'b:v': Math.round(62500 * Math.pow(2, +sliderValue)),
								}),
								paramNames: ['cbr', 'b:v'],
								defaultDetail: {
									'cbr': 'true',
									'b:v': 4000000,
								},
							},
						},
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "preset", display: "速度/质量",
							items: [ ...nvencPreset ],
						},
						{
							mode: "combo", parameter: "tune", display: "编码倾重",
							items: [ 默认, psnr, ssim, fastdecode, zerolatency ],
						},
						{
							mode: "combo", parameter: 'profile:v', display: "规格",
							items: [ 自动, baseline, main, high, high444p ],
						},
						{
							mode: "combo", parameter: "level", display: "级别",
							items: [ ...h264Level ],
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, nv12, p016le, yuv444p, p010le, yuv444p16le, bgr0, rgb0, cuda, d3d11 ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'h264_amf',
				label: 'h264_amf',
				tooltip: 'AMD 硬件加速编码器',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{
							...QP51,
							extra: {
								...QP51.extra,
								detailToSliderValue: (detail) => {
									const qp = detail['qp_i'] || detail['qp_p'] || detail['qp'];
									return Number.isFinite(+qp) ? 51 - qp : undefined;
								},
								sliderParamToDetail: (sliderValue) => ({
									'qp_i': 51 - sliderValue,
									'qp_p': 51 - sliderValue,
								}),
								paramNames: ['qp_i', 'qp_p'],
								defaultDetail: {
									'qp_i': 28,
									'qp_p': 28,
								},
							},
						},
						{
							...CBR,
							extra: {
								...CBR.extra,
								sliderParamToDetail: (sliderValue) => ({
									'rc': 'vbr',
									'b:v': Math.round(62500 * Math.pow(2, +sliderValue)),
								}),
								paramNames: ['rc', 'b:v'],
								defaultDetail: {
									'rc': 'vbr',
									'b:v': 4000000,
								},
							},
						},
						{ ...ABR },
					],
					parameters: [
						{
							mode: "slider", parameter: "preset", display: "速度/质量",
							max: 2,
							tags: new Map([
								[0, 'speed'],
								[1, 'balanced'],
								[2, 'quality'],
							]),
							sliderMode: 'string',
							default: 'balanced',
							valueToParam: (value) => value,
						},
						{
							mode: "combo", parameter: "tune", display: "编码倾重",
							items: [
								{
									type: 'normal',
									value: 'transcoding',
									label: 'transcoding（默认）',
									tooltip: '转码',
								},
								{
									type: 'normal',
									value: 'ultralowlatency',
									label: 'ultralowlatency',
									tooltip: '超低延迟',
								},
								{
									type: 'normal',
									value: 'webcam',
									label: 'webcam',
									tooltip: '网络摄像头',
								},
							],
						},
						{
							mode: "combo", parameter: 'profile:v', display: "规格",
							items: [ 自动, main, high, constrained_baseline, constrained_high ],
						},
						{
							mode: "combo", parameter: "level", display: "级别",
							items: [ ...h264Level ],
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, nv12, d3d11, dxva2_vld ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'h264_videotoolbox',
				label: 'h264_videotoolbox',
				tooltip: '苹果硬件加速编码器',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: 'profile:v', display: "规格",
							items: [ 自动, baseline, main, main10, extended ],
						},
						{
							mode: "combo", parameter: "level", display: "级别",
							items: [ ...h264Level ],
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, videotoolbox_vld, nv12, yuv420p ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'MPEG-4 Part 2',
		tooltip: '一种由动态图像专家组 (MPEG) 委员会开发的，基于 H.263 扩展而来的视频编码标准。\n它是互联网视频从物理介质走向网络传播时代的第一代成功编码。较流行的实现包括 Microsoft MPEG-4、DivX、XviD、Nero Digital、ffmpeg 等。\n\n- 发布日期：1999-12',
		subMenu: [
			{
				type: 'normal',
				value: 'mpeg4',
				label: '【默认】mpeg4',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{
							...Q100,
							extra: {
								...Q100.extra,
								min: 0,
								max: 31,
								tags: new Map([
									[31, '0（最高画质）'],
									[30, '1（高画质）'],
									[28, '3（良画质）'],
									[25, '6（一般画质）'],
									[21, '10（低画质）'],
									[0, '（最低为 10000）'],
								]),
								detailToSliderValue: (detail) => {
									const q = detail['q'];
									return Number.isFinite(+q) ? 31 - q : undefined;
								},
								valueToParam: (value) => 31 - +value + '',
								sliderParamToDetail: (sliderValue) => ({
									'q': 31 - sliderValue,
								}),
								paramNames: ['q'],
								defaultDetail: {
									'q': 10,
								},
							},
						},
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'msmpeg4',
				label: 'msmpeg4v3',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'msmpeg4v2',
				label: 'msmpeg4v2',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'libxvid',
				label: 'libxvid',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'H.263',
		tooltip: '一种由 ITU-T（国际电信联盟电信标准化部门）发布的，用于流媒体和视频通话的视频压缩编码，也常见于早期手机的 3GP 视频中。\nH.263 支持 4 种分辨率：SQCIF、QCIF、CIF、4CIF、16CIF。另有 H.263+ 和 H.263++ 两种新版本。\n\n- H.263 发布日期：1996-03-20\n- H.263p 发布日期：1998 年',
		subMenu: [
			{
				type: 'normal',
				value: 'h263',
				label: 'h263',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'h263p',
				label: 'h263p',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'H.262 · MPEG-2 Part 2',
		tooltip: '一种由 ITU-T 和 MPEG 联合制定的视频编码，是 MPEG-1 Video 的继任者，被广泛应用在无线数字电视广播和 DVD 视频中。\n\n- 发布日期：1995 年',
		subMenu: [
			{
				type: 'normal',
				value: 'mpeg2video',
				label: '【默认】mpeg2video',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, yuv422p ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'mpeg2_qsv',
				label: 'mpeg2_qsv',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "slider", parameter: "preset", display: "速度/质量",
							...qsvPresetSlider,
						},
						{
							mode: "combo", parameter: 'profile:v', display: '规格',
							items: [ 自动, main, main10, mainsp ],
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, nv12, qsv ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'MPEG-1',
		tooltip: '一种由动态图像专家组 (MPEG) 委员会开发的，基于 H.261 技术派生而来的视频编码标准。这项视频技术被应用在 VCD 中。\n\n- 发布日期：1991-12-06',
		subMenu: [
			{
				type: 'normal',
				value: 'mpeg1video',
				label: '【默认】mpeg1video',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, yuv422p ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'H.261',
		tooltip: '一种由 ITU-T（国际电信联盟电信标准化部门）发布的首个视频压缩编码，用于 ISDN 网络视频通话。\n其前身是 1984 年制定的 H.120，但由于性能太差，它并未得到实际应用。\n\n- 发布日期：1990 年\n\n该标准支持两种视频帧尺寸：CIF 和 QCIF',
		subMenu: [
			{
				type: 'normal',
				value: 'h261',
				label: '【默认】h261',
				tooltip: '',
				extra: {
					rateControl: [],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p ],
						},
					],
				},
			},
		],
	},
];

const builtInVpAvVcodecs: MenuItem<VCodecDetail>[] = [
	{
		type: 'submenu',
		label: 'AV1',
		tooltip: 'AOMedia Video 1 是一种由 AOMedia 制定的开放的、免专利的、为网络流传输而设计的新一代视频编码，基于 VP9 与其他技术结合产生。\nAV1 是为取代需要专利费的 H.265 而生，压缩率一般比 H.265 略高，比 VP9 高约三分之一。得益于免专利费的特征，它较早就已受浏览器等平台支持。目前在硬件编解码器逐渐铺开的情况下逐渐普及。\n\n- 发布日期：2018-03-28\n\n另有使用相同压缩算法的图像文件格式：AVIF。',
		subMenu: [
			{
				type: 'normal',
				value: 'libsvtav1',
				label: 'libsvtav1',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{
							...CRF63,
							extra: {
								...CRF63.extra,
								tags: new Map([
									[0, '63（最低画质）'],
									[3, '60（低画质）'],	// VMAF 75.76
									[13, '50（一般画质）'],	// VMAF 85.51
									[27, '36（良画质）'],	// VMAF 92.56
									[41, '22（高画质）'],	// VMAF 96.44
									[62, '1（最高画质）'],
									[63, '0（自动）'],
								]),
								defaultDetail: {
									'crf': 27,
								},
							},
						},
						{ ...QP63 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, yuv420p10le ],
						},
						{
							mode: "slider", parameter: "preset", display: "速度/质量",
								max: 13,
								tags: new Map([
									[0, '13（低质量，快）'],
									[13, '0（高质量，慢）'],
								]),
								default: 6, // 13 - 7
								valueToDisplay: { type: 'revertInteger' },
								adsorption: 'int',
								valueToParam: (value) => {
									return 13 - Math.round(+value);
								},
						},
					],
				}
			},
			{
				type: 'normal',
				value: 'libaom-av1',
				label: '【默认】libaom-av1',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{
							...CRF63,
							extra: {
								...CRF63.extra,
								tags: new Map([
									[0, '63（最低画质）'],
									[5, '58（低画质）'],	// VMAF 77.28
									[15, '48（一般画质）'],	// VMAF 86.39
									[29, '34（良画质）'],	// VMAF 93.25
									[43, '20（高画质）'],	// VMAF 96.59
									[63, '0（最高画质）'],
								]),
								defaultDetail: {
									'crf': 29,
								},
							},
						},
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, yuv422p, yuv444p, gbrp, yuv420p10le, yuv422p10le, yuv444p10le, yuv420p12le, yuv422p12le, yuv444p12le, gbrp10le, gbrp12le, gray, gray10le, gbrp12le ],
						},
						{
							mode: "slider", parameter: "cpu-used", display: "速度/质量",
								max: 8,
								tags: new Map([
									[0, '8（低质量，快）'],
									[8, '0（高质量，慢）'],
								]),
								default: 0,
								valueToDisplay: { type: 'revertInteger' },
								adsorption: 'int',
								valueToParam: (value) => {
									return 8 - Math.round(+value);
								},
						},
					],
				}
			},
			{
				type: 'normal',
				value: 'av1_qsv',
				label: 'av1_qsv',
				tooltip: 'Intel 硬件加速编码器',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Qav1qsv },	// 255 以上的数值依然有效，但影响甚微
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, nv12, p010le, qsv ],
						},
						{
							mode: "slider", parameter: "preset", display: "速度/质量",
							...qsvPresetSlider,
						},
					],
				}
			},
		],
	},
	{
		type: 'submenu',
		label: 'VP9',
		tooltip: '一种由谷歌公司开发的免版税的视频编码格式，是 VP8 的继任者。\nVP9 是为与需要专利费的 H.265 竞争而生，因此在浏览器中很早就得到了支持。它的压缩效率介于 H.264 和 H.265 之间（通常更接近 H.264）。\n\n- 发布日期：2013-06-17\n\n通常与 WebM 格式与 Opus 音频搭配。',
		subMenu: [
			{
				type: 'normal',
				value: 'libvpx-vp9',
				label: '【默认】libvpx-vp9',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{
							...CRF63,
							extra: {
								...CRF63.extra,
								tags: new Map([
									[0, '63（最低画质）'],
									[9, '54（低画质）'],	// VMAF 77.41
									[19, '44（一般画质）'],	// VMAF 87.31
									[29, '34（良画质）'],	// VMAF 93.22
									[41, '22（高画质）'],	// VMAF 96.58
									[63, '0（有损最高画质）'],
								]),
								defaultDetail: {
									'crf': 29,
								},
							},
						},
						{ ...ABR },
					],
					parameters: [
						{
							mode: "slider", parameter: "quality", display: "速度/质量",
							max: 2,
							tags: new Map([
								[0, 'realtime'],
								[1, 'good'],
								[2, 'best'],
							]),
							sliderMode: 'string',
							default: 'good',
							valueToParam: (value) => value,
						},
						{
							mode: "slider", parameter: "speed", display: "速度/质量",
							max: 16,
							tags: new Map([
								[0, '16 (最快)'],
								[15, '1 (默认值)'],
								[16, '0 (最慢)'],
							]),
							sliderMode: 'number',
							default: 15,
							valueToParam: (value) => 16 - +value + '',
							adsorption: 'int',
							valueToDisplay: { type: 'revertInteger' },
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, yuv422p, yuv440p, yuv444p, yuv420p10le, yuv422p10le, yuv440p10le, yuv444p10le, yuv420p12le, yuv422p12le, yuv440p12le, yuv444p12le, gbrp, gbrp10le, gbrp12le ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'VP8',
		tooltip: '一种由谷歌公司开发的免版税的视频编码格式，由 On2 公司的 VP7 格式改进并收购而来。\n其目的是为了与 HTML5 共同取代 Adobe Flash 和 H.264，并取代 GIF。\n\n- 发布日期：2008-09-13\n\n通常与 WebM 格式与 Opus 音频搭配。\n另有使用相同压缩算法的图像文件格式：WebP。',
		subMenu: [
			{
				type: 'normal',
				value: 'libvpx',
				label: '【默认】libvpx',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...CRF63 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "slider", parameter: "quality", display: "速度/质量",
							max: 2,
							tags: new Map([
								[0, 'realtime'],
								[1, 'good'],
								[2, 'best'],
							]),
							sliderMode: 'string',
							default: 'good',
							valueToParam: (value) => value,
						},
						{
							mode: "slider", parameter: "speed", display: "速度/质量",
							max: 16,
							tags: new Map([
								[0, '16 (最快)'],
								[15, '1 (默认值)'],
								[16, '0 (最慢)'],
							]),
							sliderMode: 'number',
							default: 15,
							valueToParam: (value) => 16 - +value + '',
							adsorption: 'int',
							valueToDisplay: { type: 'revertInteger' },
						},
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, yuva420p ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'Theora',
		tooltip: '一种由 Xiph.Org 基金会开发的视频编码格式，源自 On2 公司的 VP3 格式经过开源后衍生而来。\n其目的是为了达成比 MPEG-4 Part 2 更好的编码效率。\n\n- 发布日期：2004-06-01\n\n通常与 OGG 容器或 Matroska 容器搭配。',
		subMenu: [
			{
				type: 'normal',
				value: 'libtheora',
				label: '【默认】libtheora',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{
							type: 'normal',
							value: 'Q',
							label: '指定质量 Q',
							tooltip: 'Q - 质量\n指定画质，具体值对应的画质由具体编码器决定。',
							extra: {
								min: 0,
								max: 10,
								tags: new Map([
									[0, '0 (最低画质)'],
									[10, '10 (最高画质)'],
								]),
								adsorption: 'int',
								detailToSliderValue: (detail) => {
									const q = detail['q'];
									return Number.isFinite(+q) ? q : undefined;
								},
								valueToDisplay: { type: 'integer' },
								valueToParam: (value) => +value + '',
								sliderParamToDetail: (sliderValue) => ({
									'q': sliderValue,
								}),
								paramNames: ['q'],
								defaultDetail: {
									'q': 5,
								},
							},
						},
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, yuv422p, yuv444p ],
						},
						{
							mode: "slider", parameter: "speed_level", display: "速度/质量",
							max: 4,
							tags: new Map([
								[0, '4 (最快)'],
								[4, '0 (最慢)'],
							]),
							sliderMode: 'number',
							default: 4,
							valueToParam: (value) => 4 - +value + '',
							adsorption: 'int',
							valueToDisplay: { type: 'revertInteger' },
						},
					],
				},
			},
		],
	},
];

const builtInVcVcodecs: MenuItem<VCodecDetail>[] = [
	{
		type: 'submenu',
		label: 'VC-5 (GoPro Cineform)',
		tooltip: 'CineForm 中间编解码器最初于 2002 年设计，用于电影或电视应用中使用高清或更高分辨率媒体的压缩数字中间片工作流程。CineForm 媒体最常封装在 AVI 或 MOV 文件类型中。所有压缩媒体类型均使用 FourCC 编码的 “CFHD” 格式。',
		subMenu: [
			{
				type: 'normal',
				value: 'cfhd',
				label: '【默认】cfhd',
				tooltip: '',
				extra: {
					rateControl: [],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv422p10le, gbrp12le ],
						},
						{
							mode: "slider", parameter: "quality", display: "画质",
							max: 12,
							tags: new Map([
								[0, 'low'],
								[1, 'low+'],
								[2, 'medium'],
								[3, 'medium+'],
								[4, 'high'],
								[5, 'high+'],
								[6, 'film1'],
								[7, 'film1+'],
								[8, 'film1.5'],
								[9, 'film2'],
								[10, 'film2+'],
								[11, 'film3'],
								[12, 'film3+'],
							]),
							sliderMode: 'string',
							default: 'film3+',
							valueToParam: (value) => value,
						}
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'VC-3 (Avid DNxHD)',
		tooltip: 'Avid DNxHD（“数字非线性可扩展高清”）是由 Avid 开发的一种有损高清视频后期制作编解码器，用于多代合成，可降低存储和带宽需求，它采用了 SMPTE VC-3 标准的初始版本。该标准的最新版本（2026）现已被 Avid DNxHR 编解码器采用，后者完全包含了 Avid DNxHD。DNxHD 数据通常存储在 MXF 容器中，但也可以存储在 QuickTime 容器中。',
		subMenu: [
			{
				type: 'normal',
				value: 'dnxhd',
				label: '【默认】dnxhd',
				tooltip: '',
				extra: {
					rateControl: [],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv422p, yuv422p10le, yuv444p10le, gbrp10le ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'VC-2 (Dirac)',
		tooltip: 'Dirac（以及 Dirac Pro，其子集已标准化为 SMPTE VC-2）是由 BBC 研究与开发部门开发的开放且免版税的 视频压缩格式、规范和软件视频编解码器。Dirac 旨在为超高清电视提供高质量的视频压缩，并与 H.264 等现有格式竞争。',
		subMenu: [
			{
				type: 'normal',
				value: 'dirac',
				label: '【默认】dirac',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuv420p, yuv422p, yuv444p, yuv420p10le, yuv422p10le, yuv444p10le, yuv420p12le, yuv422p12le, yuv444p12le ],
						},
					],
				},
			},
		],
	},
];

const builtInOtherVcodecs: MenuItem<VCodecDetail>[] = [
	{
		type: 'submenu',
		label: 'MJPEG',
		tooltip: 'MJPEG - MJPEG 即 Motion JPEG（Motion Joint Photographic Experts Group）是一种影像压缩格式，其中每一帧图像都分别使用 JPEG 编码。',
		subMenu: [
			{
				type: 'normal',
				value: 'mjpeg',
				label: '【默认】mjpeg',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{
							...Q100,
							extra: {
								...Q100.extra,
								min: 0,
								max: 31,
								tags: new Map([
									[29, '2（最高画质）'],
									[26, '5（良画质）'],
									[23, '8（一般画质）'],
									[13, '18（低画质）'],
									[0, '31（最低画质）'],
								]),
								detailToSliderValue: (detail) => {
									const q = detail['q'];
									return Number.isFinite(+q) ? 31 - q : undefined;
								},
								valueToParam: (value) => 31 - +value + '',
								sliderParamToDetail: (sliderValue) => ({
									'q': 31 - sliderValue,
								}),
								paramNames: ['q'],
								defaultDetail: {
									'q': 10,
								},
							},
						},
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuvj420p, yuvj422p, yuvj444p ],
						},
					],
				},
			},
			{
				type: 'normal',
				value: 'mjpeg_qsv',
				label: 'mjpeg_qsv',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, nv12, qsv ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'WMV2 (WMV v8)',
		tooltip: 'WMV2 - WMV（Windows Media Video）是微软公司开发的一组数字影片编解码格式的通称，它是 Windows Media 架构下的一部分。WMV2 即 Windows Media Video v8',
		subMenu: [
			{
				type: 'normal',
				value: 'wmv2',
				label: '【默认】wmv2',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuvj420p ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'WMV1 (WMV v7)',
		tooltip: 'WMV1 - WMV（Windows Media Video）是微软公司开发的一组数字影片编解码格式的通称，它是 Windows Media 架构下的一部分。WMV1 即 Windows Media Video v7',
		subMenu: [
			{
				type: 'normal',
				value: 'wmv1',
				label: '【默认】wmv1',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuvj420p ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'RV20',
		tooltip: 'RealVideo 2，是一种由 RealNetworks 于 1998 年开发的，基于 H.263 派生的视频编码器。',
		subMenu: [
			{
				type: 'normal',
				value: 'rv20',
				label: '【默认】rv20',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuvj420p ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'RV10',
		tooltip: 'RealVideo 1，是一种由 RealNetworks 于 1997 年开发的，基于 H.263 派生的视频编码器。',
		subMenu: [
			{
				type: 'normal',
				value: 'rv10',
				label: '【默认】rv10',
				tooltip: '',
				extra: {
					rateControl: [
						...AUTO_RATECONTROLs,
						{ ...Q100 },
						{ ...ABR },
					],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, yuvj420p ],
						},
					],
				},
			},
		],
	},
	{
		type: 'submenu',
		label: 'Microsoft Video 1',
		tooltip: 'Microsoft Video 1 是一种早期的有损视频压缩和解压缩算法（编解码器），于 1992 年 11 月随 Microsoft 的 Windows 视频软件 1.0 版本发布。',
		subMenu: [
			{
				type: 'normal',
				value: 'msvideo1',
				label: '【默认】msvideo1',
				tooltip: '',
				extra: {
					rateControl: [],
					parameters: [
						{
							mode: "combo", parameter: "pix_fmt", display: "像素格式",
							items: [ 自动, rgb555le ],
						},
					],
				},
			},
		],
	},
];

export const builtInVcodecs = [...builtInH26xMpegVcodecs, { type: 'separator' }, ...builtInVpAvVcodecs, { type: 'separator' }, ...builtInVcVcodecs, { type: 'separator' }, ...builtInOtherVcodecs];

export const allVcodecs: MenuItem<VCodecDetail>[] = [];

// https://zh.wikipedia.org/wiki/显示分辨率列表
export const resolution: MenuItem[] = [
	{ type: 'normal', label: '不改变', value: '不改变', tooltip: '不改变分辨率' },
	{ type: 'submenu', label: '横向 16:9', subMenu: [
		{ type: 'normal', label: '7680×4320', value: '7680x4320', tooltip: 'UHD 8K, 33.2M 像素' },
		{ type: 'normal', label: '5120×2880', value: '5120x2880', tooltip: '5K, 14.7M 像素' },
		{ type: 'normal', label: '3840×2160', value: '3840x2160', tooltip: 'UHD 4K, 8.3M 像素' },
		{ type: 'normal', label: '2560×1440', value: '2560x1440', tooltip: 'QHD 2K, 3.7M 像素' },
		{ type: 'normal', label: '1920×1080', value: '1920x1080', tooltip: 'FHD, 2.0M 像素' },
		{ type: 'normal', label: '1280×720', value: '1280x720', tooltip: 'HD, 921.6K 像素' },
		{ type: 'normal', label: '960×540', value: '960x540', tooltip: 'qHD, 518.4K 像素' },
		{ type: 'normal', label: '640×360', value: '640x360', tooltip: '230.4K 像素' },
	] },
	{ type: 'submenu', label: '纵向 9:16', subMenu: [
		{ type: 'normal', label: '4320×7680', value: '4320x7680', tooltip: 'UHD 8K, 33.2M 像素' },
		{ type: 'normal', label: '2880×5120', value: '2880x5120', tooltip: '5K, 14.7M 像素' },
		{ type: 'normal', label: '2160×3840', value: '2160x3840', tooltip: 'UHD 4K, 8.3M 像素' },
		{ type: 'normal', label: '1440×2560', value: '1440x2560', tooltip: 'QHD 2K, 3.7M 像素' },
		{ type: 'normal', label: '1080×1920', value: '1080x1920', tooltip: 'FHD, 2.0M 像素' },
		{ type: 'normal', label: '720×1280', value: '720x1280', tooltip: 'HD, 921.6K 像素' },
		{ type: 'normal', label: '540×960', value: '540x960', tooltip: 'qHD, 518.4K 像素' },
		{ type: 'normal', label: '360×640', value: '360x640', tooltip: '230.4K 像素' },
	] },
	{ type: 'submenu', label: '数字电影联盟标准', subMenu: [
		{ type: 'normal', label: '8192×4320', value: '8192x4320', tooltip: 'DCI 8K, 35.4M 像素' },
		{ type: 'normal', label: '4096×2160', value: '4096x2160', tooltip: 'DCI 4K, 8.8M 像素' },
		{ type: 'normal', label: '2048×1080', value: '2048x1080', tooltip: 'DCI 2K, 2.2M 像素' },
	] },
	{ type: 'submenu', label: '电脑显示标准', subMenu: [
		{ type: 'normal', label: '10240×4320', value: '10240x4320', tooltip: '(64:27), 44.2M 像素' },
		{ type: 'normal', label: '7680×4320', value: '7680x4320', tooltip: 'UHD 8K (16:9), 33.2M 像素' },
		{ type: 'normal', label: '6144×3456', value: '6144x3456', tooltip: '(16:9), 21.2M 像素' },
		{ type: 'normal', label: '5760×3240', value: '5760x3240', tooltip: '(16:9), 18.7M 像素' },
		{ type: 'normal', label: '5120×3200', value: '5120x3200', tooltip: 'WHXGA (8:5), 16.4M 像素' },
		{ type: 'normal', label: '4096×3072', value: '4096x3072', tooltip: '(4:3), 12.6M 像素' },
		{ type: 'normal', label: '5120×2880', value: '5120x2880', tooltip: '5K (16:9), 14.7M 像素' },
		{ type: 'normal', label: '3840×2560', value: '3840x2560', tooltip: '(3:2), 9.8M 像素' },
		{ type: 'normal', label: '3840×2400', value: '3840x2400', tooltip: 'WQUXGA (8:5), 9.2M 像素' },
		{ type: 'normal', label: '3200×2400', value: '3200x2400', tooltip: '(4:3), 7.7M 像素' },
		{ type: 'normal', label: '5120×2160', value: '5120x2160', tooltip: 'UW5K (64:27), 11.1M 像素' },
		{ type: 'normal', label: '3840×2160', value: '3840x2160', tooltip: 'UHD 4K (16:9), 8.3M 像素' },
		{ type: 'normal', label: '3240×2160', value: '3240x2160', tooltip: '(3:2), 7.0M 像素' },
		{ type: 'normal', label: '2880×2160', value: '2880x2160', tooltip: '(4:3), 6.2M 像素' },
		{ type: 'normal', label: '2880×1920', value: '2880x1920', tooltip: '(3:2), 5.5M 像素' },
		{ type: 'normal', label: '2560×1920', value: '2560x1920', tooltip: '(4:3), 4.9M 像素' },
		{ type: 'normal', label: '3200×1800', value: '3200x1800', tooltip: 'WQXGA+ (16:9), 5.8M 像素' },
		{ type: 'normal', label: '2560×1600', value: '2560x1600', tooltip: 'WQXGA (8:5), 4.1M 像素' },
		{ type: 'normal', label: '2400×1600', value: '2400x1600', tooltip: '(3:2), 3.8M 像素' },
		{ type: 'normal', label: '2048×1536', value: '2048x1536', tooltip: 'QXGA (4:3), 3.1M 像素' },
		{ type: 'normal', label: '5120×1440', value: '5120x1440', tooltip: 'UWQHD (32:9), 7.4M 像素' },
		{ type: 'normal', label: '3440×1440', value: '3440x1440', tooltip: 'UWQHD (43:18), 5.0M 像素' },
		{ type: 'normal', label: '2560×1440', value: '2560x1440', tooltip: 'QHD 2K (16:9), 3.7M 像素' },
		{ type: 'normal', label: '1920×1440', value: '1920x1440', tooltip: '(4:3), 2.8M 像素' },
		{ type: 'normal', label: '1920×1280', value: '1920x1280', tooltip: '(3:2), 2.5M 像素' },
		{ type: 'normal', label: '1920×1200', value: '1920x1200', tooltip: 'WUXGA (8:5), 2.3M 像素' },
		{ type: 'normal', label: '1600×1200', value: '1600x1200', tooltip: 'UXGA (4:3), 1.9M 像素' },
		{ type: 'normal', label: '2048×1152', value: '2048x1152', tooltip: 'QWXGA (16:9), 2.4M 像素' },
		{ type: 'normal', label: '1536×1152', value: '1536x1152', tooltip: '(4:3), 1.8M 像素' },
		{ type: 'normal', label: '3840×1080', value: '3840x1080', tooltip: '(32:9), 4.1M 像素' },
		{ type: 'normal', label: '2560×1080', value: '2560x1080', tooltip: 'UWFHD (64:27), 2.8M 像素' },
		{ type: 'normal', label: '2160×1080', value: '2160x1080', tooltip: '(2:1), 2.3M 像素' },
		{ type: 'normal', label: '1920×1080', value: '1920x1080', tooltip: 'FHD (16:9), 2.0M 像素' },
		{ type: 'normal', label: '1440×1080', value: '1440x1080', tooltip: '(4:3), 1.5M 像素' },
		{ type: 'normal', label: '1680×1050', value: '1680x1050', tooltip: 'WSXGA+ (3:2), 1.8M 像素' },
		{ type: 'normal', label: '1280×1024', value: '1280x1024', tooltip: 'SXGA (5:4), 1.3M 像素' },
		{ type: 'normal', label: '1440×960', value: '1440x960', tooltip: 'FWXGA+ (3:2), 1.4M 像素' },
		{ type: 'normal', label: '1280×960', value: '1280x960', tooltip: 'QVGA (4:3), 1.2M 像素' },
		{ type: 'normal', label: '1600×900', value: '1600x900', tooltip: 'HD+ (16:9), 1.4M 像素' },
		{ type: 'normal', label: '1440×900', value: '1440x900', tooltip: 'WXGA+ (8:5), 1.3M 像素' },
		{ type: 'normal', label: '1200×900', value: '1200x900', tooltip: '(4:3), 1.1M 像素' },
		{ type: 'normal', label: '1280×800', value: '1280x800', tooltip: 'WXGA (8:5), 1.0M 像素' },
		{ type: 'normal', label: '1366×768', value: '1366x768', tooltip: 'FWXGA, 1.0M 像素' },
		{ type: 'normal', label: '1152×768', value: '1152x768', tooltip: 'WXGA (3:2), 884.7K 像素' },
		{ type: 'normal', label: '1024×768', value: '1024x768', tooltip: 'XGA (4:3), 786.4K 像素' },
		{ type: 'normal', label: '1280×720', value: '1280x720', tooltip: 'HD (16:9), 921.6K 像素' },
		{ type: 'normal', label: '1152×720', value: '1152x720', tooltip: '(8:5), 829.4K 像素' },
		{ type: 'normal', label: '960×720', value: '960x720', tooltip: '(4:3), 691.2K 像素' },
		{ type: 'normal', label: '1024×640', value: '1024x640', tooltip: '(8:5), 655.4K 像素' },
		{ type: 'normal', label: '960×640', value: '960x640', tooltip: 'DVGA (3:2), 614.4K 像素' },
		{ type: 'normal', label: '800×600', value: '800x600', tooltip: 'SVGA (4:3), 480.0K 像素' },
		{ type: 'normal', label: '1024×576', value: '1024x576', tooltip: 'WSVGA (16:9), 589.8K 像素' },
		{ type: 'normal', label: '720×576', value: '720x576', tooltip: 'PAL, 414.7K 像素' },
		{ type: 'normal', label: '704×576', value: '704x576', tooltip: 'D1 (11:9), 405.5K 像素' },
		{ type: 'normal', label: '960×540', value: '960x540', tooltip: 'qHD (16:9), 518.4K 像素' },
		{ type: 'normal', label: '854×480', value: '854x480', tooltip: 'FWVGA (16:9), 409.9K 像素' },
		{ type: 'normal', label: '800×480', value: '800x480', tooltip: 'WVGA (5:3), 384.0K 像素' },
		{ type: 'normal', label: '720×480', value: '720x480', tooltip: 'NTSC (4:3), 345.6K 像素' },
		{ type: 'normal', label: '640×480', value: '640x480', tooltip: 'VGA (4:3), 307.2K 像素' },
		{ type: 'normal', label: '640×400', value: '640x400', tooltip: 'QCGA (8:5), 256.0K 像素' },
		{ type: 'normal', label: '480×360', value: '480x360', tooltip: '(4:3), 172.8K 像素' },
		{ type: 'normal', label: '480×320', value: '480x320', tooltip: 'HVGA (3:2), 153.6K 像素' },
		{ type: 'normal', label: '352×288', value: '352x288', tooltip: 'CIF (11:9), 101.3K 像素' },
		{ type: 'normal', label: '400×240', value: '400x240', tooltip: 'WqVGA (5:3), 96.0K 像素' },
		{ type: 'normal', label: '320×240', value: '320x240', tooltip: 'qVGA (4:3), 76.8K 像素' },
		{ type: 'normal', label: '320×200', value: '320x200', tooltip: 'CGA (8:5), 64.0K 像素' },
		{ type: 'normal', label: '240×160', value: '240x160', tooltip: 'HqVGA (3:2), 38.4K 像素' },
		{ type: 'normal', label: '176×144', value: '176x144', tooltip: 'qCIF (11:9), 25.3K 像素' },
		{ type: 'normal', label: '160×120', value: '160x120', tooltip: 'qqVGA (4:3), 19.2K 像素' },
	] },
];

export const framerate: MenuItem[] = [
	{ type: 'normal', label: '不改变', value: '不改变', tooltip: '按源平均帧率输出' },
	{ type: 'submenu', label: '常见帧率', subMenu: [
		{ type: 'normal', label: '1920', value: '1920', tooltip: '1920p' },
		{ type: 'normal', label: '960', value: '960', tooltip: '960p' },
		{ type: 'normal', label: '480', value: '480', tooltip: '480p' },
		{ type: 'normal', label: '240', value: '240', tooltip: '240p' },
		{ type: 'normal', label: '144', value: '144', tooltip: '144p' },
		{ type: 'normal', label: '120', value: '120', tooltip: '120p' },
		{ type: 'normal', label: '90', value: '90', tooltip: '90p' },
		{ type: 'normal', label: '75', value: '75', tooltip: '75p' },
		{ type: 'normal', label: '60', value: '60', tooltip: '60p（常见屏幕刷新率）' },
		{ type: 'normal', label: '50', value: '50', tooltip: '50p' },
		{ type: 'normal', label: '30', value: '30', tooltip: '30p' },
		{ type: 'normal', label: '25', value: '25', tooltip: '25p（PAL 帧频）' },
		{ type: 'normal', label: '24', value: '24', tooltip: '24p（常见电影制作标准）' },
		{ type: 'normal', label: '15', value: '15', tooltip: '15p' },
		{ type: 'normal', label: '12', value: '12', tooltip: '12p' },
		{ type: 'normal', label: '10', value: '10', tooltip: '卡成 PPT' },
		{ type: 'normal', label: '5', value: '5', tooltip: '卡成 WPS Presentation' },
		{ type: 'normal', label: '3', value: '3', tooltip: '三帧极致' },
		{ type: 'normal', label: '2', value: '2', tooltip: '二帧流畅' },
		{ type: 'normal', label: '1', value: '1', tooltip: '一帧能玩' },
	] },
	{ type: 'submenu', label: '隔行扫描', tooltip: '上场优先的隔行扫描\n注意 ffmpeg 将先处理帧率，再将每帧扩展为上下场，因此您无法使用此方法进行常规的逐行转隔行处理', subMenu: [
		{ type: 'normal', label: '60i', value: '60i', tooltip: '场频 60，帧频 30' },
		{ type: 'normal', label: '50i', value: '50i', tooltip: '场频 50，帧频 25' },
	] },
	{ type: 'submenu', label: '慎用帧率', tooltip: '', subMenu: [
		{ type: 'submenu', label: 'NTSC 邪教帧率', tooltip: '由美国国家电视标准委员会（NTSC）推出的相关帧率标准', subMenu: [
			{ type: 'submenu', label: '重要信息 1', tooltip: '在 NTSC 早期标准（1941）中，帧率为 30 帧/秒。\n在后来的标准（1953）中，色度信号的引入容易导致音频信号与视频信号发生串扰，故将帧率降低 0.1%，即降低到 29.97 帧/秒。\nwikipedia\nIn December 1953, the FCC unanimously approved what is now called the NTSC color television standard (later defined as RS-170a). The compatible color standard retained full backward compatibility with then-existing black-and-white television sets. Color information was added to the black-and-white image by introducing a color subcarrier of precisely 315/88 MHz (usually described as 3.579545 MHz±10 Hz). The precise frequency was chosen so that horizontal line-rate modulation components of the chrominance signal fall exactly in between the horizontal line-rate modulation components of the luminance signal, such that the chrominance signal could easily be filtered out of the luminance signal on new television sets, and that it would be minimally visible in existing televisions. Due to limitations of frequency divider circuits at the time the color standard was promulgated, the color subcarrier frequency was constructed as composite frequency assembled from small integers, in this case 5×7×9/(8×11) MHz. The horizontal line rate was reduced to approximately 15,734 lines per second (3.579545×2/455 MHz = 9/572 MHz) from 15,750 lines per second, and the frame rate was reduced to 30/1.001 ≈ 29.970 frames per second (the horizontal line rate divided by 525 lines/frame) from 30 frames per second. These changes amounted to 0.1 percent and were readily tolerated by then-existing television receivers.', subMenu: [
				{ type: 'submenu', label: '重要信息 2', tooltip: '该方案为旧时代工程师在对应时代受电气特性限制为黑白电视与彩色电视所实现的兼容性设计。\n请注意，使用 NTSC 标准的美国电台已于 2021-07-13 全数进行了切换，即不再有电台使用该标准。\n故除非有极其特殊的场合，均不应再大规模应用该帧率。', subMenu: [
					{ type: 'submenu', label: '重要信息 3', tooltip: '非整数倍的帧率在非线性编辑软件中往往容易产生问题，如跳帧或重复帧、素材偏移或无法对齐等。\n您使用了 FFBox，代表了您已使用数字形式进行多媒体信息的处理，无需按照模拟信号时代的标准处理素材。', subMenu: [
						{ type: 'submenu', label: '重要信息 4', tooltip: '如果您使用的是部分日本相机品牌（如索尼、佳能等）制造的微单相机，或部分中国相机品牌（如大疆），您可能会发现相机中仅有 29.97 帧/秒相关的选项，或者界面上显示为 30 帧/秒但实际摄录帧率为 29.97 帧/秒的情况。\n这种情况是厂商设计有误所致，往往会对后期素材的剪辑工作流造成严重影响。\n您可尝试联系厂商修复此问题，或自行编写相机操作系统刷入机身以解决此问题。', subMenu: [
							{ type: 'submenu', label: '重要信息 5', tooltip: '如果无法进行此操作，建议将素材先以某种方式处理成 30 帧/秒相关的倍数再进行后续操作。', subMenu: [
								{ type: 'submenu', label: '重要信息 6', tooltip: '如您已知悉上述重要提示，并执意要使用此类帧率，请选择。', subMenu: [
									{ type: 'normal', label: '29.97', value: '29.97', tooltip: '29.97p' },
									{ type: 'normal', label: '23.976', value: '23.976', tooltip: '23.976p' },
									{ type: 'normal', label: '59.94', value: '59.94', tooltip: '59.94p' },
									{ type: 'normal', label: '119.88', value: '119.88', tooltip: '119.88p' },
								] },
							] },
						] },
					] },
				] },
			] },
		] },
	] },
];

export function getVideoFFmpegParam(videoParams: OutputParams_video) {
	const ret = [];
	let strict2 = false;
	let flags = '';
	if (videoParams.vcodec === '禁用') {
		ret.push('-vn');
	} else if (videoParams.vcodec === 'copy') {
		ret.push('-vcodec');
		ret.push('copy');
	} else if (videoParams.vcodec && videoParams.vcodec !== '自动') {
		ret.push('-vcodec');
		ret.push(videoParams.vcodec);
		let vcodecItem = getMenuItemByValue(builtInVcodecs, videoParams.vcodec) as any;
		if (!vcodecItem) {
			vcodecItem = getMenuItemByValue(allVcodecs, videoParams.vcodec) as any;
		}
		const vcodecDetail = (vcodecItem?.extra) as VCodecDetail;
		if (vcodecDetail) {
			if (vcodecDetail.strict2) {
				strict2 = true;
			}
			if (!videoParams.detail) videoParams.detail = {};	// 这会改变 outputParams，但从类型定义上来说不应该会执行这一条，这里的处理是防范外部 API 调用不遵守规范
			for (const parameter of vcodecDetail.parameters || []) {
				if (parameter.optional && videoParams.detail[parameter.parameter] === undefined) {
					continue;
				}
				if (parameter.mode === 'combo') {
					if (videoParams.detail[parameter.parameter] && videoParams.detail[parameter.parameter] != '默认' && videoParams.detail[parameter.parameter] != '自动') {
						ret.push('-' + parameter.parameter);
						ret.push(videoParams.detail[parameter.parameter]);
					}
					// 检查参数项是否有 strict2 标记
					const item = parameter.items.find((item) => item.value === videoParams.detail[parameter.parameter]);
					if ((item as any)?.strict2) {
						strict2 = true;
					}
				} else if (parameter.mode == 'slider') {
					ret.push('-' + parameter.parameter);
					const floatValue = videoParams.detail[parameter.parameter];
					const value = parameter.valueToParam ? parameter.valueToParam(floatValue) : floatValue;
					ret.push(value);
				} else if (parameter.mode === 'switch') {
					if (videoParams.detail[parameter.parameter] !== undefined) {
						ret.push('-' + parameter.parameter);
						ret.push(videoParams.detail[parameter.parameter]);
					}
				} else if (parameter.mode === 'text') {
					if ([undefined, '', '默认', '自动'].indexOf(videoParams.detail[parameter.parameter]) === -1) {
						ret.push('-' + parameter.parameter);
						ret.push(videoParams.detail[parameter.parameter]);
					}
				}
			}
							// 调试用↓
							// ret.push('-threads')
							// ret.push('1')
							// 调试用↑
			// 完成编码器详细设定转 ffmpeg 参数后，检查 ratecontrol。如果此前没有指定参数，那么在此处指定
			const ratecontrolItem = (vcodecDetail.rateControl || []).find((item) => item.type === 'normal' && item.value === videoParams.ratecontrol) as any;
			if (ratecontrolItem) {
				const rc = ratecontrolItem.extra as RateControl;
				for (const paramName of rc.paramNames) {
					const defined = ret.some((param) => '-' + paramName === param);
					if (!defined) {
						ret.push('-' + paramName);
						ret.push(videoParams.detail[paramName]);
					}
				}
			}
			if (strict2) {
				ret.push('-strict');
				ret.push('-2');
			}
			if (flags) {
				ret.push('-flags:v');
				ret.push(flags);
			}
		}
	}
	// 设置通用参数
	if (videoParams.vcodec !== '禁用' && videoParams.vcodec !== 'copy') {
		if (videoParams.resolution && videoParams.resolution !== '不改变') {
			ret.push('-s');
			ret.push(videoParams.resolution);
		}
		if (videoParams.framerate && videoParams.framerate !== '不改变') {
			if (videoParams.framerate.includes('i') && videoParams.framerate.match(/^\d+(.\d+)?i?$/)) {
				const fieldrate = Number(videoParams.framerate.match(/^(\d+(.\d+)?)/)![0]);
				ret.push('-r');
				ret.push(fieldrate / 2);	
				flags += '+ilme+ildct';
			} else {
				ret.push('-r');
				ret.push(videoParams.framerate);
			}
		}
	}
	// 如果编码为自动，则不设置 vcodec 参数，返回空 Array
	if (videoParams.custom) {
		ret.push(...videoParams.custom.split(' '));
	}
	return ret;
}

// 获取 ratecontrol 方面的参数，主要是给 taskitem 用
export function getVideoRateControlParam(videoParams: OutputParams_video) {
	let ret = {
		mode: '-',
		value: '-'
	};
	if (!videoParams || videoParams.vcodec == '禁用' || videoParams.vcodec == 'copy' || videoParams.vcodec == '自动') {
		return ret;
	} else {
		const vcodecItem = getMenuItemByValue(builtInVcodecs, videoParams.vcodec) as any;
		const vcodecDetail = (vcodecItem?.extra) as VCodecDetail;
		if (!vcodecDetail || !vcodecDetail.rateControl?.length) {
			return ret;
		}
		const ratecontrolItem = vcodecDetail.rateControl.find((item) => {
			return item.type === 'normal' && item.value == videoParams.ratecontrol;
		}) as any;
		if (ratecontrolItem) {
			const rc = ratecontrolItem.extra as RateControl;
			const sliderValue = rc.detailToSliderValue(videoParams.detail);
			const displayValue = (() => {
				if (sliderValue === undefined) return '';

				const vtt = rc.valueToDisplay;
				if (vtt instanceof Function) return vtt(sliderValue);
				if (vtt?.type === 'bitrate') {
					const bps = Math.round((vtt.base ?? 0) * 2 ** sliderValue);
					return formatUtils.bitrate(bps, window.frontendSettings?.useIEC ?? false);
				}
				if (vtt?.type === 'revertInteger') return ((rc.max ?? 0) - sliderValue).toFixed(0);
				if (vtt?.type === 'integer') return sliderValue.toFixed(0);
				return sliderValue + '';
			})();
			ret = { mode: ratecontrolItem.value, value: displayValue };
		}
		return ret;
	}
}
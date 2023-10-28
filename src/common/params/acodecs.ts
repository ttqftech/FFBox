import { OutputParams_audio } from "../types";
import { strict2, MenuItem, NarrowedMenuItem, SliderOptions, Parameter, RateControl } from './types';

const VALUE = Symbol()

export interface AEncoder extends NarrowedMenuItem {
	codecName: string;	// 实际传给 ffmpeg 的编码器
	parameters?: Parameter[];
	ratecontrol?: RateControl[];
	strict2?: true;
}
export interface ACodec extends NarrowedMenuItem {
	codecName: string;
	encoders?: AEncoder[];
	strict2?: true;
}

const 自动: NarrowedMenuItem = {
	type: 'normal',
	value: '自动',
	label: '自动',
	tooltip: '自动',
}
const strict2 = {
	strict2: true as true,
}

// #region 预置码率控制模式 combo

const CBR_ABR: any = {
	type: 'normal',
	value: 'CBR/ABR',
	label: 'CBR/ABR',
	tooltip: '指定预期码率大小',
	cmd: ['-b:a', VALUE]
}
const Q: any = {
	type: 'normal',
	value: 'Q',
	label: 'Q',
	tooltip: '指定音频质量',
	cmd: ['-q:a', VALUE]
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

const abitrateSlider: SliderOptions = {
	step: 60,
	tags: new Map([
		[0.000, '8 Kbps'],
		[0.167, '16 Kbps'],
		[0.333, '32 Kbps'],
		[0.500, '64 Kbps'],
		[0.667, '128 Kbps'],
		[0.833, '256 Kbps'],
		[1.000, '512 Kbps']
	]),
	valueToText: function (value) {
		return Math.round(8 * Math.pow(2, value * 6)) + " kbps"
	},
	valueProcess: function (value) {
		return approximation(value,
				[0, 0.0975, 0.1667, 0.2642, 0.3333, 0.3870, 0.4308, 0.5, 0.5537, 0.5975, 0.6667, 0.7203, 0.7642, 0.8333, 0.8870, 0.9308, 1]);
			//	 8    12      16      24      32      40      48     64    80      96      128     160     192     256     320     384  512
	},
	valueToParam: function (value) {
		return Math.round(8 * Math.pow(2, value * 6)) + "k"
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

// #endregion

// #region 预置音频采样率

const sr_96000: NarrowedMenuItem = {
	type: 'normal',
	value: '96000',
	label: '96000 Hz',
	tooltip: '',
}

const sr_88200: NarrowedMenuItem = {
	type: 'normal',
	value: '88200',
	label: '88200 Hz',
	tooltip: '',
}

const sr_64000: NarrowedMenuItem = {
	type: 'normal',
	value: '64000',
	label: '64000 Hz',
	tooltip: '',
}

const sr_48000: NarrowedMenuItem = {
	type: 'normal',
	value: '48000',
	label: '48000 Hz',
	tooltip: '',
}

const sr_44100: NarrowedMenuItem = {
	type: 'normal',
	value: '44100',
	label: '44100 Hz',
	tooltip: '',
}

const sr_32000: NarrowedMenuItem = {
	type: 'normal',
	value: '32000',
	label: '32000 Hz',
	tooltip: '',
}

const sr_24000: NarrowedMenuItem = {
	type: 'normal',
	value: '24000',
	label: '24000 Hz',
	tooltip: '',
}

const sr_22050: NarrowedMenuItem = {
	type: 'normal',
	value: '22050',
	label: '22050 Hz',
	tooltip: '',
}

const sr_16000: NarrowedMenuItem = {
	type: 'normal',
	value: '16000',
	label: '16000 Hz',
	tooltip: '',
}

const sr_12000: NarrowedMenuItem = {
	type: 'normal',
	value: '12000',
	label: '12000 Hz',
	tooltip: '',
}

const sr_11025: NarrowedMenuItem = {
	type: 'normal',
	value: '11025',
	label: '11025 Hz',
	tooltip: '',
}

const sr_8000: NarrowedMenuItem = {
	type: 'normal',
	value: '8000',
	label: '8000 Hz',
	tooltip: '',
}

const sr_7350: NarrowedMenuItem = {
	type: 'normal',
	value: '7350',
	label: '7350 Hz',
	tooltip: '',
}

// #endregion

// #region 预置声道布局

const lo_mono: NarrowedMenuItem = {
	type: 'normal',
	value: 'mono',
	label: 'mono',
	tooltip: '单声道<br />FC',
}

const lo_stereo: NarrowedMenuItem = {
	type: 'normal',
	value: 'stereo',
	label: 'stereo',
	tooltip: '立体声<br />FL+FR',
}

const lo_2_1: NarrowedMenuItem = {
	type: 'normal',
	value: '2.1',
	label: '2.1',
	tooltip: '左右前置 + 重低音<br />FL+FR+LFE',
}

const lo_3_0: NarrowedMenuItem = {
	type: 'normal',
	value: '3.0',
	label: '3.0',
	tooltip: '左右前置 + 前中置<br />FL+FR+FC',
}

const lo_3_0_back: NarrowedMenuItem = {
	type: 'normal',
	value: '3.0(back)',
	label: '3.0(back)',
	tooltip: '左右前置 + 后中置<br />FL+FR+BC',
}

const lo_4_0: NarrowedMenuItem = {
	type: 'normal',
	value: '4.0',
	label: '4.0',
	tooltip: '左右前置 + 前后中置<br />FL+FR+FC+BC',
}

const lo_quad: NarrowedMenuItem = {
	type: 'normal',
	value: 'quad',
	label: 'quad',
	tooltip: '左右前置 + 左右后置<br />FL+FR+BL+BR',
}

const lo_quad_side: NarrowedMenuItem = {
	type: 'normal',
	value: 'quad(side)',
	label: 'quad(side)',
	tooltip: '左右前置 + 左右侧置<br />FL+FR+SL+SR',
}

const lo_3_1: NarrowedMenuItem = {
	type: 'normal',
	value: '3.1',
	label: '3.1',
	tooltip: '左中右前置 + 重低音<br />FL+FR+FC+LFE',
}

const lo_5_0: NarrowedMenuItem = {
	type: 'normal',
	value: '5.0',
	label: '5.0',
	tooltip: '左中右前置 + 左右后置<br />FL+FR+FC+BL+BR',
}

const lo_5_0_side: NarrowedMenuItem = {
	type: 'normal',
	value: '5.0(side)',
	label: '5.0(side)',
	tooltip: '左中右前置 + 左右侧置<br />FL+FR+FC+SL+SR',
}

const lo_4_1: NarrowedMenuItem = {
	type: 'normal',
	value: '4.1',
	label: '4.1',
	tooltip: '左右前置 + 前后中置 + 重低音<br />FL+FR+FC+LFE+BC',
}

const lo_5_1: NarrowedMenuItem = {
	type: 'normal',
	value: '5.1',
	label: '5.1',
	tooltip: '左中右前置 + 左右后置 + 重低音<br />FL+FR+FC+LFE+BL+BR',
}

const lo_5_1_side: NarrowedMenuItem = {
	type: 'normal',
	value: '5.1(side)',
	label: '5.1(side)',
	tooltip: '左中右前置 + 左右侧置 + 重低音<br />FL+FR+FC+LFE+SL+SR',
}

const lo_6_0: NarrowedMenuItem = {
	type: 'normal',
	value: '6.0',
	label: '6.0',
	tooltip: '左右前置 + 前后中置 + 左右侧置<br />FL+FR+FC+BC+SL+SR',
}

const lo_6_0_front: NarrowedMenuItem = {
	type: 'normal',
	value: '6.0(front)',
	label: '6.0(front)',
	tooltip: 'FL+FR+FLC+FRC+SL+SR',
}

const lo_hexagonal: NarrowedMenuItem = {
	type: 'normal',
	value: 'hexagonal',
	label: 'hexagonal',
	tooltip: '左中右前置 + 左中右后置<br />FL+FR+FC+BL+BR+BC',
}

const lo_6_1: NarrowedMenuItem = {
	type: 'normal',
	value: '6.1',
	label: '6.1',
	tooltip: '左右前置 + 前后中置 + 左右侧置 + 重低音<br />FL+FR+FC+LFE+BC+SL+SR',
}

const lo_6_1_back: NarrowedMenuItem = {
	type: 'normal',
	value: '6.1(back)',
	label: '6.1(back)',
	tooltip: '左中右前置 + 左中右后置 + 重低音<br />FL+FR+FC+LFE+BL+BR+BC',
}

const lo_6_1_front: NarrowedMenuItem = {
	type: 'normal',
	value: '6.1(front)',
	label: '6.1(front)',
	tooltip: 'FL+FR+LF+FLC+FRC+SL+SR',
}

const lo_7_0: NarrowedMenuItem = {
	type: 'normal',
	value: '7.0',
	label: '7.0',
	tooltip: '左中右前置 + 左右后置 + 左右侧置<br />FL+FR+FC+BL+BR+SL+SR',
}

const lo_7_0_front: NarrowedMenuItem = {
	type: 'normal',
	value: '7.0(front)',
	label: '7.0(front)',
	tooltip: 'FL+FR+FC+FLC+FRC+SL+SR',
}

const lo_7_1: NarrowedMenuItem = {
	type: 'normal',
	value: '7.1',
	label: '7.1',
	tooltip: '左中右前置 + 左右后置 + 左右侧置 + 重低音<br />FL+FR+FC+LFE+BL+BR+SL+SR',
}

const lo_7_1_wide: NarrowedMenuItem = {
	type: 'normal',
	value: '7.1(wide)',
	label: '7.1(wide)',
	tooltip: 'FL+FR+FC+LFE+BL+BR+FLC+FRC',
}

const lo_7_1_wide_side: NarrowedMenuItem = {
	type: 'normal',
	value: '7.1(wide-side)',
	label: '7.1(wide-side)',
	tooltip: 'FL+FR+FC+LFE+FLC+FRC+SL+SR',
}

const lo_octagonal: NarrowedMenuItem = {
	type: 'normal',
	value: 'octagonal',
	label: 'octagonal',
	tooltip: '左中右前置 + 左中右后置 + 左右侧置<br />FL+FR+FC+BL+BR+BC+SL+SR',
}

const lo_hexadecagonal: NarrowedMenuItem = {
	type: 'normal',
	value: 'hexadecagonal',
	label: 'hexadecagonal',
	tooltip: '这个就很牛逼了<br />FL+FR+FC+BL+BR+BC+SL+SR+TFL+TFC+TFR+TBL+TBC+TBR+WL+WR',
}

const lo_downmix: NarrowedMenuItem = {
	type: 'normal',
	value: 'downmix',
	label: 'downmix',
	tooltip: 'DL+DR',
}

// #endregion

const volSlider: SliderOptions = {
	step: 96,
	tags: new Map([
		[0.000, '-48 dB'],
		[0.125, '-36 dB'],
		[0.250, '-24 dB'],
		[0.375, '-12 dB'],
		[0.500, '0 dB'],
		[0.625, '+12 dB'],
		[0.750, '+24 dB'],
		[0.875, '+36 dB'],
		[1.000, '+48 dB'],
	]),
	valueToText: function (value) {
		value *= 96
		if (value > 48) {
			return '+ ' + (value - 48) + ' dB'
		} else {
			return (value - 48) + ' dB'
		}
	},
	valueProcess: function (value) {
		value = Math.round(value * 96) / 96
		return approximation(value,
				[0.000, 0.125, 0.250, 0.375, 0.500, 0.625, 0.750, 0.875, 1.000]);
	},
	valueToParam: function (value) {
		value = value * 96 - 48
		return Math.round(256 * Math.pow(10, (value) / 20))
	}
}


const 默认编码器: AEncoder = {
	type: 'normal',
	value: '默认',
	label: '默认',
	tooltip: '使用默认编码器',
	codecName: '-',
}

var acodecs: ACodec[] = [
	{
		type: 'normal',
		value: '禁用音频',
		label: '禁用音频',
		tooltip: '不输出音频',
		codecName: '-',
		encoders: [
			默认编码器
		],
	},
	{
		type: 'normal',
		value: '不重新编码',
		label: '不重新编码',
		tooltip: '复制源码流，不重新编码。',
		codecName: 'copy',
		encoders: [
			默认编码器
		],
	},
	{
		type: 'normal',
		value: '自动',
		label: '自动',
		tooltip: '自动选择编码',
		codecName: '-',
		encoders: [
			默认编码器
		],
	},
	{
		type: 'normal',
		value: 'OPUS',
		label: 'OPUS',
		tooltip: 'OPUS - Opus 是一个有损声音编码的格式，由 Xiph.Org 基金会开发，之后由互联网工程任务组进行标准化，目标是希望用单一格式包含声音和语音，取代 Speex 和 Vorbis，且适用于网络上低延迟的即时声音传输，标准格式定义于 RFC 6716 文件。Opus 格式是一个开放格式，使用上没有任何专利或限制。',
		codecName: 'opus',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "ar", display: "采样频率",
						items: [ 自动, sr_48000 ]
					},
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [ 自动, lo_mono, lo_stereo ]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				type: 'normal',
				value: 'opus',
				label: 'opus',
				tooltip: '',
				codecName: 'opus',
				parameters: [
					{
						mode: "combo", parameter: "ar", display: "采样频率",
						items: [ 自动, sr_48000 ]
					},
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [ 自动, lo_mono, lo_stereo ]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				type: 'normal',
				value: 'libopus',
				label: 'libopus',
				tooltip: '',
				codecName: 'libopus',
				parameters: [
					{
						mode: "combo", parameter: "ar", display: "采样频率",
						items: [ 自动, sr_48000, sr_24000, sr_16000, sr_12000, sr_8000 ]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
		],
		...strict2
	},
	{
		type: 'normal',
		value: 'AAC',
		label: 'AAC',
		tooltip: 'AAC - AAC 即 Advanced Audio Coding，高级音频编码，出现于 1997 年，为一种基于 MPEG-2 的有损数字音频压缩的专利音频编码标准，由 Fraunhofer IIS、杜比实验室、AT&T、Sony、Nokia 等公司共同开发。2000 年，MPEG-4 标准在原本的基础上加上了 PNS（Perceptual Noise Substitution）等技术，并提供了多种扩展工具。为了区别于传统的MPEG-2 AAC 又称为 MPEG-4 AAC。其作为 MP3 的后继者而被设计出来，在相同的比特率之下，AAC 相较于 MP3 通常可以达到更好的声音质量。',
		codecName: 'aac',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "ar", display: "采样频率",
						items: [ 自动, sr_96000, sr_88200, sr_64000, sr_48000, sr_44100, sr_32000, sr_24000, sr_22050, sr_16000, sr_12000, sr_11025, sr_8000, sr_7350 ]
					},
					{
						mode: "combo", parameter: "aac_coder", display: "编码算法",
						items: [
							自动,
							{
								type: 'normal',
								value: 'anmr',
								label: 'anmr',
								tooltip: 'ANMR method',
								...strict2
							},
							{
								type: 'normal',
								value: 'twoloop',
								label: 'twoloop',
								tooltip: 'Two loop searching method',
							},
							{
								type: 'normal',
								value: 'fast',
								label: 'fast（默认）',
								tooltip: 'Default fast search',
							},
						]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
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
		type: 'normal',
		value: 'Vorbis',
		label: 'Vorbis (OGG)',
		tooltip: 'Vorbis - Vorbis 是一种有损音频压缩格式，由 Xiph.Org 基金会所领导并开放源代码的一个免费的开源软件项目。该项目为有损音频压缩产生音频编码格式和软件参考编码器╱解码器（编解码器）。Vorbis 通常以 Ogg 作为容器格式，所以常合称为 Ogg Vorbis。',
		codecName: 'vorbis',
		encoders: [
			{
				...默认编码器,
				parameters: [],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				type: 'normal',
				value: 'vorbis',
				label: 'vorbis',
				tooltip: '',
				codecName: 'vorbis',
				parameters: [],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				type: 'normal',
				value: 'libvorbis',
				label: 'libvorbis',
				tooltip: '',
				codecName: 'libvorbis',
				parameters: [],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
		],
		...strict2
	},
	{
		type: 'normal',
		value: 'MP3',
		label: 'MP3',
		tooltip: 'MP3 - MP3 即 MPEG-1 Audio Layer Ⅲ，是当今流行的一种数字音频编码和有损压缩格式，它被设计来大幅降低音频数据量，通过舍弃 PCM 音频数据中对人类听觉不重要的部分，达成压缩成较小文件的目的。而对于大多数用户的听觉感受来说，MP3 的音质与最初的不压缩音频相比没有明显的下降。',
		codecName: 'MP3',
		encoders: [
			{
				...默认编码器,
				parameters: [],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				type: 'normal',
				value: 'libmp3lame',
				label: 'libmp3lame',
				tooltip: '',
				codecName: 'libmp3lame',
				parameters: [
					{
						mode: "combo", parameter: "ar", display: "采样频率",
						items: [ 自动, sr_48000, sr_44100, sr_32000, sr_24000, sr_22050, sr_16000, sr_12000, sr_11025, sr_8000 ]
					},
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [ 自动, lo_mono, lo_stereo ]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				type: 'normal',
				value: 'libshine',
				label: 'libshine',
				tooltip: '',
				codecName: 'libshine',
				parameters: [
					{
						mode: "combo", parameter: "ar", display: "采样频率",
						items: [ 自动, sr_48000, sr_44100, sr_32000 ]
					},
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [ 自动, lo_mono, lo_stereo ]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
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
		type: 'normal',
		value: 'MP2',
		label: 'MP2',
		tooltip: 'MP3 - MP3 即 MPEG-1 Audio Layer Ⅱ。个人电脑和互联网音乐流行 MP3，MP2 则多用于广播。',
		codecName: 'mp2',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "ar", display: "采样频率",
						items: [ 自动, sr_48000, sr_44100, sr_32000, sr_24000, sr_22050, sr_16000 ]
					},
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [ 自动, lo_mono, lo_stereo ]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				type: 'normal',
				value: 'mp2',
				label: 'mp2',
				tooltip: '',
				codecName: 'mp2',
				parameters: [
					{
						mode: "combo", parameter: "ar", display: "采样频率",
						items: [ 自动, sr_48000, sr_44100, sr_32000, sr_24000, sr_22050, sr_16000 ]
					},
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [ 自动, lo_mono, lo_stereo ]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				type: 'normal',
				value: 'mp2fixed',
				label: 'mp2fixed',
				tooltip: '',
				codecName: 'mp2fixed',
				parameters: [
					{
						mode: "combo", parameter: "ar", display: "采样频率",
						items: [ 自动, sr_48000, sr_44100, sr_32000, sr_24000, sr_22050, sr_16000 ]
					},
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [ 自动, lo_mono, lo_stereo ]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				type: 'normal',
				value: 'libtwolame',
				label: 'libtwolame',
				tooltip: '',
				codecName: 'libtwolame',
				parameters: [
					{
						mode: "combo", parameter: "ar", display: "采样频率",
						items: [ 自动, sr_48000, sr_44100, sr_32000, sr_24000, sr_22050, sr_16000 ]
					},
					{
						mode: "combo", parameter: "mode", display: "声道模式",
						items: [
							自动,
							{
								type: 'normal',
								value: 'stereo',
								label: 'stereo',
								tooltip: '立体声',
							},
							{
								type: 'normal',
								value: 'joint_stereo',
								label: 'joint_stereo',
								tooltip: '联合立体声',
							},
							{
								type: 'normal',
								value: 'dual_channel',
								label: 'dual_channel',
								tooltip: '双声道',
							},
							{
								type: 'normal',
								value: 'mono',
								label: 'mono',
								tooltip: '单声道',
							},
						]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
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
		type: 'normal',
		value: 'AC3',
		label: 'AC3',
		tooltip: 'AC3 - AC3 即杜比数字音频编码。杜比数字（Dolby Digital）是美国杜比实验室开发的一系列有损和无损的多媒体单元格式。',
		codecName: 'ac3',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [
							自动, lo_mono, lo_stereo, lo_3_0_back, lo_3_0, lo_quad_side, lo_quad, lo_4_0, lo_5_0_side, lo_5_0, lo_2_1, lo_3_1, lo_4_1, lo_5_1_side, lo_5_1,
							{
								type: 'normal',
								value: 'FC+LFE',
								label: 'FC+LFE',
								tooltip: '',
							},
							{
								type: 'normal',
								value: 'FL+FR+LFE+BC',
								label: 'FL+FR+LFE+BC',
								tooltip: '',
							},
							{
								type: 'normal',
								value: 'FL+FR+LFE+SL+SR',
								label: 'FL+FR+LFE+SL+SR',
								tooltip: '',
							},
							{
								type: 'normal',
								value: 'FL+FR+LFE+BL+BR',
								label: 'FL+FR+LFE+BL+BR',
								tooltip: '',
							},
						]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				type: 'normal',
				value: 'ac3',
				label: 'ac3',
				tooltip: '',
				codecName: 'ac3',
				parameters: [
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [
							自动, lo_mono, lo_stereo, lo_3_0_back, lo_3_0, lo_quad_side, lo_quad, lo_4_0, lo_5_0_side, lo_5_0, lo_2_1, lo_3_1, lo_4_1, lo_5_1_side, lo_5_1,
							{
								type: 'normal',
								value: 'FC+LFE',
								label: 'FC+LFE',
								tooltip: '',
							},
							{
								type: 'normal',
								value: 'FL+FR+LFE+BC',
								label: 'FL+FR+LFE+BC',
								tooltip: '',
							},
							{
								type: 'normal',
								value: 'FL+FR+LFE+SL+SR',
								label: 'FL+FR+LFE+SL+SR',
								tooltip: '',
							},
							{
								type: 'normal',
								value: 'FL+FR+LFE+BL+BR',
								label: 'FL+FR+LFE+BL+BR',
								tooltip: '',
							},
						]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				type: 'normal',
				value: 'ac3_fixed',
				label: 'ac3_fixed',
				tooltip: '',
				codecName: 'ac3_fixed',
				parameters: [
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [
							自动, lo_mono, lo_stereo, lo_3_0_back, lo_3_0, lo_quad_side, lo_quad, lo_4_0, lo_5_0_side, lo_5_0, lo_2_1, lo_3_1, lo_4_1, lo_5_1_side, lo_5_1,
							{
								type: 'normal',
								value: 'FC+LFE',
								label: 'FC+LFE',
								tooltip: '',
							},
							{
								type: 'normal',
								value: 'FL+FR+LFE+BC',
								label: 'FL+FR+LFE+BC',
								tooltip: '',
							},
							{
								type: 'normal',
								value: 'FL+FR+LFE+SL+SR',
								label: 'FL+FR+LFE+SL+SR',
								tooltip: '',
							},
							{
								type: 'normal',
								value: 'FL+FR+LFE+BL+BR',
								label: 'FL+FR+LFE+BL+BR',
								tooltip: '',
							},
						]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
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
		type: 'normal',
		value: 'FLAC',
		label: 'FLAC',
		tooltip: 'FLAC - FLAC 即 Free Lossless Audio Codec，FLAC 是一款的自由音频压缩编码，其特点是可以对音频文件无损压缩。',
		codecName: 'flac',
		encoders: [
			{
				...默认编码器,
				parameters: [],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
		],
		...strict2
	},
	{
		type: 'normal',
		value: 'ALAC',
		label: 'ALAC',
		tooltip: 'ALAC - ALAC 即 Apple Lossless Audio Codec，为苹果的无损音频压缩编码格式，可将非压缩音频格式（WAV、AIFF）压缩至原先容量的 40% 至 60% 左右。',
		codecName: 'alac',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [ 自动, lo_mono, lo_stereo, lo_3_0, lo_4_0, lo_5_0, lo_5_1, lo_6_1_back, lo_7_1_wide ]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			}
		],
		...strict2
	},
	{
		type: 'normal',
		value: 'WMA V2',
		label: 'WMA V2',
		tooltip: 'WMA 2 - WMA 是微软公司开发的一系列音频编解码器。WMA Pro 支持更多声道和更高质量的音频。',
		codecName: 'wmav2',
		encoders: [
			{
				...默认编码器,
				parameters: [],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
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
		type: 'normal',
		value: 'WMA V1',
		label: 'WMA V1',
		tooltip: 'WMA 1 - WMA 是微软公司开发的一系列音频编解码器。WMA Pro 支持更多声道和更高质量的音频。',
		codecName: 'wmav1',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [ 自动, lo_mono, lo_stereo, lo_3_0, lo_4_0, lo_5_0, lo_5_1, lo_6_1_back, lo_7_1_wide ]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
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
		type: 'normal',
		value: 'DTS',
		label: 'DTS',
		tooltip: 'DTS - DTS 即 Digital Theater Systems，数字影院系统，由 DTS 公司（DTS Inc.，NASDAQ：DTSI）开发，为多声道音频格式中的一种，广泛应用于 DVD 音效上。其最普遍的格式为 5.1 声道。',
		codecName: 'dts',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "ar", display: "采样频率",
						items: [ 自动, sr_48000, sr_44100, sr_32000, sr_24000, sr_22050, sr_16000, sr_12000, sr_11025, sr_8000 ]
					},
							{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [ 自动, lo_mono, lo_stereo, lo_quad_side, lo_5_0_side, lo_5_1_side ]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				type: 'normal',
				value: 'dca',
				label: 'dca',
				tooltip: '',
				codecName: 'dca',
				parameters: [
					{
						mode: "combo", parameter: "ar", display: "采样频率",
						items: [ 自动, sr_48000, sr_44100, sr_32000, sr_24000, sr_22050, sr_16000, sr_12000, sr_11025, sr_8000 ]
					},
							{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [ 自动, lo_mono, lo_stereo, lo_quad_side, lo_5_0_side, lo_5_1_side ]
					},
				],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
		],
		...strict2
	},
	{
		type: 'normal',
		value: 'AMR WB',
		label: 'AMR WB',
		tooltip: 'AMR - AMR 即 Adaptive multi-Rate compression，自适应多速率音频压缩，是一个使语音编码最优化的专利。AMR 被标准语音编码 3GPP 在 1998 年 10 月选用，现在广泛在 GSM 和 UMTS 中使用。',
		codecName: 'amr_wb',
		encoders: [
			{
				...默认编码器,
				parameters: [],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
			{
				type: 'normal',
				value: 'libvo_armwbenc',
				label: 'libvo_armwbenc',
				tooltip: '',
				codecName: 'libvo_armwbenc',		
				parameters: [],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
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
		type: 'normal',
		value: 'AMR NB',
		label: 'AMR NB',
		tooltip: 'AMR - AMR 即 Adaptive multi-Rate compression，自适应多速率音频压缩，是一个使语音编码最优化的专利。AMR 被标准语音编码 3GPP 在 1998 年 10 月选用，现在广泛在 GSM 和 UMTS 中使用。',
		codecName: 'amr_nb',
		encoders: [
			{
				...默认编码器,
			},
			{
				type: 'normal',
				value: 'libopencore_armnb',
				label: 'libopencore_armnb',
				tooltip: '',
				codecName: 'libopencore_armnb',		
				parameters: [],
				ratecontrol: [
					{
						...CBR_ABR,
						...abitrateSlider
					},
					{
						...Q,
						...q100slider
					},
				]
			},
		]
	},
]


const generator = {
	getAudioParam: function (audioParams: OutputParams_audio) {
		const ret = [];
		let strict2 = false;
		if (audioParams.acodec == '禁用音频') {
			ret.push('-an');
		} else if (audioParams.acodec == '不重新编码') {
			ret.push('-acodec');
			ret.push('copy');
		} else if (audioParams.acodec !== '自动') {
			const acodec = acodecs.find((item) => item.value == audioParams.acodec);
			const aencoder = acodec?.encoders.find((item) => item.value == audioParams.aencoder);
			if (acodec && aencoder) {
				// 不是用户手动填的 acodec 和 aencoder
				if (audioParams.aencoder === "默认") {
					// 使用默认编码器，返回 acodec.codecName
					ret.push('-acodec');
					ret.push(acodec.codecName);
				} else {
					// 使用特定编码器，返回 acodev.ancoder[].codecName
					ret.push('-acodec');
					ret.push(aencoder.codecName);
				}
				if (acodec.strict2 || aencoder.strict2) {
					strict2 = true;
				}
				for (const parameter of aencoder.parameters) {
					// 普通的详细参数
					if (parameter.mode === 'combo') {
						if (audioParams.detail[parameter.parameter] != '默认' && audioParams.detail[parameter.parameter] != '自动') {
							ret.push('-' + parameter.parameter);
							ret.push(audioParams.detail[parameter.parameter]);
						}
						// 检查参数项是否有 strict2 标记
						var item = parameter.items.find((item) => item.value === audioParams.detail[parameter.parameter]);
						if (item?.strict2) {
							strict2 = true;
						}
					} else if (parameter.mode == 'slider') {
						ret.push('-' + parameter.parameter);
						const floatValue = audioParams.detail[parameter.parameter];
						const value = parameter.valueToParam(floatValue);
						ret.push(value);
					}
				}
				const ratecontrol = aencoder.ratecontrol.find((item) => item.value === audioParams.ratecontrol);
				if (ratecontrol) {
					// 计算值
					const floatValue = audioParams.ratevalue;
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
			} else if (acodec) {
				// 用户手动填入的 aencoder
				ret.push('-acodec');
				ret.push(audioParams.aencoder);
			} else {
				// 用户手动填入的 acodec
				ret.push('-acodec');
				ret.push(audioParams.acodec);
			}
		} // 如果编码为自动，则不设置 acodec 参数，返回空 Array
		if (audioParams.acodec !== '禁用音频' && audioParams.acodec !== '不重新编码') {
			if (audioParams.vol !== 0.5) {
				ret.push('-vol');
				ret.push(volSlider.valueToParam(audioParams.vol));
			}
		}
		if (audioParams.custom) {
			ret.push(...audioParams.custom.split(' '));
		}
		return ret;
	},
	// 获取 ratecontrol 方面的参数，主要是给 taskitem 用
	getRateControlParam: function (audioParams: OutputParams_audio) {
		var ret = {
			mode: '-',
			value: '-'
		}
		if (audioParams.acodec == '禁用音频' || audioParams.acodec == '不重新编码' || audioParams.acodec == '自动') {
			return ret
		} else {
			var acodec = acodecs.find((item) => {
				return item.value == audioParams.acodec
			})
			if (!acodec) {
				return ret
			}
			var aencoder = acodec.encoders.find((item) => {
				return item.value == audioParams.aencoder
			})
			if (!aencoder || aencoder.ratecontrol == null) {
				return ret
			}
			// 找到 ratecontrol 参数
			var ratecontrol = aencoder.ratecontrol.find((item) => {
				return item.value == audioParams.ratecontrol
			})
			if (ratecontrol != null) {
				// 计算值
				var floatValue = audioParams.ratevalue
				var value = ratecontrol.valueToText(floatValue)
				ret = {
					mode: ratecontrol.value,
					value
				}
			}
			return ret
		}
	}
}
export { acodecs, volSlider, generator }

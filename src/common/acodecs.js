const VALUE = Symbol()

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

const CBR_ABR = {
	sName: 'CBR/ABR',
	lName: 'CBR/ABR',
	imageName: 'video_ratecontrol',
	imageOffset: 6,
	description: '指定预期码率大小',
	cmd: ['-b:a', VALUE]
}
const Q = {
	sName: 'Q',
	lName: 'Q',
	imageName: 'video_ratecontrol',
	imageOffset: 6,
	description: '指定音频质量',
	cmd: ['-q:a', VALUE]
}

// #endregion

// #region 预置 slider

function approximation (number, numList, threshould = 0.01) {
	for (const num of numList) {
		if (Math.abs(num - number) < threshould) {
			number = num;
		}
	}
	return number;
}

const abitrateSlider = {
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
const q100slider = {
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

const sr_96000 = {
	sName: '96000',
	lName: '96000 Hz',
	imageName: '',
	imageOffset: 0,
	description: '',
}

const sr_88200 = {
	sName: '88200',
	lName: '88200 Hz',
	imageName: '',
	imageOffset: 0,
	description: '',
}

const sr_64000 = {
	sName: '64000',
	lName: '64000 Hz',
	imageName: '',
	imageOffset: 0,
	description: '',
}

const sr_48000 = {
	sName: '48000',
	lName: '48000 Hz',
	imageName: '',
	imageOffset: 0,
	description: '',
}

const sr_44100 = {
	sName: '44100',
	lName: '44100 Hz',
	imageName: '',
	imageOffset: 0,
	description: '',
}

const sr_32000 = {
	sName: '32000',
	lName: '32000 Hz',
	imageName: '',
	imageOffset: 0,
	description: '',
}

const sr_24000 = {
	sName: '24000',
	lName: '24000 Hz',
	imageName: '',
	imageOffset: 0,
	description: '',
}

const sr_22050 = {
	sName: '22050',
	lName: '22050 Hz',
	imageName: '',
	imageOffset: 0,
	description: '',
}

const sr_16000 = {
	sName: '16000',
	lName: '16000 Hz',
	imageName: '',
	imageOffset: 0,
	description: '',
}

const sr_12000 = {
	sName: '12000',
	lName: '12000 Hz',
	imageName: '',
	imageOffset: 0,
	description: '',
}

const sr_11025 = {
	sName: '11025',
	lName: '11025 Hz',
	imageName: '',
	imageOffset: 0,
	description: '',
}

const sr_8000 = {
	sName: '8000',
	lName: '8000 Hz',
	imageName: '',
	imageOffset: 0,
	description: '',
}

const sr_7350 = {
	sName: '7350',
	lName: '7350 Hz',
	imageName: '',
	imageOffset: 0,
	description: '',
}

// #endregion

// #region 预置声道布局

const lo_mono = {
	sName: 'mono',
	lName: 'mono',
	imageName: '',
	imageOffset: 0,
	description: '单声道<br />FC',
}

const lo_stereo = {
	sName: 'stereo',
	lName: 'stereo',
	imageName: '',
	imageOffset: 0,
	description: '立体声<br />FL+FR',
}

const lo_2_1 = {
	sName: '2.1',
	lName: '2.1',
	imageName: '',
	imageOffset: 0,
	description: '左右前置 + 重低音<br />FL+FR+LFE',
}

const lo_3_0 = {
	sName: '3.0',
	lName: '3.0',
	imageName: '',
	imageOffset: 0,
	description: '左右前置 + 前中置<br />FL+FR+FC',
}

const lo_3_0_back = {
	sName: '3.0(back)',
	lName: '3.0(back)',
	imageName: '',
	imageOffset: 0,
	description: '左右前置 + 后中置<br />FL+FR+BC',
}

const lo_4_0 = {
	sName: '4.0',
	lName: '4.0',
	imageName: '',
	imageOffset: 0,
	description: '左右前置 + 前后中置<br />FL+FR+FC+BC',
}

const lo_quad = {
	sName: 'quad',
	lName: 'quad',
	imageName: '',
	imageOffset: 0,
	description: '左右前置 + 左右后置<br />FL+FR+BL+BR',
}

const lo_quad_side = {
	sName: 'quad(side)',
	lName: 'quad(side)',
	imageName: '',
	imageOffset: 0,
	description: '左右前置 + 左右侧置<br />FL+FR+SL+SR',
}

const lo_3_1 = {
	sName: '3.1',
	lName: '3.1',
	imageName: '',
	imageOffset: 0,
	description: '左中右前置 + 重低音<br />FL+FR+FC+LFE',
}

const lo_5_0 = {
	sName: '5.0',
	lName: '5.0',
	imageName: '',
	imageOffset: 0,
	description: '左中右前置 + 左右后置<br />FL+FR+FC+BL+BR',
}

const lo_5_0_side = {
	sName: '5.0(side)',
	lName: '5.0(side)',
	imageName: '',
	imageOffset: 0,
	description: '左中右前置 + 左右侧置<br />FL+FR+FC+SL+SR',
}

const lo_4_1 = {
	sName: '4.1',
	lName: '4.1',
	imageName: '',
	imageOffset: 0,
	description: '左右前置 + 前后中置 + 重低音<br />FL+FR+FC+LFE+BC',
}

const lo_5_1 = {
	sName: '5.1',
	lName: '5.1',
	imageName: '',
	imageOffset: 0,
	description: '左中右前置 + 左右后置 + 重低音<br />FL+FR+FC+LFE+BL+BR',
}

const lo_5_1_side = {
	sName: '5.1(side)',
	lName: '5.1(side)',
	imageName: '',
	imageOffset: 0,
	description: '左中右前置 + 左右侧置 + 重低音<br />FL+FR+FC+LFE+SL+SR',
}

const lo_6_0 = {
	sName: '6.0',
	lName: '6.0',
	imageName: '',
	imageOffset: 0,
	description: '左右前置 + 前后中置 + 左右侧置<br />FL+FR+FC+BC+SL+SR',
}

const lo_6_0_front = {
	sName: '6.0(front)',
	lName: '6.0(front)',
	imageName: '',
	imageOffset: 0,
	description: 'FL+FR+FLC+FRC+SL+SR',
}

const lo_hexagonal = {
	sName: 'hexagonal',
	lName: 'hexagonal',
	imageName: '',
	imageOffset: 0,
	description: '左中右前置 + 左中右后置<br />FL+FR+FC+BL+BR+BC',
}

const lo_6_1 = {
	sName: '6.1',
	lName: '6.1',
	imageName: '',
	imageOffset: 0,
	description: '左右前置 + 前后中置 + 左右侧置 + 重低音<br />FL+FR+FC+LFE+BC+SL+SR',
}

const lo_6_1_back = {
	sName: '6.1(back)',
	lName: '6.1(back)',
	imageName: '',
	imageOffset: 0,
	description: '左中右前置 + 左中右后置 + 重低音<br />FL+FR+FC+LFE+BL+BR+BC',
}

const lo_6_1_front = {
	sName: '6.1(front)',
	lName: '6.1(front)',
	imageName: '',
	imageOffset: 0,
	description: 'FL+FR+LF+FLC+FRC+SL+SR',
}

const lo_7_0 = {
	sName: '7.0',
	lName: '7.0',
	imageName: '',
	imageOffset: 0,
	description: '左中右前置 + 左右后置 + 左右侧置<br />FL+FR+FC+BL+BR+SL+SR',
}

const lo_7_0_front = {
	sName: '7.0(front)',
	lName: '7.0(front)',
	imageName: '',
	imageOffset: 0,
	description: 'FL+FR+FC+FLC+FRC+SL+SR',
}

const lo_7_1 = {
	sName: '7.1',
	lName: '7.1',
	imageName: '',
	imageOffset: 0,
	description: '左中右前置 + 左右后置 + 左右侧置 + 重低音<br />FL+FR+FC+LFE+BL+BR+SL+SR',
}

const lo_7_1_wide = {
	sName: '7.1(wide)',
	lName: '7.1(wide)',
	imageName: '',
	imageOffset: 0,
	description: 'FL+FR+FC+LFE+BL+BR+FLC+FRC',
}

const lo_7_1_wide_side = {
	sName: '7.1(wide-side)',
	lName: '7.1(wide-side)',
	imageName: '',
	imageOffset: 0,
	description: 'FL+FR+FC+LFE+FLC+FRC+SL+SR',
}

const lo_octagonal = {
	sName: 'octagonal',
	lName: 'octagonal',
	imageName: '',
	imageOffset: 0,
	description: '左中右前置 + 左中右后置 + 左右侧置<br />FL+FR+FC+BL+BR+BC+SL+SR',
}

const lo_hexadecagonal = {
	sName: 'hexadecagonal',
	lName: 'hexadecagonal',
	imageName: '',
	imageOffset: 0,
	description: '这个就很牛逼了<br />FL+FR+FC+BL+BR+BC+SL+SR+TFL+TFC+TFR+TBL+TBC+TBR+WL+WR',
}

const lo_downmix = {
	sName: 'downmix',
	lName: 'downmix',
	imageName: '',
	imageOffset: 0,
	description: 'DL+DR',
}

// #endregion

const volSlider = {
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


const 默认编码器 = {
	sName: '默认',
	lName: '默认',
	imageName: 'audio_acodec',
	imageOffset: 0,
	description: '使用默认编码器。',
	codecName: '-',
}

var acodecs = [
	{
		sName: '禁用音频',
		lName: '禁用音频',
		imageName: 'audio_acodec',
		imageOffset: 0,
		description: '不输出音频',
		codecName: '-',
		encoders: [
			默认编码器
		],
	},
	{
		sName: '不重新编码',
		lName: '不重新编码',
		imageName: 'audio_acodec',
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
		imageName: 'audio_acodec',
		imageOffset: 0,
		description: '自动选择编码',
		codecName: '-',
		encoders: [
			默认编码器
		],
	},
	{
		sName: 'OPUS',
		lName: 'OPUS',
		imageName: 'audio_acodec',
		imageOffset: 2,
		description: 'OPUS - Opus 是一个有损声音编码的格式，由 Xiph.Org 基金会开发，之后由互联网工程任务组进行标准化，目标是希望用单一格式包含声音和语音，取代 Speex 和 Vorbis，且适用于网络上低延迟的即时声音传输，标准格式定义于 RFC 6716 文件。Opus 格式是一个开放格式，使用上没有任何专利或限制。',
		codecName: 'opus',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "sample_fmt", display: "采样频率",
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
				sName: 'opus',
				lName: 'opus',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
				codecName: 'opus',
				parameters: [
					{
						mode: "combo", parameter: "sample_fmt", display: "采样频率",
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
				sName: 'libopus',
				lName: 'libopus',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
				codecName: 'libopus',
				parameters: [
					{
						mode: "combo", parameter: "sample_fmt", display: "采样频率",
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
		sName: 'AAC',
		lName: 'AAC',
		imageName: 'audio_acodec',
		imageOffset: 3,
		description: 'AAC - AAC 即 Advanced Audio Coding，高级音频编码，出现于 1997 年，为一种基于 MPEG-2 的有损数字音频压缩的专利音频编码标准，由 Fraunhofer IIS、杜比实验室、AT&T、Sony、Nokia 等公司共同开发。2000 年，MPEG-4 标准在原本的基础上加上了 PNS（Perceptual Noise Substitution）等技术，并提供了多种扩展工具。为了区别于传统的MPEG-2 AAC 又称为 MPEG-4 AAC。其作为 MP3 的后继者而被设计出来，在相同的比特率之下，AAC 相较于 MP3 通常可以达到更好的声音质量。',
		codecName: 'aac',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "sample_fmt", display: "采样频率",
						items: [ 自动, sr_96000, sr_88200, sr_64000, sr_48000, sr_44100, sr_32000, sr_24000, sr_22050, sr_16000, sr_12000, sr_11025, sr_8000, sr_7350 ]
					},
					{
						mode: "combo", parameter: "aac_coder", display: "编码算法",
						items: [
							自动,
							{
								sName: 'anmr',
								lName: 'anmr',
								imageName: 'audio_acodec',
								imageOffset: 0,
								description: 'ANMR method',
								...strict2
							},
							{
								sName: 'twoloop',
								lName: 'twoloop',
								imageName: 'audio_acodec',
								imageOffset: 0,
								description: 'Two loop searching method',
							},
							{
								sName: 'fast',
								lName: 'fast（默认）',
								imageName: 'audio_acodec',
								imageOffset: 0,
								description: 'Default fast search',
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
		sName: 'Vorbis',
		lName: 'Vorbis (OGG)',
		imageName: 'audio_acodec',
		imageOffset: 4,
		description: 'Vorbis - Vorbis 是一种有损音频压缩格式，由 Xiph.Org 基金会所领导并开放源代码的一个免费的开源软件项目。该项目为有损音频压缩产生音频编码格式和软件参考编码器╱解码器（编解码器）。Vorbis 通常以 Ogg 作为容器格式，所以常合称为 Ogg Vorbis。',
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
				sName: 'vorbis',
				lName: 'vorbis',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
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
				sName: 'libvorbis',
				lName: 'libvorbis',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
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
		sName: 'MP3',
		lName: 'MP3',
		imageName: 'audio_acodec',
		imageOffset: 5,
		description: 'MP3 - MP3 即 MPEG-1 Audio Layer Ⅲ，是当今流行的一种数字音频编码和有损压缩格式，它被设计来大幅降低音频数据量，通过舍弃 PCM 音频数据中对人类听觉不重要的部分，达成压缩成较小文件的目的。而对于大多数用户的听觉感受来说，MP3 的音质与最初的不压缩音频相比没有明显的下降。',
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
				sName: 'libmp3lame',
				lName: 'libmp3lame',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
				codecName: 'libmp3lame',
				parameters: [
					{
						mode: "combo", parameter: "sample_fmt", display: "采样频率",
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
				sName: 'libshine',
				lName: 'libshine',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
				codecName: 'libshine',
				parameters: [
					{
						mode: "combo", parameter: "sample_fmt", display: "采样频率",
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
		sName: 'MP2',
		lName: 'MP2',
		imageName: 'audio_acodec',
		imageOffset: 6,
		description: 'MP3 - MP3 即 MPEG-1 Audio Layer Ⅱ。个人电脑和互联网音乐流行 MP3，MP2 则多用于广播。',
		codecName: 'mp2',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "sample_fmt", display: "采样频率",
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
				sName: 'mp2',
				lName: 'mp2',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
				codecName: 'mp2',
				parameters: [
					{
						mode: "combo", parameter: "sample_fmt", display: "采样频率",
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
				sName: 'mp2fixed',
				lName: 'mp2fixed',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
				codecName: 'mp2fixed',
				parameters: [
					{
						mode: "combo", parameter: "sample_fmt", display: "采样频率",
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
				sName: 'libtwolame',
				lName: 'libtwolame',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
				codecName: 'libtwolame',
				parameters: [
					{
						mode: "combo", parameter: "sample_fmt", display: "采样频率",
						items: [ 自动, sr_48000, sr_44100, sr_32000, sr_24000, sr_22050, sr_16000 ]
					},
					{
						mode: "combo", parameter: "mode", display: "声道模式",
						items: [
							自动,
							{
								sName: 'stereo',
								lName: 'stereo',
								imageName: '',
								imageOffset: 0,
								description: '立体声',
							},
							{
								sName: 'joint_stereo',
								lName: 'joint_stereo',
								imageName: '',
								imageOffset: 0,
								description: '联合立体声',
							},
							{
								sName: 'dual_channel',
								lName: 'dual_channel',
								imageName: '',
								imageOffset: 0,
								description: '双声道',
							},
							{
								sName: 'mono',
								lName: 'mono',
								imageName: '',
								imageOffset: 0,
								description: '单声道',
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
		sName: 'AC3',
		lName: 'AC3',
		imageName: 'audio_acodec',
		imageOffset: 8,
		description: 'AC3 - AC3 即杜比数字音频编码。杜比数字（Dolby Digital）是美国杜比实验室开发的一系列有损和无损的多媒体单元格式。',
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
								sName: 'FC+LFE',
								lName: 'FC+LFE',
								imageName: '',
								imageOffset: 0,
								description: '',
							},
							{
								sName: 'FL+FR+LFE+BC',
								lName: 'FL+FR+LFE+BC',
								imageName: '',
								imageOffset: 0,
								description: '',
							},
							{
								sName: 'FL+FR+LFE+SL+SR',
								lName: 'FL+FR+LFE+SL+SR',
								imageName: '',
								imageOffset: 0,
								description: '',
							},
							{
								sName: 'FL+FR+LFE+BL+BR',
								lName: 'FL+FR+LFE+BL+BR',
								imageName: '',
								imageOffset: 0,
								description: '',
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
				sName: 'ac3',
				lName: 'ac3',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
				codecName: 'ac3',
				parameters: [
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [
							自动, lo_mono, lo_stereo, lo_3_0_back, lo_3_0, lo_quad_side, lo_quad, lo_4_0, lo_5_0_side, lo_5_0, lo_2_1, lo_3_1, lo_4_1, lo_5_1_side, lo_5_1,
							{
								sName: 'FC+LFE',
								lName: 'FC+LFE',
								imageName: '',
								imageOffset: 0,
								description: '',
							},
							{
								sName: 'FL+FR+LFE+BC',
								lName: 'FL+FR+LFE+BC',
								imageName: '',
								imageOffset: 0,
								description: '',
							},
							{
								sName: 'FL+FR+LFE+SL+SR',
								lName: 'FL+FR+LFE+SL+SR',
								imageName: '',
								imageOffset: 0,
								description: '',
							},
							{
								sName: 'FL+FR+LFE+BL+BR',
								lName: 'FL+FR+LFE+BL+BR',
								imageName: '',
								imageOffset: 0,
								description: '',
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
				sName: 'ac3_fixed',
				lName: 'ac3_fixed',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
				codecName: 'ac3_fixed',
				parameters: [
					{
						mode: "combo", parameter: "channel_layout", display: "声道布局",
						items: [
							自动, lo_mono, lo_stereo, lo_3_0_back, lo_3_0, lo_quad_side, lo_quad, lo_4_0, lo_5_0_side, lo_5_0, lo_2_1, lo_3_1, lo_4_1, lo_5_1_side, lo_5_1,
							{
								sName: 'FC+LFE',
								lName: 'FC+LFE',
								imageName: '',
								imageOffset: 0,
								description: '',
							},
							{
								sName: 'FL+FR+LFE+BC',
								lName: 'FL+FR+LFE+BC',
								imageName: '',
								imageOffset: 0,
								description: '',
							},
							{
								sName: 'FL+FR+LFE+SL+SR',
								lName: 'FL+FR+LFE+SL+SR',
								imageName: '',
								imageOffset: 0,
								description: '',
							},
							{
								sName: 'FL+FR+LFE+BL+BR',
								lName: 'FL+FR+LFE+BL+BR',
								imageName: '',
								imageOffset: 0,
								description: '',
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
		sName: 'FLAC',
		lName: 'FLAC',
		imageName: 'audio_acodec',
		imageOffset: 9,
		description: 'FLAC - FLAC 即 Free Lossless Audio Codec，FLAC 是一款的自由音频压缩编码，其特点是可以对音频文件无损压缩。',
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
		sName: 'ALAC',
		lName: 'ALAC',
		imageName: '',
		imageOffset: 10,
		description: 'ALAC - ALAC 即 Apple Lossless Audio Codec，为苹果的无损音频压缩编码格式，可将非压缩音频格式（WAV、AIFF）压缩至原先容量的 40% 至 60% 左右。',
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
		sName: 'WMA V2',
		lName: 'WMA V2',
		imageName: '',
		imageOffset: 11,
		description: 'WMA 2 - WMA 是微软公司开发的一系列音频编解码器。WMA Pro 支持更多声道和更高质量的音频。',
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
		sName: 'WMA V1',
		lName: 'WMA V1',
		imageName: '',
		imageOffset: 12,
		description: 'WMA 1 - WMA 是微软公司开发的一系列音频编解码器。WMA Pro 支持更多声道和更高质量的音频。',
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
		sName: 'DTS',
		lName: 'DTS',
		imageName: '',
		imageOffset: 13,
		description: 'DTS - DTS 即 Digital Theater Systems，数字影院系统，由 DTS 公司（DTS Inc.，NASDAQ：DTSI）开发，为多声道音频格式中的一种，广泛应用于 DVD 音效上。其最普遍的格式为 5.1 声道。',
		codecName: 'dts',
		encoders: [
			{
				...默认编码器,
				parameters: [
					{
						mode: "combo", parameter: "sample_fmt", display: "采样频率",
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
				sName: 'dca',
				lName: 'dca',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
				codecName: 'dca',
				parameters: [
					{
						mode: "combo", parameter: "sample_fmt", display: "采样频率",
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
		sName: 'AMR WB',
		lName: 'AMR WB',
		imageName: '',
		imageOffset: 14,
		description: 'AMR - AMR 即 Adaptive multi-Rate compression，自适应多速率音频压缩，是一个使语音编码最优化的专利。AMR 被标准语音编码 3GPP 在 1998 年 10 月选用，现在广泛在 GSM 和 UMTS 中使用。',
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
				sName: 'libvo_armwbenc',
				lName: 'libvo_armwbenc',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
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
		sName: 'AMR NB',
		lName: 'AMR NB',
		imageName: '',
		imageOffset: 15,
		description: 'AMR - AMR 即 Adaptive multi-Rate compression，自适应多速率音频压缩，是一个使语音编码最优化的专利。AMR 被标准语音编码 3GPP 在 1998 年 10 月选用，现在广泛在 GSM 和 UMTS 中使用。',
		codecName: 'amr_nb',
		encoders: [
			{
				...默认编码器,
			},
			{
				sName: 'libopencore_armnb',
				lName: 'libopencore_armnb',
				imageName: 'audio_acodec',
				imageOffset: 0,
				description: '',
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


var generator = {
	getAudioParam: function (audioParams) {
		var ret = []
		var strict2 = false
		if (audioParams.acodec == '禁用音频') {
			ret.push('-an')
		} else if (audioParams.acodec == '不重新编码') {
			ret.push('-acodec')
			ret.push('copy')
		} else if (audioParams.acodec != '自动') {
			var acodec = acodecs.find((value) => {
				return value.sName == audioParams.acodec
			})
			if (acodec) {
				var aencoder = acodec.encoders.find((value) => {
					return value.sName == audioParams.aencoder
				})
			}
			if (acodec && aencoder) {
				// 不是用户手动填的 acodec 和 aencoder
				if (audioParams.aencoder == "默认") {
					// 使用默认编码器，返回 acodec.codecName
					ret.push('-acodec')
					ret.push(acodec.codecName)
				} else {
					// 使用特定编码器，返回 acodev.ancoder[].codecName
					ret.push('-acodec')
					ret.push(aencoder.codecName)
				}
				if (acodec.strict2 || aencoder.strict2) {
					strict2 = true
				}
				for (const parameter of aencoder.parameters) {
					// 普通的详细参数
					if (parameter.mode == 'combo') {
						if (audioParams.detail[parameter.parameter] != '默认' && audioParams.detail[parameter.parameter] != '自动') {
							ret.push('-' + parameter.parameter)
							ret.push(audioParams.detail[parameter.parameter])
						}
						// 检查参数项是否有 strict2 标记
						var item = parameter.items.find((value) => {
							return value.sName == audioParams.detail[parameter.parameter]
						})
						if (item && item.strict2) {
							strict2 = true
						}
					} else if (parameter.mode == 'slider') {
						ret.push('-' + parameter.parameter)
						var floatValue = audioParams.detail[parameter.parameter]
						var value = parameter.valueToParam(floatValue)
						ret.push(value)
					}
				}
				var ratecontrol = aencoder.ratecontrol.find(value => {
					return value.sName == audioParams.ratecontrol
				})
				if (ratecontrol != null) {
					// 计算值
					var floatValue = audioParams.ratevalue
					var value = ratecontrol.valueToParam(floatValue)
					// 将值插入参数列表中
					for (const item of ratecontrol.cmd) {
						if (item == VALUE) {
							ret.push(value)
						} else {
							ret.push(item)
						}
					}
				}
				if (strict2) {
					ret.push('-strict')
					ret.push('-2')
				}
			} else if (acodec) {
				// 用户手动填入的 aencoder
				ret.push('-acodec')
				ret.push(audioParams.aencoder)
			} else {
				// 用户手动填入的 acodec
				ret.push('-acodec')
				ret.push(audioParams.acodec)
			}
		} // 如果编码为自动，则不设置 acodec 参数，返回空 Array
		if (audioParams.acodec != '禁用音频' && audioParams.acodec != '不重新编码') {
			if (audioParams.vol != 0.5) {
				ret.push('-vol')
				ret.push(volSlider.valueToParam(audioParams.vol))
			}
		}
		return ret
	},
	// 获取 ratecontrol 方面的参数，主要是给 taskitem 用
	getRateControlParam: function (audioParams) {
		var ret = {
			mode: '-',
			value: '-'
		}
		if (audioParams.acodec == '禁用音频' || audioParams.acodec == '不重新编码' || audioParams.acodec == '自动') {
			return ret
		} else {
			var acodec = acodecs.find((value) => {
				return value.sName == audioParams.acodec
			})
			if (!acodec) {
				return ret
			}
			var aencoder = acodec.encoders.find((value) => {
				return value.sName == audioParams.aencoder
			})
			if (!aencoder || aencoder.ratecontrol == null) {
				return ret
			}
			// 找到 ratecontrol 参数
			var ratecontrol = aencoder.ratecontrol.find(value => {
				return value.sName == audioParams.ratecontrol
			})
			if (ratecontrol != null) {
				// 计算值
				var floatValue = audioParams.ratevalue
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
export { acodecs, volSlider, generator }

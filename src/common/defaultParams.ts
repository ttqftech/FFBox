import { OutputParams } from '@common/types';

export const defaultParams: OutputParams = {
	input: {
		mode: 'standalone',
		hwaccel: '不使用',
		files: [],
		begin: '',
		end: '',
	},
	video: {
		vcodec: 'HEVC',
		vencoder: '默认',
		resolution: '不改变',
		framerate: '不改变',
		ratecontrol: 'CRF',
		ratevalue: 0.5,
		detail: {
			preset: 0.5,
			tune: '默认',
			profile: '自动',
			level: '自动',
			quality: 'balanced',
			pix_fmt: '自动',
		},
	},
	audio: {
		acodec: '不重新编码',
		aencoder: '默认',
		ratecontrol: 'CBR/ABR',
		ratevalue: 0.5,
		vol: 0.5,
		detail: {
			sample_fmt: '自动',
			channel_layout: '自动',
		},
	},
	output: {
		format: 'MP4',
		moveflags: false,
		filename: '[filedir]/[filebasename]_converted.[fileext]',
	},
};

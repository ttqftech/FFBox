<template>
	<div class="taskitem" :class="taskItemStyle" @click="$emit('itemClicked', $event)">
		<div class="taskitem-background-wrapper">
			<div class="taskitem-background">
				<div class="taskitem-background-white"></div>
				<div class="taskitem-background-progress" :style="{ width: progress_smooth.progress * 100 + '%' }" :class="backgroundStyle"></div>
				<div class="taskitem-previewbox">
					<div class="taskitem-previewbox-img"></div>
				</div>
				<span class="taskitem-timing">{{ before.duration | getFormattedTime }}</span>
				<span class="taskitem-filename">{{ file_name }}</span>
				<div class="taskitem-info taskitem-infobefore">
					<div class="taskitem-img-format"></div>
					<span class="taskitem-span-format">{{ before.format }}</span>
					<div class="taskitem-img-vcodec"></div>
					<span class="taskitem-span-vcodec">{{ before.vcodec }}</span>
					<div class="taskitem-img-acodec"></div>
					<span class="taskitem-span-acodec">{{ before.acodec }}</span>
					<div class="taskitem-img-size"></div>
					<span class="taskitem-span-size taskitem-size-compact" v-html="before.vresolution"></span>
					<div class="taskitem-img-vratecontrol"></div>
					<span class="taskitem-span-vratecontrol">{{ before.vbitrate | beforeBitrateFilter }}</span>
					<div class="taskitem-img-aratecontrol"></div>
					<span class="taskitem-span-aratecontrol">{{ before.abitrate | beforeBitrateFilter }}</span>
				</div>
				<div class="taskitem-rightarrow"></div>
				<div class="taskitem-info taskitem-infoafter">
					<div class="taskitem-img-format"></div>
					<span class="taskitem-span-format">{{ after.output.format }}</span>
					<div class="taskitem-img-vcodec"></div>
					<span class="taskitem-span-vcodec">{{ after.video.vcodec }}</span>
					<div class="taskitem-img-acodec"></div>
					<span class="taskitem-span-acodec">{{ after.audio.acodec }}</span>
					<div class="taskitem-img-size"></div>
					<span class="taskitem-span-size" :class="{ 'taskitem-size-compact': after.video.resolution != '不改变' }" v-html="$options.filters.resolutionXtoBR(after.video.resolution)"></span>
					<div class="taskitem-img-vratecontrol"></div>
					<span class="taskitem-span-vratecontrol">{{ videoRateControl }}</span>
					<div class="taskitem-img-aratecontrol"></div>
					<span class="taskitem-span-aratecontrol">{{ audioRateControl }}</span>
				</div>
				<div class="taskitem-graphs">
					<div class="taskitem-graph">
						<div class="taskitem-graph-ring" :style="dashboard_bitrate"></div>
						<span class="taskitem-graph-data">{{ progress_smooth.bitrate | bitrateFilter }}</span>
						<span class="taskitem-graph-description">码率</span>
					</div>
					<div class="taskitem-graph">
						<div class="taskitem-graph-ring" :style="dashboard_speed"></div>
						<span class="taskitem-graph-data">{{ progress_smooth.speed | speedFilter }}</span>
						<span class="taskitem-graph-description">速度</span>
					</div>
					<div class="taskitem-graph">
						<div class="taskitem-graph-ring" :style="dashboard_time"></div>
						<span class="taskitem-graph-data">{{ progress_smooth.time | timeFilter }}</span>
						<span class="taskitem-graph-description">时间</span>
					</div>
					<div class="taskitem-graph">
						<div class="taskitem-graph-ring" :style="dashboard_frame"></div>
						<span class="taskitem-graph-data">{{ (progress_smooth.frame).toFixed(0) }}</span>
						<span class="taskitem-graph-description">帧</span>
					</div>
				</div>
				<button class="taskitem-button" @click="$event.stopPropagation(); $emit('pauseNremove')" :aria-label="deleteButtonAriaLabel">
					<div class="taskitem-delete" :style="{ 'background-position-x': deleteButtonBackgroundPositionX }"></div>
				</button>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';

import { getFormattedTime } from '@/common/utils'
import { OutputParams, TaskStatus, Task, UITask } from "@/types/types";
import { generator as vGenerator } from '@/common/vcodecs'
import { generator as aGenerator } from '@/common/acodecs'

interface Props {
	id: number;
	duration: number;
	file_name: string;
	before: Task['before'];
	after: OutputParams;
	progress_smooth: UITask['progress_smooth'];
	status: number;
	selected: boolean;
}

export default Vue.extend<{}, any, any, Props>({
	name: 'TaskItem',
	props: {
		id: Number,
		duration: Number,
		file_name: String,
		before: Object,
		after: Object,
		progress_smooth: Object,
		status: Number,
		selected: Boolean,
	},
	computed: {
		// 样式部分
		taskItemStyle: function (): string {
			let running = this.status === TaskStatus.TASK_RUNNING || this.status === TaskStatus.TASK_PAUSED || this.status === TaskStatus.TASK_STOPPING || this.status === TaskStatus.TASK_FINISHING;
			let selected = this.selected;
			if (!running && !selected) {
				return 'taskitem-small';
			} else if (!running && selected) {
				return 'taskitem-large';
			} else if (running && !selected) {
				return 'taskitem-small-run';
			} else if (running && selected) {
				return 'taskitem-large-run';
			}
			return '';
		},
		backgroundStyle: function (): string {
			switch (this.status) {
				case TaskStatus.TASK_RUNNING: case TaskStatus.TASK_FINISHING:
					return 'progress-green';
				case TaskStatus.TASK_PAUSED: case TaskStatus.TASK_STOPPING:
					return 'progress-yellow';
				case TaskStatus.TASK_FINISHED: case TaskStatus.TASK_STOPPED:
					return 'progress-gray';
				case TaskStatus.TASK_ERROR:
					return 'progress-red';
			}
			return '';
		},
		deleteButtonBackgroundPositionX: function (): string {
			switch (this.status) {
				case TaskStatus.TASK_STOPPED:
					return '0px';	// 删除按钮
				case TaskStatus.TASK_RUNNING:
					return '-16px';	// 暂停按钮
				case TaskStatus.TASK_PAUSED: case TaskStatus.TASK_STOPPING: case TaskStatus.TASK_FINISHING: case TaskStatus.TASK_FINISHED: case TaskStatus.TASK_ERROR:
					return '-32px';	// 重置按钮
			}
			return '';
		},
		deleteButtonAriaLabel: function (): string {
			switch (this.status) {
				case TaskStatus.TASK_STOPPED: case TaskStatus.TASK_FINISHED:
					return '删除任务' + this.file_name
				case TaskStatus.TASK_RUNNING:
					return '暂停任务' + this.file_name
				case TaskStatus.TASK_PAUSED: case TaskStatus.TASK_STOPPING: case TaskStatus.TASK_FINISHING: case TaskStatus.TASK_FINISHED:
					return '重置任务' + this.file_name
			}
			return '删除暂停重置按钮';
		},
		// 仪表盘部分
		// 计算方式：(log(数值) / log(底，即每增长多少倍数为一格) + 数值为 1 时偏移多少格) / 格数
		// 　　　或：(log(数值 / 想要以多少作为最低值) / log(底，即每增长多少倍数为一格)) / 格数
		dashboard_bitrate: function () {
			var value = Math.log(this.progress_smooth.bitrate / 62.5) / Math.log(8) / 4;		// 0.0625M, 0.5M, 4M, 32M, 256M
			if (value == Infinity) { value = 1; }
			return "background: conic-gradient(#36D 0%, #36D " + value * 75 + "%, #DDD " + value * 75 + "%, #DDD 75%, transparent 75%);";
		},
		dashboard_speed: function () {
			var value = Math.log(this.progress_smooth.speed / 0.04) / Math.log(5) / 6;			// 0.04, 0.2, 1, 5, 25, 125, 625
			return "background: conic-gradient(#36D 0%, #36D " + value * 75 + "%, #DDD " + value * 75 + "%, #DDD 75%, transparent 75%);";
		},
		dashboard_time: function () {
			var valueOdd = this.progress_smooth.time % 2;
			if (valueOdd > 1) { valueOdd = 1; }
			var valueEven = this.progress_smooth.time % 2 - 1;
			if (valueEven < 0) { valueEven = 0; }
			return "background: conic-gradient(#DDD 0%, #DDD " + valueEven * 75 + "%, #36D " + valueEven * 75 + "%, #36D " + valueOdd * 75 + "%, #DDD " + valueOdd * 75 + "%, #DDD 75%, transparent 75%);";
		},
		dashboard_frame: function () {
			var valueOdd = this.progress_smooth.frame % 2;
			if (valueOdd > 1) { valueOdd = 1; }
			var valueEven = this.progress_smooth.frame % 2 - 1;
			if (valueEven < 0) { valueEven = 0; }
			return "background: conic-gradient(#DDD 0%, #DDD " + valueEven * 75 + "%, #36D " + valueEven * 75 + "%, #36D " + valueOdd * 75 + "%, #DDD " + valueOdd * 75 + "%, #DDD 75%, transparent 75%);";	
		},
		// 码率部分
		videoRateControl: function (): string {
			return vGenerator.getRateControlParam(this.after.video).value;
		},
		audioRateControl: function (): string {
			return aGenerator.getRateControlParam(this.after.audio).value;
		},
	},
	filters: {
		getFormattedTime: function (duration: number): string {
			if (isNaN(duration)) {	// 静态图片
				return '--:--:--.--';
			} else if (typeof duration === 'number') {
				return getFormattedTime(duration);
			} else {
				return duration;
			}
		},
		resolutionXtoBR: function (str: string) {
			return str.replace('x', '<br />');
		},
		bitrateFilter: function (kbps: number) {
			if (kbps >= 10000) {
				return (kbps / 1000).toFixed(1) + ' M';
			} else {
				return (kbps / 1000).toFixed(2) + ' M';
			}
		},
		speedFilter: function (value: number) {
			if (value < 10) {
				return value.toFixed(2) + ' ×';
			} else {
				return value.toFixed(1) + ' ×';
			}
		},
		timeFilter: function (value: number) {
			let left = value;
			let hour = Math.floor(left / 3600); left -= hour * 3600;
			let minute = Math.floor(left / 60); left -= minute * 60;
			let second = left;
			if (hour) {
				return `${hour}:${minute.toString().padStart(2, '0')}:${second.toFixed(0).toString().padStart(2, '0')}`;
			} else if (minute) {
				return `${minute}:${second.toFixed(1).padStart(4, '0')}`;
			} else {
				return second.toFixed(2);
			}
		},
		beforeBitrateFilter: function (kbps: number) {
			if (isNaN(kbps)) {
				return '读取中';
			} else if (kbps >= 10000) {
				return (kbps / 1000).toFixed(1) + ' Mbps';
			} else {
				return kbps + ' kbps';
			}
		},
	},
});

</script>

<style scoped>

/* ================================ 动画等共同项 ================================ */

.taskitem-large, .taskitem-large-run, .taskitem-small, .taskitem-small-run {
	/* position: absolute; */
	box-sizing: border-box;
	width: 100%;
	margin-bottom: -16px;
	/* transition: top 0.5s; */
}
	.taskitem-background-wrapper {
		/* position: absolute; */
		margin-top: 4px;
		padding: 0px 16px 12px;
		width: 100%;
		box-sizing: border-box;
		overflow: hidden;
		transform: translate3d(0, 0, 0);
	}
		.taskitem-background {
			transition: height 0.5s;
			pointer-events: none;
		}
			.taskitem-background-white {
				transition: height 0.5s, background-color 0.1s;
				height: 100%;
				border-radius: 2px;
				box-sizing: border-box;
				background: white;
				box-shadow: 0px 0px 2px 2px rgba(255, 255, 255, 1),
							0px 2px 4px 0px rgba(0, 0, 0, 0.3);
				pointer-events: all;
			}
			.taskitem-background-white:hover {
				/* background: rgba(204, 232, 255, 0.6); */
				background: hsl(210, 100%, 95%);
			}
			.taskitem-background-progress {
				transition: width 0.3s ease-out, height 0.5s;
				position: absolute;
				top: 0;
				height: 100%;
				border-radius: 2px;
			}
			.progress-green {
				background: linear-gradient(180deg, rgba(204, 255, 204, 0.7), rgba(153, 255, 153, 0.7));
				box-shadow: 0px 4px 12px 0px rgba(143, 255, 143, 1),
							0px 2px 4px 0px rgba(0, 0, 0, 0.25);
			}
			.progress-yellow {
				background: linear-gradient(180deg, rgba(255, 238, 187, 0.7), rgba(255, 238, 136, 0.7));
				box-shadow: 0px 4px 12px 0px rgba(255, 229, 103, 1),
							0px 2px 4px 0px rgba(0, 0, 0, 0.25);
			}
			.progress-red {
				background: linear-gradient(180deg, rgba(255, 187, 187, 0.7), rgba(255, 136, 136, 0.7));
				box-shadow: 0px 4px 12px 0px rgba(255, 103, 103, 0.8),
							0px 2px 4px 0px rgba(0, 0, 0, 0.25);
			}
			.progress-gray {
				background: linear-gradient(180deg, rgba(238, 238, 238, 0.7), rgba(221, 221, 221, 0.7));
				box-shadow: 0px 4px 12px 0px rgba(204, 204, 204, 1),
							0px 2px 4px 0px rgba(0, 0, 0, 0.25);
			}
			.taskitem-previewbox {
				transition: top 0.5s, height 0.5s;
			}
			.taskitem-previewbox-img {
				background: url(/images/preview.png) center/contain no-repeat;
				width: 100%;
				height: 100%;
			}
			.taskitem-timing {
				transition: left 0.5s, top 0.5s, font-size 0.5s, width 0.5s;
				text-align: center;
				white-space: nowrap;
			}
			.taskitem-filename {
				transition: left 0.5s, top 0.5s, width 0.5s, font-size 0.5s;
				overflow: hidden;
				text-align: left;
			}
			.taskitem-info {
				transition: right 0.5s, width 0.5s, height 0.5s, transform 0.5s;
				overflow: hidden;
			}
			.taskitem-infobefore {
			}
			.taskitem-infoafter {
			}
			.taskitem-rightarrow {
				position: absolute;
				top: 0;
				bottom: 0;
				margin: auto;
				right: 400px;
				width: 32px;
				height: 32px;
				background-image: url(/images/rightarrow.svg);
				background-size: contain;
				transition: right 0.5s, opacity 0.5s;
			}
				.taskitem-img-format {
					background-image: url(/images/formats/format_format.png);
				}
				.taskitem-img-vcodec {
					background-image: url(/images/formats/video_vcodec.png);
				}
				.taskitem-img-acodec {
					background-image: url(/images/formats/audio_acodec.png);
				}
				.taskitem-span-format {
					text-align: center;
					white-space: nowrap;
				}
				.taskitem-span-vcodec {
					text-align: center;
					white-space: nowrap;
				}
				.taskitem-span-acodec {
					text-align: center;
					white-space: nowrap;
				}
				.taskitem-img-size {
					background-image: url(/images/formats/video_resolution.png);
				}
				.taskitem-img-vratecontrol {
					background-image: url(/images/formats/video_ratecontrol.png);
				}
				.taskitem-img-aratecontrol {
					background-image: url(/images/formats/audio_ratecontrol.png);
				}
				.taskitem-span-size {
					text-align: center;
					white-space: nowrap;
				}
				.taskitem-span-vratecontrol {
					text-align: center;
					white-space: nowrap;
				}
				.taskitem-span-aratecontrol {
					text-align: center;
					white-space: nowrap;
				}
				.taskitem-info div {
					transition: left 0.5s, top 0.5s;
				}
				.taskitem-info span {
					transition: font-size 0.5s, width 0.5s, left 0.5s, top 0.5s;
				}
				.taskitem-size-compact {
				}
				.taskitem-graphs {
					transition: width 0.5s, right 0.5s, top 0.5s;
					overflow: hidden;
				}
					.taskitem-graph {
						transition: width 0.5s, height 0.5s, right 0.5s;
						text-align: left;
					}
						.taskitem-graph-ring {
							width: 100%;
							height: 100%;
							border-radius: 50%;
							-webkit-mask: radial-gradient(transparent 60%, #000 61%);
							background: conic-gradient(#36D 0%, #36D 0%, #DDD 0%, #DDD 75%, transparent 75%);
							transform: rotate(225deg);
						}
						.taskitem-graph-data {
							transition: font-size 0.5s;
						}
						.taskitem-graph-description {
							transition: font-size 0.5s;
						}
			.taskitem-button {
				position: absolute;
				right: 1px;
				top: 1px;
				bottom: 1px;
				width: 48px;
				display: flex;
				justify-content: center;
				align-items: center;
				transition: background 0.1s linear;
				background: none;
				border: none;
				outline: none;
				pointer-events: all;
			}
			.taskitem-button:hover {
				/* background: rgba(204, 232, 255, 0.6); */
				background: hsl(210, 100%, 95%);
			}
			.taskitem-button:active {
				transition: background 0s;
				background: hsl(0, 100%, 90%);
			}
				.taskitem-delete {
					width: 16px;
					height: 16px;
					background-image: url(/images/deleteNpause_button.svg);
					background-size: 300%;	/* 三倍大小 */
					pointer-events: none;
					background-position-x: 0px;
					/* background-position-x 使用 js 代码控制 */
				}
				.taskitem-delete:hover {
					background-position-y: -16px;
				}
				.taskitem-delete:active {
					background-position-y: -32px;
				}


/* ================================ 大号列表项 ================================ */

.taskitem-large {
}
	.taskitem-large .taskitem-background-wrapper {
	}
		.taskitem-large .taskitem-background {
			position: relative;
			height: 80px;
		}
			.taskitem-large .taskitem-background-white {
				background: hsl(210, 100%, 90%);
				border: hsl(210, 100%, 80%) 1px solid;
			}
			.taskitem-large .taskitem-background-progress {
			}
			.taskitem-large .taskitem-previewbox {
				position: absolute;
				left: 8px;
				top: 20px;
				width: 96px;
				height: 54px;
				display: flex;
				align-items: center;
				justify-content: center;
				border: #DDD 1px dashed;
			}
			.taskitem-large .taskitem-previewbox img {
			}
			.taskitem-large .taskitem-timing {
				position: absolute;
				left: 8px;
				top: 4px;
				width: 96px;
				font-size: 12px;
			}
			.taskitem-large .taskitem-filename {
				display: -webkit-box;
				position: absolute;
				left: 112px;
				top: 8px;
				width: calc(100% - 912px);
				height: 66px;
				font-size: 23.5px;
				font-weight: bold;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
			}
			.taskitem-large .taskitem-info {
				height: 68px;
				width: 336px;
			}
			.taskitem-large .taskitem-infobefore {
				position: absolute;
				top: 8px;
				right: 448px;
			}
			.taskitem-large .taskitem-infoafter {
				position: absolute;
				top: 8px;
				right: 48px;
			}
			.taskitem-large .taskitem-rightarrow {
				opacity: 1;
			}
				.taskitem-large .taskitem-img-format {
					top: 0px;
					left: 0px;
				}
				.taskitem-large .taskitem-img-vcodec {
					top: 0px;
					left: 112px;					
				}
				.taskitem-large .taskitem-img-acodec {
					top: 0px;
					left: 224px;
				}
				.taskitem-large .taskitem-span-format {
					top: 5px;
					left: 40px;
				}
				.taskitem-large .taskitem-span-vcodec {
					top: 5px;
					left: 152px;					
				}
				.taskitem-large .taskitem-span-acodec {
					top: 5px;
					left: 264px;
				}
				.taskitem-large .taskitem-img-size {
					top: 36px;
					left: 0px;
				}
				.taskitem-large .taskitem-img-vratecontrol {
					top: 36px;
					left: 112px;
				}
				.taskitem-large .taskitem-img-aratecontrol {
					top: 36px;
					left: 224px;
				}
				.taskitem-large .taskitem-span-size {
					top: 41px;
					left: 40px;
				}
				.taskitem-large .taskitem-span-vratecontrol {
					top: 41px;
					left: 152px;					
				}
				.taskitem-large .taskitem-span-aratecontrol {
					top: 41px;
					left: 264px;
				}
				.taskitem-large .taskitem-info div {
					position: absolute;
					width: 32px;
					height: 32px;
					background-size: cover;
					/*border: #DDD 1px dashed;*/
				}
				.taskitem-large .taskitem-info span {
					position: absolute;
					display: block;
					width: 0px;
					font-size: 14px;
					/*border: #DDD 1px dashed;*/
				}
				.taskitem-large .taskitem-size-compact {
					line-height: 12px;
					font-size: 11px !important;
				}

			.taskitem-large .taskitem-graphs {
				position: absolute;
				right: 400px;
				top: 8px;
				width: 0px;
				display: flex;
				justify-content: space-around;
			}
				.taskitem-large .taskitem-graph {
					position: relative;
					display: inline-block;
					width: 64px;
					height: 64px;
				}
					.taskitem-large .taskitem-graph-ring {
					}
					.taskitem-large .taskitem-graph-data {
						position: absolute;
						top: 50%;
						width: 100%;
						text-align: center;
						font-weight: 600;
						transform: translateY(-51%);
						font-size: 15px;
						font-family: Bahnschrift,Calibri,"SF Electrotome",Avenir,苹方-简,苹方,微软雅黑,"Segoe UI",Consolas,Roboto,黑体;
					}
					.taskitem-large .taskitem-graph-description {
						position: absolute;
						bottom: -2px;
						width: 100%;
						text-align: center;
						font-size: 12px;
					}

			@media screen and (min-width: 0px) and (max-width: 1199px) {
				.taskitem-large .taskitem-infobefore {
					width: 0px;
				}
				.taskitem-large .taskitem-rightarrow {
					opacity: 0;
				}
				.taskitem-large .taskitem-filename {
					width: calc(100% - 516px);
				}
			}
			.taskitem-large .taskitem-delete {
			}
			.taskitem-large .taskitem-delete:hover {
			}
			.taskitem-large .taskitem-delete:active {
			}


/* ================================ 大号运行中列表项 ================================ */

.taskitem-large-run {
}
	.taskitem-large-run .taskitem-background-wrapper {
	}
		.taskitem-large-run .taskitem-background {
			position: relative;
			height: 80px;
		}
			.taskitem-large-run .taskitem-background-white {
				background: hsl(210, 100%, 90%);
				border: hsl(210, 100%, 80%) 1px solid;
			}
			.taskitem-large-run .taskitem-background-progress {
			}
			.taskitem-large-run .taskitem-previewbox {
				position: absolute;
				left: 8px;
				top: 20px;
				width: 96px;
				height: 54px;
				display: flex;
				align-items: center;
				justify-content: center;
				border: #DDD 1px dashed;
			}
			.taskitem-large-run .taskitem-previewbox img {
			}
			.taskitem-large-run .taskitem-timing {
				position: absolute;
				left: 8px;
				top: 4px;
				width: 96px;
				font-size: 12px;
			}
			.taskitem-large-run .taskitem-filename {
				display: -webkit-box;
				position: absolute;
				left: 112px;
				top: 8px;
				width: calc(100% - 872px);
				height: 66px;
				font-size: 23.5px;
				font-weight: bold;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
			}
			.taskitem-large-run .taskitem-info {
				height: 68px;
				width: 336px;
			}
			.taskitem-large-run .taskitem-infobefore {
				position: absolute;
				top: 8px;
				right: 448px;
				width: 0;
			}
			.taskitem-large-run .taskitem-infoafter {
				position: absolute;
				top: 8px;
				right: 48px;
			}
			.taskitem-large-run .taskitem-rightarrow {
				opacity: 0;
			}
				.taskitem-large-run .taskitem-img-format {
					top: 0px;
					left: 0px;
				}
				.taskitem-large-run .taskitem-img-vcodec {
					top: 0px;
					left: 112px;					
				}
				.taskitem-large-run .taskitem-img-acodec {
					top: 0px;
					left: 224px;
				}
				.taskitem-large-run .taskitem-span-format {
					top: 5px;
					left: 40px;
				}
				.taskitem-large-run .taskitem-span-vcodec {
					top: 5px;
					left: 152px;					
				}
				.taskitem-large-run .taskitem-span-acodec {
					top: 5px;
					left: 264px;
				}
				.taskitem-large-run .taskitem-img-size {
					top: 36px;
					left: 0px;
				}
				.taskitem-large-run .taskitem-img-vratecontrol {
					top: 36px;
					left: 112px;
				}
				.taskitem-large-run .taskitem-img-aratecontrol {
					top: 36px;
					left: 224px;
				}
				.taskitem-large-run .taskitem-span-size {
					top: 41px;
					left: 40px;
				}
				.taskitem-large-run .taskitem-span-vratecontrol {
					top: 41px;
					left: 152px;					
				}
				.taskitem-large-run .taskitem-span-aratecontrol {
					top: 41px;
					left: 264px;
				}
				.taskitem-large-run .taskitem-info div {
					position: absolute;
					width: 32px;
					height: 32px;
					background-size: cover;
					/*border: #DDD 1px dashed;*/
				}
				.taskitem-large-run .taskitem-info span {
					position: absolute;
					display: block;
					width: 0px;
					font-size: 14px;
					/*border: #DDD 1px dashed;*/
				}
				.taskitem-large-run .taskitem-size-compact {
					line-height: 12px;
					font-size: 11px !important;
				}

			.taskitem-large-run .taskitem-graphs {
				position: absolute;
				right: 400px;
				top: 8px;
				width: 336px;
				display: flex;
				justify-content: space-around;
			}
				.taskitem-large-run .taskitem-graph {
					position: relative;
					display: inline-block;
					width: 64px;
					height: 64px;
				}
					.taskitem-large-run .taskitem-graph-ring {
					}
					.taskitem-large-run .taskitem-graph-data {
						position: absolute;
						top: 50%;
						width: 100%;
						text-align: center;
						font-weight: 600;
						transform: translateY(-51%);
						font-size: 15px;
						font-family: Bahnschrift,Calibri,"SF Electrotome",Avenir,苹方-简,苹方,微软雅黑,"Segoe UI",Consolas,Roboto,黑体;
					}
					.taskitem-large-run .taskitem-graph-description {
						position: absolute;
						bottom: -2px;
						width: 100%;
						text-align: center;
						font-size: 12px;
					}
			
			@media screen and (min-width: 0px) and (max-width: 1199px) {
				.taskitem-large-run .taskitem-infobefore, .taskitem-large-run .taskitem-graphs {
					width: 0px;
				}
				.taskitem-large-run .taskitem-rightarrow {
					opacity: 0;
				}
				.taskitem-large-run .taskitem-filename {
					width: calc(100% - 516px);
				}
			}
			.taskitem-large-run .taskitem-delete {
			}
			.taskitem-large-run .taskitem-delete:hover {
			}
			.taskitem-large-run .taskitem-delete:active {
			}


/* ================================ 小号列表项 ================================ */

.taskitem-small {
}
	.taskitem-small .taskitem-background-wrapper {
	}
		.taskitem-small .taskitem-background {
			position: relative;
			height: 60px;
		}
			.taskitem-small .taskitem-background-white {
			}
			.taskitem-small .taskitem-background-progress {
			}
			.taskitem-small .taskitem-previewbox {
				position: absolute;
				left: 8px;
				top: 8px;
				width: 96px;
				height: 46px;
				display: flex;
				align-items: center;
				justify-content: center;
				border: #DDD 1px dashed;
			}
			.taskitem-small .taskitem-previewbox img {
			}
			.taskitem-small .taskitem-timing {
				position: absolute;
				left: 112px;
				top: 38px;
				width: 0;
				font-size: 14px;
			}
			.taskitem-small .taskitem-filename {
				position: absolute;
				left: 112px;
				top: 8px;
				width: calc(100% - 516px);
				height: 28px;
				font-size: 20px;
				font-weight: bold;
				white-space: nowrap;
				text-overflow: ellipsis;
			}
			.taskitem-small .taskitem-info {
				height: 48px;
				width: 336px;
			}
			.taskitem-small .taskitem-infobefore {
				position: absolute;
				top: 6px;
				right: 448px;
				width: 0;
			}
			.taskitem-small .taskitem-infoafter {
				position: absolute;
				top: 6px;
				right: 48px;
			}
			.taskitem-small .taskitem-rightarrow {
				opacity: 0;
			}
				.taskitem-small .taskitem-img-format {
					top: 0px;
					left: 11px;
				}
				.taskitem-small .taskitem-img-vcodec {
					top: 0px;
					left: 123px;					
				}
				.taskitem-small .taskitem-img-acodec {
					top: 0px;
					left: 235px;
				}
				.taskitem-small .taskitem-span-format {
					top: 34px;
					left: 0px;
				}
				.taskitem-small .taskitem-span-vcodec {
					top: 34px;
					left: 112px;					
				}
				.taskitem-small .taskitem-span-acodec {
					top: 34px;
					left: 224px;
				}
				.taskitem-small .taskitem-img-size {
					top: 0px;
					left: 67px;
				}
				.taskitem-small .taskitem-img-vratecontrol {
					top: 0px;
					left: 179px;
				}
				.taskitem-small .taskitem-img-aratecontrol {
					top: 0px;
					left: 291px;
				}
				.taskitem-small .taskitem-span-size {
					top: 34px;
					left: 56px;
				}
				.taskitem-small .taskitem-span-vratecontrol {
					top: 34px;
					left: 168px;					
				}
				.taskitem-small .taskitem-span-aratecontrol {
					top: 34px;
					left: 280px;
				}
				.taskitem-small .taskitem-info div {
					position: absolute;
					width: 32px;
					height: 32px;
					background-size: cover;
					/*border: #DDD 1px dashed;*/
				}
				.taskitem-small .taskitem-info span {
					position: absolute;
					display: block;
					width: 54px;
					line-height: 16.5px;
					font-size: 10px;
					/*border: #DDD 1px dashed;*/
				}
				
				.taskitem-small .taskitem-size-compact {
					line-height: 16.8px;
					height: 16.8px;
				}
				
			.taskitem-small .taskitem-graphs {
				position: absolute;
				right: 400px;
				top: 8px;
				width: 0px;
				display: flex;
				justify-content: space-around;
			}
				.taskitem-small .taskitem-graph {
					position: relative;
					display: inline-block;
					width: 48px;
					height: 48px;
				}
					.taskitem-small .taskitem-graph-ring {
					}
					.taskitem-small .taskitem-graph-data {
						position: absolute;
						top: 50%;
						width: 100%;
						text-align: center;
						font-weight: 600;
						transform: translateY(-51%);
						font-size: 12px;
						font-family: Bahnschrift,Calibri,"SF Electrotome",Avenir,苹方-简,苹方,微软雅黑,"Segoe UI",Consolas,Roboto,黑体;
					}
					.taskitem-small .taskitem-graph-description {
						position: absolute;
						bottom: -2px;
						width: 100%;
						text-align: center;
						font-size: 9px;
					}

			@media screen and (min-width: 0px) and (max-width: 1199px) {
			}
			.taskitem-small .taskitem-delete {
			}
			.taskitem-small .taskitem-delete:hover {
			}
			.taskitem-small .taskitem-delete:active {
			}


/* ================================ 小号运行中列表项 ================================ */

.taskitem-small-run {
}
	.taskitem-small-run .taskitem-background-wrapper {
	}
		.taskitem-small-run .taskitem-background {
			position: relative;
			height: 60px;
		}
			.taskitem-small-run .taskitem-background-white {
			}
			.taskitem-small-run .taskitem-background-progress {
			}
			.taskitem-small-run .taskitem-previewbox {
				position: absolute;
				left: 8px;
				top: 8px;
				width: 96px;
				height: 46px;
				display: flex;
				align-items: center;
				justify-content: center;
				border: #DDD 1px dashed;
			}
			.taskitem-small-run .taskitem-previewbox img {
			}
			.taskitem-small-run .taskitem-timing {
				position: absolute;
				left: 112px;
				top: 38px;
				width: 0;
				font-size: 14px;
			}
			.taskitem-small-run .taskitem-filename {
				position: absolute;
				left: 112px;
				top: 8px;
				width: calc(100% - 870px);
				height: 28px;
				font-size: 20px;
				font-weight: bold;
				white-space: nowrap;
				text-overflow: ellipsis;
			}
			.taskitem-small-run .taskitem-info {
				height: 48px;
				width: 336px;
			}
			.taskitem-small-run .taskitem-infobefore {
				position: absolute;
				top: 6px;
				right: 448px;
				width: 0;
			}
			.taskitem-small-run .taskitem-infoafter {
				position: absolute;
				top: 6px;
				right: 48px;
			}
			.taskitem-small-run .taskitem-rightarrow {
				opacity: 0;
			}
				.taskitem-small-run .taskitem-img-format {
					top: 0px;
					left: 11px;
				}
				.taskitem-small-run .taskitem-img-vcodec {
					top: 0px;
					left: 123px;					
				}
				.taskitem-small-run .taskitem-img-acodec {
					top: 0px;
					left: 235px;
				}
				.taskitem-small-run .taskitem-span-format {
					top: 34px;
					left: 0px;
				}
				.taskitem-small-run .taskitem-span-vcodec {
					top: 34px;
					left: 112px;					
				}
				.taskitem-small-run .taskitem-span-acodec {
					top: 34px;
					left: 224px;
				}
				.taskitem-small-run .taskitem-img-size {
					top: 0px;
					left: 67px;
				}
				.taskitem-small-run .taskitem-img-vratecontrol {
					top: 0px;
					left: 179px;
				}
				.taskitem-small-run .taskitem-img-aratecontrol {
					top: 0px;
					left: 291px;
				}
				.taskitem-small-run .taskitem-span-size {
					top: 34px;
					left: 56px;
				}
				.taskitem-small-run .taskitem-span-vratecontrol {
					top: 34px;
					left: 168px;					
				}
				.taskitem-small-run .taskitem-span-aratecontrol {
					top: 34px;
					left: 280px;
				}
				.taskitem-small-run .taskitem-info div {
					position: absolute;
					width: 32px;
					height: 32px;
					background-size: cover;
					/*border: #DDD 1px dashed;*/
				}
				.taskitem-small-run .taskitem-info span {
					position: absolute;
					display: block;
					width: 54px;
					line-height: 16.5px;
					font-size: 10px;
					/*border: #DDD 1px dashed;*/
				}
				
				.taskitem-small-run .taskitem-size-compact {
					line-height: 16.8px;
					height: 16.8px;
				}

			.taskitem-small-run .taskitem-graphs {
				position: absolute;
				right: 400px;
				top: 8px;
				width: 336px;
				display: flex;
				justify-content: space-around;
			}
				.taskitem-small-run .taskitem-graph {
					position: relative;
					display: inline-block;
					width: 48px;
					height: 48px;
				}
					.taskitem-small-run .taskitem-graph-ring {
					}
					.taskitem-small-run .taskitem-graph-data {
						position: absolute;
						top: 50%;
						width: 100%;
						text-align: center;
						font-weight: 600;
						transform: translateY(-51%);
						font-size: 12px;
						font-family: Bahnschrift,Calibri,"SF Electrotome",Avenir,苹方-简,苹方,微软雅黑,"Segoe UI",Consolas,Roboto,黑体;
					}
					.taskitem-small-run .taskitem-graph-description {
						position: absolute;
						bottom: -2px;
						width: 100%;
						text-align: center;
						font-size: 9px;
					}
				
			@media screen and (min-width: 0px) and (max-width: 1199px) {
				.taskitem-small-run .taskitem-infoafter {
					transform: scale(0.5);
					right: -30px;
				}
				.taskitem-small-run .taskitem-filename {
					width: calc(100% - 610px);
				}
				.taskitem-small-run .taskitem-graphs {
					width: 256px;
					right: 230px;
				}
			}
			.taskitem-small-run .taskitem-delete {
			}
			.taskitem-small-run .taskitem-delete:hover {
			}
			.taskitem-small-run .taskitem-delete:active {
			}

</style>

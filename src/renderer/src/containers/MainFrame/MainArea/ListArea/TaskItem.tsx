import { computed, defineComponent, FunctionalComponent } from 'vue'; // defineComponent 的主要功能是提供类型检查
import { TaskStatus, UITask } from '@common/types';
import { generator as vGenerator } from '@common/vcodecs';
import { generator as aGenerator } from '@common/acodecs';
import IconPreview from '@renderer/assets/video.svg';
import IconRightArrow from '@renderer/assets/swap_right.svg';
import style from './TaskItem.module.less';

interface Props {
	task: UITask;
}

export const TaskItem: FunctionalComponent<Props> = (props) => {
	const { task } = props;

	const beforeBitrateFilter = (kbps: number) => {
		if (isNaN(kbps)) {
			return '读取中';
		} else if (kbps >= 10000) {
			return (kbps / 1000).toFixed(1) + ' Mbps';
		} else {
			return kbps + ' kbps';
		}
	};
	const smpteBefore = computed(() => task.before.vresolution && task.before.vframerate ? `${task.before.vresolution.replace('<br />', '×')}@${task.before.vframerate}` : '-');
	const videoRateControlValue = computed(() => vGenerator.getRateControlParam(task.after.video).value);
	const audioRateControlValue = computed(() => aGenerator.getRateControlParam(task.after.audio).value);
	const videoRateControl = computed(() => (videoRateControlValue.value === '-' ? '' : `@${task.after.video.ratecontrol} ${videoRateControlValue.value}`));
	const audioRateControl = computed(() => (audioRateControlValue.value === '-' ? '' : `@${task.after.audio.ratecontrol} ${audioRateControlValue.value}`));
	const videoInputBitrate = computed(() => task.before.vbitrate > 0 ? `@${beforeBitrateFilter(task.before.vbitrate)}` : '');
	const audioInputBitrate = computed(() => task.before.abitrate > 0 ? `@${beforeBitrateFilter(task.before.abitrate)}` : '');
	// console.log(task.fileBaseName, videoRateControl.value, videoRateControl.value);
	// console.log(props);

	const deleteButtonBackgroundPositionX = computed(() => {
		switch (task.status) {
			case TaskStatus.TASK_STOPPED:
				return '0px';	// 删除按钮
			case TaskStatus.TASK_RUNNING:
				return '-16px';	// 暂停按钮
			case TaskStatus.TASK_PAUSED: case TaskStatus.TASK_STOPPING: case TaskStatus.TASK_FINISHING: case TaskStatus.TASK_FINISHED: case TaskStatus.TASK_ERROR:
				return '-32px';	// 重置按钮
		}
		return '';
	});

	return (
		<div class={style.taskWrapper1}>
			<div class={style.taskWrapper2}>
				<div class={style.task}>
					<div class={style.backgroundWhite}></div>
					<div class={style.previewIcon}><IconPreview /></div>
					<div class={style.taskName}>{task.fileBaseName ?? '读取中'}</div>
					<div class={style.paraArea}>
						<div class={style.divider}><div></div></div>
						{/* 容器 */}
						<div class={style.formatBefore}>{task.before.format}</div>
						<div class={style.formatTo}><IconRightArrow /></div>
						<div class={style.formatAfter}>{task.after.output.format}</div>
						<div class={style.divider}><div></div></div>
						{/* 分辨率码率 */}
						<div class={style.smpteBefore}>{smpteBefore.value}</div>
						<div class={style.smpteTo}><IconRightArrow /></div>
						<div class={style.smpteAfter}>{task.after.video.resolution}@{task.after.video.framerate}</div>
						<div class={style.divider}><div></div></div>
						{/* 视频 */}
						<div class={style.videoBefore}>{task.before.vcodec}{videoInputBitrate.value}</div>
						<div class={style.videoTo}><IconRightArrow /></div>
						<div class={style.videoAfter}>{task.after.video.vcodec}{videoRateControl.value}</div>
						<div class={style.divider}><div></div></div>
						{/* 音频 */}
						<div class={style.audioBefore}>{task.before.acodec}{audioInputBitrate.value}</div>
						<div class={style.audioTo}><IconRightArrow /></div>
						<div class={style.audioAfter}>{task.after.audio.acodec}{audioRateControl.value}</div>
						<div class={style.divider}><div></div></div>
					</div>
					<button class={style.button}>
						<div style={{ backgroundPositionX: deleteButtonBackgroundPositionX.value }}></div>
					</button>
				</div>
			</div>
		</div>
	);
};

// export const TaskItem = defineComponent({
// 	setup() {
// 		return () => (
// 			<div class={style.red}>Helloo!!!</div>
// 		);
// 	}
// });

// export const TaskJtem = defineComponent({
// 	render() {
// 		return <div>Vue 3.0</div>;
// 	},
// });

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import nodeBridge from '@renderer/bridges/nodeBridge';
import { useAppStore } from '@renderer/stores/appStore';
import Popup from '@renderer/components/Popup/Popup';
import { NotificationLevel } from '@common/types';
import { TaskItem } from './ListArea/TaskItem';
import IconNoffmpeg from '@renderer/assets/mainArea/noffmpeg.svg?component';

const appStore = useAppStore();

const selectedTask_last = ref(-1);
const dragging = ref(false);

const tasks = computed(() => {
	// console.log('服务器', appStore.currentServer, '任务', appStore.currentServer?.data.tasks);
	const currentServer = appStore.currentServer;
	if (!currentServer) {
		return [];
	}
	const ret = [];
	// 为 tasklist 中的每个条目补充 id（以前我这么设计，是为了节省一个字段，🤔但现在看来这个做法有点“个性”😂）
	for (const [id_s, task] of Object.entries(currentServer.data.tasks)) {
		let id = parseInt(id_s);
		if (id_s !== '-1') {
			ret.push({ ...task, id });
		}
	}
	// 新任务加入，滚动到底
	// if (ret.length > this.lastTaskListLength) {
	// 	let tasklistWrapper = this.$refs.tasklist_wrapper as Element;
	// 	tasklistWrapper.scrollTop = tasklistWrapper.scrollHeight - tasklistWrapper.getBoundingClientRect().height;
	// }
	// this.lastTaskListLength = ret.length;
	return ret;
});

const hasFFmpeg = computed(() => appStore.currentServer?.data.ffmpegVersion !== '-');

const debugLauncher = (() => {
	let clickSpeedCounter = 0;
	let clickSpeedTimer = 0;
	let clickSpeedTimerStatus = false;
	return function () {
		clickSpeedCounter += 20;
		if (clickSpeedCounter > 100) {
			Popup({
			    message: '打开开发者工具',
			    level: NotificationLevel.info
			});
			console.log('打开开发者工具');
			nodeBridge.openDevTools();
			clickSpeedCounter = 0;
			clearInterval(clickSpeedTimer);
			clickSpeedTimerStatus = false;
		} else if (clickSpeedTimerStatus == false) {
			clickSpeedTimerStatus = true;
			clickSpeedTimer = setInterval(() => {
				// console.log(clickSpeedCounter)
				if (clickSpeedCounter == 0) {
					clearInterval(clickSpeedTimer);
					clickSpeedTimerStatus = false;
				}
				clickSpeedCounter -= 1;
			}, 70) as any as number;
		}
	}
})();

const handleTaskClicked = (event: MouseEvent, id: number, index: number) => {
	let currentSelection = new Set(appStore.selectedTask);
	if (event.shiftKey) {
		if (selectedTask_last.value !== -1) {		// 之前没选东西，现在选一堆
			currentSelection.clear();
			const minIndex = Math.min(selectedTask_last.value, index);
			const maxIndex = Math.max(selectedTask_last.value, index);
			for (let i = minIndex; i <= maxIndex; i++) {	// 对 taskOrder 里指定区域项目进行选择
				currentSelection.add(tasks.value[i].id);
				// if (taskArray.has(id)) {	// 如果任务未被删除
				// 	currentSelection.add(i);
				// }
			}
		} else {							// 之前没选东西，现在选第一个
			currentSelection = new Set([id]);
		}
	} else if (event.ctrlKey == true || nodeBridge.os === 'MacOS' && event.metaKey == true) {
		if (currentSelection.has(id)) {
			currentSelection.delete(id);
		} else {
			currentSelection.add(id);
		}
	} else {
		currentSelection.clear();
		currentSelection.add(id);
	}
	selectedTask_last.value = index;
	// this.selectedTask = new Set([...this.selectedTask])	// 更新自身的引用值以触发 computed: taskSelected
	appStore.selectedTask = new Set([...currentSelection]);
	appStore.applySelectedTask();
};

const handleDownloadFFmpegClicked = () => {
	nodeBridge.jumpToUrl('https://ffmpeg.org/download.html');
};

const onDragenter = (event: DragEvent) => {
	// 这里把 dragenter 和 dragover 都引到这里了，拖动时会高频率调用，虽然不是很好，但是不加 dragover 会导致 drop 没反应
	if (!appStore.currentServer || appStore.currentServer.data.ffmpegVersion === '-') {
		return;
	}
	event.preventDefault();
	dragging.value = true;
};
const onDragleave = (event: DragEvent) => {
	event.preventDefault();
	dragging.value = false;
};
const onDrop = (event: DragEvent) => {	// 此函数触发四次 taskList update，分别为加入任务、ffmpeg data、ffmpeg metadata、selectedTask update？
	event.stopPropagation();
	dragging.value = false;
	appStore.addTasks(event.dataTransfer?.files);
};

</script>

<template>
	<div class="listarea"  @dragenter="onDragenter($event)" @dragover="onDragenter($event)" @dragleave="onDragleave($event)" @drop="onDrop($event)">
		<div class="tasklist">
			<TaskItem
				v-for="(task, index) in tasks"
				:key="task.id"
				:task="task"
				:id="task.id"
				:selected="appStore.selectedTask.has(task.id)"
				@click="handleTaskClicked($event, task.id, index)"
				@pause-or-remove="appStore.pauseNremove(task.id)"/>
		</div>
		<div v-if="hasFFmpeg" class="dropfilesdiv" @click="appStore.selectedTask = new Set()">
			<div class="dropfilesimage" @click="debugLauncher" :class="dragging ? 'imgDragging' : 'imgNormal'" />
		</div>
		<div v-else class="noffmpeg">
			<div class="box">
				<IconNoffmpeg />
				<div class="right">
					<h2>FFmpeg 依赖缺失</h2>
					<p class="smallTip">请按以下步骤解决问题：</p>
					<div style="height: 12px" />
					<p>1. 在<a @click="handleDownloadFFmpegClicked"> FFmpeg 官网</a>下载对应操作系统的程序</p>
					<p>　　2.1. 选择一：将 ffmpeg 可执行文件所在路径放至于环境变量中</p>
					<p>　　2.2. 选择二：将 ffmpeg 可执行文件放入 FFBox 可执行程序路径</p>
					<div style="height: 4px" />
					<p>完成以上操作后，重启本软件即可开始使用</p>
					<div style="height: 12px" />
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="less">
	.listarea {
		position: relative;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		height: 100%;
		padding: 8px 0;
		overflow-y: auto;
		.tasklist {
			margin-bottom: 14px;
		}
		.dropfilesdiv {
			display: flex;
			width: 100%;
			min-height: 80px;
			flex-grow: 1;
			.dropfilesimage {
				background-size: contain;
				background-position: center;
				background-repeat: no-repeat;
				margin: auto;
				width: 100%;
				max-height: 200px;
				height: 100%;
			}
			.imgNormal {
				background-image: url(/src/assets/mainArea/drop_files.png);
			}
			.imgDragging {
				background-image: url(/src/assets/mainArea/drop_files_ok.png);
			}
		}
		.noffmpeg {
			position: absolute;
			left: 0;
			top: 0;
			width: 100%;
			height: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
			.box {
				border-radius: 8px;
				background-color: hwb(var(--bg97) / 0.8);
				box-shadow: 0 3px 2px -2px hwb(var(--highlight)) inset,	// 上亮光
							0 16px 32px 0px hwb(var(--hoverShadow) / 0.02),
							0 6px 6px 0px hwb(var(--hoverShadow) / 0.02),
							0 0 0 1px hwb(var(--highlight) / 0.9);	// 包边
				display: flex;
				justify-content: center;
				align-items: center;
				width: 720px;
				text-align: left;
				transition: all 0.3s ease-in-out;
				@media only screen and (max-width: 760px) {
					width: 660px;
				}
				svg {
					width: 120px;
					height: auto;
					padding-right: 24px;
					transition: all 0.3s ease-in-out;
					@media only screen and (max-width: 680px) {
						width: 0;
						padding-right: 0;
					}
				}
				.right {
					padding: 0 12px;
					.smallTip {
						margin-top: -16px;
						font-size: 13px;
					}
					p {
						font-size: 15px;
						margin-block-start: 0.5em;
						margin-block-end: 0.5em;
					}
					a {
						color: var(--titleText);
						cursor: pointer;
					}
				}
			}
		}
	}
</style>

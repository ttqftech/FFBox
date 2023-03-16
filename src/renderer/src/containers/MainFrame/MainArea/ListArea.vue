<script setup lang="ts">
import nodeBridge from '@renderer/bridges/nodeBridge';
import { useAppStore } from '@renderer/stores/appStore';
import { computed, ref } from 'vue';
import { TaskItem } from './ListArea/TaskItem';

const appStore = useAppStore();

const selectedTask_last = ref(-1);

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
const dropfilesimage = computed(() => 'src/assets/mainArea/drop_files.png');

const debugLauncher = (() => {
	let clickSpeedCounter = 0;
	let clickSpeedTimer = 0;
	let clickSpeedTimerStatus = false;
	return function () {
		clickSpeedCounter += 20;
		if (clickSpeedCounter > 100) {
			// @ts-ignore
			// this.$popup({
			//     message: '打开开发者工具',
			//     level: NotificationLevel.info
			// });
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
	console.log('选中', appStore.selectedTask);
	appStore.applySelectedTask();
};
</script>

<template>
	<div class="listarea">
		<div class="tasklist">
			<TaskItem
				v-for="(task, index) in tasks"
				:key="task.id"
				:task="task"
				:selected="appStore.selectedTask.has(task.id)"
				@click="handleTaskClicked($event, task.id, index)" />
		</div>
		<div class="dropfilesdiv" @click="appStore.selectedTask = new Set()">
			<div class="dropfilesimage" @click="debugLauncher" :style="{ 'backgroundImage': `url(${dropfilesimage})` }" />
		</div>
	</div>
</template>

<style lang="less">
	.listarea {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
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
				/* background-image: url(/images/mainArea/drop_files.png); */
				background-size: contain;
				background-position: center;
				background-repeat: no-repeat;
				margin: auto;
				width: 100%;
				max-height: 200px;
				height: 100%;
			}
		}
	}
</style>

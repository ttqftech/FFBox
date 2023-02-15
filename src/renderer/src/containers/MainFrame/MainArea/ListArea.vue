<script setup lang="ts">
import nodeBridge from '@renderer/bridges/nodeBridge';
import { useAppStore } from '@renderer/stores/appStore';
import { computed } from 'vue';
import { TaskItem } from './ListArea/TaskItem';

const appStore = useAppStore();
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
const dropfilesimage = computed(() => 'src/assets/drop_files.png');

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
</script>

<template>
	<div class="listarea">
		<div class="tasklist">
			<TaskItem v-for="task in tasks" :key="task.id" :task="task" />
		</div>
		<div class="dropfilesdiv">
			<div class="dropfilesimage" @click="debugLauncher" :style="{ 'backgroundImage': `url(${dropfilesimage})` }"></div>
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
		.dropfilesdiv {
			display: flex;
			width: 100%;
			min-height: 80px;
			margin-top: 8px;
			flex-grow: 1;
			.dropfilesimage {
				/* background-image: url(/images/drop_files.png); */
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

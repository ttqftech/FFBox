<template>
	<div id="listview" :style="{ height: $store.state.draggerPos + '%' }">
		<transition name="listviews-ani">
			<tasks-view v-show="$store.state.listSelected == 0"></tasks-view>
		</transition>
		<transition name="listviews-ani">
			<command-view v-show="$store.state.listSelected == 1"></command-view>
		</transition>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';

import TasksView from './Listview/TasksView.vue'
import CommandView from './Listview/CommandView.vue'

export default Vue.extend({
	name: 'Listview',
	components: {
		TasksView, CommandView
	},
});
</script>

<style scoped>
	#listview {
		position: absolute;
		/* height: 60%; */
		min-height: 56px;
		max-height: calc(100% - 28px);
		width: 100%;
		left: 0;
	}
		.listviews-ani-enter, .listviews-ani-leave-to {
			/* z-index: 0; */
			opacity: 0;
			transform: translateY(40px);
		}
		.listviews-ani-enter-active, .listviews-ani-leave-active {
			transition: opacity 0.3s, transform 0.3s;
		}
		.listviews-ani-enter-to, .listviews-ani-leave {
			/* z-index: 1; */
			opacity: 1;
			transform: translateY(0);
		}

</style>

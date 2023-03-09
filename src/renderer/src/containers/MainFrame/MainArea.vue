<script setup lang="ts">
import { useAppStore } from '@renderer/stores/appStore';
import ListArea from './MainArea/ListArea.vue';
import ParaBox from './MainArea/ParaBox.vue';

const appStore = useAppStore();

</script>

<template>
	<div class="mainarea" :ref="(el) => appStore.componentRefs['MainArea'] = (el as Element)">
		<ListArea :style="{ height: `${appStore.draggerPos * 100}%` }" />
		<ParaBox :style="{ height: `${(1 - appStore.draggerPos) * 100}%` }" />
	</div>
</template>

<style lang="less">
	.mainarea {
		position: relative;
		width: 100%;
		// height: 24px;
		background-color: hwb(0 92% 8%);
		flex: 1 1 auto;
		overflow-y: auto;
		// .listarea
		// .parabox
	}

</style>
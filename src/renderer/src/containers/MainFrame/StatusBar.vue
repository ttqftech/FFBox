<script setup lang="ts">
import { useAppStore } from '@renderer/stores/appStore';

const appStore = useAppStore();

</script>

<template>
	<div class="statusbar"></div>
</template>

<style lang="less">
	.statusbar {
		width: 100%;
		height: 24px;
		background-color: hwb(220 25% 10%);
		/* box-shadow: 0 3px 2px -2px hwb(0deg 100% 0%) inset; */
	}
</style>
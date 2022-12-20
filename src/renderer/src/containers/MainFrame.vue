<script setup lang="ts">
</script>

<template>
	<div class="container">
		<div class="titlebar"></div>
		<div class="actionbar"></div>
		<div class="listarea"></div>
		<div class="parabox"></div>
		<div class="statusbar"></div>
	</div>
	<div class="icon"></div>
</template>

<style lang="less" scoped>
	.container {
		display: flex;
		flex-direction: column;		
		height: 100%;
		.titlebar {
			width: 100%;
			height: 32px;
			background-color: hwb(220 95% 2%);
			box-shadow: 0 -32px 32px -16px hwb(0 0% 100% / 0.02) inset,
						0 -8px 8px -4px hwb(0 0% 100% / 0.02) inset;
		}
		.actionbar {
			width: 100%;
			height: 48px;
			background-color: hwb(220 97% 3%);
			box-shadow: 0 3px 2px -2px hwb(0deg 100% 0%) inset,
						0 20px 20px 0px hwb(0 0% 100% / 0.02),
						0 6px 6px 0px hwb(0 0% 100% / 0.02);
			z-index: 1;
		}
		.listarea {
			width: 100%;
			// height: 24px;
			background-color: hwb(0 93% 7%);
			flex: 1 0 auto;
		}
		.statusbar {
			width: 100%;
			height: 24px;
			background-color: hwb(220 25% 10%);
			/* box-shadow: 0 3px 2px -2px hwb(0deg 100% 0%) inset; */
		}
	}
</style>

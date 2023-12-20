<script setup lang="ts">
interface Props {
	onClick?: () => any;
}

const props = defineProps<Props>();
</script>

<template>
	<button class="buttonbox" @click="(props.onClick || (() => {}))()">
		<slot></slot>
	</button>
</template>

<style scoped>
	.buttonbox {
		position: relative;
		height: 36px;
		width: 120px;
		border-radius: 10px;
		background: linear-gradient(180deg, #fefefe, #f0f0f0);
		box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.3);
		margin: 8px 12px;
		border: none;
		outline: none;
		font: inherit;
	}
	.buttonbox:active {
		background: linear-gradient(180deg, var(--e7), #f0f0f0);
	}
	.buttonbox:active:before {
		display: none;
	}
	.buttonbox:hover:before {
		position: absolute;
		top: 0;
		left: 0;
		content: "";
		width: 100%;
		height: 100%;
		border-radius: 10px;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3));
	}
	.buttonbox img {
		position: absolute;
		left: 10px;
		top: 8px;
		width: 20px;
		height: 20px;
	}
	.buttonbox span {
		position: absolute;
		top: 0;
		right: 10px;
		line-height: 36px;
		text-align: center;
		font-size: 15px;
		color: hsl(0, 0%, 20%);
	}

</style>

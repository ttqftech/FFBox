<script setup lang="ts">
import MainFrame from './containers/MainFrame.vue';
</script>

<template>
	<MainFrame id="app" />
</template>

<style>
	body {
		width: 100vw;
		height: 100vh;
		margin: 0;
		font-weight: 400;
		-webkit-font-smoothing: grayscale;
		-moz-osx-font-smoothing: grayscale;
		text-align: center;
		color: hsl(0, 0%, 20%);
		position: relative;
		overflow: hidden;
	}
	#app {
		height: 100vh;
		overflow: hidden;
	}
</style>

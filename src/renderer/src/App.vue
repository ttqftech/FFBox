<script setup lang="ts">
import MainFrame from './containers/MainFrame.vue';
</script>

<template>
	<MainFrame id="app" />
</template>

<style>
	html {
		overflow: hidden;
	}
	body {
		width: 100vw;
		height: 100vh;
		margin: 0;
		font-weight: 400;
        font-family: "PingFang SC", 苹方, 微软雅黑, "Segoe UI", Consolas, Avenir, Arial, Helvetica, sans-serif, 黑体;
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
		position: relative;
	}
</style>

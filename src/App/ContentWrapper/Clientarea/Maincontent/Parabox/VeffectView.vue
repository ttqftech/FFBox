<template>
	<div id="veffect-view">
		<p style="text-align: center;">此功能暂未开发<br />请关注 https://FFBox.ttqf.tech/ 以获取版本更新</p>
	</div>
</template>

<script>

export default {
	name: 'VeffectView',
	components: {
		
	},
	props: {		
	},
	computed: {

	},
	methods: {
	}
}
</script>

<style scoped>
	#veffect-view {
		position: absolute;
		width: 100%;
		height: 100%;
		overflow-y: auto;
		display: flex;
		flex-wrap: wrap;
		align-items: center;	/* 一行 */
		/* align-content: space-between;	 多行 */
		justify-content: space-around;
	}

</style>

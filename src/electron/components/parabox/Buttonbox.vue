<template>
	<button class="buttonbox" @click="onClick">
		<img v-if="imgsrc" :src="imgsrc">
		<span :style="{ left: imgsrc ? '40px' : '10px' }">{{ text }}</span>
	</button>
</template>

<script>

export default {
	name: 'Buttonbox',
	components: {
	},
	props: {
		text: String,
		imgsrc: String,
	},
	computed: {
	},
	methods: {
		onClick: function (event) {
			this.$emit('click')
		}
	},
}
</script>

<style scoped>
	.buttonbox {
		position: relative;
		height: 40px;
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
		background: linear-gradient(180deg, #e7e7e7, #f0f0f0);
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
		top: 10px;
		width: 20px;
		height: 20px;
	}
	.buttonbox span {
		position: absolute;
		top: 0;
		/* left: 40px; */ /* 由 v-style 控制 */
		right: 10px;
		line-height: 40px;
		text-align: center;
		color: hsl(0, 0, 20%);
	}

</style>

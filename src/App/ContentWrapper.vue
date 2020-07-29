<template>
	<div id="content-wrapper">
		<titlebar></titlebar>
		<clientarea></clientarea>
		<statusbar></statusbar>
		<infocenter></infocenter>
	</div>
</template>

<script>
import Titlebar from './ContentWrapper/Titlebar'
import Clientarea from './ContentWrapper/Clientarea'
import Statusbar from './ContentWrapper/Statusbar'
import Infocenter from './ContentWrapper/Infocenter'

export default {
	name: 'ContentWrapper',
	components: {
		Titlebar, Clientarea, Statusbar, Infocenter
	},
	props: {
	},
	methods: {
	}
}
</script>

<style scoped>
	#content-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		background: hsl(0, 0%, 92.5%);
		overflow: hidden;
		border-radius: 14px;
	}
</style>

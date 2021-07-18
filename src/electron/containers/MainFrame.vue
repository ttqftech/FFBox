<template>
	<div id="content-wrapper">
		<titlebar></titlebar>
		<clientarea></clientarea>
		<statusbar></statusbar>
		<infocenter></infocenter>
		<sponsorcenter></sponsorcenter>
	</div>
</template>

<script>
import Titlebar from './MainFrame/Titlebar'
import Clientarea from './MainFrame/Clientarea'
import Statusbar from './MainFrame/Statusbar'
import Infocenter from './MainFrame/Infocenter'
import Sponsorcenter from './MainFrame/Sponsorcenter'

export default {
	name: 'MainFrame',
	components: {
		Titlebar, Clientarea, Statusbar, Infocenter, Sponsorcenter
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
		background: transparent;
		overflow: hidden;
		border-radius: 14px;
	}
</style>

<template>
	<div id="maincontent">
		<listview></listview>
		<parabox></parabox>
	</div>
</template>

<script>
import Listview from './Maincontent/Listview'
import Parabox from './Maincontent/Parabox'

export default {
	name: 'Maincontent',
	components: {
		Listview, Parabox
	},
	props: {
	},
	methods: {
	}
}
</script>

<style scoped>
	#maincontent {
		position: absolute;
		height: 100%;
		left: 139px;
		width: calc(100% - 139px);
		background: hsla(0, 0%, 92.5%, 1);
		overflow: hidden;
	}
</style>

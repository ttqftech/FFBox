<template>
	<div id="floating-content">
        <msgbox v-for="(value) in $store.state.msgboxs" :value="value" :key="value.id"></msgbox>
        <popup v-for="(value) in $store.state.popups" :value="value" :key="value.id"></popup>
        <combomenu></combomenu>
        <tooltip></tooltip>
	</div>
</template>

<script>
import Popup from './FloatingContent/Popup'
import Msgbox from './FloatingContent/Msgbox'
import Combomenu from './FloatingContent/Combomenu'
import Tooltip from './FloatingContent/Tooltip'

export default {
    name: 'FloatingContent',
    components: {
        Popup, Msgbox, Combomenu, Tooltip
    },
	props: {
		
	},
	computed: {

    },
}
</script>

<style scoped>
    #floating-content {
        position: absolute;
        top: 0;
        height: 100%;
        width: 100%;
        pointer-events: none;
    }
    #floating-content>* {
        pointer-events: initial;
    }
</style>

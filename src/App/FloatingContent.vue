<template>
	<div id="floating-content">
        <msgbox v-for="(value) in $store.state.msgboxs" :value="value" :key="value.id"></msgbox>
        <popup v-for="(value) in $store.state.popups" :value="value" :key="value.id"></popup>
        <combomenu :showCombomenu="$store.state.showCombomenu" :comboPosition="$store.state.comboPosition" :comboDefault="$store.state.comboDefault" :comboList="$store.state.comboList"></combomenu>
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
	props: {},
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

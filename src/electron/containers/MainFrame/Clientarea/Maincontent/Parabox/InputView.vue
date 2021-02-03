<template>
	<div id="input-view">
		<combobox title="硬件解码" :text="$store.state.globalParams.input.hwaccel" :list="hwaccelsList" @change="onChange('combo', 'hwaccel', $event)"></combobox>
		<inputbox title="剪辑起点" :text="$store.state.globalParams.input.begin" @change="onChange('input', 'begin', $event)" type="duration"></inputbox>
		<inputbox title="剪辑终点" :text="$store.state.globalParams.input.end" @change="onChange('input', 'end', $event)" type="duration"></inputbox>
	</div>
</template>

<script>
import { hwaccels, generator } from '@/App/Codecs/formats'
import Combobox from './Components/Combobox'
import Inputbox from './Components/Inputbox'
// import Checkbox from './Components/Checkbox'

export default {
	name: 'InputView',
	components: {
		Combobox, Inputbox
	},
	props: {
	},
	computed: {
		// 用途是给 template 读取，因为它不能直接读取 import 的变量
		hwaccelsList: function () {
			return hwaccels
		},
	},
	methods: {
		// 由子组件发生变化所触发的事件（mode 为组件类型，sName 为参数名，value 为参数值，list 为对于 combo 需要传入的列表（废弃））
		onChange: function (mode, sName, value) {
			this.$store.commit('changePara', {
				type: 'input',
				key: sName,
				value
			})
		},
	}
}
</script>

<style scoped>
	#input-view {
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

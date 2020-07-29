<template>
	<div id="format-view">
		<combobox title="容器/格式" :text="$store.state.globalParams.format.format" :list="formatsList" @change="onChange('combo', 'format', $event, formatsList)"></combobox>
		<checkbox title="元数据迁移" :checked="$store.state.globalParams.format.moveflags" @change="onChange('checkbox', 'moveflags', $event)"></checkbox>
		<combobox title="硬件解码" :text="$store.state.globalParams.format.hwaccel" :list="hwaccelsList" @change="onChange('combo', 'hwaccel', $event, hwaccelsList)"></combobox>
	</div>
</template>

<script>
import { formats, hwaccels, generator } from '@/App/Codecs/formats'
import Combobox from './Components/Combobox'
import Checkbox from './Components/Checkbox'

export default {
	name: 'FormatView',
	components: {
		Combobox, Checkbox
	},
	props: {		
	},
	computed: {
		// 用途是给 template 读取，因为它不能直接读取 import 的变量
		formatsList: function () {
			return formats
		},
		hwaccelsList: function () {
			return hwaccels
		},
	},
	methods: {
		// 由子组件发生变化所触发的事件（mode 为组件类型，sName 为参数名，value 为参数值，list 为对于 combo 需要传入的列表）
		onChange: function (mode, sName, value, list) {
			switch (mode) {
				case 'combo':
					// 注：这里 commit 的 value 不能直接读取 import 来的变量，直接用开发者工具读取也不行，但是 console.log 可以，疑似 vue 的 bug
					// console.log(this.formatsList[args.paramName + 's'][args.value].sName)
					this.$store.commit('changePara', {
						type: 'format',
						key: sName,
						value: list[value].sName
					})
					break;
				case 'checkbox':
					this.$store.commit('changePara', {
						type: 'format',
						key: sName,
						value
					})
					break;
			}
		},
	}
}
</script>

<style scoped>
	#format-view {
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

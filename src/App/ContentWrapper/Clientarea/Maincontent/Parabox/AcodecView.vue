<template>
	<div id="acodec-view">
		<combobox title="音频编码" :text="$store.state.globalParams.audio.acodec" :list="acodecsList" @change="onChange('combo', 'acodec', $event)"></combobox>
		<combobox title="编码器" :text="$store.state.globalParams.audio.aencoder" :list="aencodersList" @change="onChange('combo', 'aencoder', $event)" v-show="hasParameters > 1"></combobox>
		<combobox title="码率控制" :text="$store.state.globalParams.audio.ratecontrol" :list="ratecontrolsList" @change="onChange('combo', 'ratecontrol', $event)" v-if="ratecontrolsList != 0"></combobox>
		<slider v-if="ratecontrolSlier != null" :title="ratecontrolSlier.display" :value="$store.state.globalParams.audio.ratevalue" :tags="ratecontrolSlier.tags" :valueToText="ratecontrolSlier.valueToText" :valueProcess="ratecontrolSlier.valueProcess" @change="onChange('slider', 'ratevalue', $event)"></slider>
		<div v-for="(parameter, index) in parametersList" :key="index" :class="{ comboParent: parameter.mode == 'combo', sliderParent: parameter.mode == 'slider' }">
			<combobox class="fullSpace" v-if="parameter.mode == 'combo'" :title="parameter.display" :text="$store.state.globalParams.audio.detail[parameter.parameter]" :list="parameter.items" @change="onDetailChange('combo', parameter.parameter, $event)"></combobox>
			<slider class="fullSpace" v-if="parameter.mode == 'slider'" :title="parameter.display" :value="$store.state.globalParams.audio.detail[parameter.parameter]" :tags="parameter.tags" :valueToText="parameter.valueToText" :valueProcess="parameter.valueProcess" @change="onDetailChange('slider', parameter.parameter, $event)"></slider>
		</div>
		<slider title="音量" :value="$store.state.globalParams.audio.vol" :tags="volSlider.tags" :valueToText="volSlider.valueToText" :valueProcess="volSlider.valueProcess" @change="onChange('slider', 'vol', $event)" v-show="hasParameters > 0"></slider>
		<!-- <button @click="getAudioParams()">输出参数</button> -->
	</div>
</template>

<script>
import { acodecs, volSlider, generator } from '@/App/Codecs/acodecs'
import Combobox from './Components/Combobox'
import Checkbox from './Components/Checkbox'
import Slider from './Components/Slider'

export default {
	name: 'AcodecView',
	components: {
		Combobox, Checkbox, Slider
	},
	props: {
	},
	computed: {
		// 用途是给 template 读取，因为它不能直接读取 import 的变量
		acodecsList: function () {
			return acodecs
		},
		// aencoderList 中的项由 acodec 具体决定
		aencodersList: function () {
			var sName_acodec = this.$store.state.globalParams.audio.acodec
			if (sName_acodec != '禁用音频' && sName_acodec != '自动' && sName_acodec != '不重新编码') {
				var acodec = acodecs.find((value) => {
					return value.sName == sName_acodec
				})
				if (acodec) {
					return acodec.encoders
				} else {
					return []
				}
			} else {
				return []
			}
		},
		parametersList: function () {
			var sName_aencoder = this.$store.state.globalParams.audio.aencoder
			var aencoder = this.aencodersList.find((value) => {
				return value.sName == sName_aencoder
			})
			if (typeof aencoder != 'undefined') {
				var parameters = aencoder.parameters
				return parameters
			} else {
				return []
			}
		},
		ratecontrolsList: function () {
			var sName_aencoder = this.$store.state.globalParams.audio.aencoder
			var aencoder = this.aencodersList.find(value => {
				return value.sName == sName_aencoder
			})
			if (typeof aencoder != 'undefined') {
				var ratecontrol = aencoder.ratecontrol
				return ratecontrol
			} else {
				return []
			}
		},
		ratecontrolSlier: function () {
			var ratecontrolsList_ = this.ratecontrolsList
			if (ratecontrolsList_ == 0) {
				return null
			}
			var sName_ratecontrol = this.$store.state.globalParams.audio.ratecontrol
			var index = ratecontrolsList_.findIndex(value => {
				return value.sName == sName_ratecontrol
			})
			// 切换编码器后没有原来的码率控制模式了
			if (index == -1) {
				index = 0
				this.$store.commit('changePara', {
					type: 'audio',
					key: 'ratecontrol',
					value: ratecontrolsList_[0].sName
				})
			}
			var slider = ratecontrolsList_[index]
			var display
			switch (slider.sName) {
				case 'CBR/ABR':
					display = '码率'
					break;
				case 'Q':
					display = '质量参数'
					break;
			}
			return {
				display, 
				parameter: 'ratevalue',
				step: slider.step,
				tags: slider.tags,
				valueToText: slider.valueToText,
				valueProcess: slider.valueProcess,
				valueToParam: slider.valueToParam
			}
		},		
		volSlider: function () {
			return volSlider
		},
		// 主要用于控制是否显示多余参数
		hasParameters: function () {
			if (this.$store.state.globalParams.audio.acodec == '不重新编码' || this.$store.state.globalParams.audio.acodec == '禁用音频') {
				return 0
			} else if (this.$store.state.globalParams.audio.acodec == '自动' || this.aencodersList.length == 0) {
				return 1
			} else {
				return 2
			}
		},
	},
	methods: {
		// 由子组件发生变化所触发的事件（mode 为组件类型，sName 为参数名，value 为参数值，list 为对于 combo 需要传入的列表（废弃））
		onChange: function (mode, sName, value) {
			switch (mode) {
				case 'combo':
					// 注：这里 commit 的 value 不能直接读取 import 来的变量，直接用开发者工具读取也不行，但是 console.log 可以，疑似 vue 的 bug
					// console.log(this.formatsList[args.paramName + 's'][args.value].sName)
					this.$store.commit('changePara', {
						type: 'audio',
						key: sName,
						value
					})
					break;
				case 'slider':
					this.$store.commit('changePara', {
						type: 'audio',
						key: sName,
						value
					})
					break;
			}
			if (sName == 'acodec') {
			// 更改 acodec 后将 aencoder 恢复为默认
				this.$store.commit('changePara', {
					type: 'audio',
					key: 'aencoder',
					value: '默认'
				})
			}
			if (sName == 'aencoder' || sName == 'acodec') {
				// 更改 acodec 或 aencoder 后检查子组件的设置
				for (const parameter of this.parametersList) {
					if (parameter.mode == 'combo') {
						var index = parameter.items.findIndex((value) => {
							return value.sName == this.$store.state.globalParams.audio.detail[parameter.parameter]
						})
						if (index == -1) {
							console.log(`参数 ${parameter.parameter} 与列表数据不匹配，重置为默认值`)
							this.$store.commit('changePara', {
								type: 'audioDetail',
								key: parameter.parameter,
								value: parameter.items[0].sName
							})
						}
					} else if (parameter.mode == 'slider') {
						if (isNaN(this.$store.state.globalParams.audio.detail[parameter.parameter])) {
							console.log(`参数 ${parameter.parameter} 类型不为数字，重置为 0.5`)
							this.$store.commit('changePara', {
								type: 'audioDetail',
								key: parameter.parameter,
								value: 0.5
							})
						}
					}
				}

			}
		},
		onDetailChange: function (mode, sName, value) {
			switch (mode) {
				case 'combo':
					this.$store.commit('changePara', {
						type: 'audioDetail',
						key: sName,
						value: value
					})
					break;			
				case 'slider':					
					this.$store.commit('changePara', {
						type: 'audioDetail',
						key: sName,
						value
					})
					break;
			}
		},
		// getAudioParams: function () {
		// 	console.log(generator.getAudioParam(this.$store.state.globalParams.audio))
		// }
	}
}
</script>

<style scoped>
	#acodec-view {
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

	.sliderParent {
		position: relative;
		width: calc(100% - 16px);
		height: 56px;
		margin: 4px 24px;
		/* transition: all 0.5s; */
	}
	.comboParent {
		position: relative;
		width: 210px;
		height: 56px;
		margin: 4px 24px;
	}
	.fullSpace {
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
	}
</style>

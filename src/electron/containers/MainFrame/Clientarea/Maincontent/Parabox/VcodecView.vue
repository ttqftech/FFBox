<template>
	<div id="vcodec-view">
		<combobox title="视频编码" :text="$store.state.globalParams.video.vcodec" :list="vcodecsList" @change="onChange('combo', 'vcodec', $event)"></combobox>
		<combobox title="编码器" :text="$store.state.globalParams.video.vencoder" :list="vencodersList" @change="onChange('combo', 'vencoder', $event)" v-show="hasParameters > 1"></combobox>
		<combobox title="分辨率" :text="$store.state.globalParams.video.resolution" :list="resolutionsList" @change="onChange('combo', 'resolution', $event)" v-show="hasParameters > 0"></combobox>
		<combobox title="输出帧速" :text="$store.state.globalParams.video.framerate" :list="frameratesList" @change="onChange('combo', 'framerate', $event)" v-show="hasParameters > 0"></combobox>
		<combobox title="码率控制" :text="$store.state.globalParams.video.ratecontrol" :list="ratecontrolsList" @change="onChange('combo', 'ratecontrol', $event)" v-if="ratecontrolsList != 0"></combobox>
		<slider v-if="ratecontrolSlider != null" :title="ratecontrolSlider.display" :value="$store.state.globalParams.video.ratevalue" :tags="ratecontrolSlider.tags" :step="ratecontrolSlider.step" :valueToText="ratecontrolSlider.valueToText" :valueProcess="ratecontrolSlider.valueProcess" @change="onChange('slider', 'ratevalue', $event)"></slider>
		<component :is="['combobox', 'slider'][['combo', 'slider'].findIndex(mode => parameter.mode == mode)]" v-for="(parameter, index) in parametersList" :key="index"
		  :title="parameter.display" @change="onDetailChange(parameter.mode, parameter.parameter, $event)"
		  :text="$store.state.globalParams.video.detail[parameter.parameter]" :list="parameter.items"
		  :value="$store.state.globalParams.video.detail[parameter.parameter]" :tags="parameter.tags" :step="parameter.step" :valueToText="parameter.valueToText" :valueProcess="parameter.valueProcess"
		></component>
		<!-- <button @click="getVideoParams()">输出参数</button> -->
	</div>
</template>

<script>
import { vcodecs, resolution, framerate, generator } from '@/App/Codecs/vcodecs'
import Combobox from './Components/Combobox'
import Checkbox from './Components/Checkbox'
import Slider from './Components/Slider'

export default {
	name: 'VcodecView',
	components: {
		Combobox, Checkbox, Slider
	},
	props: {
	},
	computed: {
		// 用途是给 template 读取，因为它不能直接读取 import 的变量
		vcodecsList: function () {
			return vcodecs
		},
		// vencoderList 中的项由 vcodec 具体决定
		vencodersList: function () {
			var sName_vcodec = this.$store.state.globalParams.video.vcodec
			if (sName_vcodec != '禁用视频' && sName_vcodec != '自动'  && sName_vcodec != '不重新编码') {
				var vcodec = vcodecs.find((value) => {
					return value.sName == sName_vcodec
				})
				if (vcodec) {
					return vcodec.encoders
				} else {
					return []
				}
			} else {
				return []
			}
		},
		resolutionsList: function () {
			return resolution
		},
		frameratesList: function () {
			return framerate
		},
		parametersList: function () {
			var sName_vencoder = this.$store.state.globalParams.video.vencoder
			var vencoder = this.vencodersList.find((value) => {
				return value.sName == sName_vencoder
			})
			if (typeof vencoder != 'undefined') {
				var parameters = vencoder.parameters
				return parameters
			} else {
				return []
			}
		},
		ratecontrolsList: function () {
			var sName_vencoder = this.$store.state.globalParams.video.vencoder
			var vencoder = this.vencodersList.find(value => {
				return value.sName == sName_vencoder
			})
			if (typeof vencoder != 'undefined') {
				var ratecontrol = vencoder.ratecontrol
				return ratecontrol
			} else {
				return []
			}
		},
		ratecontrolSlider: function () {
			var ratecontrolsList_ = this.ratecontrolsList
			if (ratecontrolsList_ == 0) {
				return null
			}
			var sName_ratecontrol = this.$store.state.globalParams.video.ratecontrol
			var index = ratecontrolsList_.findIndex(value => {
				return value.sName == sName_ratecontrol
			})
			// 切换编码器后没有原来的码率控制模式了
			if (index == -1) {
				index = 0
				this.$store.commit('changePara', {
					type: 'video',
					key: 'ratecontrol',
					value: ratecontrolsList_[0].sName
				})
			}
			var slider = ratecontrolsList_[index]
			var display
			switch (slider.sName) {
				case 'CRF':
					display = 'CRF'
					break;
				case 'CQP':
					display = 'QP 参数'
					break;
				case 'CBR': case 'ABR':
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
		// 主要用于控制是否显示多余参数
		hasParameters: function () {
			if (this.$store.state.globalParams.video.vcodec == '不重新编码' || this.$store.state.globalParams.video.vcodec == '禁用视频') {
				return 0
			} else if (this.$store.state.globalParams.video.vcodec == '自动' || this.vencodersList.length == 0) {
				return 1
			} else {
				return 2
			}
		},
	},
	methods: {
		// 由子组件发生变化所触发的事件（mode 为组件类型，sName 为参数名，value 为参数值，list 为对于 combo 需要传入的列表（废弃））
		onChange: function (mode, sName, value) {
			this.$store.commit('changePara', {
				type: 'video',
				key: sName,
				value
			})
			if (sName == 'vcodec') {
			// 更改 vcodec 后将 vencoder 恢复为默认
				this.$store.commit('changePara', {
					type: 'video',
					key: 'vencoder',
					value: '默认'
				})
			}
			if (sName == 'vencoder' || sName == 'vcodec') {
				// 更改 vcodec 或 vencoder 后检查子组件的设置
				for (const parameter of this.parametersList) {
					if (parameter.mode == 'combo') {
						var index = parameter.items.findIndex((value) => {
							return value.sName == this.$store.state.globalParams.video.detail[parameter.parameter]
						})
						if (index == -1) {
							console.log(`参数 ${parameter.parameter} 与列表数据不匹配，重置为默认值`)
							this.$store.commit('changePara', {
								type: 'videoDetail',
								key: parameter.parameter,
								value: parameter.items[0].sName
							})
						}
					} else if (parameter.mode == 'slider') {
						if (isNaN(this.$store.state.globalParams.video.detail[parameter.parameter])) {
							console.log(`参数 ${parameter.parameter} 类型不为数字，重置为 0.5`)
							this.$store.commit('changePara', {
								type: 'videoDetail',
								key: parameter.parameter,
								value: 0.5
							})
						}
					}
				}

			}
		},
		onDetailChange: function (mode, sName, value, list) {
			this.$store.commit('changePara', {
				type: 'videoDetail',
				key: sName,
				value
			})
		},
		// getVideoParams: function () {
		// 	console.log(generator.getVideoParam(this.$store.state.globalParams.video))
		// }
	}
}
</script>

<style scoped>
	#vcodec-view {
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

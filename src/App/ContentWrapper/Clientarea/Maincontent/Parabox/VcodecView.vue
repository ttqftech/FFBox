<template>
	<div id="vcodec-view">
		<combobox title="视频编码" :text="$store.state.globalParams.video.vcodec" :list="vcodecsList" @change="onChange('combo', 'vcodec', $event, vcodecsList)"></combobox>
		<combobox title="编码器" :text="$store.state.globalParams.video.vencoder" :list="vencodersList" @change="onChange('combo', 'vencoder', $event, vencodersList)" v-show="hasParameters > 1"></combobox>
		<combobox title="分辨率" :text="$store.state.globalParams.video.resolution" :list="resolutionsList" @change="onChange('combo', 'resolution', $event, resolutionsList)" v-show="hasParameters > 0"></combobox>
		<combobox title="输出帧速" :text="$store.state.globalParams.video.framerate" :list="frameratesList" @change="onChange('combo', 'framerate', $event, frameratesList)" v-show="hasParameters > 0"></combobox>
		<div v-for="(parameter, index) in parametersList" :key="index" :class="{ comboParent: parameter.mode == 'combo', sliderParent: parameter.mode == 'slider' }">
			<combobox class="fullSpace" v-if="parameter.mode == 'combo'" :title="parameter.display" :text="$store.state.globalParams.video.detail[parameter.parameter]" :list="parameter.items" @change="onDetailChange('combo', parameter.parameter, $event, parameter.items)"></combobox>
			<slider class="fullSpace" v-if="parameter.mode == 'slider'" :title="parameter.display" :value="$store.state.globalParams.video.detail[parameter.parameter]" :tags="parameter.tags" :valueToText="parameter.valueToText" :valueProcess="parameter.valueProcess" @change="onDetailChange('slider', parameter.parameter, $event)"></slider>
		</div>
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
				return vcodecs.find((value) => {
					return value.sName == sName_vcodec
				}).encoders
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
				var parameters_new = []
				// 消去一些不需要的项，这里主要指 ratecontrol，算是特定处理方法
				var ratecontrolString = this.$store.state.globalParams.video.detail.ratecontrol
				for (const parameter of parameters) {
					if (ratecontrolString == 'CRF') {
						if (parameter.parameter == 'qp' || parameter.parameter == 'vbitrate' || parameter.parameter == 'q') {
							continue
						}
					} else if (ratecontrolString == 'CQP') {
						if (parameter.parameter == 'crf' || parameter.parameter == 'vbitrate' || parameter.parameter == 'q') {
							continue
						}
					} else if (ratecontrolString == 'CBR' || ratecontrolString == 'ABR') {
						if (parameter.parameter == 'crf' || parameter.parameter == 'qp' || parameter.parameter == 'q') {
							continue
						}
					} else if (ratecontrolString == 'Q') {
						if (parameter.parameter == 'crf' || parameter.parameter == 'qp' || parameter.parameter == 'vbitrate') {
							continue
						}
					}
					parameters_new.push(parameter)
				}
				return parameters_new
			} else {
				return []
			}
		},
		// 主要用于控制是否显示多余参数
		hasParameters: function () {
			if (this.$store.state.globalParams.video.vcodec == '不重新编码' || this.$store.state.globalParams.video.vcodec == '禁用视频') {
				return 0
			} else if (this.$store.state.globalParams.video.vcodec == '自动') {
				return 1
			} else {
				return 2
			}
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
						type: 'video',
						key: sName,
						value: list[value].sName
					})
					break;
				case 'slider':
					this.$store.commit('changePara', {
						type: 'video',
						key: sName,
						value
					})
					break;
			}
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
							console.log(`参数 ${parameter.parameter} 类型不为数字，重置为 0`)
							this.$store.commit('changePara', {
								type: 'videoDetail',
								key: parameter.parameter,
								value: 0
							})
						}
					}
				}

			}
		},
		onDetailChange: function (mode, sName, value, list) {
			switch (mode) {
				case 'combo':
					this.$store.commit('changePara', {
						type: 'videoDetail',
						key: sName,
						value: list[value].sName
					})
					break;			
				case 'slider':					
					this.$store.commit('changePara', {
						type: 'videoDetail',
						key: sName,
						value
					})
					break;
			}
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

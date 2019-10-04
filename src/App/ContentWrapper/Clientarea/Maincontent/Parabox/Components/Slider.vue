<template>
	<div class="slider">
		<div class="slider-title">{{ title }}</div>
		<div class="slider-module" @mousedown="dragStart">
			<div class="slider-module-track"></div>
			<div class="slider-module-track-background" :style="{ width: value * 100 + '%' }"></div>
			<span v-for="(tag, index) in tags" :key="index" class="slider-module-mark" :style="{ left: tag[0] * 100 + '%' }">{{ tag[1] }}</span>
			<div class="slider-module-slipper" v-bind:style="{ left: value * 100 + '%' }"></div>
		</div>
		<div class="slider-text">{{ valueToText(value) }}</div>
	</div>
</template>

<script>

export default {
	name: 'Slider',
	components: {		
	},
	props: {
		// paramName: String,
		title: String,
		value: Number,
		tags: Map,
		valueToText: Function,
		valueProcess: Function
	},
	computed: {
	},
	methods: {
		dragStart: function (event) {
			event.preventDefault()
			var id = Symbol()
			var mouseDownX = event.pageX || event.touches[0].pageX;				// 鼠标在页面（窗口）内的坐标
			var slipper = event.target.className == 'slider-module-slipper' ? true : false
			if (slipper) {
				var sliderLeft = getWindowOffsetLeft(event.target.parentElement)
				var sliderWidth = event.target.parentElement.offsetWidth
				var slipperOffsetX = event.offsetX - event.target.offsetWidth / 2
			} else {
				var sliderLeft = getWindowOffsetLeft(event.target)
				var sliderWidth = event.target.offsetWidth
				var slipperOffsetX = 0
			}
			// 添加鼠标事件捕获，将其独立为一个函数，以便于 mouseDown 直接触发 mouseMove
			var handleMouseMove = (event) => {
				var value = (parseInt(event.pageX || event.touches[0].pageX) - sliderLeft - slipperOffsetX) / sliderWidth
				if (value > 1) {
					value = 1
				} else if (value < 0) {
					value = 0
				}
				value = this.valueProcess(value)
				if (value != lastValue) {
					this.$emit('change', value)
					lastValue = value
				}
			}
			this.$store.commit('addPointerEvents', {
				type: "mousemove",
				id,
				// 处理鼠标拖动
				func: handleMouseMove
			})
			this.$store.commit('addPointerEvents', {
				type: "mouseup",
				id,
				// 移除鼠标事件捕获
				func: (event) => {
					this.$store.commit('removePointerEvents', {
						type: "mousemove",
						id
					})
					this.$store.commit('removePointerEvents', {
						type: "mouseup",
						id
					})
				}
			})
			// lastValue 用于减少频繁提交参数更改的次数
			var lastValue = (parseInt(event.pageX || event.touches[0].pageX) - sliderLeft - slipperOffsetX) / sliderWidth
			if (lastValue > 1) {
				lastValue = 1
			} else if (lastValue < 0) {
				lastValue = 0
			}
			lastValue = this.valueProcess(lastValue)
			handleMouseMove({ pageX: event.pageX })	// mouseDown 直接触发 mouseMove
		}
	},
}

// 计算元素相对于窗口的 left 和 top
function getWindowOffsetLeft(obj) {
	var realNum = obj.offsetLeft;
	var positionParent = obj.offsetParent;  // 获取上一级定位元素对象
	
	while(positionParent != null) {
		realNum += positionParent.offsetLeft;
		positionParent = positionParent.offsetParent;
	}
	return realNum;
}
function getWindowOffsetTop(obj) {
	var realNum = obj.offsetTop;
	var positionParent = obj.offsetParent;  // 获取上一级定位元素对象
	
	while(positionParent != null) {
		realNum += positionParent.offsetTop - positionParent.scrollTop;
		positionParent = positionParent.offsetParent;
	}
	return realNum;
}

</script>

<style scoped>
	.slider {
		position: relative;
		width: calc(100% - 16px);
		height: 56px;
		margin: 4px 24px;
		transition: all 0.5s;
	}
		.slider-title {
			position: absolute;
			left: 0;
			top: 50%;
			width: 88px;
			transform: translateY(-50%);
			font-size: 14px;
			text-align: center;
		}
		.slider-module {
			position: absolute;
			left: 104px;
			width: calc(100% - 88px - 88px - 32px);
			height: 100%;
			font-size: 14px;
		}
			.slider-module-track {
				position: absolute;
				top: 17px;
				width: 100%;
				height: 6px;
				background: #FFF;
				border-radius: 8px;
				box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.15) inset;
							
			}
			.slider-module-track-background {
				position: absolute;
				top: 17px;
				height: 6px;
				background: #49e;
				border-radius: 8px;
				box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.15) inset;
			}
			.slider-module-slipper {
				position: absolute;
				top: 4px;
				transform: translateX(-50%);
				width: 18px;
				height: 30px;
				background: linear-gradient(180deg, #fefefe, #f0f0f0);
				border-radius: 4px;
				box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.2);
			}
			.slider-module-slipper:hover {
				background: linear-gradient(180deg, #ffffff, #fefefe);
			}
			.slider-module-slipper:active {
				background: linear-gradient(180deg, #f0f0f0, #ededed);
			}
			/*
			.slider-module-slipper:before {
				position: absolute;
				display: inline-block;
				left: 0;
				content: "";
				width: 18px;
				height: 15px;
				background: linear-gradient(-90deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.3));
				border-radius: 1px 1px 18px 18px / 1px 1px 3px 3px;
			}
			*/
			.slider-module-mark {
				position: absolute;
				bottom: 0px;
				transform: translateX(-50%);
				width: 96px;
				font-size: 10px;
				text-align: center;
				opacity: 0.7;
				pointer-events: none;
			}
			.slider-module-mark:before {
				content: "";
				position: absolute;
				left: calc(50% - 2px);
				top: -8px;
				width: 4px;
				height: 4px;
				background: white;
				border-radius: 4px;
				box-shadow: 0px 1px 1px 0px rgba(0, 0, 0, 0.2) inset;
				z-index: -10;
			}
		.slider-text {
			position: absolute;
			right: 0px;
			top: 50%;
			transform: translateY(-50%);
			width: 88px;
			font-size: 14px;
			text-align: center;
		}
	
</style>

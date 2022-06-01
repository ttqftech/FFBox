<template>
	<div class="slider">
		<div class="slider-title">{{ title }}</div>
		<div class="slider-module" @mousedown="dragStart">
			<div class="slider-module-track"></div>
			<div class="slider-module-track-background" :style="{ width: value * 100 + '%' }"></div>
			<span v-for="(tag, index) in tags" :key="index" class="slider-module-mark" :style="{ left: tag[0] * 100 + '%' }">{{ tag[1] }}</span>
			<button class="slider-module-slipper" v-bind:style="{ left: value * 100 + '%' }" @keydown="onKeypress" :aria-label="title + '滑块'"></button>
		</div>
		<div class="slider-text">{{ valueToText(value) }}</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	name: 'Slider',
	components: {		
	},
	props: {
		// paramName: String,
		title: String,
		value: Number,
		tags: Map,
		step: Number,
		valueToText: Function,
		valueProcess: Function
	},
	computed: {
	},
	methods: {
		dragStart: function (event: DragEvent | TouchEvent) {
			event.preventDefault();
			let mouseDownX = (event as MouseEvent).pageX || (event as TouchEvent).touches[0].pageX;	// 鼠标在页面（窗口）内的坐标
			let slipper = event.target!.className == 'slider-module-slipper' ? true : false;
			let sliderLeft: number, sliderWidth: number, slipperOffsetX: number;
			if (slipper) {
				sliderLeft = event.target!.parentElement!.getBoundingClientRect().left;
				sliderWidth = event.target!.parentElement!.offsetWidth;
				slipperOffsetX = (event as MouseEvent).offsetX - event.target!.offsetWidth / 2;
				event.target!.focus();
			} else {
				sliderLeft = event.target!.getBoundingClientRect().left;
				sliderWidth = event.target!.offsetWidth;
				slipperOffsetX = 0;
			}
			// 添加鼠标事件捕获，将其独立为一个函数，以便于 mouseDown 直接触发 mouseMove
			let handleMouseMove = (event: Partial<MouseEvent | TouchEvent>) => {
				let value = (Math.floor((event as MouseEvent).pageX || (event as TouchEvent).touches[0].pageX) - sliderLeft - slipperOffsetX) / sliderWidth;	// event.pageX == 0 时短路逻辑失效，会报错，不影响使用
				if (value > 1) {
					value = 1;
				} else if (value < 0) {
					value = 0;
				}
				value = this.valueProcess(value)
				if (value != lastValue) {
					this.$emit('change', value);
					lastValue = value;
				}
			}
			let handleMouseUp = () => {
				document.removeEventListener('mousemove', handleMouseMove);
	    		document.removeEventListener('mouseup', handleMouseUp);
			};
	    	document.addEventListener('mousemove', handleMouseMove);
	    	document.addEventListener('mouseup', handleMouseUp);

			// lastValue 用于减少频繁提交参数更改的次数
			let lastValue = NaN;
			handleMouseMove({ pageX: mouseDownX });	// mouseDown 直接触发 mouseMove
		},
		onKeypress: function (event: KeyboardEvent) {
			if (event.key == 'ArrowLeft' || event.key == 'ArrowRight') {
				let direction, delta, sum;
				if (event.key == 'ArrowLeft') {
					direction = -1;
				} else {
					direction = 1;
				}
				if (this.step) {
					delta = 1 / this.step;
				} else {
					delta = 0.01;
				}
				sum = this.value + direction * delta;
				if (sum < 0) {
					sum = 0;
				} else if (sum > 1) {
					sum = 1;
				}
				this.$emit('change', sum);
			}
		}
	},
});

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
				border: none;
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

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
	title: string;
	checked: boolean;
	onChange?: (value: boolean) => any;
}

const props = defineProps<Props>();

const slipperRef = ref<Element>(null);

const handleDragStart = (event: MouseEvent | TouchEvent) => {
	// event.preventDefault();
	// const deviderRect = deviderRef.value.getBoundingClientRect();	// 列表元素的 rect
	// const mainAreaRect = (appStore.componentRefs['MainArea'] as Element).getBoundingClientRect();	// 列表元素的 rect
	// const mouseY = (event as MouseEvent).pageY || (event as TouchEvent).touches[0].pageY;	// 鼠标在窗口内的 Y
	// // const inElementY = (event as MouseEvent).offsetY || (event as TouchEvent).touches[0].offsetY;	// 鼠标在元素内的 Y
	// const inElementY = mouseY - deviderRect.top;	// 不直接用 offsetY 的原因是，鼠标所在的元素不一定是 devider
	// // 添加鼠标事件捕获
	// let handleMouseMove = (event: Partial<MouseEvent>) => {
	// 	const mouseY = (event as MouseEvent).pageY || (event as TouchEvent).touches[0].pageY;	// 鼠标在窗口内的 Y
	// 	let listPercent = (mouseY - mainAreaRect.top - inElementY) / mainAreaRect.height;
	// 	listPercent = Math.min(Math.max(listPercent, 0), 1);
	// 	appStore.draggerPos = listPercent;
	// }

	event.preventDefault();
	const beforeChecked = props.checked;
	let mouseDownX = (event as MouseEvent).pageX || (event as TouchEvent).touches[0].pageX;	// 鼠标在页面（窗口）内的坐标
	let sliderLeft: number, sliderWidth: number;
	if (event.target! === slipperRef.value) {
		sliderLeft = event.target!.parentElement!.getBoundingClientRect().left;
		sliderWidth = event.target!.parentElement!.offsetWidth;
	} else {
		sliderLeft = event.target!.getBoundingClientRect().left;
		sliderWidth = event.target!.offsetWidth;
	}
	// 添加鼠标事件捕获，将其独立为一个函数，以便于 mouseDown 直接触发 mouseMove
	const handleMouseMove = (event: Partial<MouseEvent | TouchEvent>) => {
		let valueX: any = Math.floor((event as MouseEvent).pageX || (event as TouchEvent).touches[0].pageX) - sliderLeft;
		if (valueX < sliderWidth / 2) {;
			valueX = false;
		} else {
			valueX = true;
		}
		if (valueX !== lastValue) {
			(props.onChange || (() => {}))(valueX);
			lastValue = valueX;
		}
	}
	const handleMouseUp = (event: MouseEvent | TouchEvent) => {
		// 处理只点一下没有动的情况
		if (Math.abs(mouseDownX - Math.floor((event as MouseEvent).pageX || (event as TouchEvent).touches[0].pageX)) <= 3) {
			if (props.checked && beforeChecked) {
				(props.onChange || (() => {}))(false);
			} else if (!props.checked && !beforeChecked) {
				(props.onChange || (() => {}))(true);
			}
		}
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	};
	document.addEventListener('mousemove', handleMouseMove);
	document.addEventListener('mouseup', handleMouseUp);
	let lastValue = NaN;
	handleMouseMove({ pageX: mouseDownX });	// mouseDown 直接触发 mouseMove
}

const handleKeydown = (event: KeyboardEvent) => {
	if (event.key == 'ArrowLeft') {
		(props.onChange || (() => {}))(false);
	} else if (event.key == 'ArrowRight') {
		(props.onChange || (() => {}))(true);
	}
};
const handleKeyup = (event: KeyboardEvent) => {
	if (event.key == ' ' || event.key == 'Enter') {
		(props.onChange || (() => {}))(!props.checked);
	}
};

</script>

<template>
	<div class="checkbox">
		<div class="checkbox-title">{{ props.title }}</div>
		<div class="checkbox-track" @mousedown="handleDragStart">
			<div class="checkbox-track-background" :style="props.checked ? 'width: 100%;' : 'width: 0%'"></div>
			<button
				ref="slipperRef"
				class="checkbox-slipper"
				:style="props.checked ? 'left: 64px;' : 'left: 0px'"
				@keydown="handleKeydown"
				@keyup="handleKeyup"
			/>
		</div>
	</div>
</template>

<style scoped>
	.checkbox {
		position: relative;
		width: 210px;
		height: 56px;
		margin: 4px 24px;
	}
		.checkbox-title {
			position: absolute;
			left: 0;
			top: 50%;
			width: 88px;
			transform: translateY(-50%);
			font-size: 14px;
			text-align: center;
		}
		.checkbox-track {
			position: absolute;
			right: 0;
			height: 24px;
			width: 88px;
			margin: 15px 0;
			border-radius: 24px;
			background: #F7F7F7;
			border: #CCC 1px solid;
			box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1) inset;
		}
			.checkbox-track-background {
				position: absolute;
				height: 24px;
				border-radius: 24px;
				background: hsl(210, 85%, 60%);
				box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1) inset;
				transition: all 0.15s ease-out;
			}
			.checkbox-slipper {
				position: absolute;
				top: 0;
				height: 24px;
				width: 24px;
				border-radius: 50%;
				background: linear-gradient(180deg, #fefefe, #f0f0f0);
				box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.3);
				transform: scale(1.25);
				transition: all 0.15s ease-out;
				border: none;
			}
			.checkbox-slipper:hover {
				background: linear-gradient(180deg, #ffffff, #fefefe);
			}
			.checkbox-slipper:active {
				background: linear-gradient(180deg, #f0f0f0, #ededed);								
			}

</style>

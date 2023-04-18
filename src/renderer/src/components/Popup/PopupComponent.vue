<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

interface Props {
    message: string;
	level: 0 | 1 | 2 | 3;
	verticalOffset: number;	// px
    onWillClose: () => void;
    onClose: () => void;	// 由本组件调用，外部将本组件销毁
	index: number;			// 用于计算 delayedVerticalOffset
}

const props = defineProps<Props>();

const show = ref(false);
const duration = ref(0);
const timeLeft = ref(0);
const mouseIn = ref(false);
const delayedVerticalOffset = ref(0);

const bgClass = computed(() => {
	switch (props.level) {
		case 1:
			return 'popup-box popup-ok'
		case 2:
			return 'popup-box popup-warning'
		case 3:
			return 'popup-box popup-error'
		default:
			return 'popup-box'
	}
});
const color = computed(() => {
	switch (props.level) {
		case 1:
			return '#FFFFFF'
		case 2:
			return '#3F330D'
		case 3:
			return '#FFFFFF'
		default:
			return '#000000'
	}
});

onMounted(() => {
	// 设置动画并自动退出
	const powerSave = true;
	show.value = true;
	duration.value = 2500 + props.message.length * 100;
	timeLeft.value = duration.value;
	let lastTime = new Date().getTime();
	const count = () => {
		let now = new Date().getTime();
		if (!mouseIn.value) {
			timeLeft.value = timeLeft.value - (now - lastTime);
			if (timeLeft.value <= 0) {
				show.value = false;
				props.onWillClose();
			}
		} else {
			timeLeft.value = Math.min(timeLeft.value + (now - lastTime) * 2, duration.value);
		}
		if (show.value) {
			if (powerSave) {
				setTimeout(count, 67);
			} else {
				requestAnimationFrame(count);
			}
		}
		lastTime = now;
	}
	count();
});

watch(() => props.verticalOffset, (newValue) => {
	setTimeout(() => {
		delayedVerticalOffset.value = newValue;
	}, 33 * props.index);
});

</script>

<template>
	<dialog
		class="popup"
		@mouseenter="mouseIn = true"
		@mouseleave="mouseIn = false"
		:style="{ transform: `translateY(${-delayedVerticalOffset}px)` }"
	>
		<Transition name="popupanimate" @after-leave="props.onClose()">
			<div v-if="show" :class="bgClass">
				<div class="popup-progress">
					<svg viewBox="-24 -24 48 48" class="popup-progress-circle">
						<circle
							fill="transparent"
							stroke-width="6"
							:stroke="color"
							stroke-dasharray="125.664"
							:stroke-dashoffset=" - 125.664 * (1 - timeLeft / duration)"
							r="20"
						></circle>
					</svg>
				</div>
				<div class="popup-message" v-html="message"></div>
			</div>
		</Transition>
	</dialog>
</template>


<style scoped>
	.popup {
		display: block;
		position: absolute;
		bottom: 10%;
		left: 0;
		right: 0;
		max-width: 60%;
		background: none;
		border: none;
		margin: auto;
		padding: 0;
		transition: transform 0.7s cubic-bezier(0.35, 1.4, 0.2, 0.95);
		z-index: 10;
	}
		.popupanimate-enter-from {
			opacity: 0;
			transform: scale(0.5);
		}
		.popupanimate-enter-active {
			transition: transform 0.5s cubic-bezier(0.4, 1.3, 0.4, 1), opacity 0.2s linear;
		}
		.popupanimate-enter-to, .popupanimate-leave-from {
			opacity: 1;
			transform: scale(1);
		}
		.popupanimate-leave-active {
			transition: opacity 0.7s ease-out, transform 0.6s cubic-bezier(1, 0, 1, 1) 0.1s;
		}
		.popupanimate-leave-to {
			opacity: 0;
			transform: scale(0.5);
		}

		.popup-box {
			display: flex;
			align-items: center;
			padding: 12px;
			background: hsl(0, 0%, 98%);
			will-change: transform, opacity;
			border: hsl(0, 0%, 67%) 1px solid;
			border-radius: 12px;
			box-shadow: 0px 4px 8px hsla(0, 0%, 0%, 0.3);
		}
		.popup-ok {
			background: linear-gradient(180deg, hsl(120, 80%, 65%), hsl(120, 60%, 50%));
			border-color: hsl(120, 60%, 40%);
			box-shadow: 0px 4px 8px hsla(120, 80%, 65%, 0.3);
			color: white;
		}
		.popup-warning {
			background: linear-gradient(180deg, hsl(45, 100%, 75%), hsl(45, 100%, 65%));
			border-color: hsl(45, 70%, 60%);
			box-shadow: 0px 4px 8px rgba(160, 127, 0, 0.3);
			color: hsl(46, 66%, 15%);
		}
		.popup-error {
			background: hsl(0, 85%, 65%);
			border-color: hsl(0, 55%, 45%);
			box-shadow: 0px 4px 8px hsla(0, 100%, 25%, 0.3);
			color: white;
		}
			.popup-message {
				display: inline-block;
				font-size: 16px;
				line-height: 1.3em;
				text-align: center;
				word-break: break-word;
			}
			.popup-progress {
				display: inline-block;
				position: relative;
				/* top: 2.5px; */
				margin-right: 8px;
				width: 16px;
				height: 16px;
				line-height: 1.3em;
				opacity: 0.8;
			}
				.popup-progress-circle {
					width: 16px;
					height: 16px;
					transform: rotate(-90deg);
				}

</style>

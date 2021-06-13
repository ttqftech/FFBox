<template>
	<dialog class="popup" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave" :style="positionStyle(delayedVerticalOffset)">
		<transition name="popupanimate" @after-leave="afterLeave">
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
		</transition>
	</dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import { NotificationLevel } from '@/types/types'

export default Vue.extend({
	name: 'Popup',
	props: {
		message: String,
		level: Number, // 0 1 2 3
		verticalOffset: Number,
		onClose: Function,
		index: Number, // 用于计算 delayedVerticalOffset
	},
	data: () => {
		return {
			show: false,
			duration: 0,
			timeLeft: 0,
			mouseIn: false,
			delayedVerticalOffset: 0,
		}
	},
	computed: {
		bgClass: function () {
			switch (this.level) {
				case 1:
					return 'popup-box popup-ok'
				case 2:
					return 'popup-box popup-warning'
				case 3:
					return 'popup-box popup-error'
				default:
					return 'popup-box'
			}
		},
		color: function () {
			switch (this.level) {
				case 1:
					return '#FFFFFF'
				case 2:
					return '#3F330D'
				case 3:
					return '#FFFFFF'
				default:
					return '#000000'
			}
		},
		positionStyle: function () {
			return function (delayedVerticalOffset: number) {
				return {
					'transform': `translateY(-${delayedVerticalOffset}px)`
				};
			}
		},
	},
	watch: {
		verticalOffset: function (newValue: number, oldValue: number) {
			setTimeout(() => {
				this.delayedVerticalOffset = newValue;
			}, 33 * this.index);				
		}
	},
	mounted: function () {
		// 设置动画并自动退出
		const powerSave = true;
		this.show = true;
		this.duration = 2500 + this.message.length * 100;
		this.timeLeft = this.duration;
		let lastTime = new Date().getTime();
		const count = () => {
			let now = new Date().getTime();
			if (!this.mouseIn) {
				this.timeLeft = this.timeLeft - (now - lastTime);
				if (this.timeLeft <= 0) {
					this.show = false;
					this.beforeLeave();
				}
			} else {
				this.timeLeft = Math.min(this.timeLeft + (now - lastTime) * 2, this.duration);
			}
			if (this.show) {
				if (powerSave) {
					setTimeout(() => {
						count();
					}, 67);
				} else {
					requestAnimationFrame(count);
				}
			}
			lastTime = now;
		}
		count();
	},
	methods: {
		beforeLeave() {
			this.onClose();
		},
		afterLeave() {
    	    this.$destroy();
        	this.$el.parentNode!.removeChild(this.$el);
		},
		onMouseEnter() {
			this.mouseIn = true;
		},
		onMouseLeave() {
			this.mouseIn = false;
		},
	}
})
</script>

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
		.popupanimate-enter {
			opacity: 0;
			transform: scale(0.5);
		}
		.popupanimate-enter-active {
			transition: transform 0.5s cubic-bezier(0.4, 1.3, 0.4, 1), opacity 0.2s linear;
		}
		.popupanimate-enter-to, .popupanimate-leave {
			opacity: 1;
			transform: scale(1);
		}
		.popupanimate-leave-active {
			transition: opacity 0.7s ease-out;
		}
		.popupanimate-leave-to {
			opacity: 0;
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

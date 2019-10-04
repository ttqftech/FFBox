<template>
	<dialog class="popup">
		<transition name="popupanimate">
			<div v-if="show" :class="bgClass(value.level)">
				<div class="popup-message">{{ value.msg }}</div>
			</div>
		</transition>
	</dialog>
</template>

<script>
export default {
	name: 'Popup',
	props: [
		'value'
	],
	data: () => { return {
		show: false
	}},
	computed: {
		bgClass: function () { return function (level) {
			switch (level) {
				case 1:
					return 'popup-box popup-ok'
				case 2:
					return 'popup-box popup-warning'
				case 3:
					return 'popup-box popup-error'
				default:
					return 'popup-box'
			}
		}}
	},
	mounted: function () {
		// 设置动画并自动退出
		this.show = true
		setTimeout(() => {
			this.show = false
		}, 2500 + this.value.msg.length * 100);
		setTimeout(() => {
			this.$store.commit('popupDisappear', this.value.id)
		}, 3200 + this.value.msg.length * 100);
	}
}
</script>

<style scoped>
	.popup {
		display: block;
		background: none;
		border: none;
		margin: 0;
		padding: 0;
		position: absolute;
		bottom: 10%;
		left: 50%;
		transform: translateX(-50%);
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
			padding: 12px;
			background: hsl(0, 0%, 98%);
			will-change: transform, opacity;
			border: hsl(0, 0%, 67%) 1px solid;
			border-radius: 12px;
			box-shadow: 0px 4px 8px hsla(0, 0%, 0%, 0.3);
			z-index: 5;
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
			color: hsl(45, 65%, 15%);
		}
		.popup-error {
			background: hsl(0, 85%, 65%);
			border-color: hsl(0, 55%, 45%);
			box-shadow: 0px 4px 8px hsla(0, 100%, 25%, 0.3);
			color: white;
		}
			.popup-message {
				font-size: 16px;
				line-height: 1.3em;
				text-align: center;
			}

</style>

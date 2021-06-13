<template>
	<dialog>
		<transition name="bganimate" @after-leave="afterLeave">
			<div class="messagebox-background" v-if="show"></div>
		</transition>
		<transition name="boxanimate">
			<div class="messagebox-box" v-if="show">
				<div class="messagebox-titlebar">
					<span class="messagebox-titletext">{{ title }}</span>
				</div>
				<div class="messagebox-content">
					<span class="messagebox-contenttext">{{ content }}</span>
					<div class="messagebox-buttons">
						<button v-for="(button, index) in buttons" :key="index" :class="buttonClass(index)" @click="close(index)">{{ button.text }}</button>
					</div>
				</div>
			</div>
		</transition>
	</dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { ButtonRole, Buttons } from './Msgbox'

export default Vue.extend({
	name: 'Msgbox',
	props: {
		title: String,
		content: String,
		buttons: Array,
		onClose: Function,
	},
	data: () => {
		return {
			show: false
		}
	},
	mounted: function () {
		// 设置动画并自动退出
		this.show = true
    	document.addEventListener('keydown', this.onKeydown);
	},
	computed: {
		buttonClass: function () {
			return (index: number) => {
				let role = (this.buttons as Buttons)[index].role;
				if (role) {
					if (role === ButtonRole.Confirm) {
						return 'msgbutton msgbutton-skyblue'
					} else {
						return 'msgbutton msgbutton-white'
					}
				} else {
					return 'msgbutton msgbutton-white'
				}
			}
		}
	},
	methods: {
		close: function (index: number) {
			let func = (this.buttons as Buttons)[index].callback;
			if (func) {
				func();
			}
			this.show = false;
			this.onClose();
		},
		afterLeave() {
      		document.removeEventListener('keydown', this.onKeydown);
    	    this.$destroy();
        	this.$el.parentNode!.removeChild(this.$el);
		},
		onKeydown(e: KeyboardEvent) {
			console.log(e);
			if (e.key === 'Escape') {
				let index = (this.buttons as Buttons).findIndex((button) => {
					return button.role === ButtonRole.Cancel;
				});
				if (index > 0) {
					this.close(index);
				}
			} else if (e.key === 'Enter') {
				let index = (this.buttons as Buttons).findIndex((button) => {
					return button.role === ButtonRole.Cancel;
				});
				if (index > 0) {
					this.close(index);
				}
			}
		}
	}
})
</script>

<style scoped>
	dialog {
		display: flex;
		background: none;
		border: none;
		margin: 0;
		padding: 0;
		position: absolute;
		top: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		z-index: 5;
	}
		.messagebox-background {
			position: absolute;
			width: 100%;
			height: 100%;
			will-change: background;
			background-color: hsla(0, 0%, 100%, 0.4);
		}
		@keyframes bganimation {
			from {
				background-color: hsla(0, 0%, 100%, 0.0);
			}
			to {
				/* background-color: hsla(0, 0%, 100%, 0.4); */
			}
		}
		.bganimate-enter-active {
			animation: bganimation ease-out 0.4s;
		}
		.bganimate-leave-active {
			animation: bganimation ease-out 0.2s reverse;
		}

		.messagebox-box {
			margin: auto;
			will-change: transform, opacity;
			transition: transform cubic-bezier(0.33, 1, 1, 1) 0.3s, opacity linear 0.2s;
			width: 400px;
			height: 200px;
			background: #EEE;
			border-radius: 16px;
			overflow: hidden;
			box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.15);
		}
		.boxanimate-enter {
			transform: scale(1.1);
			opacity: 0;
		}
		.boxanimate-enter-active {
			transition: transform cubic-bezier(0.33, 1, 1, 1) 0.3s, opacity linear 0.2s;
		}
		.boxanimate-enter-to, .boxanimate-leave {
			transform: scale(1.0);
			opacity: 1;
		}
		.boxanimate-leave-to {
			transform: scale(0.9);
			opacity: 0;
		}
		.boxanimate-leave-active {
			transition: all linear 0.2s;
		}
		
			.messagebox-titlebar {
				height: 28px;
				z-index: 1;
				background: linear-gradient(180deg, hsl(0deg, 0%, 100%), hsl(0deg, 0%, 92.5%));
				box-shadow: 0px 10px 20px -5px rgba(0, 0, 0, 0.1),
							0px  4px  8px -3px rgba(0, 0, 0, 0.1);
			}
			.messagebox-titletext {
				position: relative;
				display: inline-block;
				top: 3px;
				width: 100%;
				font-size: 16px;
				text-align: center;			
			}
			.messagebox-contenttext {
				position: relative;
				display: block;
				top: 48px;
				left: 50%;
				transform: translateX(-50%);
				width: 85%;
				text-align: center;
			}
			.messagebox-buttons {
				position: absolute;
				top: 130px;
				width: 100%;
				display: flex;
				justify-content: center;
			}
				.msgbutton {
					position: relative;
					width: 100px;
					height: 32px;
					line-height: 32px;
					border-radius: 32px;
					text-align: center;
					border: none;
					outline: none;
					padding: 0;
					margin: 0 20px;
					font: inherit;
				}
				.msgbutton:hover:before {
					position: absolute;
					display: inline-block;
					top: 0;
					left: 0;
					content: "";
					width: 100px;
					height: 32px;
					border-radius: 32px;
					background: -webkit-linear-gradient(-90deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
				}
				.msgbutton-skyblue {
					background: linear-gradient(180deg, hsl(210, 100%, 75%), hsl(210, 80%, 65%));
					box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
								0px 1px 1px 0px rgba(16, 16, 16, 0.15),
								0px 2px 6px 0px rgba(0, 0, 0, 0.15),
								0px 4px 16px -4px hsl(210, 100%, 753%);
				}
				.msgbutton-skyblue:hover {
					box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
								0px 1px 1px 0px rgba(16, 16, 16, 0.15),
								0px 2px 6px 0px rgba(0, 0, 0, 0.15),
								0px 4px 24px 0px hsl(210, 100%, 75%);				
				}
				.msgbutton-skyblue:active {
					background: linear-gradient(180deg, hsl(210, 55%, 55%), hsl(210, 80%, 65%));
				}
				.msgbutton-white {
					background: linear-gradient(180deg, #FFF, #DDD);
					box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
								0px 1px 1px 0px rgba(16, 16, 16, 0.15),
								0px 2px 6px 0px rgba(0, 0, 0, 0.15),
								0px 4px 16px -4px #FFF;
				}
				.msgbutton-white:hover {
					box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
								0px 1px 1px 0px rgba(16, 16, 16, 0.15),
								0px 2px 6px 0px rgba(0, 0, 0, 0.15),
								0px 4px 24px 0px #FFF;
				}
				.msgbutton-white:active {
					background: linear-gradient(180deg, #BBB, #DDD);
				}
</style>

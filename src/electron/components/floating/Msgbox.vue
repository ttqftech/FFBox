<template>
	<dialog style="width: 100%; height: 100%">
		<transition name="bganimate">
			<div class="messagebox-background" v-if="show"></div>
		</transition>
		<transition name="boxanimate">
			<div class="messagebox-box" v-if="show">
				<div class="messagebox-titlebar">
					<span class="messagebox-titletext">{{ value.title }}</span>
				</div>
				<div class="messagebox-content">
					<span class="messagebox-contenttext">{{ value.content }}</span>
					<button class="messageconfirm msgbutton msgbutton-skyblue" @click="close(value.onOK)">确认</button>
					<button class="messagecancel msgbutton msgbutton-white" @click="close(value.onCancel)">取消</button>
				</div>
			</div>
		</transition>
	</dialog>
</template>

<script>
export default {
	name: 'Msgbox',
	props: [
		'value'
	],
	data: () => { return {
		show: false
	}},
	mounted: function () {
		// 设置动画并自动退出
		this.show = true
	},
	methods: {
		close: function (func) {
			try {
				func()
			} catch (e) {}
			this.show = false
			setTimeout(() => {
				this.$store.commit('msgboxDisappear', this.value.id)
			}, 200);	
		}
	}
	
}
</script>

<style scoped>
	dialog {
		display: flex;
		background: none;
		border: none;
		margin: 0;
		padding: 0;
		position: absolute;
		top: 28px;
		width: 100%;
		height: calc(100% - 28px - 24px);
		z-index: 10;
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
		.boxanimate-enter, .boxanimate-leave-to {
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
			.msgbutton {
				width: 100px;
				height: 32px;
				line-height: 32px;
				border-radius: 32px;
				text-align: center;
				border: none;
				outline: none;
				padding: 0;
				margin: 0;
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
			.messageconfirm {
				position: absolute;
				top: 130px;
				left: calc(50% - 120px - 20px);
			}
			.messagecancel {
				position: absolute;
				top: 130px;
				left: calc(50% + 20px);
			}
</style>

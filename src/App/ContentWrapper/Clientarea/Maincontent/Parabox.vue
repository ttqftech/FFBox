<template>
	<div id="parabox" :style="{ height: 100 - $store.state.draggerPos + '%' }">
		<div id="parabox-dragger" @mousedown="dragStart" @touchstart="dragStart">
			<div id="parabox-dragger-left"></div>
			<div id="parabox-dragger-right"></div>
			<div id="parabox-name" :style="{ backgroundPositionY: 12.5 * $store.state.paraselected + 25 + '%' }"></div>
		</div>
		<div id="paraboxes">
			<transition name="paraboxes-ani">
				<shorcuts-view v-show="$store.state.paraselected == 0"></shorcuts-view>
			</transition>
			<transition name="paraboxes-ani">
				<format-view v-show="$store.state.paraselected == 1"></format-view>
			</transition>
			<transition name="paraboxes-ani">
				<vcodec-view v-show="$store.state.paraselected == 2"></vcodec-view>
			</transition>
			<transition name="paraboxes-ani">
				<acodec-view v-show="$store.state.paraselected == 3"></acodec-view>
			</transition>
			<transition name="paraboxes-ani">
				<veffect-view v-show="$store.state.paraselected == 4"></veffect-view>
			</transition>
			<transition name="paraboxes-ani">
				<aeffect-view v-show="$store.state.paraselected == 5"></aeffect-view>
			</transition>
			<transition name="paraboxes-ani">
				<timing-view v-show="$store.state.paraselected == 6"></timing-view>
			</transition>
		</div>
	</div>
</template>

<script>
import ShorcutsView from './Parabox/ShorcutsView'
import FormatView from './Parabox/FormatView'
import VcodecView from './Parabox/VcodecView'
import AcodecView from './Parabox/AcodecView'
import VeffectView from './Parabox/VeffectView'
import AeffectView from './Parabox/AeffectView'
import TimingView from './Parabox/TimingView'

export default {
	name: 'Parabox',
	components: {
		ShorcutsView, FormatView, VcodecView, AcodecView, VeffectView, AeffectView, TimingView
	},
	props: {
	},
	data: () => { return {
		// mouseEventId: undefined,
		// mouseDownY: 0
	}},
	methods: {
		dragStart: function (event) {
			/*
				笔记：普通函数与箭头函数的区别
				普通函数，this 作用域为调用者作用域——
					如此处 dragStart，因其调用者为 VueComponent，因此 this 指向当前的 VueComponent
					如下方处理鼠标拖动，this 指向 state.onPointerEvents.onMouseMove 中的它
				箭头函数，相当于 function.call(this)，作用域为它自身的上层——
					如此处 dragStart，没有上层，也没有默认的 Window，所以 this 指向 undefined
					如下方处理鼠标拖动，this 指向这里的 this，也就是的 VueComponent
			*/
			// TODO：在 vue-cli 的开发中，不应直接操作 DOM
			event.preventDefault()
			var id = Symbol()
			var mouseDownY = event.pageY || event.touches[0].pageY
			var topHeight = document.getElementById("listview").offsetHeight					// topHeight: 列表视图顶部的高度
			var fullHeight = document.getElementById("maincontent").offsetHeight;				// fullHeight: maincontent 的总高度
			// 添加鼠标事件捕获
			this.$store.commit('addPointerEvents', {
				type: "mousemove",
				id,
				// 处理鼠标拖动
				func: (event) => {
					var offsetY = parseInt(event.pageY || event.touches[0].pageY) - mouseDownY;		// offsetY: 鼠标相比按下时移动的高度
					var finalHeight = topHeight - (-offsetY);										// finalHeight: 最终等效的高度。这里要减负，否则 js 会当作字符串连接处理
					var listPercent = finalHeight / fullHeight;
					// console.log(offsetY, listPercent)
					if (listPercent >= 0 && listPercent <= 1) {
						this.$store.commit('dragParabox', listPercent * 100)
					} else {
						this.$store.commit('dragParabox', listPercent < 0 ? 0 : 100)
					}
				}
			})
			this.$store.commit('addPointerEvents', {
				type: "mouseup",
				id,
				// 移除鼠标事件捕获
				func: () => {
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
		}
	}
}
</script>

<style scoped>
	#parabox {
		position: absolute;
		bottom: 0;
		height: 40%;
		max-height: calc(100% - 56px);
		min-height: 28px;
		width: 100%;
		background: hsl(0, 0%, 92.5%);
		box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.3);
		/* z-index: 2; */
	}
		.paraboxes-ani-enter, .paraboxes-ani-leave-to {
			/* z-index: 0; */
			opacity: 0;
			transform: translateY(40px);
		}
		.paraboxes-ani-enter-active, .paraboxes-ani-leave-active {
			transition: opacity 0.3s, transform 0.3s;
		}
		.paraboxes-ani-enter-to, .paraboxes-ani-leave {
			/* z-index: 1; */
			opacity: 1;
			transform: translateY(0);
		}
		/* 拖动器 */
		#parabox-dragger {
			width: 100%;
			height: 28px;
			cursor: ns-resize;
		}
			#parabox-name {
				position: absolute;
				top: 4px;
				left: 50%;
				height: 20px;
				width: 65px;
				transform: translateX(-50%);
				background: url(/sidebar-icon-colored.png);
				background-size: cover;
				/* background-position-y: -40px; */
			}
			#parabox-dragger-left {
				position: absolute;
				top: 12px;
				left: 16px;
				right: calc(50% + 50px);
				height: 4px;
				background: linear-gradient(90deg, rgba(127, 127, 127, 0.1), rgba(127, 127, 127, 0.2));
				border-radius: 4px;
			}
			#parabox-dragger-right {
				position: absolute;
				top: 12px;
				right: 16px;
				left: calc(50% + 50px);
				height: 4px;
				background: linear-gradient(270deg, rgba(127, 127, 127, 0.1), rgba(127, 127, 127, 0.2));
				border-radius: 4px;
			}
		
		#paraboxes {
			position: absolute;
			top: 28px;
			/* left: 12px; */
			/* width: calc(100% - 12px); */
			left: 0;
			right: 0;
			height: calc(100% - 28px);
		}


</style>

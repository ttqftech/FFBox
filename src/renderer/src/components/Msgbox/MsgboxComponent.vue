<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { MsgboxOptions, Button } from './Msgbox';

interface Props extends MsgboxOptions {
    onClose: () => void;	// 由本组件调用，外部将本组件销毁
}

const props = defineProps({
	container: Object,
	image: Object,
	title: String,
	content: String,
	Buttons: Array,
}) as Props;

const show = ref(false);
onMounted(() => {show.value = true; console.log(props)});

const handleButtonClick = (button: Button) => {
	const ret = button.callback();
	if (true) {
		show.value = false;
	}
}

</script>

<template>
	<dialog class="dialog">
		<transition name="bganimate" @after-leave="props.onClose()">
			<div class="background" v-if="show" />
		</transition>
		<transition name="boxanimate">
			<div class="box">
				<div class="image" v-if="props.title">
					<component :is="props.image" />
				</div>
				<div class="title" v-if="props.title">{{ props.title }}</div>
				<div class="content" v-if="props.content === 'string'">
					{{ props.content }}
				</div>
				<!-- <div class="content" v-if="typeof props.content === 'object'">
					<component :is="props.content" />
				</div> -->
				<div class="buttons" v-if="props.buttons">
					<button v-for="button in props.buttons" @click="handleButtonClick(button)">
						{{ button.text }}
					</button>
				</div>
			</div>
		</transition>
	</dialog>
</template>


<style scoped lang="less">
	.dialog {
		display: flex;
		justify-content: center;
		align-items: center;
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

		.background {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			will-change: opacity;
			background-color: hwb(0 90% 20% / 0.3);
		}
		@keyframes bganimation {
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}
		.bganimate-enter-active {
			animation: bganimation ease-out 0.4s;
		}
		.bganimate-leave-active {
			animation: bganimation ease-out 0.2s reverse;
		}

		.box {
			display: flex;
			flex-direction: column;
			align-items: center;
			min-width: 200px;
			padding: 16px;
			border-radius: 8px;
			background-color: hwb(0 97% 3% / 0.8);
			box-shadow: 0 3px 2px -2px hwb(0 100% 0%) inset,	// 上亮光
					0 16px 32px 0px hwb(0 0% 100% / 0.02),
					0 6px 6px 0px hwb(0 0% 100% / 0.02),
					0 0 0 1px hwb(0deg 100% 0% / 0.9);	// 包边
			will-change: transform, opacity;
			transition: transform cubic-bezier(0.33, 1, 1, 1) 0.3s, opacity linear 0.2s;
			&>*:not(:last-child) {
				margin-bottom: 8px;
			}
			image {
				height: 80px;
			}
			.title {
				font-size: 16px;
				font-weight: 500;
			}
			.content {

			}
			.buttons {
				display: flex;
				button {
					position: relative;
					width: 100px;
					height: 28px;
					text-align: center;
					line-height: 28px;
					font-size: 14px;
					background: linear-gradient(180deg, hwb(0 100% 0%), hwb(0 94% 6%));
					box-shadow: 0 0 1px 0.5px hwb(0 99% 1%),	// 柔和边缘
								0 1px 3px 0 hwb(30 0% 100% / 0.3);	// 外部阴影
					// letter-spacing: 4px;
					// text-indent: 2px;
					color: hwb(0 20% 80%);
					font-family: inherit;
					border-radius: 8px;
					border: none;
					outline: none;
					transition: box-shadow 0.3s cubic-bezier(0, 1.5, 0.3, 1);
					&:not(&:nth-last-child(1)) {
						margin-right: 16px;
					}
					&:hover {
						box-shadow: 0 0 1px 0.5px hwb(0 99% 1%),	// 柔和边缘
									0 0 0 0.5px hwb(0 99% 1%) inset,	// 包边
									0 1px 4px 0 hwb(30 0% 100% / 0.4),	// 外部阴影
					}
					// &:hover:before {
					// 	position: absolute;
					// 	left: 0;
					// 	content: "";
					// 	width: 100%;
					// 	height: 100%;
					// 	border-radius: 8px;
					// 	background: -webkit-linear-gradient(-90deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
					// 	box-shadow: 0 0 0 1px hwb(30 0% 0%);
					// }
					&:active {
						transition: none;
						background-color: hwb(0deg 97% 3%);
						box-shadow: 0 0px 2px 0.5px hwb(0deg 0% 100% / 0.15), // 外部阴影
									0 8px 12px hwb(0deg 0% 100% / 0.1) inset; // 内部凹陷阴影
						transform: translateY(0.5px);
					}
				}
			}
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
	}

</style>

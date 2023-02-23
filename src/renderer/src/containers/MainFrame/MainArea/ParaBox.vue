<script setup lang="ts">
import { useAppStore } from '@renderer/stores/appStore';
import { ref } from 'vue';
import IconSidebarFavorite from '@renderer/assets/mainArea/paraBox/parabox_favorite.svg?component';
import IconSidebarInput from '@renderer/assets/mainArea/paraBox/parabox_input.svg?component';
import IconSidebarVideo from '@renderer/assets/mainArea/paraBox/parabox_video.svg?component';
import IconSidebarAudio from '@renderer/assets/mainArea/paraBox/parabox_audio.svg?component';
import IconSidebarEffect from '@renderer/assets/mainArea/paraBox/parabox_effect.svg?component';
import IconSidebarOutput from '@renderer/assets/mainArea/paraBox/parabox_output.svg?component';
import IconUpArrow from '@renderer/assets/mainArea/paraBox/uparrow.svg?component';

const sidebarIcons = [IconSidebarFavorite, IconSidebarInput, IconSidebarVideo, IconSidebarAudio, IconSidebarEffect, IconSidebarOutput];
const sidebarTexts = ['快捷', '输入', '视频', '音频', '效果', '输出'];
const sidebarColors = ['hwb(45 0% 5%)', 'hwb(195 0% 10%)', 'hwb(285 10% 5%)', 'hwb(120 0% 15%)', 'hwb(315 0% 0%)', 'hwb(0 30% 0%)'];
const paraSelected = 0;
const appStore = useAppStore();
const deviderRef = ref<Element>(null);

// appStore.componentRefs['MainArea']
const dragStart = (event: MouseEvent | TouchEvent) => {
	event.preventDefault();
	const deviderRect = deviderRef.value.getBoundingClientRect();	// 列表元素的 rect
	const mainAreaRect = (appStore.componentRefs['MainArea'] as Element).getBoundingClientRect();	// 列表元素的 rect
	const mouseY = (event as MouseEvent).pageY || (event as TouchEvent).touches[0].pageY;	// 鼠标在窗口内的 Y
	// const inElementY = (event as MouseEvent).offsetY || (event as TouchEvent).touches[0].offsetY;	// 鼠标在元素内的 Y
	const inElementY = mouseY - deviderRect.top;	// 不直接用 offsetY 的原因是，鼠标所在的元素不一定是 devider
	// 添加鼠标事件捕获
	let handleMouseMove = (event: Partial<MouseEvent>) => {
		const mouseY = (event as MouseEvent).pageY || (event as TouchEvent).touches[0].pageY;	// 鼠标在窗口内的 Y
		let listPercent = (mouseY - mainAreaRect.top - inElementY) / mainAreaRect.height;
		listPercent = Math.min(Math.max(listPercent, 0), 1);
		appStore.draggerPos = listPercent;
	}
	let handleMouseUp = () => {
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}
	window.addEventListener('mousemove', handleMouseMove);
	window.addEventListener('mouseup', handleMouseUp);

}
</script>

<template>
	<div class="parabox">
		<div class="upper" :style="{ height: appStore.showGlobalParams ? '64px' : undefined }">
			<div class="devider" :ref="(el) => deviderRef = el">
				<div class="buttons" @mousedown="dragStart" @touchstart="dragStart">
					<button v-for="index in [0, 1, 2, 3, 4, 5]" :key="index" :aria-label="sidebarTexts[index] + '参数'">
						<!-- <div class="icon" :class="{'icon-selected': paraSelected == index}" :style="{ backgroundPositionY: `${(value + 2) / 7 * 100}%` }"></div> -->
						<component :is="sidebarIcons[index]" :style="{ color: sidebarColors[index] }" />
						<span :style="{ color: sidebarColors[index] }">{{ sidebarTexts[index] }}</span>
					</button>
				</div>
				<button class="showGlobalButton" @mousedown="appStore.showGlobalParams = !appStore.showGlobalParams" aria-label="展示全局参数开关">
					<IconUpArrow :style="{ transform: appStore.showGlobalParams ? undefined : 'rotate(-180deg)' }" />
				</button>
			</div>
			<div class="globalparam" :style="{ opacity: appStore.showGlobalParams ? 1 : 0 }">
				<textarea readonly aria-label="全局参数" value="ffmpeg -hide_banner -hwaccel auto -i [输入文件路径] -vcodec hevc -preset medium -crf 24 -acodec copy ./[输出文件名]_converted.mp4 -y"></textarea>
			</div>
		</div>
		<div class="lower"></div>
	</div>
</template>

<style lang="less">
	.parabox  {
		position: absolute;
		bottom: 0;
		width: 100%;
		min-height: 28px;
		// height: 40%;
		background-color: hwb(0 30% 0%);
		background-color: hwb(0 94% 6%);
		box-shadow: 0px 0px 8px hwb(0 0% 100% / 0.05), // 远距离上阴影
					0px 1px 1px hwb(0 100% 0% / 0.25) inset; // 内部上阴影
		overflow: hidden;
		.upper {
			position: relative;
			height: 30px;
			background-color: hwb(0 97% 3%);
			box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.02), // 远距离下阴影
						0px -2px 1px -1px rgba(0, 0, 0, 0.1) inset; // 内部下阴影
			overflow: hidden;
			transition: height 0.4s cubic-bezier(0.2, 1.4, 0.65, 1);
			.devider {
				cursor: ns-resize;
				.buttons {
					height: 28px;
					overflow: hidden;
					button {
						display: inline-block;
						text-align: center;
						width: 80px;
						height: 28px;
						padding: 0;
						background-color: transparent;
						border: none;
						transition: width 0.3s ease;
						&:hover {
							background-color: hwb(0 100% 0% / 0.5);
							box-shadow: 0 0 4px 2px hwb(0 0% 100% / 0.05);
						}
						&:active {
							background-color: transparent;
							box-shadow: 0 0 2px 1px hwb(0 0% 100% / 0.05), // 外部阴影
										0 6px 12px hwb(0 0% 100% / 0.1) inset; // 内部凹陷阴影
							transform: translateY(0.25px);
						}
						svg {
							width: 24px;
							height: 24px;
							vertical-align: middle;
						}
						span {
							display: inline-block;
							width: 32px;
							vertical-align: -4.5px;
							padding-left: 4px;
							letter-spacing: 2px;
							white-space: nowrap;
							overflow: hidden;
							transition: width 0.3s ease, padding 0.3s ease;
						}
					}
				}
				@media only screen and (max-width: 600px) {
					.buttons {
						button {
							width: 50px;
							span {
								// display: none;
								width: 0px;
								padding: 0px;
							}
						}
					}
				}
				.showGlobalButton {
					position: absolute;
					top: 0;
					right: 0;
					width: 40px;
					height: 28px;
					display: flex;
					justify-content: center;
					align-items: center;
					padding: 0;
					background-color: transparent;
					border: none;
					&:hover {
						background-color: hwb(0 100% 0% / 0.5);
						box-shadow: 0 0 4px 2px hwb(0 0% 100% / 0.05);
					}
					&:active {
						background-color: transparent;
						box-shadow: 0 0 2px 1px hwb(0 0% 100% / 0.05), // 外部阴影
									0 6px 12px hwb(0 0% 100% / 0.1) inset; // 内部凹陷阴影
						transform: translateY(0.25px);
					}
					svg {
						width: 20px;
						height: 20px;
						color: #777;
						transition: transform 0.4s cubic-bezier(0.2, 1.4, 0.65, 1);
					}
				}
			}
			.globalparam {
				position: absolute;
				top: 30px;
				left: 6px;
				right: 6px;
				height: 30px;
				box-sizing: border-box;
				transition: opacity 0.2s ease;
				textarea {
					border: none;
					background: hwb(0 96% 4% / 0.6);
					outline: none;
					box-sizing: border-box;
					width: 100%;
					height: 100%;
					resize: none;
					color: #333;
					font-family: Consolas,monaco,"黑体","苹方-简","苹方",Roboto;
					font-weight: 400;
					font-size: 12px;
					line-height: 13px; // 52 / 4
					border-radius: 0 2px 2px 0;
					box-shadow: 0 0 1px 1px hwb(0 0% 100% / 0.05), // 外部阴影
								0 3px 6px hwb(0 0% 100% / 0.02) inset; // 内部凹陷阴影
					&:hover {
						background: hwb(0 97% 3% / 0.8);
						box-shadow: 0 0 1px 1px hwb(210deg 0% 0% / 0.5), // 外部阴影
									0 3px 6px hwb(0 0% 100% / 0.02) inset; // 内部凹陷阴影
					}
				}
			}
		}
		.lower {

		}
	}

</style>
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
// import Tooltip from './Tooltip/Tooltip';
import Tooltip from '@renderer/components/Tooltip/Tooltip';

import { BaseComboItem } from '@common/types';

interface Props {
	title: string;
	text: string;
	list: Array<BaseComboItem>;
	readonly?: boolean;
	deletable?: boolean;
	onChange?: (value: string) => any;
	onDelete?: (index: number) => any;
}

const props = defineProps<Props>();

const focused = ref(false);
const comboOpened = ref(false);
const inputText = ref('-');
const currentIndex = ref(-1);
const comboPosition = ref<Partial<{
	left: string;
	top: string;
	bottom: string;
	height: string;
	width: string;
}>>({});

const selectorRef = ref<Element>(null);
const menuRef = ref<Element>(null);

// 处理输入框
const handleClick = () => {
	calcComboPosition();

	// 计算默认项
	currentIndex.value = props.list.findIndex((value, index) => {
		if (value.sName === props.text) {
			return true;
		}
	});

	selectorRef.value.firstElementChild!.focus();
	comboOpened.value = true;
	// Vue.nextTick(() => {
	setTimeout(() => {
		menuRef.value.firstElementChild!.children[currentIndex.value].scrollIntoView({
			behavior: "auto", block: "nearest", inline: "nearest"
		});
	}, 0);
	// });
};

const handleBlur = (event: FocusEvent) => {
	// 鼠标按下菜单中的元素时，首先触发输入框的 onBlur，然后才触发菜单的 onMouseDown
	// onBlur 发生时，activeElement 是 body，需要在 nextTick 读取才能读到正确的被激活的元素
	// 只要这个元素是菜单元素中的任意一项，就忽略这次失焦行为，避免影响菜单的 onClick 事件
	setTimeout(() => {
		let allowedActiveElement = flattenElement(menuRef.value);
		let findResult = allowedActiveElement.find((element) => {
			return element === document.activeElement;
		});
		if (!findResult) {
			focused.value = false;
			comboOpened.value = false;
		} else {
			selectorRef.value.firstElementChild!.focus();
		}
	}, 0);
};

const handleFocus = (event: FocusEvent) => {
	focused.value = true;
};

const handleInput = (event: InputEvent) => {
	let newValue = (event.target as HTMLInputElement).value;
	currentIndex.value = props.list.findIndex((value, index) => {
		return value.sName == newValue;
	});
	(props.onChange || (() => {}))(newValue);
};

const handleKeydown = (event: KeyboardEvent) => {
	let selectionChaged = true;
	switch (event.key) {
		case 'ArrowUp':
			if (currentIndex.value > 0) {
				currentIndex.value--;
			} else {
				currentIndex.value = props.list.length - 1;
			}
			break;
		case 'ArrowDown':
			if (currentIndex.value < props.list.length - 1) {
				currentIndex.value++;
			} else {
				currentIndex.value = 0;
			}
			break;
		case 'Home':
			currentIndex.value = 0;
			break;
		case 'End':
			currentIndex.value = props.list.length - 1;
			break;
		case 'Enter':
		case 'Escape':
			comboOpened.value = false;
		default:
			selectionChaged = false;
			break;
	}
	if (selectionChaged) {
		event.preventDefault();
		inputText.value = props.list[currentIndex.value].sName;
		props.onChange(inputText.value);
		if (!comboOpened.value) {
			comboOpened.value = true;
			calcComboPosition();
		}
		// Vue.nextTick(() => {
		setTimeout(() => {
			// 若 !comboOpened，此处没有 child，所以等 nextTick 处理
			menuRef.value.firstElementChild!.children[currentIndex.value].scrollIntoView({
				behavior: "auto", block: "nearest", inline: "nearest"
			});
		}, 0);
		// })
	}
};

// 处理菜单
const handleMenuClick = (index: number) => {
	let newValue = props.list[index].sName;
	inputText.value = newValue;
	props.onChange(newValue);
	comboOpened.value = false;
	Tooltip.hide();
};

const handleMenuMouseEnter = (event: MouseEvent, index: number) => {
	if (!props.list[index].description) {
		return;
	}
	let position = {};
	let target = event.target as HTMLElement;
	let targetRect = target.getBoundingClientRect();
	// 计算水平方向
	if (parseInt(comboPosition.value.left) + event.target!.offsetWidth / 2 < document.documentElement.clientWidth / 2) {
		position = {
			...position,
			left: `${targetRect.left + targetRect.width + 16}px`,
		}
	} else {
		position = {
			...position,
			right: `calc(100% - ${targetRect.left - 16}px)`,
		}
	}
	// 计算垂直方向（若 item 垂直位置在窗口上方，那么指定 top，否则指定 bottom）
	if (targetRect.top + targetRect.height / 2 < document.documentElement.clientHeight / 2) {
		position = {
			...position,
			top: `${targetRect.top}px`,
		}
	} else {
		position = {
			...position,
			bottom: `calc(100% - ${targetRect.top + targetRect.height}px)`
		}
	}
	Tooltip.show({
		text: props.list[index].description,
		position,
	})
};

const handleMenuMouseLeave = () => {
	Tooltip.hide();
};

const handleMenuDeleteClick = (event: MouseEvent, index: number) => {
	event.stopPropagation();
	(props.onDelete || (() => {}))(index);
};

const calcComboPosition = () => {
	// 暂时写死的高度
	const titlebarHeight = 28;
	const menuItemHeight = 40;
	const statusbarHeight = 24;

	let ScreenWidth = document.documentElement.clientWidth;			// 使用 window.innerWidth 也行
	let ScreenHeight = document.documentElement.clientHeight;
	let finalPosition = {};
	let target = selectorRef.value;

	let listHeight = menuItemHeight * props.list.length;
	let selectorUpperTop = target.getBoundingClientRect().top;
	let selectorLowerTop = selectorUpperTop + target.offsetHeight;
	let upperSpace = selectorUpperTop - titlebarHeight;
	let lowerSpace = ScreenHeight - selectorLowerTop - statusbarHeight;
	
	// 计算水平位置
	finalPosition = { left: `${target.getBoundingClientRect().left - 39}px` };
	
	// 计算垂直位置
	if (upperSpace >= lowerSpace) {
		// 上方空间更大，往上弹出
		if (listHeight <= upperSpace) {
			finalPosition = { ...finalPosition, height: `${listHeight}px`, bottom: `${ScreenHeight - upperSpace}px` };
		} else {
			finalPosition = { ...finalPosition, height: `${upperSpace - titlebarHeight}px`, top: `${titlebarHeight}px` };
		}
	} else {
		// 下方空间更大，往下弹出
		if (listHeight <= lowerSpace) {
			finalPosition = { ...finalPosition, height: `${listHeight}px`, top: `${ScreenHeight - lowerSpace}px` };
		} else {
			finalPosition = { ...finalPosition, height: `${lowerSpace - statusbarHeight}px`, bottom: `${statusbarHeight}px` };
		}
	}

	// 确定位置
	comboPosition.value = finalPosition;
};

// 监听 props 中的 text，并在其更新时依此更新 data 中的 inputText（与输入框双向绑定）
watch(() => props.text, (newValue, oldValue) => {
	inputText.value = newValue;
})

onMounted(() => {
	inputText.value = props.text;
})

function flattenElement(element: Element) {
	let ret = [element];
	for (const child of element.children) {
		ret.push(...flattenElement(child));
	}
	return ret;
}

</script>

<template>
	<div class="combobox">
		<div class="combobox-title">{{ title }}</div>
		<div class="combobox-selector" ref="selectorRef" :style="{ background: focused || comboOpened ? 'white' : '' }" @click="handleClick">
			<input
				type="text"
				v-model="inputText"
				:readonly="readonly"
				@blur="handleBlur"
				@focus="handleFocus"
				@input="handleInput"
				@keydown="handleKeydown"
			>
			<div class="combobox-selector-img"></div>
		</div>
		<div class="combomenu" ref="menuRef">
			<transition name="comboanimate">
				<menu class="combomenu-list" v-if="comboOpened" :style="comboPosition">
					<div
						v-for="(listitem, index) in list"
						:key="listitem.sName"
						class="combomenu-item"
						:class="{ combomenuItemSelected: index === currentIndex }"
						:tabindex="index" @click="handleMenuClick(index)"
						@mouseenter="handleMenuMouseEnter($event, index)"
						@mouseleave="handleMenuMouseLeave()"
					>
						<!-- <div class="combomenu-item-img" style="background-image: url(image/star.png);"></div> -->
						{{ listitem.lName }}
						<button v-if="deletable" class="combomenu-item-delete" aria-label="删除此项" @click="handleMenuDeleteClick($event, index)">
							<img src="@renderer/assets/mainArea/paraBox/×.svg" alt="">
						</button>
					</div>
				</menu>
			</transition>
		</div>
	</div>
</template>

<style scoped>
	.combobox {
		position: relative;
		width: 210px;
		height: 56px;
		margin: 4px 24px;
	}
		.combobox-title {
			position: absolute;
			left: 0;
			top: 50%;
			width: 88px;
			transform: translateY(-50%);
			font-size: 14px;
			text-align: center;
		}
		.combobox-selector {
			position: absolute;
			left: 88px;
			height: 24px;
			width: 122px;
			margin: 15px 0;
			border-radius: 24px;
			background: #F7F7F7;
			border: #AAA 1px solid;
			box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
		}
		.combobox-selector:hover {
			background: white;
		}
		.combobox-selector:active {
			background: #E7E7E7;
		}
			.combobox-selector input {
				position: absolute;
				left: 6px;
				width: calc(100% - 28px);
				height: 24px;
				line-height: 24px;
				background: none;
				border: none;
				margin: 0;
				padding: 0;
				outline: none;
				font-family: inherit;
				font-size: 13px;
				color: inherit;
			}
			.combobox-selector-img {
				position: absolute;
				right: 6px;
				top: 4px;
				width: 16px;
				height: 16px;
				background: url(/src/assets/mainArea/paraBox/menu_button.svg) center/contain no-repeat;
			}
		.combomenu {
			position: fixed;
			left: 0;
			top: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
			z-index: 100;
		}
			.combomenu * {
				pointer-events: auto;
			}
			.combomenu-list {
				position: absolute;
				width: 200px;
				background: #fbfbfb;
				box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);
				border-radius: 8px;
				overflow-y: auto;
				font-size: 0;
				text-align: left;
				padding-inline-start: 0;
			}
			.comboanimate-enter-from, .comboanimate-leave-to {
				transform: scale(0.95);
				opacity: 0;
			}
			.comboanimate-enter-active {
				transition: transform cubic-bezier(0.33, 1, 1, 1) 0.15s, opacity linear 0.1s;
			}
			.comboanimate-enter-to, .comboanimate-leave-from {
				transform: scale(1);
				opacity: 1;
			}
			.comboanimate-leave-active {
				transition: all linear 0.1s;
			}
			.combomenu-list::-webkit-scrollbar {
				position: relative;
				width: 12px;
				left: -32px;
				background: transparent;
			}
			.combomenu-list::-webkit-scrollbar-thumb {
				border-radius: 12px;
				background: rgba(192, 192, 192, 0.3);
			}
			.combomenu-list::-webkit-scrollbar-track {
				background: none;
			}
				.combomenu-item {
					display: inline-block;
					position: relative;
					width: 100%;
					height: 40px;
					border-bottom: #EEE 1px solid;
					box-sizing: border-box;
					padding-left: 40px;
					font-size: 16px;
					line-height: 40px;
					outline: none;
				}
				.combomenu-item:nth-last-child(1) {
					border-bottom: none;
				}
				.combomenu-item:hover, .combomenu-item:focus {
					background: hsl(210, 95%, 90%);
				}
				.combomenuItemSelected, .combomenuItemSelected:focus {
					background: hsl(210, 95%, 80%);
				}
					.combomenu-item-img {
						position: absolute;
						left: 10px;
						top: 10px;
						width: 20px;
						height: 20px;
						background-size: cover;
					}
					.combomenu-item-delete {
						position: absolute;
						top: 0;
						right: 0;
						height: 100%;
						width: 32px;
						opacity: 0.5;
						border: none;
						outline: none;
						background: none;
						padding: 0;
						display: flex;
						justify-content: center;
						align-items: center;
					}
					.combomenu-item-delete:hover {
						background: hsl(210, 100%, 95%);
						opacity: 1;
					}
					.combomenu-item-delete:active {
						background: hsl(210, 100%, 95%);
						opacity: 0.7;
					}
						.combomenu-item-delete>img {
							width: 16px;
						}

					
			.combomenu-description {
				display: inline-block;
				position: absolute;
				height: 200px;
				background: #fbfbfb;
				box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);
				border-radius: 12px;
				font-size: 14px;
				pointer-events: none;
				overflow: hidden;
				transition: all 0.2s;
			}
			.combomenu-description-open {
				padding: 12px;
				width: 300px;
			}
			.combomenu-description-fold {
				padding: 0px;
				width: 0px;
			}

</style>

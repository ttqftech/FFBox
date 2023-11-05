<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
// import Tooltip from './Tooltip/Tooltip';
// import Tooltip from '@renderer/components/Tooltip/Tooltip';

import showMenu, { MenuItem } from '@renderer/components/Menu/Menu';

interface Props {
	title: string;
	text: string;
	list: MenuItem[];
	readonly?: boolean;
	deletable?: boolean;
	validator?: (value: string) => string;
	inputFixer?: (value: string) => string;
	onChange?: (value: string) => any;
	onDelete?: (index: number) => any;
}

const props = defineProps<Props>();

const focused = ref(false);
const comboOpened = ref(false);
const inputText = ref('-');
const invalidMsg = ref<string>(undefined);

const selectorRef = ref<Element>(null);
const menuRef = ref<ReturnType<typeof showMenu>>(null);

const selectorStyle = computed(() => {
	const ret: any = {};
	if (invalidMsg.value) {
		ret.border = '#E66 1px solid';
		ret.boxShadow = '0 0 12px hsla(0, 100%, 60%, 0.3), 0px 4px 8px rgba(0, 0, 0, 0.05)';
		if (focused.value) {
			ret.background = '#FEE';
		} else {
			ret.background = '#F7E7E7';
		}
	} else {
		if (focused.value || comboOpened.value) {
			ret.background = 'white';
		}
	}
	return ret;
});

// 输入框点击打开菜单
const handleClick = () => {
	const selectorRect = selectorRef.value.getBoundingClientRect();
	menuRef.value = showMenu({
		menu: props.list,
		type: 'select',
		selectedValue: props.text,
		triggerRect: { xMin: selectorRect.x, yMin: selectorRect.y, xMax: selectorRect.x + selectorRect.width, yMax: selectorRect.y + selectorRect.height },
		onSelect: (event, value, checked) => {
			inputText.value = value;
			props.onChange(value);
			menuRef.value.setSelectedValue(value);	// 更改值后主动反馈至菜单
		},
		onClose: () => {
			comboOpened.value = false;
			menuRef.value = null;
		},
		returnFocus: (e) => {
			selectorRef.value.firstElementChild!.focus();
		},
		onKeyDown: (e) => {
			if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
				let selPos = (selectorRef.value.firstChild as HTMLInputElement).selectionStart;
				if (e.key === 'ArrowLeft') {
					selPos--;
				} else if (e.key === 'ArrowRight') {
					selPos++;
				}
				(selectorRef.value.firstChild as HTMLInputElement).selectionStart = selPos;
				(selectorRef.value.firstChild as HTMLInputElement).selectionEnd = selPos;
			}
		},
	});

	selectorRef.value.firstElementChild!.focus();
	comboOpened.value = true;
};

const handleBlur = (event: FocusEvent) => {
	focused.value = false;
	comboOpened.value = false;
};

const handleFocus = (event: FocusEvent) => {
	focused.value = true;
};

const handleInput = (event: InputEvent) => {
	if (props.inputFixer) {
		inputText.value = props.inputFixer(event.target.value);
	}
	let newValue = (event.target as HTMLInputElement).value;
	menuRef.value.setSelectedValue(newValue);
	(props.onChange || (() => {}))(newValue);
};

const handleKeydown = (event: KeyboardEvent) => {
	if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', 'Escape'].includes(event.key)) {
		if (menuRef.value) {
			menuRef.value.triggerKeyboardEvent(event);
			event.preventDefault();
		} else {
			if (['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
				handleClick();	// 未打开菜单情况下通过这些按键可打开菜单
				event.preventDefault();
			}
		}
	}
};

// 监听 props 中的 text，并在其更新时依此更新 data 中的 inputText（与输入框双向绑定）
watch(() => props.text, (newValue, oldValue) => {
	inputText.value = newValue;
});
watch(inputText, (newValue, oldValue) => {
	if (props.validator) {
		invalidMsg.value = props.validator(newValue ?? '');
	} else {
		invalidMsg.value = undefined;
	}
}, { immediate: true });

onMounted(() => {
	inputText.value = props.text;
});

</script>

<template>
	<div class="combobox">
		<div class="combobox-title">{{ title }}</div>
		<div class="combobox-selector" ref="selectorRef" :style="selectorStyle" @click="handleClick">
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
</style>

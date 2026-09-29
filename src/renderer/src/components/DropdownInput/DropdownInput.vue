<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import IconMenuButton from './menu_button.svg?component';

import showMenu, { MenuItem } from '@renderer/components/Menu/Menu';

interface Props {
	// 受控属性：text 是当前值的唯一真值来源（同时驱动输入框显示与菜单的选中高亮）。
	// 组件自身不写回 text——选中 / 输入后通过 onChange 把值交给父组件，由父组件写回 :text。
	// 若父组件未在 onChange 中写回，重开菜单时会定位回旧的 text 值
	// （FFBox-UI 的 Lit 版 ffbox-dropdown-input 为自包含组件，改为内部同步回 text 属性，无需写回）
	text?: string | number;
	list: MenuItem[];
	readonly?: boolean;	// 不允许输入，但允许下拉选择
	disabled?: boolean;	// 不允许更改
	placeholder?: string;
	// deletable?: boolean;
	validator?: (value: string) => string | undefined;
	inputFixer?: (value: string) => string;
	onChange?: (value: string) => any;
	onEnter?: () => any;
	// onDelete?: (index: number) => any;
}

const props = defineProps<Props>();

const focused = ref(false);
const comboOpened = ref(false);
const inputText = ref('-');
const invalidMsg = ref<string | undefined>(undefined);

const selectorRef = ref<HTMLDivElement | null>(null);
const menuRef = ref<ReturnType<typeof showMenu> | null>(null);

const selectorStyle = computed(() => {
	const ret: any = {};
	// 校验有误的情况下背景和边框都变红
	if (invalidMsg.value) {
		ret.border = 'var(--errorBorder) 1px solid';
		ret.boxShadow = '0 0 12px hsla(0, 100%, 60%, 0.3), 0px 4px 8px hwb(0 0 0 / 0.05)';
		if (focused.value) {
			ret.background = 'var(--errorBgActive)';
		} else {
			ret.background = 'var(--errorBg)';
		}
	} else {
		if (focused.value) {
			ret.background = 'var(--ff)';
		}
	}
	// 禁用的情况下整体变透明，并且固定背景颜色
	if (props.disabled) {
		ret.opacity = 0.6;
		ret.color = 'var(--66)'; // 默认，20% 亮度黑色，变灰 40% 亮度黑色
		ret.background = 'var(--f7)';
	}
	return ret;
});

// 输入框点击、方向键等打开菜单
const openMenu = () => {
	if (props.disabled) {
		return;
	}
	const selectorRect = selectorRef.value!.getBoundingClientRect();
	menuRef.value = showMenu({
		menu: props.list,
		type: 'select',
		// 以 text 为选中高亮的定位来源——依赖父组件在 onChange 中写回 :text 才能从当前选中项继续（见 Props 注释）
		selectedValue: props.text,
		triggerRect: { xMin: selectorRect.x, yMin: selectorRect.y, xMax: selectorRect.x + selectorRect.width, yMax: selectorRect.y + selectorRect.height },
		onSelect: (event, value, checked) => {
			inputText.value = value;
			props.onChange?.(value);
			menuRef.value!.setSelectedValue(value);	// 更改值后主动反馈至菜单
		},
		onClose: () => {
			comboOpened.value = false;
			menuRef.value = null;
		},
		returnFocus: (e) => {
			selectorRef.value!.firstElementChild!.focus();
		},
		onKeyDown: (e) => {
			if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
				let selPos = (selectorRef.value!.firstChild as HTMLInputElement).selectionStart || 0;
				if (e.key === 'ArrowLeft') {
					selPos--;
				} else if (e.key === 'ArrowRight') {
					selPos++;
				}
				(selectorRef.value!.firstChild as HTMLInputElement).selectionStart = selPos;
				(selectorRef.value!.firstChild as HTMLInputElement).selectionEnd = selPos;
			}
		},
	});

	selectorRef.value!.firstElementChild!.focus();
	comboOpened.value = true;
};

const handleBlur = (event: FocusEvent) => {
	focused.value = false;
	comboOpened.value = false;
};

const handleFocus = (event: FocusEvent) => {
	focused.value = true;
};

const handleInput = (event: Event) => {
	if (props.inputFixer) {
		inputText.value = props.inputFixer((event.target as HTMLInputElement).value);
	}
	let newValue = (event.target as HTMLInputElement).value;
	menuRef.value?.setSelectedValue(newValue);
	props.onChange?.(newValue);
};

const handleKeydown = (event: KeyboardEvent) => {
	if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', 'Escape'].includes(event.key)) {
		if (menuRef.value) {
			menuRef.value.triggerKeyboardEvent(event);
			event.preventDefault();
		} else {
			if (props.onEnter) {
				// 若定义了 Enter 行为，则优先使用该行为
				props.onEnter();
			} else {
				if (['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
					openMenu();	// 未打开菜单情况下通过这些按键可打开菜单
					event.preventDefault();
				}
			}
		}
	}
};

// 监听 props 中的 text，并在其更新时依此更新 data 中的 inputText（与输入框双向绑定）
watch(() => props.text, (newValue, oldValue) => {
	inputText.value = newValue !== undefined ? newValue + '' : '';
});
watch(inputText, (newValue, oldValue) => {
	if (props.validator) {
		invalidMsg.value = props.validator(newValue ?? '');
	} else {
		invalidMsg.value = undefined;
	}
}, { immediate: true });

onMounted(() => {
	inputText.value = props.text !== undefined ? props.text + '' : '';
});

</script>

<template>
	<div class="combobox-selector" ref="selectorRef" :style="selectorStyle" @click="openMenu">
		<input
			type="text"
			v-model="inputText"
			:readonly="readonly || disabled"
			@blur="handleBlur"
			@focus="handleFocus"
			@input="handleInput"
			@keydown="handleKeydown"
			:placeholder="placeholder"
		>
		<IconMenuButton class="combobox-selector-img"></IconMenuButton>
	</div>
</template>

<style scoped>
	.combobox-selector {
		position: relative;
		height: 24px;
		/* width: 122px; */
		flex-grow: 1;
		border-radius: 24px;
		background: var(--f7);
		border: #AAA 1px solid;
		box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
	}
	.combobox-selector:hover {
		background: var(--ff);
	}
	.combobox-selector:active {
		background: var(--e7);
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
		}
</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

interface Props {
	title: string;
	value?: string;
	disabled?: boolean;
	long?: boolean;
	validator?: (value: string) => string;
	inputFixer?: (value: string) => string;
	placeholder?: string;
	onChange?: (value: string) => any;
};

const props = defineProps<Props>();

const focused = ref(false);
const inputText = ref('-');
const invalidMsg = ref<string>(undefined);

const selectorStyle = computed(() => {
	const ret: any = {};
	// 校验有误的情况下背景和边框都变红
	if (invalidMsg.value) {
		ret.border = 'var(--errorBorder) 1px solid';
		ret.boxShadow = '0 0 12px hsla(0, 100%, 60%, 0.3), 0px 4px 8px rgba(0, 0, 0, 0.05)';
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

const handleBlur = (event: FocusEvent) => {
	focused.value = false;
};
const handleFocus = (event: FocusEvent) => {
	event.target!.selectionEnd = event.target!.selectionStart;
	focused.value = true;
};
const handleInput = (event: KeyboardEvent) => {
	if (props.inputFixer) {
		inputText.value = props.inputFixer(event.target.value);
	}
	(props.onChange || (() => {}))(inputText.value);
};

// 监听 props 中的 text，并在其更新时依此更新 data 中的 inputText（与输入框双向绑定）
watch(() => props.value, (newValue, oldValue) => {
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
	inputText.value = props.value;
});

</script>

<template>
	<div class="inputbox" :style="{ width: long ? 'calc(100% - 28px)' : '210px' }">
		<div class="inputbox-title">{{ title }}</div>
		<div class="inputbox-selector" :style="selectorStyle">
			<input type="text" :disabled="props.disabled" v-model="inputText" @blur="handleBlur" @focus="handleFocus" @input="handleInput" :placeholder="placeholder">
		</div>
	</div>
</template>

<style scoped>
	.inputbox {
		position: relative;
		height: 56px;
		margin: 4px 28px 4px 20px;
	}
		.inputbox-title {
			position: absolute;
			left: 0;
			top: 50%;
			width: 88px;
			transform: translateY(-50%);
			font-size: 14px;
			text-align: center;
		}
		.inputbox-selector {
			position: absolute;
			left: 88px;
			height: 24px;
			right: 0;
			margin: 15px 0;
			border-radius: 24px;
			background: var(--f7);
			border: #AAA 1px solid;
			box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
			transition: box-shadow 0.2s linear, border 0.2s linear;
		}
		.inputbox-selector:hover {
			background: var(--ff);
		}
		.inputbox-selector:active {
			background: var(--e7);
		}
			.inputbox-selector>input {
				position: absolute;
				left: 6px;
				width: calc(100% - 12px);
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
			.inputbox-selector>input::placeholder {
				font-size: 13px;
				opacity: 0.1;
				font-style: italic;
				transition: opacity 0.15s linear;
			}
			.inputbox-selector>input:hover::placeholder {
				font-size: 13px;
				opacity: 0.25;
			}

</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

interface Props {
	title: string;
	value?: string;
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
	if (invalidMsg.value) {
		ret.border = '#E66 1px solid';
		ret.boxShadow = '0 0 12px hsla(0, 100%, 60%, 0.3), 0px 4px 8px rgba(0, 0, 0, 0.05)';
		if (focused.value) {
			ret.background = '#FEE';
		} else {
			ret.background = '#F7E7E7';
		}
	} else {
		if (focused.value) {
			ret.background = 'white';
		}
	}
	return ret;
})

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

watch(() => props.value, (newValue, oldValue) => {		// props 的 text 只有单向数据流，因此新增 data 的 inputText 做双向绑定和事件监听
	inputText.value = newValue;
});
watch(inputText, (newValue, oldValue) => {		// props 的 text 只有单向数据流，因此新增 data 的 inputText 做双向绑定和事件监听
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
			<input type="text" v-model="inputText" @blur="handleBlur" @focus="handleFocus" @input="handleInput" :placeholder="placeholder">
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
			background: #F7F7F7;
			border: #AAA 1px solid;
			box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
			transition: box-shadow 0.2s linear, border 0.2s linear;
		}
		.inputbox-selector:hover {
			background: white;
		}
		.inputbox-selector:active {
			background: #E7E7E7;
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

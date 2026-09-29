<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { durationFixer, durationValidator } from '@renderer/components/validatorAndFixer';
import Button, { ButtonType } from '@renderer/components/Button/Button'

interface Props {
	value: [string | undefined, string | undefined];
	disabled?: boolean;
	placeholder?: [string, string];
	onChange?: (value: [string | undefined, string | undefined]) => any;
	onButtonClick?: () => any;
	onEnter?: () => any;
};

const props = defineProps<Props>();

const focused = ref([false, false]);
const inputText = ref<[string | undefined, string | undefined]>([undefined, undefined]);
const invalidMsg = ref<string | undefined>(undefined);

const selectorStyle = computed(() => {
	const ret: any = {};
	if (props.value === undefined) {
		return ret;
	}
	// 校验有误的情况下背景和边框都变红
	if (invalidMsg.value) {
		ret.border = 'var(--errorBorder) 1px solid';
		ret.boxShadow = '0 0 12px hsla(0, 100%, 60%, 0.3), 0px 4px 8px rgba(0, 0, 0, 0.05)';
		if (focused.value[0] || focused.value[1]) {
			ret.background = 'var(--errorBgActive)';
		} else {
			ret.background = 'var(--errorBg)';
		}
	} else {
		if (focused.value[0] || focused.value[1]) {
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

const handleBlur = (index: number) => {
	focused.value[index] = false;
};
const handleFocus = (index: number) => {
	// event.target!.selectionEnd = event.target!.selectionStart;
	focused.value[index] = true;
};
const handleInput = (event: Event, index: number) => {
	inputText.value[index] = durationFixer((event.target as HTMLInputElement).value);
	(props.onChange || (() => {}))(inputText.value);	// 使用输入法时会出现 inputText 为空的现象
};
const handleKeydown = (event: KeyboardEvent) => {
	if (props.onEnter && event.key === 'Enter') {
		props.onEnter();
	}
};

// 监听 props 中的 text，并在其更新时依此更新 data 中的 inputText（与输入框双向绑定）
watch(() => props.value, (newValue, oldValue) => {
	inputText.value = newValue;
});
watch(inputText, (newValue, oldValue) => {
	invalidMsg.value = durationValidator(newValue[0] ?? '') || durationValidator(newValue[1] ?? '');
}, { immediate: true });

onMounted(() => {
	inputText.value = props.value;
});

</script>

<template>
	<div class="inputbox-selector">
		<div class="inputbox-selectorBackground-wrapper">
			<div :style="selectorStyle"></div>
		</div>
		<input :disabled="props.disabled" v-model="inputText[0]" @blur="handleBlur(0)" @focus="handleFocus(0)" @input="handleInput($event, 0)" @keydown="handleKeydown" :placeholder="placeholder?.[0]">
		<div class="opButton">
			<div class="hiddenButton">
				<Button size="small" :type="ButtonType.Danger" @click="props.onChange?.(['', ''])">清空</Button>
			</div>
			<Button size="small" @click="onButtonClick">编✂️辑</Button>
		</div>
		<input :disabled="props.disabled" v-model="inputText[1]" @blur="handleBlur(1)" @focus="handleFocus(1)" @input="handleInput($event, 1)" @keydown="handleKeydown" :placeholder="placeholder?.[1]">
	</div>
</template>

<style lang="less" scoped>
	.inputbox-selector {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 6px;
		height: 24px;
		flex-grow: 1;
		margin: 15px 0;
		&:hover .inputbox-selectorBackground-wrapper>div {
			background: var(--ff);
		}
		.inputbox-selectorBackground-wrapper {
			position: absolute;
			top: -4px;
			left: -8px;
			width: calc(100% + 16px);
			height: calc(100% + 16px);
			-webkit-mask-image: linear-gradient(to right, black calc(50% - 34px), #0003 calc(50% - 18px), #0003 calc(50% + 18px), black calc(50% + 34px));
			z-index: -1;
			&>div {
				position: absolute;
				top: 3px;	// border 有 1px 往下顶，所以这里减去 1px
				left: 8px;
				width: calc(100% - 16px);
				height: calc(100% - 16px);
				border-radius: 24px;
				background: var(--f7);
				border: #AAA 1px solid;
				box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
				transition: box-shadow 0.2s linear, border 0.2s linear;
			}
		}
		&>input {
			width: calc(50% - 28px - 12px);
			height: 24px;
			line-height: 24px;
			background: none;
			border: none;
			margin: 0;
			padding: 0;
			outline: none;
			font-family: inherit;
			font-size: 13px;
			text-align: center;
			color: inherit;
			&::placeholder {
				font-size: 13px;
				opacity: 0.1;
				font-style: italic;
				transition: opacity 0.15s linear;
			}
			&:hover::placeholder {
				font-size: 13px;
				opacity: 0.25;
			}
		}
		.opButton {
			position: relative;
			button {
				width: 60px;
			}
			&:hover {
				.hiddenButton {
					height: calc(24px + 22px);
					transform: translateY(-22px);
					opacity: 1;
					// outline: red 1px solid;
					transition: transform 0.4s cubic-bezier(0.2, 1.5, 0.3, 1);
				}
			}
			.hiddenButton {
				position: absolute;
				opacity: 0;
				transition: transform 0.4s, opacity 0.1s;
				button {
					height: 20px;
				}
			}
		}
	}
</style>

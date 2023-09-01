<script setup lang="ts">
import { CSSProperties, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface Props {
	style?: CSSProperties;
	value?: string;
	onInput?: (event: Event) => void | false;
	onKeyDown?: (event: Event) => void | false;
	onPressEnter?: (value: string) => void;
	onChange?: (value: string) => void;
	onBlur?: (value: string) => void;
}

const props = defineProps<Props>();
const divRef = ref();
const ro = ref<ResizeObserver>();
const text = ref<string>();
const size = ref<CSSProperties>({
	width: 0
});

const refreshSize = () => {
    const rect = divRef.value?.getBoundingClientRect();
	if (rect) {
		size.value = {
			width: `${Math.max(8, rect.width)}px`,
		};
	}
}

const handleInput = (event: Event) => {
	if (!props.onInput || props.onInput(event) !== false) {
		text.value = event.target.value;
	}
	// nextTick(refreshSize); 已在 ResizeObserver 处理
};
const handleKeyDown = (event: KeyboardEvent) => {
	if (props.onKeyDown && props.onKeyDown(event) === false) {
		return;
	}
	if (event.key === 'Enter') {
		(props.onPressEnter || (() => {}))(event.target.value);
	}
};

onMounted(() => {
	text.value = props.value;
	ro.value = new ResizeObserver((entries) => {
		refreshSize();
	});
	ro.value.observe(divRef.value);
	// nextTick(refreshSize); 已在 ResizeObserver 处理
});
onBeforeUnmount(() => {
	ro.value.disconnect();
});

watch(() => props.value, (a, b) => {
	text.value = props.value;
	nextTick(refreshSize);
});

</script>

<template>
	<div>
		<input
			:style="{ fontSize: 'inherit', ...props.style, ...size }"
			type="text"
			@keydown="handleKeyDown"
			@input="handleInput"
			@blur="event => (props.onBlur || (() => {}))(event.target.value)"
			@change="event => (props.onChange || (() => {}))(event.target.value)"
			:value="text"
		/>
		<div class="hiddenDiv" :style="props.style" ref="divRef">
			{{ text }}
		</div>
	</div>
</template>

<style scoped lang="less">
	.hiddenDiv {
		display: inline-block;
		position: fixed;
		visibility: hidden;
	}
</style>

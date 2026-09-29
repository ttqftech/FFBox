<script setup lang="ts">
/**
 * 本组件适用于需要对不定高度组件进行通过高度变化的动画进行显隐的场景
 * AutoSizeWrapper 自身是一个 div，能测量 slot 中所有组件的高度并反馈到 AutoSizeWrapper 的 style 或 customStyle 函数的参数中
 * 由于 slot 可以是多个组件，所以会多一层 div 进行打包测量高度
 * 注意此组件并不适用于通过动态高度 slot 组件的高度修改 slot 组件的高度，因为这个逻辑回环了。子组件的高度应当是自由撑开的，否则无法测量高度
 */
import { onMounted, ref, onBeforeUnmount, nextTick, computed, watch, StyleValue } from 'vue'

interface Props {
	useResizeObserver?: boolean;
	style?: (size: { width: number; height: number }) => StyleValue;
	customStyle?: (size: { width: number; height: number }) => StyleValue;	// 若 style 不生效，使用 customStyle
	onResize?: (size: { width: number; height: number }) => void;
}

const props = defineProps<Props>();

const containerRef = ref<HTMLElement>();
const width = ref(0);
const height = ref(0);
let resizeObserver: ResizeObserver | null = null;

const updateSize = () => {
	if (!containerRef.value) return;
	const rect = containerRef.value.firstElementChild!.getBoundingClientRect();
	width.value = rect.width;
	height.value = rect.height;
	props.onResize?.({ width: width.value, height: height.value });
};

const observeSlot = (observe: boolean) => {
	const target = containerRef.value?.firstElementChild;
	if (!target) return;
	if (observe) {
		if (!resizeObserver) {
			resizeObserver = new ResizeObserver(() => updateSize());
		}
		resizeObserver.observe(target);
	} else if (resizeObserver) {
		resizeObserver.unobserve(target);
	}
};

onMounted(async () => {
	await nextTick();
	updateSize();
	if (props.useResizeObserver) {
		observeSlot(true);
	}
});

watch(() => props.useResizeObserver, (val) => {
	observeSlot(val ?? false);
});

onBeforeUnmount(() => {
	observeSlot(false);
});

const computedStyle = computed(() => (props.style || props.customStyle)?.({ width: width.value, height: height.value }) || {});

</script>

<template>
	<div :style="computedStyle" ref="containerRef">
		<div>
			<slot />
		</div>
	</div>
</template>

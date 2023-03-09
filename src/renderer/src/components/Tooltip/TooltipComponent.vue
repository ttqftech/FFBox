<script setup lang="ts">

interface Props {
    text: string;
    position: {[key: string]: any};
    show: boolean;
}

const props = defineProps<Props>();

</script>

<template>
	<div id="tooltip" :style="props.position">
		<Transition name="tooltipanimate">
			<div v-if="props.show" id="tooltip-box">
				<div id="tooltip-message" v-html="props.text"></div>
			</div>
		</Transition>
	</div>
</template>


<style scoped>
	#tooltip {
		position: absolute;
		z-index: 100;
        pointer-events: none !important;
        max-width: calc(200px + 25%);
	}
		.tooltipanimate-enter-from {
			opacity: 0;
		}
		.tooltipanimate-enter-active {
			transition: opacity 0.1s linear;
		}
		.tooltipanimate-enter-to, .tooltipanimate-leave-from {
			opacity: 1;
		}
		.tooltipanimate-leave-active {
			transition: opacity 0.2s linear;
		}
		.tooltipanimate-leave-to {
			opacity: 0;
		}

		#tooltip-box {
			padding: 12px;
			background: hsl(0, 0%, 98%);
			will-change: transform, opacity;
			border: hsl(0, 0%, 67%) 1px solid;
			border-radius: 12px;
			box-shadow: 0px 4px 8px hsla(0, 0%, 0%, 0.3);
			z-index: 5;
		}
			#tooltip-message {
				font-size: 16px;
				line-height: 1.3em;
				text-align: left;
			}

</style>

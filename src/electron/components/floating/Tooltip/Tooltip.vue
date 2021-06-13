<template>
	<div id="tooltip" :style="position">
		<transition name="tooltipanimate">
			<div v-if="show" id="tooltip-box">
				<div id="tooltip-message" v-html="text"></div>
			</div>
		</transition>
	</div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
	name: 'Tooltip',
	props: {
		text: String,
		position: Object,
		show: Boolean
	},
})
</script>

<style scoped>
	#tooltip {
        /*
		display: block;
		background: none;
		border: none;
		margin: 0;
		padding: 0;
        */
		position: absolute;
		z-index: 100;
        pointer-events: none !important;
        max-width: calc(200px + 25%);
	}
		.tooltipanimate-enter {
			opacity: 0;
		}
		.tooltipanimate-enter-active {
			transition: opacity 0.1s linear;
		}
		.tooltipanimate-enter-to, .tooltipanimate-leave {
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

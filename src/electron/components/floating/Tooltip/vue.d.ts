/**
 * Extends interfaces in Vue.js
 */

import Vue from "vue";
import Tooltip from "./Tooltip.ts";

declare module "vue/types/vue" {
	interface Vue {
		$tooltip: Tooltip;
	}
}

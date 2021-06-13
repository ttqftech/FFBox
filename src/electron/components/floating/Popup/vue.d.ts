/**
 * Extends interfaces in Vue.js
 */

import Vue from "vue";
import Popup from "./Popup.ts";

declare module "vue/types/vue" {
	interface Vue {
		$popup: Popup;
	}
}

/**
 * Extends interfaces in Vue.js
 */

import Vue from "vue";
import Msgbox from "./Msgbox.ts";

declare module "vue/types/vue" {
	interface Vue {
		$msgbox: Msgbox;
		$alert: Msgbox.alert;
		$confirm: Msgbox.confirm;
	}
}

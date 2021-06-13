import Vue from 'vue';
import TooltipUI from './Tooltip.vue';
let TooltipConstructor = Vue.extend(TooltipUI);

export interface TooltipOptions {
	text: String,
	position: any, // 应是 vue :style 的对象类型
}

let instance = new TooltipConstructor();
instance.$mount();
document.body.appendChild(instance.$el);

const Tooltip = function () {
	return instance;
};

Tooltip.install = function (Vue: any, options: any) {
	Vue.prototype.$tooltip = Tooltip;
}

Tooltip.show = function (options: TooltipOptions) {
	instance.$props.text = options.text;
	instance.$props.position = options.position;
	instance.$props.show = true;
}

Tooltip.hide = function () {
	instance.$props.show = false;
}

export default Tooltip;
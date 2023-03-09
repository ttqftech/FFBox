import { AppContext, createVNode, render } from 'vue';
import TooltipUI from './TooltipComponent.vue';

export interface TooltipOptions {
	text: string,
	position: any, // 应是 vue :style 的对象类型
}

const defaultProps = {
	text: '',
	position: {},
	show: false,
};

const vnode = createVNode(TooltipUI, defaultProps);
const container = document.createElement('div');
document.body.appendChild(container);
// vnode.appContext = appContext;
render(vnode, container);

const Tooltip = function () {
	return vnode;
};

Tooltip.show = function (options: TooltipOptions) {
	vnode.component.props.text = options.text;
	vnode.component.props.position = options.position;
	vnode.component.props.show = true;
}

Tooltip.hide = function () {
	vnode.component.props.show = false;
}

export default Tooltip;

import { AppContext, createVNode, nextTick, render, VNode } from 'vue';
import PopupUI from './PopupComponent.vue';

export interface PopupOptions {
	message: string,
	level?: 0 | 1 | 2 | 3,	// 白 | 绿 | 黄 | 红
}

interface Instance {
	vnode: VNode;
	DOM: HTMLElement;
	id: number;
}

const instances: Instance[] = [];
let seed = 0;

const container = document.createElement('div');
document.body.appendChild(container);

const Popup = function (options: PopupOptions) {
	if (!options.level) {
		options.level = 0;
	}
	const id = seed++;

	const DOM = document.createElement('div');
	container.appendChild(DOM);
	const vnode = createVNode(PopupUI, {
		message: options.message,
		level: options.level ?? 0,
		verticalOffset: 0,
		index: instances.length,
		onWillClose: handleOnClose.bind(null, id),
		onClose: () => {
			render(null, DOM);
			container.removeChild(DOM);
		},
	});
	render(vnode, DOM);
	const instance = { id, vnode, DOM };
	instances.unshift(instance);
	// DOM 渲染完成
	nextTick(reCalcVerticalOffset);
	return instance;
}

function handleOnClose(id: number) {
	let index = instances.findIndex((item) => {
		return item.id === id;
	});
	instances.splice(index, 1);
	setTimeout(() => {
		reCalcVerticalOffset();
	}, 300);
}

function reCalcVerticalOffset() {
	for (let i = 0, totalHeight = 0; i < instances.length; i++) {
		let instance = instances[i];
		instance.vnode.component.props.index = i;
		instance.vnode.component.props.verticalOffset = totalHeight;
		totalHeight += instances[i].DOM.firstElementChild.clientHeight + 16;
	}		
}

export default Popup;

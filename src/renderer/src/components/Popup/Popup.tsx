import { createVNode, nextTick, render, VNode } from 'vue';
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

let container: HTMLDivElement;
if (typeof document !== 'undefined') {
	container = document.createElement('div');
	document.body.appendChild(container);
}

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
		onWillClose: (isUserInteraction?: boolean) => handleOnWillClose(id, isUserInteraction),
		onClose: () => {
			render(null, DOM);
			container.removeChild(DOM);
		},
	});
	render(vnode, DOM);
	const instance = { id, vnode, DOM };
	instances.unshift(instance);
	// console.log('气泡数量', instances.length, container.children.length);
	if (instances.length > 30) {
		// 删除过多的气泡避免卡顿
		const oldest = instances.pop()!;
		// oldest.vnode.component!.props.show = false;	// 停止计时器
		render(null, oldest.DOM);
		container.removeChild(oldest.DOM);
	}
	
	nextTick(reCalcVerticalOffset);	// 等待 Vue 将组件渲染到 DOM 上后修改其他气泡的偏移量
	return instance;
}

function handleOnWillClose(id: number, isUserInteraction?: boolean) {
	let index = instances.findIndex((item) => {
		return item.id === id;
	});
	// console.log('气泡 will close', id);
	instances.splice(index, 1);
	setTimeout(() => {
		reCalcVerticalOffset();
	}, isUserInteraction ? 0 : 300);
}

function reCalcVerticalOffset() {
	for (let i = 0, totalHeight = 0; i < instances.length; i++) {
		let instance = instances[i];
		instance.vnode.component!.props.index = i;
		instance.vnode.component!.props.verticalOffset = totalHeight;
		totalHeight += instances[i].DOM.firstElementChild!.clientHeight + 16;
	}		
}

export default Popup;

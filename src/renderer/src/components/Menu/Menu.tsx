import { AppContext, createVNode, render, VNode } from 'vue';
import MenuUI from './MenuComponent.vue';

export type MenuItem = {
    type: 'normal';
	value: any;
	label: string;
	tooltip?: string;
	disabled?: boolean;
	onClick?: (event: Event, value: any) => void;
} | {
    type: 'separator';
} | {
	type: 'submenu';
	label: string;
	tooltip?: string;
	subMenu: MenuItem[];
	disabled?: boolean;
	key?: number; // 仅供内部使用
} | {
	type: 'checkbox' | 'radio';
	value: any;
	checked: boolean;
	label: string;
	tooltip?: string;
	disabled?: boolean;
	onClick?: (event: Event, checked: boolean) => void;
};

/**
 * 菜单有两种模式：动作菜单、选项菜单
 * 动作菜单一般无 selectedValue。只有鼠标点击或键盘 Enter 时触发 onSelect，触发后默认关闭菜单
 * 选项菜单一般有 selectedValue。鼠标点击、键盘 Enter 时触发 onSelect，触发后默认关闭菜单；键盘上下选择时触发 onSelect，触发后根据键盘按键决定是否关闭菜单
 */
export interface MenuOptions {
	menu: MenuItem[];
	type?: 'action' | 'select';
	selectedValue?: any;
	container?: HTMLElement;	// 指定外侧容器，如不指定则默认全屏展示
	triggerRect?: { xMin: number, yMin: number, xMax: number, yMax: number };	// 触发菜单的控件的坐标，用于计算菜单弹出方向和大小
	disableMask?: boolean;
	onSelect?: (event: Event, value: any, checked?: boolean) => void | boolean;
	onCancel?: (event: Event) => void | false;	// mask 点击的情况会触发 onCancel，若返回 false 则不关闭菜单
	onClose?: () => void;
	onKeyDown?: (event: KeyboardEvent) => void;
	returnFocus?: (event: Event) => void;	// 定义该项后，菜单组件不监听全局键盘事件，若被 focus 则调用此函数用于归还焦点
};

const showMenu = function (options?: MenuOptions) {
	const type = options.type || 'action';
	const handleClose = () => {
		// 同一次 render 内第二次调用 handleClose 时，需判断是否已经被卸载
		if (document.contains(DOMNode)) {
			DOMContainer.removeChild(DOMNode);
			render(null, DOMNode);
			(options.onClose || (() => {}))();
		}
	};
	const handleItemSelect = (event: Event, value: any, checked?: boolean) => {
		let needToClose = (options.onSelect || (() => {}))(event, value, checked);
		if (needToClose === undefined) {
			if (type === 'action') {
				needToClose = true;
			} else {
				if (event.type === 'click') {
					needToClose = true;
				} else if (event.type === 'keydown') {
					needToClose = (event as KeyboardEvent).key === 'Enter';
				}
			}
		}
		if (needToClose) {
			handleClose();
		}
	}
	const handleCancel = (event: Event) => {
		const result = (options.onCancel || (() => {}))(event);
		if (result !== false) {
			handleClose();
		}
		return result;
	}
	const handleKeyboardEvent = (event: KeyboardEvent) => {
		vnode.component.exposed.triggerKeyboardEvent(event);
	}
	const _options = {
		...options,
		onClose: handleClose,
		onSelect: handleItemSelect,
		onCancel: handleCancel,
	};
	const vnode = createVNode(MenuUI, _options);
	const DOMNode = document.createElement('div');
	const DOMContainer = options?.container || document.body;
	DOMContainer.appendChild(DOMNode);
	// vnode.appContext = appContext;
	render(vnode, DOMNode);
	return {
		vnode,
		close: handleClose,
		triggerKeyboardEvent: handleKeyboardEvent,
	};
};

export default showMenu;

import { createVNode, render } from 'vue';
import { MenuItem } from '@common/menu';
import MenuUI from './MenuComponent.vue';

/**
 * 菜单有两种模式：动作菜单、选项菜单
 * 动作菜单一般无 selectedValue。只有鼠标点击或键盘 Enter 时触发 onSelect，触发后默认关闭菜单
 * 选项菜单一般有 selectedValue。鼠标点击、键盘 Enter 时触发 onSelect，触发后默认关闭菜单；键盘上下选择时触发 onSelect，触发后根据键盘按键决定是否关闭菜单
 */
export interface MenuOptions {
	menu: MenuItem[];
	type?: 'action' | 'select';	// select 类型的菜单会在键盘方向键操作时触发 onSelect，action 类型的菜单则在点击时触发 onSelect
	selectedValue?: any;
	container?: HTMLElement;	// 指定外侧容器，如不指定则默认全屏展示
	triggerRect?: { xMin: number, yMin: number, xMax: number, yMax: number };	// 触发菜单的控件的坐标，用于计算菜单弹出方向和大小
	triggerElem?: HTMLElement;	// 触发菜单的控件元素；未显式传入 triggerRect 时，自动以 getBoundingClientRect() 计算 triggerRect
	disableOnClick?: boolean;
	onSelect?: (event: Event, value: any, checked?: boolean) => void | false;	// action 模式时，不定义此项或返回 false 则触发 menuItem 的 onClick
	onCancel?: (event: Event) => void | false;	// mask 点击的情况会触发 onCancel，若返回 false 则不关闭菜单
	onClose?: () => void;
	onKeyDown?: (event: KeyboardEvent) => void;
	returnFocus?: (event: Event) => void;	// 定义该项后，菜单组件不监听全局键盘事件，若被 focus 则调用此函数用于归还焦点
};

const showMenu = function (options: MenuOptions) {
	const type = options.type || 'action';
	let unmounted = false;
	if (!options.triggerRect && options.triggerElem) {
		const rect = options.triggerElem.getBoundingClientRect();
		options.triggerRect = { xMin: rect.left, yMin: rect.top, xMax: rect.right, yMax: rect.bottom };
	}
	const handleClose = () => {
		// 同一次 render 内第二次调用 handleClose 时，需判断是否已经被卸载
		if (!unmounted) {
			vnode.component?.exposed?.preClose();
			(options.onClose || (() => {}))();
			unmounted = true;
			setTimeout(() => {
				DOMContainer.removeChild(DOMNode);
				render(null, DOMNode);
			}, 150);
		}
	};
	const handleItemSelect = (event: Event, menuItem: MenuItem) => {
		if (!('value' in menuItem) || menuItem.disabled) {
			return;
		}
		/**
		 * 菜单组件鼠标弹起、方向键、Enter 键，只要 menuItem 有 value，且有效（没有 disabled）都会触发 handleItemSelect
		 * 此时需要判断：1. 是否向上触发 onSelect；2. 是否需要关闭菜单；3. 是否需要调用 menuItem 自身的 onClick
		 * 对于 action 类型的菜单，只有点击或 Enter 键，才会触发 onSelect（目前默认关闭菜单）。而 onClick 是否要触发则取决于 onSelect
		 * 对于 select 类型的菜单，如果定义了 onClick，它就是一个例外的 action，在点击或 Enter 键的情况下在此处处理 onClick（目前默认关闭菜单）。否则 Enter、方向键都会触发 onSelect，但只有点击、Enter 会关闭菜单
		 */
		const isClickEvent = event.type === 'mouseup' || (event.type === 'keydown' && (event as KeyboardEvent).key === 'Enter');
		if (type === 'action') {
			if (isClickEvent) {
				const result = options.onSelect ? options.onSelect(event, menuItem.value, menuItem.type !== 'normal' ? menuItem.checked : undefined) : false;
				if (result === false) {
					(menuItem.onClick || (() => {}))(event, menuItem.value);
				}
				handleClose();
			}
		} else if (type === 'select') {
			if (menuItem.onClick) {
				if (isClickEvent) {
					menuItem.onClick(event, menuItem.value);
				}
			} else {
				(options.onSelect || (() => {}))(event, menuItem.value, menuItem.type !== 'normal' ? menuItem.checked : undefined);
				if (isClickEvent) {
					handleClose();
				}
			}
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
		vnode.component?.exposed?.triggerKeyboardEvent(event);
	}
	const setSelectedValue = (value: any) => {
		vnode.component?.exposed?.setSelectedValue(value);
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
		setSelectedValue: setSelectedValue,
	};
};

export type { MenuItem };
export default showMenu;

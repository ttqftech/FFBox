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
	key: number; // 仅供内部使用
} | {
	type: 'checkbox' | 'radio';
	value: any;
	checked: boolean;
	label: string;
	tooltip?: string;
	disabled?: boolean;
	onClick?: (event: Event, checked: boolean) => void;
};

export interface MenuOptions {
	menu: MenuItem[];
	selectedValue?: any;
	container?: HTMLElement;	// 指定外侧容器，如不指定则默认全屏展示
	triggerRect?: { xMin: number, yMin: number, xMax: number, yMax: number };	// 触发菜单的控件的坐标，用于计算菜单弹出方向和大小
	onItemClick?: (event: Event, value: any, checked?: boolean) => void | false;
	onCancel?: (event: Event) => void | false;
	onKeyDown?: (event: KeyboardEvent) => void;
};

const showMenu = function (options?: MenuOptions) {
	console.log('showMenu', options);
	const handleClose = () => {
		DOMContainer.removeChild(DOMNode);
		render(null, DOMNode);
	};
	const handleItemClick = (event: Event, value: any, checked?: boolean) => {
		if ((options.onItemClick || (() => {}))(event, value, checked) !== false) {
			handleClose();
		}
	}
	const handleCancel = (event: Event) => {
		if ((options.onCancel || (() => {}))(event) !== false) {
			handleClose();
		}
	}
	const _options = {
		...options,
		onClose: handleClose,
		onItemClick: handleItemClick,
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
	};
};

export default showMenu;

import { AppContext, createVNode, render, VNode } from 'vue';
import { ButtonType as ButtonType } from '../Button/Button';
import MsgboxUI from './MsgboxComponent';

export interface MsgboxOptions {
	container?: HTMLElement;	// 指定外侧容器，如不指定则默认全屏展示
	image?: VNode;	// 弹窗图片
	title?: string;
	content?: string | VNode;
	buttons?: Button[];
};
export interface Button {
	text: string;
	callback?: () => boolean | Promise<void> | void;
	type?: ButtonType;
	role?: 'confirm' | 'cancel';
}[];

const defaultButton: Button = {
	text: '好嘅',
	type: ButtonType.Normal,
	callback: () => console.log('cancelled'),
};

const Msgbox = function (options?: MsgboxOptions) {
	const handleClose = () => {
		render(null, DOMNode);
		DOMContainer.removeChild(DOMNode);
	};
	const _options = {
		...options,
		onClose: handleClose,
	};
	const vnode = createVNode(MsgboxUI, _options);
	const DOMNode = document.createElement('div');
	const DOMContainer = options?.container || document.body;
	DOMContainer.appendChild(DOMNode);
	// vnode.appContext = appContext;
	render(vnode, DOMNode);
	return vnode;
};

export default Msgbox;

import { FunctionalComponent, h } from "vue";
import { useAppStore } from '@renderer/stores/appStore';
import style from './Button.module.less';

export interface ButtonProps {
	disabled?: boolean;
	onClick?: () => any;
	type?: ButtonType;
	size?: 'small' | 'normal' | 'large';
}[];
export enum ButtonType {
	Normal = 0,
	Primary = 1,
	Danger = 2,
};

const getButtonClass = (type?: ButtonType, disabled?: boolean, size?: ButtonProps['size']) => {
	let classText = style['button'];
	classText += ' ';
	if (type === ButtonType.Primary) {
		classText += style['primary'];
	} else if (type === ButtonType.Danger) {
		classText += style['danger'];
	}
	classText += ' ';
	if (size) {
		classText += style[size];
	}
	classText += ' ';
	if (disabled) {
		classText += style['disabled'];
	}
	return classText;
};

const ButtonComponent: FunctionalComponent<ButtonProps> = (props, ctx) => {
	const appStore = useAppStore();
	return (
		<button
			data-color_theme={appStore.frontendSettings.colorTheme}
			class={getButtonClass(props.type, props.disabled, props.size)}
			disabled={props.disabled}
			onClick={() => props.onClick}
		>
			{ h(ctx.slots.default) }
		</button>
	)
}

export default ButtonComponent;

import { FunctionalComponent, h } from "vue";
import style from './Button.module.less';

export interface ButtonProps {
	disabled?: boolean;
	onClick?: () => any;
	role?: ButtonRole;
	size?: 'small' | 'normal' | 'large';
}[];
export enum ButtonRole {
	Normal = 0,
	Primary = 1,
	Danger = 2,
};

const getButtonClass = (role?: ButtonRole, disabled?: boolean, size?: ButtonProps['size']) => {
	let classText = style['button'];
	classText += ' ';
	if (role === ButtonRole.Primary) {
		classText += style['primary'];
	} else if (role === ButtonRole.Danger) {
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
	return (
		<button
			class={getButtonClass(props.role, props.disabled, props.size)}
			disabled={props.disabled}
			onClick={() => props.onClick}
		>
			{ h(ctx.slots.default) }
		</button>
	)
}

export default ButtonComponent;

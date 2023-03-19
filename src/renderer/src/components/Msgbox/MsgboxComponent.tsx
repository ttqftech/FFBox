import { FunctionalComponent, computed, ref, Transition, h } from 'vue';
import { MsgboxOptions, Button, ButtonRole } from './Msgbox';
import style from './MsgboxComponent.module.less';

interface Props extends MsgboxOptions {
    onClose: () => void;	// 由本组件调用，外部将本组件销毁
}

const MsgboxComponent: FunctionalComponent<Props> = (props) => {
	const show = ref(false);
	setTimeout(() => {
		show.value = true;
	}, 0);
	const backgroundMouseDown = ref(false);
	
	const mouseDownTransformStyle = computed(() => (
		backgroundMouseDown.value ? { transform: 'scale(0.97)', transition: 'all cubic-bezier(0.1, 2.5, 0.6, 1) 0.5s' } : {})
	);

	const getButtonClass = (role?: ButtonRole) => {
		if (role === ButtonRole.Primary) {
			return style['primary'];
		} else if (role === ButtonRole.Danger) {
			return style['danger'];
		}
	};
	const handleButtonClick = (button: Button) => {
		const ret = button.callback();
		if (true) {
			show.value = false;
		}
	};

	return (
		<dialog class={style.dialog}>
			<Transition
				// name={style.bganimate}
				on-after-leave={() => props.onClose()}
				enterActiveClass={style['bganimate-enter-active']}
				leaveActiveClass={style['bganimate-leave-active']}
			>
				{show.value && (
					<div
						class={style.background}
						onMousedown={() => backgroundMouseDown.value = true}
						onMouseup={() => backgroundMouseDown.value = false}
					/>
				)}
			</Transition>
			<Transition
				// name={style.boxanimate}
				enterFromClass={style['boxanimate-enter-from']}
				enterActiveClass={style['boxanimate-enter-active']}
				enterToClass={style['boxanimate-enter-to']}
				leaveFromClass={style['boxanimate-leave-from']}
				leaveActiveClass={style['boxanimate-leave-active']}
				leaveToClass={style['boxanimate-leave-to']}
			>
				{show.value && (
					<div class={style.box} style={mouseDownTransformStyle.value}>
						{props.image && (
							<div class={style.image}>
								{props.image}
							</div>
						)}
						{props.title && (
							<div class={style.title}>{ props.title }</div>
						)}
						{props.content && (
							<div class={style.content}>
								{ typeof props.content === 'string' ? props.content : h(props.content) }
							</div>
						)}
						{props.buttons && (
							<div class={style.buttons}>
								{props.buttons.map((button) => (
									<button class={getButtonClass(button.role)} onClick={() => handleButtonClick(button)}>
										{ button.text }
									</button>
								))}
							</div>
						)}
					</div>
				)}
			</Transition>
		</dialog>
	);
};

export default MsgboxComponent;

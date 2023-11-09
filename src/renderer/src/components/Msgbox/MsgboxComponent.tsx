import { FunctionalComponent, computed, ref, Transition, h } from 'vue';
import { MsgboxOptions } from './Msgbox';
import Button from '@renderer/components/Button/Button';
import style from './MsgboxComponent.module.less';

interface Props extends MsgboxOptions {
    onClose: () => void;	// 由本组件调用，外部将本组件销毁
}

const MsgboxComponent: FunctionalComponent<Props> = (props) => {
	const show = ref(false);
	const disable = ref(false);
	const backgroundMouseDown = ref(false);

	setTimeout(() => {
		show.value = true;
	}, 0);

	const mouseDownTransformStyle = computed(() => (
		backgroundMouseDown.value ? { transform: 'scale(0.97)', transition: 'all cubic-bezier(0.1, 2.5, 0.6, 1) 0.5s' } : {})
	);

	const handleKeyPress = (e: KeyboardEvent) => {
		if (props.buttons.length === 1 && (e.key === 'Escape' || e.key === 'Enter')) {
			handleButtonClick(props.buttons[0]);
		} else if (e.key === 'Escape') {
			const button = props.buttons.find((button) => button.role === 'cancel');
			if (button) {
				handleButtonClick(button);
			}
		} else if (e.key === 'Enter') {
			const button = props.buttons.find((button) => button.role === 'confirm');
			if (button) {
				handleButtonClick(button);
			}
		}
	}
	
	const handleButtonClick = (button: MsgboxOptions['buttons'][number]) => {
		if (button.callback) {
			disable.value = true;
			const ret = button.callback();
			if (ret === undefined || ret === true) {
				show.value = false;
			} else if (ret instanceof Promise) {
				ret.then(() => show.value = false);
			} else {
				disable.value = false;
			}
		} else {
			show.value = false;
		}
	};

	document.addEventListener('keypress', handleKeyPress);

	return (
		<dialog class={style.dialog}>
			<Transition
				// name={style.bganimate}
				on-after-leave={() => {
					document.removeEventListener('keypress', handleKeyPress);
					props.onClose();
				}}
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
									<Button
										type={button.type}
										disabled={disable.value}
										onClick={() => handleButtonClick(button)}
									>
										{ button.text }
									</Button>
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

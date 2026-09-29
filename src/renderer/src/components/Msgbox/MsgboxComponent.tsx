import { FunctionalComponent, computed, ref, Transition, h } from 'vue';
import { MsgboxOptions } from './Msgbox';
import Button from '@renderer/components/Button/Button';
import css from './MsgboxComponent.module.less';

interface Props extends MsgboxOptions {
    onClose: () => void;	// 由本组件调用，外部将本组件销毁
}

const MsgboxComponent: FunctionalComponent<Props> = (props) => {
	const show = ref(false);
	const disable = ref(false);
	const backgroundMouseDown = ref(false);
	const dialogRef = ref<HTMLDivElement>();
	let previousActiveElement: HTMLElement | null = null;

	setTimeout(() => {
		previousActiveElement = document.activeElement as HTMLElement | null;
		show.value = true;
		dialogRef.value!.addEventListener('keydown', handleKeyPress);
		// 焦点落在 dialog 本身，键盘事件才能冒泡到本组件
		dialogRef.value!.tabIndex = -1;
		dialogRef.value!.focus();
	}, 0);

	const mouseDownTransformStyle = computed(() => (
		backgroundMouseDown.value ? { transform: 'scale(0.97)', transition: 'all cubic-bezier(0.1, 2.5, 0.6, 1) 0.5s' } : {})
	);

	const handleKeyPress = (e: KeyboardEvent) => {
		if (props.buttons?.length === 1 && (e.key === 'Escape' || e.key === 'Enter')) {
			handleButtonClick(props.buttons[0]);
			e.stopPropagation();
		} else if (e.key === 'Escape') {
			const button = (props.buttons || []).find((button) => button.role === 'cancel');
			if (button) {
				handleButtonClick(button);
				e.stopPropagation();
			}
		} else if (e.key === 'Enter') {
			const button = (props.buttons || []).find((button) => button.role === 'confirm');
			if (button) {
				handleButtonClick(button);
				e.stopPropagation();
			}
		}
	}

	const handleButtonClick = (button: NonNullable<MsgboxOptions['buttons']>[number]) => {
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

	return (
		<dialog class={css.dialog} ref={dialogRef}>
			<Transition
				// name={style.bganimate}
				on-after-leave={() => {
					document.removeEventListener('keypress', handleKeyPress);
					if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
						previousActiveElement.focus();
					}
					props.onClose();
				}}
				enterActiveClass={css['bganimate-enter-active']}
				leaveActiveClass={css['bganimate-leave-active']}
			>
				{show.value && (
					<div
						class={css.background}
						onMousedown={() => backgroundMouseDown.value = true}
						onMouseup={() => backgroundMouseDown.value = false}
					/>
				)}
			</Transition>
			<Transition
				// name={style.boxanimate}
				enterFromClass={css['boxanimate-enter-from']}
				enterActiveClass={css['boxanimate-enter-active']}
				enterToClass={css['boxanimate-enter-to']}
				leaveFromClass={css['boxanimate-leave-from']}
				leaveActiveClass={css['boxanimate-leave-active']}
				leaveToClass={css['boxanimate-leave-to']}
			>
				{show.value && (
					<div class={css.box} style={mouseDownTransformStyle.value}>
						{props.image && (
							<div class={css.image}>
								{props.image}
							</div>
						)}
						{props.title && (
							<div class={css.title}>{ props.title }</div>
						)}
						{props.content && (
							<div class={css.content}>
								{ typeof props.content === 'string' ? props.content : h(props.content) }
							</div>
						)}
						{props.buttons && (
							<div class={css.buttons}>
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

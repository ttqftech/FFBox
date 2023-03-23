import { FunctionalComponent, ref, VNodeRef } from 'vue';
import { useAppStore } from '@renderer/stores/appStore';
import style from './index.module.less';
import Msgbox, { ButtonRole } from '@renderer/components/Msgbox/Msgbox';
import Button from '@renderer/components/Button/Button';
import IconPreview from '@renderer/assets/video.svg';

interface Props {}

const ShortcutView: FunctionalComponent<Props> = (props) => {
	const appStore = useAppStore();
	const containerRef = ref<VNodeRef>(null);

	const handleChange = (mode: any, sName: string, value: any) => {
		// @ts-ignore
		appStore.globalParams.input[sName] = value;
		appStore.applyParameters();
	}
	const msg = () => {
		Msgbox({
			container: document.body,
			// container: containerRef.value,
			image: <IconPreview />,
			title: '要退出吗？',
			content: '有 1 个任务还在进行，退出将会强制停止任务哦～',
			buttons: [
				{ text: '退退退', callback: () => { console.log('按钮被点击'); return true; }, role: ButtonRole.Danger },
				{ text: '再等等', callback: () => { console.log('按钮被点击'); return true; }, role: ButtonRole.Primary },
				{ text: 'Teapot', callback: () => { 
					return new Promise((resolve, reject) => {
						setTimeout(() => {
							resolve();
						}, 1000);
					});
				} },
			]
		})
	}
	return (
		<div class={style.container} ref={containerRef}>
			此处新增 RadioList 组件，像任务参数上的 cmd 切换按钮那样（自带一个不可删除的默认项）
			右边有新增按钮
			<Button onClick={msg} role={1}>按钮按钮</Button>
		</div>
	);
};

export default ShortcutView;

import { FunctionalComponent } from 'vue';
import { useAppStore } from '@renderer/stores/appStore';
import style from './index.module.less';

interface Props {}

const ShortcutView: FunctionalComponent<Props> = (props) => {
	const appStore = useAppStore();

	const handleChange = (mode: any, sName: string, value: any) => {
		// @ts-ignore
		appStore.globalParams.input[sName] = value;
		appStore.applyParameters();
	}
	return (
		<div class={style.container}>
			此处新增 RadioList 组件，像任务参数上的 cmd 切换按钮那样（自带一个不可删除的默认项）
			右边有新增按钮
		</div>
	);
};

export default ShortcutView;

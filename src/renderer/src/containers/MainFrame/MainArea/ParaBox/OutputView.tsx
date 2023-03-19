import { FunctionalComponent } from 'vue';
import Combobox from './components/Combobox.vue'
import Inputbox from './components/Inputbox.vue'
import Checkbox from './components/Checkbox.vue'
import { formats, generator } from '@common/formats'
import { useAppStore } from '@renderer/stores/appStore';
import style from './index.module.less';

interface Props {}

const OutputView: FunctionalComponent<Props> = (props) => {
	const appStore = useAppStore();

	const handleChange = (mode: any, sName: string, value: any) => {
		// @ts-ignore
		appStore.globalParams.output[sName] = value;
		appStore.applyParameters();
	}
	return (
		<div class={style.container}>
			<Combobox title="容器/格式" text={appStore.globalParams.output.format} list={formats} onChange={(value: string) => handleChange('combo', 'format', value)} />
			<Checkbox title="元数据前移" checked={appStore.globalParams.output.moveflags} onChange={(value: string) => handleChange('combo', 'moveflags', value)} />
			<Inputbox title="剪辑起点" value={appStore.globalParams.output.begin} onChange={(value: string) => handleChange('input', 'begin', value)} type="duration" />
			<Inputbox title="剪辑终点" value={appStore.globalParams.output.end} onChange={(value: string) => handleChange('input', 'end', value)} type="duration" />
			<Inputbox title="输出文件名" value={appStore.globalParams.output.filename} onChange={(value: string) => handleChange('input', 'filename', value)} long={true} placeholder="[filedir]：文件所在目录；[filebasename]：文件基础名；[fileext]：文件扩展名" notNull={true} />
		</div>
	);
};

export default OutputView;

import { FunctionalComponent } from 'vue';
import Combobox from './components/Combobox.vue'
import Inputbox from './components/Inputbox.vue'
import { hwaccels, generator } from '@common/params/formats'
import { useAppStore } from '@renderer/stores/appStore';
import style from './index.module.less';

interface Props {}

const InputView: FunctionalComponent<Props> = (props) => {
	const appStore = useAppStore();

	const handleChange = (mode: any, sName: string, value: any) => {
		// @ts-ignore
		appStore.globalParams.input[sName] = value;
		appStore.applyParameters();
	}
	return (
		<div class={style.container}>
			<Combobox title="硬件解码" text={appStore.globalParams.input.hwaccel} list={hwaccels} onChange={(value: string) => handleChange('combo', 'hwaccel', value)} />
			<Inputbox title="剪辑起点" value={appStore.globalParams.input.begin} onChange={(value: string) => handleChange('input', 'begin', value)} type="duration" />
			<Inputbox title="剪辑终点" value={appStore.globalParams.input.end} onChange={(value: string) => handleChange('input', 'end', value)} type="duration" />
		</div>
	);
};

export default InputView;

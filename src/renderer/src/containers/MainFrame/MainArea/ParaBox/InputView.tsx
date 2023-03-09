import { computed, defineComponent, FunctionalComponent, ref } from 'vue'; // defineComponent 的主要功能是提供类型检查
import Combobox from './components/Combobox.vue'
import Inputbox from './components/Inputbox.vue'
import { hwaccels, generator } from '@common/formats'
import { TaskStatus, UITask } from '@common/types';
import { generator as vGenerator } from '@common/vcodecs';
import { generator as aGenerator } from '@common/acodecs';
import { useAppStore } from '@renderer/stores/appStore';
import style from './index.module.less';

interface Props {}

const InputView: FunctionalComponent<Props> = (props) => {
	const appStore = useAppStore();
	const handleChange = (mode: any, sName: any, value: any) => {
		console.log('值更改', mode, sName, value);
	}
	return (
		<div class={style.container}>
			<Combobox title="硬件解码" text={appStore.globalParams.input.hwaccel} list={hwaccels} onChange={(value: string) => handleChange('combo', 'hwaccel', value)} />
			<Inputbox title="剪辑起点" value={appStore.globalParams.input.begin} onChange={(value: string) => handleChange('input', 'begin', value)} type="duration" />
			<Inputbox title="剪辑终点" value={appStore.globalParams.input.end} onChange={(value: string) => handleChange('input', 'end', value)} type="duration"></Inputbox>
		</div>
	);
};

export default InputView;

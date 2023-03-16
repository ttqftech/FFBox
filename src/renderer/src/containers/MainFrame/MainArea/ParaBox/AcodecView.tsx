import { computed, FunctionalComponent } from 'vue';
import { acodecs, volSlider } from '@common/acodecs';
import Combobox from './components/Combobox.vue';
import Inputbox from './components/Inputbox.vue';
import Slider from './components/Slider.vue';
import { useAppStore } from '@renderer/stores/appStore';
import style from './index.module.less';

interface Props {}

const AcodecView: FunctionalComponent<Props> = (props) => {
	const appStore = useAppStore();

	// aencoderList 中的项由 acodec 具体决定
	const aencodersList = computed(() => {
		const sName_acodec = appStore.globalParams.audio.acodec;
		if (sName_acodec !== '禁用音频' && sName_acodec !== '自动' && sName_acodec !== '不重新编码') {
			const acodec = acodecs.find((codec) => codec.sName == sName_acodec);
			return acodec?.encoders || [];
		} else {
			return []
		}
	});
	const parametersList = computed(() => {
		const sName_aencoder = appStore.globalParams.audio.aencoder;
		const aencoder = aencodersList.value.find((value) => value.sName == sName_aencoder);
		return aencoder?.parameters || [];
	});

	const handleChange = (mode: any, sName: string, value: any) => {
		// @ts-ignore
		appStore.globalParams.audio[sName] = value;
		appStore.applyParameters();
		if (sName == 'acodec') {
			// 更改 acodec 后将 aencoder 恢复为默认
			appStore.globalParams.audio[sName] = value;
			appStore.applyParameters();
		}
		if (sName == 'aencoder' || sName == 'acodec') {
			// 更改 acodec 或 aencoder 后检查子组件的设置
			for (const parameter of parametersList.value) {
				if (parameter.mode === 'combo') {
					const index = parameter.items.findIndex((value) => value.sName == appStore.globalParams.audio.detail[parameter.parameter]);
					if (index == -1) {
						console.log(`参数 ${parameter.parameter} 与列表数据不匹配，重置为默认值`);
						appStore.globalParams.audio.detail[parameter.parameter] = parameter.items[0].sName;
						appStore.applyParameters();
					}
				} else if (parameter.mode == 'slider') {
					if (isNaN(appStore.globalParams.audio.detail[parameter.parameter])) {
						console.log(`参数 ${parameter.parameter} 类型不为数字，重置为 0.5`);
						appStore.globalParams.audio.detail[parameter.parameter] = 0.5;
						appStore.applyParameters();
					}
				}
			}
		}
	};
	const handleDetailChange = (mode: any, sName: string, value: any) => {
		// @ts-ignore
		appStore.globalParams.audio.detail[sName] = value;
		appStore.applyParameters();
	};
	return (
		<div class={style.container}>
			<Combobox title="音频编码" text={appStore.globalParams.audio.acodec} list={acodecs} onChange={(value: string) => handleChange('combo', 'acodec', value)} />
			{['禁用音频', '不重新编码'].indexOf(appStore.globalParams.audio.acodec) === -1 && (
				<>
					{appStore.globalParams.audio.acodec !== '自动' && (
						<Combobox title="编码器" text={appStore.globalParams.audio.aencoder} list={aencodersList.value} onChange={(value: string) => handleChange('combo', 'aencoder', value)} />
					)}
					{parametersList.value.map((parameter) => {
						if (parameter.mode === 'slider') {
							return (
								<Slider
									title={parameter.display}
									value={appStore.globalParams.audio.detail[parameter.parameter]}
									tags={parameter.tags}
									step={parameter.step}
									valueToText={parameter.valueToText}
									valueProcess={parameter.valueProcess}
									onChange={(value: number) => handleDetailChange('slider', parameter.parameter, value)}
								/>
							);
						} else if (parameter.mode === 'combo') {
							return (
								<Combobox
									title={parameter.display}
									text={appStore.globalParams.audio.detail[parameter.parameter]}
									list={parameter.items}
									onChange={(value: number) => handleDetailChange('combo', parameter.parameter, value)}
								/>
							);
						}
					})}
					<Slider
						title="音量"
						value={appStore.globalParams.audio.vol}
						tags={volSlider.tags}
						step={volSlider.step}
						valueToText={volSlider.valueToText}
						valueProcess={volSlider.valueProcess}
						onChange={(value: number) => handleDetailChange('slider', 'vol', value)}
					/>
				</>
			)}
		</div>
	);
};

export default AcodecView;

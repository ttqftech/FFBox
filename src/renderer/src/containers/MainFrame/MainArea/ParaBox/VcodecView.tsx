import { computed, FunctionalComponent } from 'vue';
import { vcodecs, resolution, framerate } from '@common/vcodecs';
import Combobox from './components/Combobox.vue';
import Inputbox from './components/Inputbox.vue';
import Slider from './components/Slider.vue';
import { useAppStore } from '@renderer/stores/appStore';
import style from './index.module.less';

interface Props {}

const VcodecView: FunctionalComponent<Props> = (props) => {
	const appStore = useAppStore();

	// vencoderList 中的项由 vcodec 具体决定
	const vencodersList = computed(() => {
		const sName_vcodec = appStore.globalParams.video.vcodec;
		if (sName_vcodec !== '禁用视频' && sName_vcodec !== '自动' && sName_vcodec !== '不重新编码') {
			const vcodec = vcodecs.find((codec) => codec.sName == sName_vcodec);
			return vcodec?.encoders || [];
		} else {
			return []
		}
	});
	const rateControlsList = computed(() => {
		const sName_vencoder = appStore.globalParams.video.vencoder;
		const vencoder = vencodersList.value.find((encoder) => encoder.sName == sName_vencoder);
		return vencoder?.ratecontrol || [];
	});
	// 根据当前选择的码率控制器显示具体使用何种 slider
	const ratecontrolSlider = computed(() => {
		const rList = rateControlsList.value;
		if (!rList.length) {
			return null;
		}
		const sName_ratecontrol = appStore.globalParams.video.ratecontrol
		let index = rList.findIndex((value) => value.sName === sName_ratecontrol);
		// 切换编码器后没有原来的码率控制模式了
		if (index == -1) {
			index = 0
			appStore.globalParams.video.ratecontrol = rList[0].sName;
			appStore.applyParameters();
		}
		const slider = rList[index];
		let display;
		switch (slider.sName) {
			case 'CRF':
				display = 'CRF'
				break;
			case 'CQP':
				display = 'QP 参数'
				break;
			case 'CBR': case 'ABR':
				display = '码率'
				break;
			case 'Q':
				display = '质量参数'
				break;
		}
		return {
			display, 
			parameter: 'ratevalue',
			step: slider.step,
			tags: slider.tags,
			valueToText: slider.valueToText,
			valueProcess: slider.valueProcess,
			valueToParam: slider.valueToParam
		};
	});
	const parametersList = computed(() => {
		const sName_vencoder = appStore.globalParams.video.vencoder;
		const vencoder = vencodersList.value.find((value) => value.sName == sName_vencoder);
		return vencoder.parameters || [];
	});

	const handleChange = (mode: any, sName: string, value: any) => {
		// @ts-ignore
		appStore.globalParams.video[sName] = value;
		appStore.applyParameters();
		if (sName == 'vcodec') {
			// 更改 vcodec 后将 vencoder 恢复为默认
			appStore.globalParams.video[sName] = value;
			appStore.applyParameters();
		}
		if (sName == 'vencoder' || sName == 'vcodec') {
			// 更改 vcodec 或 vencoder 后检查子组件的设置
			for (const parameter of parametersList.value) {
				if (parameter.mode === 'combo') {
					const index = parameter.items.findIndex((value) => value.sName == appStore.globalParams.video.detail[parameter.parameter]);
					if (index == -1) {
						console.log(`参数 ${parameter.parameter} 与列表数据不匹配，重置为默认值`);
						appStore.globalParams.video.detail[parameter.parameter] = parameter.items[0].sName;
						appStore.applyParameters();
					}
				} else if (parameter.mode == 'slider') {
					if (isNaN(appStore.globalParams.video.detail[parameter.parameter])) {
						console.log(`参数 ${parameter.parameter} 类型不为数字，重置为 0.5`);
						appStore.globalParams.video.detail[parameter.parameter] = 0.5;
						appStore.applyParameters();
					}
				}
			}
		}
	};
	const handleDetailChange = (mode: any, sName: string, value: any) => {
		// @ts-ignore
		appStore.globalParams.video.detail[sName] = value;
		appStore.applyParameters();
	};
	return (
		<div class={style.container}>
			<Combobox title="视频编码" text={appStore.globalParams.video.vcodec} list={vcodecs} onChange={(value: string) => handleChange('combo', 'vcodec', value)} />
			{['禁用视频', '不重新编码'].indexOf(appStore.globalParams.video.vcodec) === -1 && (
				<>
					{appStore.globalParams.video.vcodec !== '自动' && (
						<Combobox title="编码器" text={appStore.globalParams.video.vencoder} list={vencodersList.value} onChange={(value: string) => handleChange('combo', 'vencoder', value)} />
					)}
					<Combobox title="分辨率" text={appStore.globalParams.video.resolution} list={resolution} onChange={(value: string) => handleChange('combo', 'resolution', value)} />
					<Combobox title="输出帧速" text={appStore.globalParams.video.framerate} list={framerate} onChange={(value: string) => handleChange('combo', 'framerate', value)} />
					<Combobox title="码率控制" text={appStore.globalParams.video.ratecontrol} list={rateControlsList.value} onChange={(value: string) => handleChange('combo', 'ratecontrol', value)} />
					{ratecontrolSlider.value && (
						<Slider
							title={ratecontrolSlider.value.display}
							value={appStore.globalParams.video.ratevalue}
							tags={ratecontrolSlider.value.tags}
							step={ratecontrolSlider.value.step}
							valueToText={ratecontrolSlider.value.valueToText}
							valueProcess={ratecontrolSlider.value.valueProcess}
							onChange={(value: number) => handleChange('slider', 'ratevalue', value)}
						/>
					)}
					{parametersList.value.map((parameter) => {
						if (parameter.mode === 'slider') {
							return (
								<Slider
									title={parameter.display}
									value={appStore.globalParams.video.detail[parameter.parameter]}
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
									text={appStore.globalParams.video.detail[parameter.parameter]}
									list={parameter.items}
									onChange={(value: number) => handleDetailChange('combo', parameter.parameter, value)}
								/>
							);
						}
					})}
				</>
			)}
		</div>
	);
};

export default VcodecView;

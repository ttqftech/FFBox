import { FunctionalComponent, ref, VNodeRef } from 'vue';
import { $ref } from 'vue/macros'
import { useAppStore } from '@renderer/stores/appStore';
import style from './index.module.less';
import Msgbox from '@renderer/components/Msgbox/Msgbox';
import Button, { ButtonType } from '@renderer/components/Button/Button';
import RadioList from './components/RadioList.vue'
import IconPreview from '@renderer/assets/video.svg';
import Popup from '@renderer/components/Popup/Popup';
import { NotificationLevel } from '@common/types';

interface Props {}

const ShortcutView: FunctionalComponent<Props> = (props) => {
	const appStore = useAppStore();
	const containerRef = ref<VNodeRef>(null);
	// let radioValue = $ref<string>('值2');
	// setInterval(() => {
	// 	radioValue.value = `${Math.random()}`;
	// }, 1000);

	// const handleChange = (mode: any, sName: string, value: any) => {
	// 	// @ts-ignore
	// 	appStore.globalParams.input[sName] = value;
	// 	appStore.applyParameters();
	// }
	const msg = () => {
		Msgbox({
			container: document.body,
			// container: containerRef.value,
			image: <IconPreview />,
			title: '要退出吗？',
			content: '有 1 个任务还在进行，退出将会强制停止任务哦～',
			buttons: [
				{ text: '退退退', callback: () => { console.log('按钮被点击'); return true; }, type: ButtonType.Danger },
				{ text: '再等等', callback: () => { console.log('按钮被点击'); return true; }, type: ButtonType.Primary },
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
	const radioListList = [
		{ value: '默认配置' },
		...appStore.availablePresets.map((name) => ({
			value: name,
			editable: true,
			deletable: true,
		})),
		{ value: '', editable: true },
	];
	return (
		<div class={style.container} ref={containerRef}>
			{/* <Button onClick={() => handleChange(`${Math.random()}`)} type={1}>{appStore.presetName}</Button> */}
			<RadioList
				list={radioListList}
				value={appStore.presetName}
				placeholder="未保存设定"
				onChange={(value) => appStore.loadPreset(`${value}`)}
				onDelete={(value) => appStore.deletePreset(`${value}`)}
				onEdit={(oldValue, newValue) => {
					if (oldValue) {
						appStore.editPreset(oldValue, newValue);
					} else if (newValue) {
						if (newValue === '默认配置') {
							Popup({
								message: '不能这样起名哦，会出 bug 的~',
								level: NotificationLevel.error,
							});
							return;
						}
						appStore.savePreset(newValue);
					}
				}}
			/>
		</div>
	);
};

export default ShortcutView;

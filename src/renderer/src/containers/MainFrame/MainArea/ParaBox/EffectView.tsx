import { FunctionalComponent, ref } from 'vue'; // defineComponent 的主要功能是提供类型检查
import Button, { ButtonType } from '@renderer/components/Button/Button';
import Msgbox from '@renderer/components/Msgbox/Msgbox';
import IconPreview from '@renderer/assets/video.svg';
import style from './index.module.less';
import showMenu, { MenuItem } from '@renderer/components/Menu/Menu';

interface Props {}

const EffectView: FunctionalComponent<Props> = (props) => {
	const count = ref({ a: 1 });

	const add = () => {
		count.value.a = Math.random();
	}
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
	const men = () => {
		const menu: MenuItem[] = [
			{
				type: 'submenu',
				label: '子菜单 1',
				subMenu: [
					{ type: 'normal', label: '子菜单项 1', value: '子菜单项 1', tooltip: '显示环境信息' },
					{ type: 'normal', label: '子菜单项 2', value: '子菜单项 2', tooltip: '显示环境信息' },
				],
			},
			{
				type: 'submenu',
				label: '子菜单 2',
				subMenu: [
					{ type: 'normal', label: '子菜单项 3', value: '子菜单项 3', tooltip: '显示环境信息' },
					{ type: 'normal', label: '子菜单项 4', value: '子菜单项 4', tooltip: '显示环境信息' },
				],
			},
			{ type: 'normal', label: '子菜单项 5', value: '子菜单项 5', tooltip: '显示环境信息' },
		];
		showMenu({
			menu,
			type: 'select',
			selectedValue: '子菜单项 2',
		})
	}
	// console.log('render');

	return (
		<div class={style.container}>
			<p style="text-align: center;">此功能暂未开发<br />请关注 https://FFBox.ttqf.tech/ 以获取版本更新</p>
			{/* <Button onClick={add}>{count.value?.a}</Button> */}
			{/* <button onClick={add}>{count.value?.a}</button> */}
			{/* <Button onClick={men}>菜单</Button> */}
		</div>
	);
};

export default EffectView;

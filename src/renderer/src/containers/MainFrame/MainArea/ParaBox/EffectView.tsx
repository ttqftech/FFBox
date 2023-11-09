import { FunctionalComponent, ref } from 'vue'; // defineComponent 的主要功能是提供类型检查
import nodeBridge from '@renderer/bridges/nodeBridge';
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
	const jumpToFFmpegFilteringGuide = () => nodeBridge.jumpToUrl('https://trac.ffmpeg.org/wiki/FilteringGuide');
	const jumpToFFmpegFiltersDocumentation = () => nodeBridge.jumpToUrl('https://ffmpeg.org/ffmpeg-filters.html');
	// console.log('render');

	return (
		<div class={style.container} style={{ padding: '16px', boxSizing: 'border-box' }}>
			<div style="text-align: center;">此功能暂未开发<br />您可通过视频/音频面板中的自定义参数手动输入滤镜</div>
			<div style={{ width: '100%', margin: '1em 0' }}>
				<Button onClick={jumpToFFmpegFilteringGuide}>🚩 FFmpeg 滤镜指南</Button>
				<Button onClick={jumpToFFmpegFiltersDocumentation}>📖 FFmpeg 滤镜文档</Button>
			</div>
			{/* <button onClick={add}>{count.value?.a}</button> */}
			{/* <Button onClick={men}>菜单</Button> */}
		</div>
	);
};

export default EffectView;

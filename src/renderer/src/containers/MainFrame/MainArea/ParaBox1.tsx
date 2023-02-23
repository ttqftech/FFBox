import { useAppStore } from '@renderer/stores/appStore';
import { FunctionalComponent, h } from 'vue'; // defineComponent 的主要功能是提供类型检查
import IconSidebarFavorite from '@renderer/assets/mainArea/paraBox/parabox_favorite.svg';
import IconSidebarInput from '@renderer/assets/mainArea/paraBox/parabox_input.svg';
import IconSidebarVideo from '@renderer/assets/mainArea/paraBox/parabox_video.svg';
import IconSidebarAudio from '@renderer/assets/mainArea/paraBox/parabox_audio.svg';
import IconSidebarEffect from '@renderer/assets/mainArea/paraBox/parabox_effect.svg';
import IconSidebarOutput from '@renderer/assets/mainArea/paraBox/parabox_output.svg';
import style from './ParaBox1.module.less';

const ParaBox: FunctionalComponent<any> = (props) => {
	const paraSelected = 0;
	const appStore = useAppStore();
	const sidebarIcons = [IconSidebarFavorite, IconSidebarInput, IconSidebarVideo, IconSidebarAudio, IconSidebarEffect, IconSidebarOutput];
	const sidebarTexts = ['快捷', '输入', '视频', '音频', '效果', '输出'];
	
	return (
		<div class={style.parabox}>
			<div class={style.upper}>
				<div class={style.devider}>
					<div class={style.buttons}>
						{[0, 1, 2, 3, 4, 5].map((index) => {
							// const icon = sidebarIcons[index];
							// icon.props = { style: { color: 'red' } };
							return (
								<button key={index} aria-label={sidebarTexts[index] + '参数'}>
									{/* {icon} */}
									{h(sidebarIcons[index], { style: { color: 'red' } })}
									<span>{sidebarTexts[index]}</span>
								</button>
							);
						})}
					</div>
				</div>
				<div class={style.globalparam}>
				</div>
			</div>
			<div class={style.lower}></div>
		</div>
	);
};

export default ParaBox;

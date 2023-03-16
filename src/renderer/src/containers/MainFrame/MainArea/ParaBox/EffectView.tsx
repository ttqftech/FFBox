import { FunctionalComponent } from 'vue'; // defineComponent 的主要功能是提供类型检查
import style from './index.module.less';

interface Props {}

const InputView: FunctionalComponent<Props> = (props) => {
	return (
		<div class={style.container}>
			<p style="text-align: center;">此功能暂未开发<br />请关注 https://FFBox.ttqf.tech/ 以获取版本更新</p>
		</div>
	);
};

export default InputView;

import { defineComponent, FunctionalComponent } from 'vue';	// defineComponent 的主要功能是提供类型检查
import style from './TaskItem.module.less';

export const TaskItem = defineComponent({	
	setup() {
		return () => (
			<div class={style.red}>Helloo!!!</div>
		);
	}
});

export const TaskJtem = defineComponent({
	render() {
		return <div>Vue 3.0</div>;
	},
});

interface PropsK {
	value: any;
}

export const TaskKtem: FunctionalComponent<PropsK> = (props) => (
	<div>{props.value}</div>
);

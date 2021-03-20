import Vue from 'vue';
import { CombinedVueInstance } from 'vue/types/vue';
import PopupUI from './Popup.vue';
let PopupConstructor = Vue.extend(PopupUI);

type Instances = Array<{
	instance: CombinedVueInstance<Record<never, any> & Vue, object, object, object, Record<never, any>>,
	id: number,
}>

let instances: Instances = [];
let seed = 0;

export interface PopupOptions {
	message: string,
	level?: number,
}

const Popup = function(options: PopupOptions) {
	if (!options.level) {
		options.level = 0;
	}
	let id = seed++;

	let instance = new PopupConstructor({
		propsData: {
			...options,
			verticalOffset: 0,
			onClose: handleOnClose.bind(null, id),
		}
	});
	instance.$mount();
	document.body.appendChild(instance.$el);
	instances.push({
		id,
		instance,
	});
	for (let i = 0; i < instances.length; i++) {
		setTimeout((index: number, instances: Instances) => {
			let instance = instances[index].instance;
			instance.$props.verticalOffset = (instances.length - index - 1) * 60; // 暂时写死 60
		}, (instances.length - i - 1) * 33, i, [...instances]);
	}
	return instance;
};

function handleOnClose(id: number) {
	let index = instances.findIndex((item) => {
		return item.id === id;
	});
	instances.splice(index, 1);
}

Popup.install = function (Vue: any, options: any) {
	console.log('plugin installed', Vue);
	Vue.prototype.$popup = Popup;
}

export default Popup;
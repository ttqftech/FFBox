import Vue from 'vue';
import { CombinedVueInstance } from 'vue/types/vue';
import MsgboxUI from './Msgbox.vue';
let MsgboxConstructor = Vue.extend(MsgboxUI);

export interface MsgboxOptions {
	title: String,
	content: String,
	buttons: Buttons,
}

export type Buttons = Array<{
	text: string,
	callback?: Function,
	role?: ButtonRole,
}>

export enum ButtonRole {
	Normal = 0,
	Confirm = 1,
	Cancel = 2,
}

type Instances = Array<{
	instance: CombinedVueInstance<Record<never, any> & Vue, object, object, object, Record<never, any>>,
	id: number,
}>

let instances: Instances = [];
let seed = 0;

const Msgbox = function (options: MsgboxOptions) {
	let id = seed++;

	let instance = new MsgboxConstructor({
		propsData: {
			...options,
			onClose: handleOnClose.bind(null, id),
		}
	});
	instance.$mount();
	document.body.appendChild(instance.$el);
	instances.unshift({
		id,
		instance,
	});
	return instance;
};

function handleOnClose(id: number) {
	let index = instances.findIndex((item) => {
		return item.id === id;
	});
	instances.splice(index, 1);
}

Msgbox.install = function (Vue: any, options: any) {
	Vue.prototype.$msgbox = Msgbox;
	Vue.prototype.$alert = Msgbox.alert;
	Vue.prototype.$confirm = Msgbox.confirm;
}

Msgbox.alert = function (options: Partial<MsgboxOptions>) {
	return new Promise((resolve) => {
		options = {
			title: options.title || '',
			content: options.content || '',
			buttons: [
				{
					text: '确认',
					callback: resolve,
					role: ButtonRole.Confirm
				}
			]
		}
		Msgbox(options as MsgboxOptions);
	})
}

Msgbox.confirm = function (options: Partial<MsgboxOptions>) {
	return new Promise((resolve, reject) => {
		options = {
			title: options.title || '',
			content: options.content || '',
			buttons: [
				{
					text: '确认',
					callback: resolve,
					role: ButtonRole.Confirm
				},
				{
					text: '取消',
					callback: reject,
					role: ButtonRole.Cancel
				},
			]
		}
		Msgbox(options as MsgboxOptions);
	})
}

export default Msgbox;
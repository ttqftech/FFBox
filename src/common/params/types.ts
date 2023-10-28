export type strict2 = { strict2?: true };
export type MenuItem = {
    type: 'normal';
	value: any;
	label: string;
	tooltip?: string;
	disabled?: boolean;
	onClick?: (event: Event, value: any) => void;
} | {
    type: 'separator';
} | {
	type: 'submenu';
	label: string;
	tooltip?: string;
	subMenu: MenuItem[];
	disabled?: boolean;
	key?: number; // 仅供内部使用
} | {
	type: 'checkbox' | 'radio';
	value: any;
	checked: boolean;
	label: string;
	tooltip?: string;
	disabled?: boolean;
	onClick?: (event: Event, checked: boolean) => void;
};
export type NarrowedMenuItem = Extract<MenuItem, { type: 'normal' }> & strict2;
export interface ComboOptions {
	items: NarrowedMenuItem[];
}
export interface SliderOptions {
	step: number;	// 步长，如不需要则传 0
	tags: Map<number, string>;
	valueToText: (value: number) => string;	// 显示在滑杆旁边的文字
	valueProcess: (value: number) => number;	// 进行吸附、整数化处理
	valueToParam: (value: number) => string | number; // 输出到 ffmpeg 参数的文字
}
export interface BasicParameter {
	parameter: string;	// 实际传给 ffmpeg 的参数
	display: string;	// 显示于表单标题
}
export type Parameter = BasicParameter & (
	({ mode: 'combo' } & ComboOptions) |
	({ mode: 'slider' } & SliderOptions)
);
export type RateControl = NarrowedMenuItem & { cmd: (string | Symbol)[] } & SliderOptions;

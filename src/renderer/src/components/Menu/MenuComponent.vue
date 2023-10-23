<script setup lang="ts">
import { computed, CSSProperties, onMounted, ref, watch, toRaw, onUnmounted } from 'vue';
import type { MenuOptions, MenuItem } from './Menu';
// @ts-ignore
import { MenuItem as v_MenuItem, MenuOptions as v_MenuOptions } from './Menu.tsx';
import Tooltip from '@renderer/components/Tooltip/Tooltip';
import Checkbox from '@renderer/components/Checkbox/Checkbox.vue';
import Radio from '@renderer/components/Radio/Radio.vue';
import IconRight from './right.svg?component';

interface InnerMenu {
	menu: MenuItem[];
	menuIndex: number;	// 对每个菜单增加 menuIndex 项，用于标识这是哪一个菜单，作为 openedSubMenus 的项值
	parent: InnerMenu | null;
};

type v_Props = v_MenuOptions & {
    onClose: () => void;	// 由本组件调用，外部将本组件销毁
}
type Props = MenuOptions & {
    onClose: () => void;	// 由本组件调用，外部将本组件销毁
}

const props = defineProps<v_Props>() as any as Props;

const menuElemRefs = ref([]);

const openedSubMenus = ref<number[]>([0]);
const openedSubMenuItemPos = ref<{[key: number]: { xMin: number, yMin: number, xMax: number, yMax: number }}>({});
const currentHoveredItem = ref<MenuItem>(undefined);

// 将所有子菜单打平，这样就能使用一个 v-for 渲染所有菜单
const flattenedMenus = computed(() => {
	const allMenus: InnerMenu[] = [];
	let i = 0;
	const queue = [{
		menu: props.menu,
		menuIndex: i,
		parent: null as any,
	}];
	while (queue.length) {
		const menu = queue.shift()!;
		allMenus.push(menu);
		for (const menuItem of menu.menu) {
			if (menuItem.type === 'submenu') {
				i++;
				menuItem.key = i;	// menuItem.key 作为子菜单的 menuIndex
				queue.push({
					menu: menuItem.subMenu,
					menuIndex: i,
					parent: menu,
				});
			}
		}
	}
	const ret = allMenus.filter((menu) => openedSubMenus.value.includes(menu.menuIndex));
	// console.log('flattenedMenus', ret);
	return ret;
}, {
	// onTrack(event) {
	// 	console.log('track', event);
	// },
	// onTrigger(event) {
	// 	console.log('trigger', event);
	// },
});

const getMenuMaskStyle = () => {
	if (props.disableMask) {
		return {
			pointerEvents: 'none',
		}
	}
}

const getMenuItemVforKey = (menuItem: MenuItem, index: number) => {
	if ('label' in menuItem) {	// normal | checkbox | radio
		return `${index}${menuItem.label}`;
	} else {
		return index;
	}
};

const getMenuItemClassName = (menuItem: MenuItem) => {
	if (menuItem.type === 'separator') {
		return 'menuSeparator';
	} else {
		let retStr = ['menuItem'];
		if (menuItem.disabled) {
			retStr.push('menuItemDisabled');
		}
		// 优先显示选中，再显示悬浮
		if ('value' in menuItem && props.selectedValue === menuItem.value) {
			retStr.push('menuItemSelected');
		} else {
			if (toRaw(currentHoveredItem.value) === menuItem) {
				retStr.push('menuItemHovered');
			}
			// 若子菜单被打开，则进入子菜单的对应项也要显示悬浮
			if (menuItem.type === 'submenu') {
				if (openedSubMenus.value.includes(menuItem.key)) {
					retStr.push('menuItemHovered');
				}
			}
		}
		return retStr.join(' ');
	}
};

const getMenuPosition = (menu: InnerMenu) => {
	// 暂时写死的高度
	const menuItemHeight = 32;
	const menuSeparatorHeight = 9;
	const menuPaddingY = 6;
	const _triggerRect = openedSubMenuItemPos.value[menu.menuIndex] || props.triggerRect || { xMin: 0, yMin: 0, xMax: 320, yMax: 0 };
	const isHorizontal = openedSubMenuItemPos.value[menu.menuIndex] !== undefined;

	let ScreenWidth = document.documentElement.clientWidth;			// 使用 window.innerWidth 也行
	let ScreenHeight = document.documentElement.clientHeight;
	let listHeight = menu.menu.reduce((prev, curr) => prev + (curr.type === 'separator' ? menuSeparatorHeight : menuItemHeight), 0) + menuPaddingY * 2;
	
	let finalPosition: CSSProperties = {};
	// 计算水平位置
	if (isHorizontal) {
		// 向右弹出
		const finalLeft = Math.min(_triggerRect.xMax, ScreenWidth - 240 );
		finalPosition = {
			left: `${finalLeft}px`,
			width: `240px`,
		};
	} else {
		// 上下弹出
		const finalWidth = Math.max(240, _triggerRect.xMax - _triggerRect.xMin);
		const centralX = Math.max(finalWidth / 2, Math.min((_triggerRect.xMax + _triggerRect.xMin) / 2, ScreenWidth - finalWidth / 2));
		finalPosition = {
			left: `${centralX - finalWidth / 2}px`,
			width: `${finalWidth}px`,
		};
	}


	// 计算垂直位置
	let upperSpace = isHorizontal ? _triggerRect.yMax : _triggerRect.yMin;
	let lowerSpace = ScreenHeight - (isHorizontal ? _triggerRect.yMin : _triggerRect.yMax);
	if (upperSpace >= lowerSpace) {
		// 上方空间更大，往上弹出
		if (listHeight <= upperSpace) {
			finalPosition = { ...finalPosition, height: `${listHeight}px`, bottom: `${ScreenHeight - upperSpace}px` };
		} else {
			finalPosition = { ...finalPosition, height: `${upperSpace}px`, top: `${0}px` };
		}
	} else {
		// 下方空间更大，往下弹出
		if (listHeight <= lowerSpace) {
			finalPosition = { ...finalPosition, height: `${listHeight}px`, top: `${ScreenHeight - lowerSpace}px` };
		} else {
			finalPosition = { ...finalPosition, height: `${lowerSpace}px`, bottom: `${0}px` };
		}
	}

	// 确定位置
	return finalPosition;
};

const getMenuByItem = (menuItem: MenuItem) => {
	for (const [keyInFlattened, menu] of Object.entries(flattenedMenus.value)) {
		for (const [keyInMenu, _menuItem] of Object.entries(menu.menu)) {
			if (_menuItem === menuItem) {
				return {
					menu,
					indexInFlattened: Number(keyInFlattened),
					indexInMenu: Number(keyInMenu),
				};
			}
		}		
	}
};
const getMenuAndItemByValue = (value: any) => {
	for (const menu of flattenedMenus.value) {
		for (const menuItem of menu.menu) {
			if ('value' in menuItem && menuItem.value === value) {
				return {
					menu,
					menuItem,
				}
			}
		}
	}
};

const handleMaskClick = (e: MouseEvent) => {
	console.log('handleMaskClick');
	props.onCancel(e);
	// e.stopPropagation();
};
const handleMenuMouseUp = (e: MouseEvent) => {
	e.stopPropagation();
}

const handleSelect = (e: MouseEvent | KeyboardEvent, menuItem: MenuItem, stopPropagation = true) => {
	if ('value' in menuItem) {
		props.onSelect(e, menuItem.value, menuItem.type !== 'normal' ? menuItem.checked : undefined);
	}
	// 鼠标 click 时为真，防止冒泡到 mask；键盘操作时为假，允许外层关闭菜单
	// if (stopPropagation) {
	// 	e.stopPropagation();
	// }
};

const handleMenuItemMouseEnter = (e: MouseEvent, menuItem: MenuItem, menu: InnerMenu) => {
	// 计算 tooltip 打开位置
	if (menuItem.type !== 'separator' && menuItem.tooltip) {
		let position = {};
		let target = e.target as HTMLElement;
		let targetRect = target.getBoundingClientRect();
		// 计算水平方向
		if (props.triggerRect.xMin + e.target!.offsetWidth / 2 < document.documentElement.clientWidth / 2) {
			position = {
				...position,
				left: `${targetRect.left + targetRect.width + 16}px`,
			};
		} else {
			position = {
				...position,
				right: `calc(100% - ${targetRect.left - 16}px)`,
			};
		}
		// 计算垂直方向（若 item 垂直位置在窗口上方，那么指定 top，否则指定 bottom）
		if (targetRect.top + targetRect.height / 2 < document.documentElement.clientHeight / 2) {
			position = {
				...position,
				top: `${targetRect.top}px`,
			};
		} else {
			position = {
				...position,
				bottom: `calc(100% - ${targetRect.top + targetRect.height}px)`
			};
		}
		Tooltip.show({
			text: menuItem.tooltip,
			position,
		});
	}
	currentHoveredItem.value = menuItem;
};	

const handleMenuItemMouseLeave = () => {
	currentHoveredItem.value = undefined;
};

const handleMenuItemFocused = (e: FocusEvent, menuItem: MenuItem) => {
	currentHoveredItem.value = menuItem;
	(props.returnFocus || (() => {}))(e);
};

watch(currentHoveredItem, (newItem, oldItem) => {
	// console.log('currentHoveredItem', newItem);
	if (newItem !== undefined) {
		const { menu, indexInFlattened, indexInMenu } = getMenuByItem(toRaw(newItem));
		const newOpenedKeys = [menu.menuIndex];
		let current = menu;
		// 打开的菜单为 [...所有父亲, 当前菜单]
		while (current.parent) {
			current = current.parent;
			newOpenedKeys.unshift(current.menuIndex);
		}
		if (newItem.type === 'submenu') {
			// 打开的菜单为 [...所有父亲, 当前菜单, 子菜单]
			newOpenedKeys.push(newItem.key);
			// 记录子菜单项的位置
			const menuElem = menuElemRefs.value[indexInFlattened] as HTMLDivElement;
			const menuItemElem = menuElem.children[indexInMenu];
			const menuItemElemRect = menuItemElem.getBoundingClientRect();
			openedSubMenuItemPos.value[newItem.key] = { xMin: menuItemElemRect.x, yMin: menuItemElemRect.y, xMax: menuItemElemRect.x + menuItemElemRect.width, yMax: menuItemElemRect.y + menuItemElemRect.height };
		}
		if (JSON.stringify(newOpenedKeys) !== JSON.stringify(openedSubMenus.value)) {
			openedSubMenus.value = newOpenedKeys;
		}
	}
	if (newItem === undefined && oldItem !== undefined) {
		Tooltip.hide();
	}	
});

const keydownListener = (e: KeyboardEvent) => {
	// 关闭菜单
	if (e.key === 'Escape') {
		props.onCancel(e);
	}
	let menuItem = toRaw(currentHoveredItem.value);
	// 动作
	if (e.key === 'Enter') {
		handleSelect(e, menuItem, false);
	}
	if (!menuItem) {
		// 未 hover 时，上下方向，反向移动一位，以便后面检测上下方向的代码移到正确位置
		if (e.key === 'ArrowDown' || e.key === 'Home') {
			menuItem = flattenedMenus.value[0].menu[flattenedMenus.value[0].menu.length - 1];
		} else if (e.key === 'ArrowUp' || e.key === 'End') {
			menuItem = flattenedMenus.value[0].menu[0];
		} else {
			// 其他按键冒泡到上层
			props.onKeyDown(e);
		}
	}
	if (!menuItem) {
		return;
	}
	// 检测上下方向，切换菜单项焦点
	const { menu, indexInFlattened, indexInMenu } = getMenuByItem(menuItem);
	if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
		// 找到菜单 DOM
		const menuElem = menuElemRefs.value[indexInFlattened] as HTMLDivElement;
		// 找下一个/上一个元素，直到可以 focus
		let currentIndex = indexInMenu;
		do {
			if (e.key === 'ArrowUp') {
				currentIndex = currentIndex === 0 ? menu.menu.length - 1 : currentIndex - 1;
			} else {
				currentIndex = currentIndex === menu.menu.length - 1 ? 0 : currentIndex + 1;
			}
			if (menu.menu[currentIndex].type !== 'separator') {
				break;
			}			
		} while (currentIndex !== indexInMenu);	// 找了一圈没找到则退出循环
		menuElem.children[currentIndex].focus();
		if (props.type === 'select') {
			handleSelect(e, menu.menu[currentIndex]);
		}
	}
	if (e.key === 'Home' || e.key === 'End') {
		// 找到菜单 DOM
		const menuElem = menuElemRefs.value[indexInFlattened] as HTMLDivElement;
		const index = e.key === 'Home' ? 0 : menuElem.children.length - 1;
		menuElem.children[index].focus();
		if (props.type === 'select') {
			handleSelect(e, menu.menu[index]);
		}
	}
	// 检测左右方向，若本菜单有动作，则不冒泡到上层；否则向上触发
	if (e.key === 'ArrowLeft') {
		if (menu.parent) {
			// 焦点回到父级的进入子菜单的项
			const parentDOM = menuElemRefs.value[menu.parent.menuIndex] as HTMLDivElement;
			const menuItemIndex = menu.parent.menu.findIndex((menuItem) => menuItem.type === 'submenu' && menuItem.key === menu.menuIndex)
			parentDOM.children[menuItemIndex].focus();
		} else {
			props.onKeyDown(e);
		}
	} else if (e.key === 'ArrowRight') {
		if (menuItem.type === 'submenu') {
			// 焦点进入子菜单的 props 选中项或第一项
			const childDOM = menuElemRefs.value[menuItem.key];
			const activeIndex = menuItem.subMenu.findIndex((menuItem) => 'value' in menuItem && menuItem.value === props.selectedValue);
			childDOM.children[activeIndex !== -1 ? activeIndex : 0].focus();
		} else {
			props.onKeyDown(e);
		}
	}
}

const closeMenuMaskMouseDownListener = (e: MouseEvent) => {
	if (props.onCancel(e) !== false) {
		// setTimeout(() => {
		// 	const elem = document.elementFromPoint(e.pageX, e.pageY);
		// 	elem.dispatchEvent(e);
		// }, 0);
	}
};

onMounted(() => {
	currentHoveredItem.value = getMenuAndItemByValue(props.selectedValue)?.menuItem;
	if (!props.returnFocus) {
		document.addEventListener('keydown', keydownListener);
	}
});
onUnmounted(() => {
	if (!props.returnFocus) {
		document.removeEventListener('keydown', keydownListener);
	}
	Tooltip.hide();
})

defineExpose({
	triggerKeyboardEvent: (event: KeyboardEvent) => {
		keydownListener(event);
	},
});

</script>

<template>
	<div class="mask" ref="menuRef" :class="props.disableMask ? 'maskDisabledOnly' : undefined" @click="handleMaskClick">
		<menu v-for="(menu, index) in flattenedMenus" class="menu" :style="getMenuPosition(menu)" :ref="(el) => menuElemRefs[index] = el" @mouseup="handleMenuMouseUp">
			<div
				v-for="(menuItem, index) in menu.menu"
				:key="getMenuItemVforKey(menuItem, index)"
				:class="getMenuItemClassName(menuItem)"
				:tabindex="menuItem.type == 'separator' ? -1 : 0"
				@mouseup="handleSelect($event, menuItem)"
				@mouseenter="handleMenuItemMouseEnter($event, menuItem, menu)"
				@mouseleave="handleMenuItemMouseLeave()"
				@focus="handleMenuItemFocused($event, menuItem)"
			>
				<div v-if="menuItem.type !== 'separator'" class="label">
					{{ menuItem.label }}
				</div>
				<div v-if="menuItem.type === 'checkbox' || menuItem.type === 'radio'" class="iconArea">
					<Checkbox v-if="menuItem.type === 'checkbox'" :checked="menuItem.checked" />
					<Radio v-if="menuItem.type === 'radio'" :checked="menuItem.checked" />
				</div>
				<div v-if="menuItem.type === 'submenu'" class="iconRightArea">
					<IconRight />
				</div>
			</div>
		</menu>
	</div>
</template>


<style scoped lang="less">
	.mask {
		position: fixed;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		// pointer-events: none;
		z-index: 10;
		.menu {
			position: absolute;
			// width: 200px;
			box-sizing: border-box;
			padding: 6px;
			border-radius: 8px;
			font-size: 0;
			text-align: left;
			overflow-y: auto;
			background: hwb(0 98% 2%);
			box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);
			.menuItem {
				display: inline-block;
				position: relative;
				box-sizing: border-box;
				width: 100%;
				height: 32px;
				// border-bottom: #EEE 1px solid;
				border-radius: 4px;
				font-size: 14px;
				line-height: 40px;
				// outline: none;
				.label {
					position: absolute;
					top: 0;
					left: 30px;
					right: 30px;
					line-height: 32px;
				}
				.iconArea {
					position: absolute;
					top: 0;
					left: 0;
					width: 28px;
					height: 32px;
					display: flex;
					justify-content: center;
					align-items: center;
				}
				.iconRightArea {
					position: absolute;
					top: 0;
					right: 0;
					width: 28px;
					height: 32px;
					svg {
						position: absolute;
						left: 25%;
						top: 25%;
						width: 50%;
						height: 50%;
					}
				}
				.opArea {
					position: absolute;
					top: 0;
					left: 0;
					width: 28px;
					height: 32px;
				}
			}
			.menuItemDisabled {
				opacity: 0.3;
			}
			.menuItemSelected {
				background: hwb(210 60% 0%);
			}
			.menuItemHovered {
				background: hwb(210 80% 0%);
			}
			.menuSeparator {
				display: inline-block;
				position: relative;
				width: 100%;
				height: 1px;
				margin: 4px 0;
				background-color: #EEE;
			}
		}
	}
	.maskDisabledOnly {
		pointer-events: none;
		&>* {
			pointer-events: initial;
		}
	}

</style>

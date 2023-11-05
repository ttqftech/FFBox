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
const openedSubMenus = ref<number[]>([]);
const openedSubMenuItemPos = ref<{[key: number]: { xMin: number, yMin: number, xMax: number, yMax: number }}>({});	// key：menuIndex / key　value：menuItem 的位置
const currentHoveredItem = ref<MenuItem>(undefined);
const currentSelectedItem = ref<MenuItem>(undefined);

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
	const ret: InnerMenu[] = [];
	for (const menu of allMenus) {
		ret[menu.menuIndex] = menu;
	}
	return ret;
});

// 过滤掉不显示的子菜单的子菜单
const flattenedMenusFiltered = computed(() => {
	const ret: InnerMenu[] = [];
	for (const menu of flattenedMenus.value) {
		if (openedSubMenus.value.includes(menu.menuIndex)) {
			ret[menu.menuIndex] = menu;
		}
	}
	return ret;
});

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
		if ('value' in menuItem && currentSelectedItem.value === menuItem.value) {
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
	const minWidth = 220;
	const _triggerRect = openedSubMenuItemPos.value[menu.menuIndex] || props.triggerRect || { xMin: 0, yMin: 0, xMax: minWidth, yMax: 0 };
	const isHorizontal = openedSubMenuItemPos.value[menu.menuIndex] !== undefined;

	let ScreenWidth = document.documentElement.clientWidth;			// 使用 window.innerWidth 也行
	let ScreenHeight = document.documentElement.clientHeight;
	let listHeight = menu.menu.reduce((prev, curr) => prev + (curr.type === 'separator' ? menuSeparatorHeight : menuItemHeight), 0) + menuPaddingY * 2;
	
	let finalPosition: CSSProperties = {};
	// 计算水平位置
	if (isHorizontal) {
		// 向右弹出
		const finalLeft = Math.min(_triggerRect.xMax, ScreenWidth - minWidth );
		finalPosition = {
			left: `${finalLeft}px`,
			width: `${minWidth}px`,
		};
	} else {
		// 上下弹出
		const finalWidth = Math.max(minWidth, _triggerRect.xMax - _triggerRect.xMin);
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

// 计算子菜单的显示位置，并更新 openedSubMenuItemPos
const calcSubMenuPosition = (menuIndex: number) => {
	// 已计算位置，则直接跳过
	if (openedSubMenuItemPos.value[menuIndex]) {
		return;
	}
	// 当前菜单父级 MenuItem 未计算位置，则通过 menuIndex 找到父级菜单
	// 然后检查这个父级菜单的父级 MenuItem 有无计算位置。若有，则直接找 menuItem，找到 DOM，计算出结果
	// 否则递归进入父级菜单
	const menu = flattenedMenus.value[menuIndex];
	const parentMenu = menu.parent;
	if (!parentMenu) {
		// 当菜单是顶层菜单时，没有父级菜单。getMenuPosition 会直接使用 triggerRect
		return;
	}
	if (!openedSubMenuItemPos.value[parentMenu.menuIndex]) {
		// 父级菜单的父级 MenuItem 未计算位置
		calcSubMenuPosition(parentMenu.menuIndex);
	}
	// 父级菜单的父级 MenuItem 已计算位置，故直接在父级菜单找到 MenuItem，找到 DOM，计算结果
	const parentIndexInFlattened = parentMenu.menuIndex;
	// const parentIndexInFlattened = flattenedMenus.value.findIndex((menu) => menu.menuIndex === parentMenu.menuIndex);
	const parentIndexInMenu = parentMenu.menu.findIndex((menuItem) => 'key' in menuItem && menuItem.key === menuIndex);
	const menuElem = menuElemRefs.value[parentIndexInFlattened] as HTMLDivElement;
	const menuItemElem = menuElem.children[parentIndexInMenu];
	const menuItemElemRect = menuItemElem.getBoundingClientRect();
	openedSubMenuItemPos.value[menuIndex] = { xMin: menuItemElemRect.x, yMin: menuItemElemRect.y, xMax: menuItemElemRect.x + menuItemElemRect.width, yMax: menuItemElemRect.y + menuItemElemRect.height };
};

// hover 到项目上时，使用此函数计算 tooltip 显示位置并展示
const showTooltip = (menuItem: MenuItem) => {
	// 计算 tooltip 打开位置
	if (menuItem.type !== 'separator' && menuItem.tooltip) {
		const { menu, indexInFlattened, indexInMenu } = getMenuByItem(menuItem);
		let position = {};
		const menuElem = menuElemRefs.value[indexInFlattened] as HTMLDivElement;
		if (!menuElem) {
			return;	// 操作特别快时，由 watch(currentHoveredItem) 延迟触发该函数时，菜单可能已经被销毁
		}
		const menuItemElem = menuElem.children[indexInMenu];
		const menuItemElemRect = menuItemElem.getBoundingClientRect();
		const screenWidth = document.documentElement.clientWidth;			// 使用 window.innerWidth 也行
		const screenHeight = document.documentElement.clientHeight;
		// 计算水平方向
		const leftSpace = menuItemElemRect.left;
		const rightSpace = screenWidth - menuItemElemRect.left - menuItemElemRect.width;
		if (leftSpace > rightSpace || menuItem.type === 'submenu' && menuItem.subMenu.length) {
			// 左侧空间更大，或者有子菜单时，在左侧弹出
			position = {
				...position,
				right: `calc(100% - ${menuItemElemRect.left - 12}px)`,
			};
		} else {
			position = {
				...position,
				left: `${menuItemElemRect.left + menuItemElemRect.width + 12}px`,
			};
		}
		// 计算垂直方向（若 item 垂直位置在窗口上方，那么指定 top，否则指定 bottom）
		if (menuItemElemRect.top + menuItemElemRect.height / 2 < screenHeight / 2) {
			position = {
				...position,
				top: `${menuItemElemRect.top}px`,
			};
		} else {
			position = {
				...position,
				bottom: `calc(100% - ${menuItemElemRect.top + menuItemElemRect.height}px)`
			};
		}
		Tooltip.show({
			text: menuItem.tooltip,
			position,
		});
	}
}

// 鼠标选择、键盘 Enter，或菜单为 select 模式时键盘移动焦点时均触发此函数，向上层报告
const handleSelect = (e: MouseEvent | KeyboardEvent, menuItem: MenuItem) => {
	if ('value' in menuItem) {
		props.onSelect(e, menuItem.value, menuItem.type !== 'normal' ? menuItem.checked : undefined);
	}
};

const handleMenuItemMouseEnter = (e: MouseEvent, menuItem: MenuItem, menu: InnerMenu) => {
	currentHoveredItem.value = menuItem;
};
const handleMenuItemMouseLeave = () => {
	currentHoveredItem.value = undefined;
};

const handleMenuItemFocused = (e: FocusEvent, menuItem: MenuItem) => {
	currentHoveredItem.value = menuItem;
	(props.returnFocus || (() => {}))(e);
};

// 根据当前 hover 项确定子菜单的打开状态、tooltip 的显隐
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
		setTimeout(() => {
			// 初次加载时，menuElemRefs 未准备好，因此添加 setTimeout 应对此情况
			showTooltip(toRaw(newItem));
		}, 0);
	}
	if ((newItem === undefined || !('tooltip' in newItem)) && oldItem !== undefined) {
		Tooltip.hide();
	}
	// 	menuRef.value.firstElementChild!.children[currentIndex.value].scrollIntoView({
	// 		behavior: "auto", block: "nearest", inline: "nearest"
	// 	});
});

// 键盘操作响应
const keydownListener = (e: KeyboardEvent) => {
	// 关闭菜单
	if (e.key === 'Escape') {
		props.onCancel(e);
	}
	let menuItem = toRaw(currentHoveredItem.value);
	// 动作
	if (e.key === 'Enter') {
		handleSelect(e, menuItem);
	}
	if (!menuItem) {
		// 未 hover 时，上下方向，反向移动一位，以便后面检测上下方向的代码移到正确位置
		if (e.key === 'ArrowDown' || e.key === 'Home') {
			menuItem = flattenedMenus.value[0].menu[flattenedMenus.value[0].menu.length - 1];
		} else if (e.key === 'ArrowUp' || e.key === 'End') {
			menuItem = flattenedMenus.value[0].menu[0];
		} else {
			// 其他按键冒泡到上层
			(props.onKeyDown || (() => {}))(e);
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
			(props.onKeyDown || (() => {}))(e);
		}
	} else if (e.key === 'ArrowRight') {
		if (menuItem.type === 'submenu') {
			// 焦点进入子菜单的 props 选中项或第一项
			const childDOM = menuElemRefs.value[menuItem.key];
			const activeIndex = menuItem.subMenu.findIndex((menuItem) => 'value' in menuItem && menuItem.value === currentSelectedItem.value);
			const finalIndex = activeIndex !== -1 ? activeIndex : 0;
			childDOM.children[finalIndex].focus();
			if (props.type === 'select') {
				handleSelect(e, menuItem.subMenu[finalIndex]);
			}
		} else {
			(props.onKeyDown || (() => {}))(e);
		}
	}
}

/**
 * 组件初始化时：
 * 1. 更改 currentHoveredItem 和 currentSelectedItem，进而在 nextTick 确定子菜单的打开状态、tooltip 的显示
 * 2. 根据 returnFocus 确定是否添加全局键盘监听归还焦点
 * 3. openedSubMenus 打开第一个菜单
 * 4. （好像不需要）自下而上计算子菜单的打开状态
 * 5. 在 nextTick 子菜单 DOM 准备好后计算显示位置
 * 6. 在 5. 后对选中项进行对焦
 */
onMounted(() => {
	currentHoveredItem.value = getMenuAndItemByValue(props.selectedValue)?.menuItem;
	currentSelectedItem.value = props.selectedValue;
	if (!props.returnFocus) {
		document.addEventListener('keydown', keydownListener);
	}
	openedSubMenus.value = [0];	// 需在 mounted 后才打开第一个菜单，这样就有动画
	const res = getMenuAndItemByValue(props.selectedValue);
	if (res) {
		const { menu, menuItem } = res;
		// const newOpenedKeys = [menu.menuIndex];
		// let current = menu;
		// while (current.parent) {
		// 	current = menu.parent;
		// 	newOpenedKeys.unshift(current.menuIndex);
		// }
		// openedSubMenus.value = newOpenedKeys;
		// 父到子计算每一节点的显示位置（需等待打开第一个菜单之后才计算）
		setTimeout(() => {
			calcSubMenuPosition(menu.menuIndex);
			// 激活对应项以自动滚动到该位置
			const { indexInFlattened, indexInMenu } = getMenuByItem(menuItem);
			const menuElem = menuElemRefs.value[indexInFlattened] as HTMLDivElement;
			const menuItemElem = menuElem.children[indexInMenu];
			menuItemElem.focus();
		}, 0);
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
	setSelectedValue: (value: any) => {
		currentSelectedItem.value = value;
	},
	preClose: () => {
		// 关闭前给个机会展示退出动画
		openedSubMenus.value = [];
	},
});

</script>

<template>
	<div class="mask" ref="menuRef" @click="props.onCancel($event)">
		<TransitionGroup name="menuAnimate">
			<menu
				v-for="menu in Object.values(flattenedMenusFiltered)"
				:key="menu.menuIndex"
				class="menu"
				:style="getMenuPosition(menu)"
				:ref="(el) => menuElemRefs[menu.menuIndex] = el"
				@mouseup="$event.stopPropagation()"
			>
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
		</TransitionGroup>
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
			-webkit-app-region: none;
			&::-webkit-scrollbar {
				position: relative;
				width: 12px;
				// background: transparent;
				box-shadow: 12px 0 12px -12px hwb(0 50% 50% / 0.08) inset;
			}
			&::-webkit-scrollbar-thumb {
				border-radius: 12px;
				background: hwb(0 50% 50% / 0.3);
				border: 3px solid transparent;
				background-clip: content-box;
				// box-shadow: 0 0 4px red;
			}
			&::-webkit-scrollbar-track {
				background: none;
			}
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
		.menuAnimate-enter-from, .menuAnimate-leave-to {
			transform: scale(0.95);
			opacity: 0;
		}
		.menuAnimate-enter-active {
			transition: transform cubic-bezier(0.33, 1, 1, 1) 0.15s, opacity linear 0.1s;
		}
		.menuAnimate-enter-to, .menuAnimate-leave-from {
			transform: scale(1);
			opacity: 1;
		}
		.menuAnimate-leave-active {
			transition: all linear 0.1s;
		}

	}

</style>

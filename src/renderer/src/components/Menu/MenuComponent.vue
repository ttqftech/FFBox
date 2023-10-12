<script setup lang="ts">
import { computed, CSSProperties, onMounted, ref, watch, toRaw, onUnmounted } from 'vue';
import type { MenuOptions, MenuItem } from './Menu';
// @ts-ignore
import { MenuItem as v_MenuItem, MenuOptions as v_MenuOptions } from './Menu.tsx';
import Tooltip from '@renderer/components/Tooltip/Tooltip';

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

const props = defineProps<v_Props>() as Props;

const menuElemRefs = ref([]);

const openedSubMenus = ref<number[]>([0]);
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
	console.log('flattenedMenus', ret);
	return ret;
}, {
	onTrack(event) {
		console.log('track', event);
	},
	onTrigger(event) {
		console.log('trigger', event);
	},
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
	const _triggerRect = props.triggerRect || { xMin: 0, yMin: 0, xMax: 320, yMax: 0 };

	let ScreenWidth = document.documentElement.clientWidth;			// 使用 window.innerWidth 也行
	let ScreenHeight = document.documentElement.clientHeight;
	let listHeight = menu.menu.reduce((prev, curr) => prev + (curr.type === 'separator' ? menuSeparatorHeight : menuItemHeight), 0) + menuPaddingY * 2;
	
	// 计算水平位置
	const finalWidth = Math.max(240, _triggerRect.xMax - _triggerRect.xMin);
	const centralX = Math.max(finalWidth / 2, Math.min((_triggerRect.xMax + _triggerRect.xMin) / 2, ScreenWidth - finalWidth / 2));

	let finalPosition: CSSProperties = {
		left: `${centralX - finalWidth / 2}px`,
		width: `${finalWidth}px`,
	};

	// 计算垂直位置
	let upperSpace = _triggerRect.yMin;
	let lowerSpace = ScreenHeight - _triggerRect.yMax;
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
	props.onCancel(e);
	e.stopPropagation();
};

const handleMenuItemClick = (e: MouseEvent, menuItem: MenuItem) => {
	if ('value' in menuItem) {
		props.onItemClick(e, menuItem.value, menuItem.type !== 'normal' ? menuItem.checked : undefined);
	}
	e.stopPropagation();	// 防止冒泡到 mask
};

const handleMenuItemOpClick = (e: MouseEvent, menuItem: MenuItem) => {

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

// const handleMenuItemKeydown = (e: KeyboardEvent, menuItem: MenuItem) => {
// };

const handleMenuItemFocused = (e: FocusEvent, menuItem: MenuItem) => {
	currentHoveredItem.value = menuItem;
};

watch(currentHoveredItem, (newItem, oldItem) => {
	console.log('currentHoveredItem', newItem);
	if (newItem !== undefined) {
		const { menu } = getMenuByItem(toRaw(newItem));
		// 计算子菜单打开状态——找到所有父亲
		const newOpenedKeys = [menu.menuIndex];
		let newOpenedSubMenus = openedSubMenus.value;
		let current = menu;
		while (current.parent) {
			current = menu.parent;
			newOpenedKeys.unshift(menu.menuIndex);
		}
		if (newItem.type === 'submenu') {
			// 保持父菜单的打开状态，打开字菜单
			newOpenedKeys.push(newItem.key);
			newOpenedSubMenus = newOpenedKeys;
		} else {
			// 仅保持父菜单的打开状态
			newOpenedSubMenus = newOpenedKeys;
		}
		if (JSON.stringify(newOpenedSubMenus) !== JSON.stringify(openedSubMenus.value)) {
			openedSubMenus.value = newOpenedSubMenus;
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
	if (!menuItem) {
		// 上下方向，反向移动一位，以便后面检测上下方向的代码移到正确位置
		if (e.key === 'ArrowDown') {
			menuItem = flattenedMenus.value[0].menu[flattenedMenus.value[0].menu.length - 1];
		} else if (e.key === 'ArrowUp') {
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
	}
	// 检测左右方向，若本菜单有动作，则不冒泡到上层；否则向上触发
	if (e.key === 'ArrowLeft') {
		if (menu.parent) {
			// 关闭当前子菜单
			const indexInOpened = openedSubMenus.value.findIndex((menuIndex) => menuIndex === menu.menuIndex);
			openedSubMenus.value.splice(indexInOpened, 1);
			// 焦点回到父级的进入子菜单的项
			const parentDOM = menuElemRefs.value[menu.parent.menuIndex] as HTMLDivElement;
			const menuItemIndex = menu.parent.menu.findIndex((menuItem) => menuItem.type === 'submenu' && menuItem.key === menu.menuIndex)
			parentDOM.children[menuItemIndex].focus();
		} else {
			props.onKeyDown(e);
		}
	} else if (e.key === 'ArrowRight') {
		if (menuItem.type === 'submenu') {
			// 打开新的子菜单
			openedSubMenus.value.push(menuItem.key);
		} else {
			props.onKeyDown(e);
		}
	}
}
onMounted(() => {
	currentHoveredItem.value = getMenuAndItemByValue(props.selectedValue)?.menuItem;
	document.body.addEventListener('keydown', keydownListener);
});
onUnmounted(() => {
	document.body.removeEventListener('keydown', keydownListener);
})

</script>

<template>
	<div class="mask" ref="menuRef" @click="handleMaskClick">
		<menu v-for="(menu, index) in flattenedMenus" class="menu" :style="getMenuPosition(menu)" :ref="(el) => menuElemRefs[index] = el">
			<div
				v-for="(menuItem, index) in menu.menu"
				:key="getMenuItemVforKey(menuItem, index)"
				:class="getMenuItemClassName(menuItem)"
				:tabindex="menuItem.type == 'separator' ? -1 : 0"
				@click="handleMenuItemClick($event, menuItem)"
				@mouseenter="handleMenuItemMouseEnter($event, menuItem, menu)"
				@mouseleave="handleMenuItemMouseLeave()"
				@focus="handleMenuItemFocused($event, menuItem)"
			>
				<!-- <div class="combomenu-item-img" style="background-image: url(image/star.png);"></div> -->
				<div v-if="menuItem.type !== 'separator'" class="label">
					{{ menuItem.label }}
				</div>
				<button v-if="false" class="iconArea">
					<img src="@renderer/assets/mainArea/paraBox/×.svg?url" alt="">
				</button>
				<button v-if="false" class="opArea" @click="handleMenuItemOpClick($event, menuItem)">
					<img src="@renderer/assets/mainArea/paraBox/×.svg?url" alt="">
				</button>
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
					left: 28px;
					right: 28px;
					line-height: 32px;
				}
				.iconArea {
					position: absolute;
					top: 0;
					left: 0;
					width: 28px;
					height: 32px;
				}
				.opArea {
					position: absolute;
					top: 0;
					left: 0;
					width: 28px;
					height: 32px;
				}
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

</style>

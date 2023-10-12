import { FunctionalComponent, computed, CSSProperties, onMounted, ref, watch } from 'vue';
import { MenuItem, MenuOptions } from './Menu';
import Tooltip from '@renderer/components/Tooltip/Tooltip';
import style from './MenuComponent.module.less';

interface InnerMenu {
	menu: MenuItem[];
	menuIndex: number;	// 对每个菜单增加 menuIndex 项，用于标识这是哪一个菜单，作为 openedSubMenus 的项值
	parent: InnerMenu | null;
};

interface Props extends MenuOptions {
    onClose: () => void;	// 由本组件调用，外部将本组件销毁
}

const MenuComponent: FunctionalComponent<Props> = (props) => {
	const isFirstRender = ref(true);
	const openedSubMenus = ref<number[]>([0]);
	const currentSelectedValue = ref<any>(undefined);

	// 将所有子菜单打平，这样就能使用一个 v-for 渲染所有菜单（TODO：每次 render 都重新计算，需优化）
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
					menuItem.key = i;
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
	});

	const getMenuItemVforKey = (menuItem: MenuItem, index: number) => {
		if (menuItem.type === 'normal' || menuItem.type === 'checkbox' || menuItem.type === 'radio') {
			return `${index}${menuItem.label}`;
		} else if (menuItem.type === 'separator' || menuItem.type === 'submenu') {
			return index;
		}
	};

	const getMenuItemClassName = (menuItem: MenuItem) => {
		if (menuItem.type === 'separator') {
			return style.menuSeparator;
		} else {
			return `${style.menuItem} ${'value' in menuItem && props.selectedValue === menuItem.value ? style.menuItemSelected : '' }`;
		}
	}

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

	const handleMaskClick = (e: MouseEvent) => {
		props.onCancel(e);
		e.stopPropagation();
	};

	const handleMenuItemClick = (e: MouseEvent, menuItem: MenuItem) => {
		if (menuItem.type === 'normal' || menuItem.type === 'checkbox' || menuItem.type === 'radio') {
			props.onItemClick(e, menuItem.value, menuItem.type !== 'normal' ? menuItem.checked : undefined);
		}
	};

	const handleMenuItemOpClick = (e: MouseEvent, menuItem: MenuItem) => {
	
	};

	const handleMenuItemMouseEnter = (e: MouseEvent, menuItem: MenuItem, menu: InnerMenu) => {
		// 计算子菜单打开状态——找到所有父亲
		const newOpenedKeys = [menu.menuIndex];
		let current = menu;
		while (current.parent) {
			current = menu.parent;
			newOpenedKeys.unshift(menu.menuIndex);
		}
		if (menuItem.type === 'submenu') {
			// 保持父菜单的打开状态，打开字菜单
			newOpenedKeys.push(menuItem.key);
			openedSubMenus.value = newOpenedKeys;
		} else {
			// 仅保持父菜单的打开状态
			openedSubMenus.value = newOpenedKeys;
		}
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
		currentSelectedValue.value = 'value' in menuItem ? menuItem.value : undefined;
	};	

	const handleMenuItemMouseLeave = () => {
		Tooltip.hide();
	};
	
	const handleMenuItemKeydown = (e: KeyboardEvent, menuItem: MenuItem) => {

	};

	// onMounted
	if (isFirstRender.value) {
		isFirstRender.value = false;
		currentSelectedValue.value = props.selectedValue;
	}

	console.log(currentSelectedValue.value);

	return (
		<div class={style.mask} onClick={handleMaskClick} onMousemove={(e) => e.preventDefault()}>
			{flattenedMenus.value.map((menu) => (
				<menu class={style.menu} style={getMenuPosition(menu)}>
					{menu.menu.map((menuItem, index) => (
						<div
							key={getMenuItemVforKey(menuItem, index)}
							class={getMenuItemClassName(menuItem)}
							tabindex={0}
							onClick={(event) => handleMenuItemClick(event, menuItem)}
							onMouseenter={(event) => handleMenuItemMouseEnter(event, menuItem, menu)}
							onMouseleave={(event) => handleMenuItemMouseLeave()}
							onKeydown={(event) => handleMenuItemKeydown(event, menuItem)}
						>
							{menuItem.type !== 'separator' && (
								<>
									<div class={style.label}>
										{ menuItem.label }
									</div>
									{false && (
										<button class={style.iconArea}>
											<img src="@renderer/assets/mainArea/paraBox/×.svg?url" />
										</button>
									)}
									{false && (
										<button class={style.opArea} onClick={(event) => handleMenuItemOpClick(event, menuItem)}>
											<img src="@renderer/assets/mainArea/paraBox/×.svg?url" />
										</button>
									)}
								</>
							)}
						</div>
					))}
				</menu>
			))}
		</div>
	);
}

export default MenuComponent;

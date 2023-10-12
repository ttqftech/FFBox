<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAppStore } from '@renderer/stores/appStore';
import showMenu from '@renderer/components/Menu/Menu';

const menuTemplate = [
	{
		label: 'FFBox (A)',
		submenu: [
			{ label: '访问官网' },
			{ label: '访问源码' },
			{ label: '检查更新' },
			{ type: 'separator' },
			{ label: 'FFBox v4.0' },
		],
	},
	{
		label: '任务 (T)',
		submenu: [
			{ label: '添加任务' },
			{ label: '停止所有任务' },
			{ label: '强行停止所有任务' },
			{ label: '删除所有未在运行的任务' },
			{ type: 'separator' },
			{ label: '开始执行队列' },
			{ label: '暂停执行队列' },
		],
	},
	{
		label: '视图 (V)',
		submenu: [
			{ label: '放大' },
			{ label: '缩小' },
			{ label: '重置缩放' },
		],
	},
];

const appStore = useAppStore();

const selectedMenuIndex = ref(-1);
const topMenuRef = ref<HTMLDivElement>(null);
const currentOpenedMenuRef = ref();
const topMenuButtonsMousemoveListener = ref();

const menuCenterPadStyle = computed(() => {
	if (appStore.showMenuCenter === 0) {
		return {
			top: '8px',
			left: '8px',
			width: '76px',
			height: '28px',
			background: 'linear-gradient(to bottom, hwb(0 97% 3%), hwb(0 95% 5%))',
			opacity: '0',
			transitionDelay: '0s, 0s, 0s, 0s, 0.2s',
		}
	} else if (appStore.showMenuCenter === 1) {
		return {
			top: '8px',
			left: '8px',
			width: '340px',
			height: '28px',
			background: 'hwb(0 98% 2%)',
			opacity: 1,
		}
	} else {
		return {
			top: '0',
			left: '0',
			width: '100%',
			height: '100%',
			background: 'linear-gradient(to bottom, hwb(0 97% 3%), hwb(0 95% 5%))',
			opacity: 1,
		}
	}
});
const menuCenterContainerStyle = computed(() => {
	if (appStore.showMenuCenter === 0) {
		return {
			width: '84px',
			height: '63px',
		}
	} else if (appStore.showMenuCenter === 1) {
		return {
			width: '348px',
			height: '36px',
		}
	} else {
		return {
			width: '100%',
			height: '100%',
			opacity: 1,
		}
	}
})

watch(() => appStore.showMenuCenter, () => {
	selectedMenuIndex.value = -1;
});
watch(selectedMenuIndex, (index, oldIndex) => {
	const selectedMenu = menuTemplate[index];
	if (selectedMenu) {
		if (oldIndex === -1) {
			// 新打开菜单时，记录顶部菜单按钮位置，并在 body 上挂载鼠标移动监听
			const rects: DOMRect[] = [];
			for (const topMenuButton of topMenuRef.value.children) {
				rects.push(topMenuButton.getBoundingClientRect());
			}
			topMenuButtonsMousemoveListener.value = (ev: MouseEvent) => {
				for (const [key, topMenuButtonRect] of Object.entries(rects)) {
					if (
						ev.pageX > topMenuButtonRect.x && ev.pageX < topMenuButtonRect.x + topMenuButtonRect.width &&
						ev.pageY > topMenuButtonRect.y && ev.pageY < topMenuButtonRect.y + topMenuButtonRect.height
					) {
						selectedMenuIndex.value = Number(key);
					}
				}
			}
			document.body.addEventListener('mousemove', topMenuButtonsMousemoveListener.value);
		}

		const elem = topMenuRef.value.children[selectedMenuIndex.value];
		const rect = elem.getBoundingClientRect();
		currentOpenedMenuRef.value?.close();
		currentOpenedMenuRef.value = showMenu({
			menu: selectedMenu.submenu.map((item) => ({
				...item,
				type: item.type === 'separator' ? 'separator' : 'normal',
				...([undefined, 'normal', 'checkbox', 'radio'].includes(item.type) ? { value: 'value' in item ? item.value : item.label } : {})
			})) as any,
			// defaultSelectedValue?: any;
			// container: containerRef.value,
			triggerRect: { xMin: rect.x, yMin: rect.y, xMax: rect.x + rect.width, yMax: rect.y + rect.height },	// 触发菜单的控件的坐标，用于计算菜单弹出方向和大小
			onCancel: () => { selectedMenuIndex.value = -1; },
			onItemClick: (event, value, checked) => {
				console.log(event, value, checked);
				selectedMenuIndex.value = -1;
			},
			onKeyDown: (event: KeyboardEvent) => {
				if (event.key === 'ArrowLeft') {
					selectedMenuIndex.value = selectedMenuIndex.value === 0 ? menuTemplate.length - 1 : selectedMenuIndex.value - 1;
				} else if (event.key === 'ArrowRight') {
					selectedMenuIndex.value = selectedMenuIndex.value === menuTemplate.length - 1 ? 0 : selectedMenuIndex.value + 1;
				}
			},
		});
	} else {
		if (oldIndex !== -1) {
			document.body.removeEventListener('mousemove', topMenuButtonsMousemoveListener.value);
			currentOpenedMenuRef.value = undefined;
		}
	}
});

const handleTopMenuHover = (index: number) => {
	if (appStore.showMenuCenter === 1) {
		selectedMenuIndex.value = index;
	}
}

</script>

<template>
	<div class="pad" :style="menuCenterPadStyle">
	</div>
	<div class="container" :style="menuCenterContainerStyle">
		<div class="topMenu" ref="topMenuRef">
			<div
				v-for="(menu, index) in menuTemplate"
				:class="`menu ${selectedMenuIndex === index ? 'menuSelected' : ''}`"
				@mouseenter="(e) => handleTopMenuHover(index)"
				@click="(e) => selectedMenuIndex = index"
			>
				{{ menu.label }}
			</div>
		</div>
	</div>
</template>

<style lang="less" scoped>
	.pad {
		position: absolute;
		border-radius: 8px;
		box-shadow: 0 2px 8px hwb(0 10% 90% / 0.2);
		overflow: hidden;
		z-index: 2;
		transition: left 0.5s cubic-bezier(0.1, 1.2, 0.5, 1),
					top 0.5s cubic-bezier(0.1, 1.2, 0.5, 1),
					width 0.5s cubic-bezier(0.1, 1.2, 0.5, 1),
					height 0.5s cubic-bezier(0.1, 1.2, 0.5, 1),
					opacity 0.15s linear;
	}
	.container {
		position: absolute;
		left: 0;
		top: 0;
		overflow: hidden;
		z-index: 2;
		overflow: hidden;
		transition: all 0.5s cubic-bezier(0.1, 1.2, 0.5, 1);
		-webkit-app-region: none;
		.topMenu {
			position: absolute;
			left: 85px;
			top: 8px;
			width: 262px;
			height: 28px;
			font-size: 14px;
			.menu {
				display: inline-block;
				padding: 0 16px;
				line-height: 28px;
				border-radius: 8px;
				&:not(.menuSelected):hover {
					box-shadow: 0 1px 4px hwb(0 0% 100% / 0.2),
								0 4px 2px -2px hwb(0 100% 0% / 0.5) inset;
				}
				&:not(.menuSelected):active {
					box-shadow: 0 0px 1px hwb(0 0% 100% / 0.2),
								0 20px 15px -10px hwb(0 0% 100% / 0.15) inset;
					transform: translateY(0.25px);
				}
			}
			.menuSelected {
				background-color: hwb(220 25% 10%);
				box-shadow: 0 1px 4px hwb(220 25% 10% / 0.5);
				color: white;
			}
		}
	}
</style>

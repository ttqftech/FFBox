<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useAppStore } from '@renderer/stores/appStore';
import { ServiceBridgeStatus } from '@renderer/bridges/serviceBridge';
import showMenu, { MenuItem } from '@renderer/components/Menu/Menu';
import nodeBridge from '@renderer/bridges/nodeBridge';
import { showEnvironmentInfo } from '@renderer/components/misc/EnvironmentInfo'
import { TaskStatus, WorkingStatus } from '@common/types';

const appStore = useAppStore();

const selectedMenuIndex = ref(-1);
const topMenuRef = ref<HTMLDivElement>(null);
const currentOpenedMenuRef = ref<ReturnType<typeof showMenu>>();
// const topMenuButtonsMousemoveListener = ref();
const topMenuButtonsMousemoveElems = ref<HTMLDivElement[]>([]);

const finalMenu = computed(() => {
	const ret: MenuItem[] = [
		{
			type: 'submenu',
			label: 'FFBox (A)',
			subMenu: [
				{ type: 'submenu', label: '访问官网', subMenu: [
					{ type: 'normal', label: 'FFBox 官网', value: 'FFBox 官网', onClick: () => nodeBridge.jumpToUrl('http://ffbox.ttqf.tech') },
					{ type: 'normal', label: '作者个人网站', value: '作者个人网站', onClick: () => nodeBridge.jumpToUrl('http://ttqf.tech') },
				] },
				{ type: 'submenu', label: '访问源码', subMenu: [
					{ type: 'normal', label: 'github 仓库', value: 'github 仓库', onClick: () => nodeBridge.jumpToUrl('https://github.com/ttqftech/FFBox') },
					{ type: 'normal', label: 'gitee 仓库', value: 'gitee 仓库', onClick: () => nodeBridge.jumpToUrl('https://gitee.com/ttqf/FFBox') },
					{ type: 'submenu', label: '子菜单', subMenu: [
						{ type: 'normal', label: 'FFBox v4.0', value: 'FFBox', tooltip: '显示环境信息', onClick: () => showEnvironmentInfo() },
					] },
				] },
				{ type: 'separator' },
				{ type: 'normal', label: 'FFBox v4.0', value: 'FFBox', tooltip: '显示环境信息', onClick: () => showEnvironmentInfo() },
			],
		},
		{
			type: 'submenu',
			label: '服务器 (S)',
			subMenu: [
				{ type: 'normal', label: '添加服务器', value: '添加服务器', tooltip: '添加服务器标签页',
					disabled: appStore.servers.length && appStore.servers[appStore.servers.length - 1].entity.status === ServiceBridgeStatus.Idle, onClick: () => appStore.addServer() },
				{ type: 'normal', label: '关闭当前服务器页面', value: '关闭当前服务器页面', tooltip: '断开当前服务器连接并关闭标签页', disabled: !(appStore.currentServer?.entity.ip !== 'localhost'), onClick: () => appStore.removeServer(appStore.currentServerId) },
				{ type: 'normal', label: '关闭所有服务器页面', value: '关闭所有服务器页面', tooltip: '断开所有服务器连接（不包括本地服务器）并关闭标签页', onClick: () => {
					for (const server of appStore.servers) {
						if (server.entity.ip !== 'localhost') {
							appStore.removeServer(server.data.id);
						}
					}
				} },
				{ type: 'separator' },
				{ type: 'normal', label: '刷新当前服务器信息', value: '刷新当前服务器信息', tooltip: '刷新服务器版本、任务列表、通知列表等信息', onClick: () => {
					const server = appStore.currentServer as any;
					appStore.updateServerVersion(server);
					// appStore.updateGlobalTask(server);
					appStore.updateTask(server, -1);
					appStore.updateTaskList(server);
					// entity.updateTaskList();
					appStore.updateNotifications(server);
				} },
			],
		},
		{
			type: 'submenu',
			label: '任务 (T)',
			subMenu: appStore.currentServer?.entity.status === ServiceBridgeStatus.Connected ? [
				{ type: 'normal', label: '添加任务', value: '添加任务', tooltip: '向当前服务器添加任务', onClick: () => {
					const elem = document.createElement('input');
					elem.type = 'file';
					elem.multiple = true;
					document.body.appendChild(elem);
					// elem.click();
					const ev = new MouseEvent('click');
					elem.dispatchEvent(ev);
					document.body.removeChild(elem);
					elem.onchange = () => {
						appStore.addTasks(elem.files);
					}
				} },
				{ type: 'normal', label: '停止所有任务', value: '停止所有任务', tooltip: '将当前服务器所有运行中、已暂停的任务进行软停止操作', onClick: () => {
					for (const [id, task] of Object.entries(appStore.currentServer?.data.tasks) || []) {
						if (task.status === TaskStatus.TASK_RUNNING || task.status === TaskStatus.TASK_PAUSED)
						appStore.currentServer.entity.taskReset(+id);
					}
				} },
				{ type: 'normal', label: '删除所有未在运行的任务', value: '删除所有未在运行的任务', tooltip: '将当前服务器所有已完成、已停止、出错的任务删除', onClick: () => {
					for (const [id, task] of Object.entries(appStore.currentServer.data.tasks)) {
						if ([TaskStatus.TASK_FINISHED, TaskStatus.TASK_STOPPED, TaskStatus.TASK_ERROR].includes(task.status)) {
							appStore.currentServer.entity.taskDelete(+id);
						}
					}
				} },
				{ type: 'separator' },
				{ type: 'normal', label: '开始执行队列', value: '开始执行队列', disabled: appStore.currentServer.data.workingStatus === WorkingStatus.running, onClick: () => {
					appStore.currentServer.entity.queueAssign();
				} },
				{ type: 'normal', label: '暂停执行队列', value: '暂停执行队列', disabled: appStore.currentServer.data.workingStatus !== WorkingStatus.running, onClick: () => {
					appStore.currentServer.entity.queuePause();
				}},
			] : [
				{ type: 'normal', label: '请先连接当前服务器', value: '请先连接当前服务器', disabled: true },
			],
		},
		{
			type: 'submenu',
			label: '视图 (V)',
			subMenu: [
				{ type: 'normal', label: '放大', value: '放大', onClick: () => nodeBridge.zoomPage('in'), tooltip: '全局界面放大' },
				{ type: 'normal', label: '缩小', value: '缩小', onClick: () => nodeBridge.zoomPage('out'), tooltip: '全局界面缩小' },
				{ type: 'normal', label: '重置缩放', value: '重置缩放', onClick: () => nodeBridge.zoomPage('reset'), tooltip: '全局界面缩放重置' },
				{ type: 'separator' },
				{ type: 'checkbox', label: '通知中心', value: '通知中心', checked: appStore.showInfoCenter, onClick: () => {
					if (appStore.showInfoCenter) {
						appStore.showInfoCenter = false;
					} else {
						appStore.showInfoCenter = true;
						appStore.showMenuCenter = 0;
					}
				} },
				{ type: 'checkbox', label: '菜单中心', value: '菜单中心', checked: appStore.showMenuCenter === 2, onClick: () => {
					if (appStore.showMenuCenter === 2) {
						appStore.showMenuCenter = 0;
					} else {
						appStore.showMenuCenter = appStore.showMenuCenter = 2;
						appStore.showInfoCenter = false;
					}
				} },
			],
		},
	];
	return ret;
}, {
	// onTrigger: (e) => {
	// 	console.log('trigger', e);
	// }
});

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
			width: '440px',
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
			width: '448px',
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

// 切换菜单中心时关闭已打开菜单
watch(() => appStore.showMenuCenter, (value) => {
	selectedMenuIndex.value = -1;
	// if (value === 0) {
	// 	setTimeout(() => {
	// 		console.log('关了', value, selectedMenuIndex.value, currentOpenedMenuRef.value);
	// 		if (currentOpenedMenuRef.value) {
	// 			currentOpenedMenuRef.value.close();
	// 		}
	// 	}, 500);
	// }
});
// 监听已打开菜单序号，控制显示悬浮菜单
watch(selectedMenuIndex, (index, oldIndex) => {
	const selectedMenu = finalMenu.value[index];
	if (selectedMenu) {
		if (oldIndex === -1) {
			// 新打开菜单时，记录顶部菜单按钮位置，并在 body 上挂载鼠标移动监听
			// const rects: DOMRect[] = [];
			// for (const topMenuButton of topMenuRef.value.children) {
			// 	rects.push(topMenuButton.getBoundingClientRect());
			// }
			// topMenuButtonsMousemoveListener.value = (ev: MouseEvent) => {
			// 	for (const [key, topMenuButtonRect] of Object.entries(rects)) {
			// 		if (
			// 			ev.pageX > topMenuButtonRect.x && ev.pageX < topMenuButtonRect.x + topMenuButtonRect.width &&
			// 			ev.pageY > topMenuButtonRect.y && ev.pageY < topMenuButtonRect.y + topMenuButtonRect.height
			// 		) {
			// 			selectedMenuIndex.value = Number(key);
			// 		}
			// 	}
			// }
			// document.body.addEventListener('mousemove', topMenuButtonsMousemoveListener.value);
			// 新打开菜单时，记录顶部菜单按钮位置，并在 body 上的此位置添加置顶元素
			if (appStore.showMenuCenter === 1) {
				const rects: DOMRect[] = [];
				for (const topMenuButton of topMenuRef.value.children) {
					rects.push(topMenuButton.getBoundingClientRect());
				}
				// topMenuButtonsMousemoveListener.value = 0;
				for (const [key, rect] of Object.entries(rects)) {
					const elem = document.createElement('div');
					elem.style.setProperty('position', 'fixed');
					elem.style.setProperty('left', `${rect.left}px`);
					elem.style.setProperty('top', `${rect.top}px`);
					elem.style.setProperty('width', `${rect.width}px`);
					elem.style.setProperty('height', `${rect.height}px`);
					elem.style.setProperty('outline', `red 1px solid`);
					elem.style.setProperty('z-index', `100`);
					elem.setAttribute('data-index', key);
					elem.addEventListener('mousemove', (ev: MouseEvent) => {
						const index = +(ev.target as HTMLDivElement).getAttribute('data-index');
						selectedMenuIndex.value = index;
					});
					document.body.appendChild(elem);
					topMenuButtonsMousemoveElems.value.push(elem);
				}
			}
		}

		const elem = topMenuRef.value.children[index];
		const rect = elem.getBoundingClientRect();
		currentOpenedMenuRef.value?.close();
		if (selectedMenu.type !== 'submenu') {
			return;
		}
		currentOpenedMenuRef.value = showMenu({
			menu: selectedMenu.subMenu,
			type: 'action',
			// defaultSelectedValue?: any;
			// container: containerRef.value,
			triggerRect: { xMin: rect.x, yMin: rect.y, xMax: rect.x + rect.width, yMax: rect.y + rect.height },	// 触发菜单的控件的坐标，用于计算菜单弹出方向和大小
			// disableMask: appStore.showMenuCenter === 1,
			onClose: () => {
				// 如果是切换菜单，此处两值就不相等，则不继续关闭其他内容
				if (index === selectedMenuIndex.value) {
					selectedMenuIndex.value = -1;
					if (appStore.showMenuCenter === 1) {
						appStore.showMenuCenter = 0;
					}
				}
			},
			onSelect: (event, value, checked) => {
				handleMenuItemClicked(event, value);
				selectedMenuIndex.value = -1;
				if (appStore.showMenuCenter === 1) {
					// 菜单组件会停止 mouseup 的冒泡，因此此处再触发一次关闭大按钮菜单
					const ev = new MouseEvent('mouseup');
					document.dispatchEvent(ev);
				}
			},
			onKeyDown: (event: KeyboardEvent) => {
				if (event.key === 'ArrowLeft') {
					selectedMenuIndex.value = selectedMenuIndex.value === 0 ? finalMenu.value.length - 1 : selectedMenuIndex.value - 1;
				} else if (event.key === 'ArrowRight') {
					selectedMenuIndex.value = selectedMenuIndex.value === finalMenu.value.length - 1 ? 0 : selectedMenuIndex.value + 1;
				}
			},
		});
	} else {
		if (oldIndex !== -1) {
			// document.body.removeEventListener('mousemove', topMenuButtonsMousemoveListener.value);
			currentOpenedMenuRef.value?.close();
			currentOpenedMenuRef.value = undefined;
			for (const elem of topMenuButtonsMousemoveElems.value) {
				document.body.removeChild(elem);
			}
			topMenuButtonsMousemoveElems.value.splice(0, Number.MAX_SAFE_INTEGER);
		}
	}
});
// 菜单有更新时通知主进程更新应用菜单
watch(finalMenu, (finalMenu) => {
	nodeBridge.setApplicationMenu(finalMenu);
}, { immediate: true });

const handleTopMenuHover = (index: number) => {
	if (appStore.showMenuCenter === 1) {
		selectedMenuIndex.value = index;
	}
};

const handleMenuItemClicked = (event: Event, value: any) => {
	// 从 finalMenu 中找 value 相同的菜单项
	function dfs(menuItems: MenuItem[]): MenuItem | undefined {
		for (const menuItem of menuItems) {
			if (menuItem.type === 'submenu') {
				const result = dfs(menuItem.subMenu);
				if (result) {
					return result;
				}
			} else if ('value' in menuItem && menuItem.value === value) {
				return menuItem;
			}
		}
	}
	const correspondingMenuItem = dfs(finalMenu.value);
	// 若找到该项，该项配置了 onClick，则触发
	if (correspondingMenuItem && 'onClick' in correspondingMenuItem) {
		correspondingMenuItem.onClick(event, value);
	}
};

// const handleMenuMaskMouseUp = () => {
// 	console.log('handleMenuMaskMouseUp');
// 	currentOpenedMenuRef.value.close();
// };

onMounted(() => {
	// 挂载菜单点击监控
	nodeBridge.ipcRenderer?.removeAllListeners('menuItemClicked');
	nodeBridge.ipcRenderer?.on('menuItemClicked', (event, value: any) => {
		handleMenuItemClicked(event, value);
	});
});

</script>

<template>
	<div class="pad" :style="menuCenterPadStyle">
	</div>
	<div class="container" :style="menuCenterContainerStyle">
		<!-- <div v-if="appStore.showMenuCenter === 1" class="menuMask" @mouseup="handleMenuMaskMouseUp"></div> -->
		<div class="topMenu" ref="topMenuRef">
			<div
				v-for="(menu, index) in finalMenu"
				:class="`menu ${selectedMenuIndex === index ? 'menuSelected' : ''}`"
				@mouseenter="(e) => handleTopMenuHover(index)"
				@mousedown="(e) => selectedMenuIndex = index"
			>
				{{ 'label' in menu && menu.label }}
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
			width: 362px;
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
		.menuMask {
			position: fixed;
			left: 0;
			top: 0;
			width: 100vh;
			height: 100vh;
		}
	}
</style>

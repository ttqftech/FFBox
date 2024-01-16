<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { TaskStatus, WorkingStatus } from '@common/types';
import { useAppStore } from '@renderer/stores/appStore';
import { ServiceBridgeStatus } from '@renderer/bridges/serviceBridge';
import showMenu, { MenuItem } from '@renderer/components/Menu/Menu';
import nodeBridge from '@renderer/bridges/nodeBridge';
import { showEnvironmentInfo } from '@renderer/components/misc/EnvironmentInfo'
import SponsorPanel from './MenuCenter/SponsorPanel.vue';
import LocalSettings from './MenuCenter/LocalSettings.vue';
import Terms from './MenuCenter/Terms.vue';
import IconSidebarSponsor from '@renderer/assets/menuCenter/sponsor.svg?component';
import IconSidebarSettings from '@renderer/assets/menuCenter/settings.svg?component';
import IconSidebarTerm from '@renderer/assets/menuCenter/term.svg?component';

const appStore = useAppStore();

const sidebarIcons = [IconSidebarSettings, IconSidebarSponsor, IconSidebarTerm];
const sidebarTexts = ['设置', '支持作者', '使用条款'];
const sidebarColors = computed(() => 
	appStore.frontendSettings.colorTheme === 'themeLight'
		? ['hwb(195 0% 10%)', 'hwb(315 0% 0%)', 'hwb(35 10% 10%)']
		: ['hwb(195 5% 5%)', 'hwb(315 20% 5%)', 'hwb(35 10% 20%)']
);
const animationName = ref('animationUp');

const selectedMenuIndex = ref(-1);
const topMenuRef = ref<HTMLDivElement>(null);
const currentOpenedMenuRef = ref<ReturnType<typeof showMenu>>();
const topMenuButtonsMousemoveElems = ref<HTMLDivElement[]>([]);

const selectedPanelIndex = ref(-1);	// 待打开面板再载入，节省资源

const finalMenu = computed(() => {
	const ret: MenuItem[] = [
		{
			type: 'submenu',
			label: 'FFBox (A)',
			subMenu: [
				{ type: 'submenu', label: '访问官网', subMenu: [
					{ type: 'normal', label: 'FFBox 官网', value: 'FFBox 官网', onClick: () => nodeBridge.jumpToUrl('http://ffbox.ttqf.tech') },
					{ type: 'normal', label: '作者个人网站', value: '作者个人网站', onClick: () => nodeBridge.jumpToUrl('http://ttqf.tech') },
					{ type: 'normal', label: 'FFmpeg 官网', value: 'FFmpeg 官网', onClick: () => nodeBridge.jumpToUrl('https://ffmpeg.org') },
				] },
				{ type: 'submenu', label: '访问源码', subMenu: [
					{ type: 'normal', label: 'github 仓库', value: 'github 仓库', onClick: () => nodeBridge.jumpToUrl('https://github.com/ttqftech/FFBox') },
					{ type: 'normal', label: 'gitee 仓库', value: 'gitee 仓库', onClick: () => nodeBridge.jumpToUrl('https://gitee.com/ttqf/FFBox') },
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
				{ type: 'normal', label: '删除所有未在运行任务', value: '删除所有未在运行任务', tooltip: '将当前服务器所有已完成、已停止、出错的任务删除', onClick: () => {
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
			background: 'linear-gradient(to bottom, hwb(var(--bg97)), hwb(var(--bg95)))',
			opacity: '0',
			transitionDelay: '0s, 0s, 0s, 0s, 0.2s',
		}
	} else if (appStore.showMenuCenter === 1) {
		return {
			top: '8px',
			left: '8px',
			width: '440px',
			height: '28px',
			background: 'hwb(var(--bg98))',
			opacity: 1,
		}
	} else {
		return {
			top: '0',
			left: '0',
			width: '100%',
			height: '100%',
			background: 'linear-gradient(to bottom, hwb(var(--bg97)), hwb(var(--bg95)))',
			opacity: 1,
		}
	}
});
const menuCenterContainerStyle = computed(() => {
	if (appStore.showMenuCenter === 0) {
		return {
			width: '84px',
			height: '36px',
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

const getButtonColorStyle = (index: number) => ({ color: selectedPanelIndex.value === index ? sidebarColors.value[index] : 'hwb(0 50% 50%)' });

// 切换菜单中心时关闭已打开菜单，切换到侧边栏第一个面板
watch(() => appStore.showMenuCenter, (value) => {
	selectedMenuIndex.value = -1;
	selectedPanelIndex.value = 0;
});
// 监听已打开菜单序号，控制显示悬浮菜单
watch(selectedMenuIndex, (index, oldIndex) => {
	const selectedMenu = finalMenu.value[index];
	if (selectedMenu) {
		if (oldIndex === -1) {
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
			triggerRect: { xMin: rect.x, yMin: rect.y, xMax: rect.x + rect.width, yMax: rect.y + rect.height },	// 触发菜单的控件的坐标，用于计算菜单弹出方向和大小
			onClose: () => {
				// 如果是切换菜单（或者是选择了项目触发了 onSelect），此处两值就不相等，则不继续关闭其他内容
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
					// 菜单组件会停止 mouseup 的冒泡，因此此处再触发一次发送到大按钮关闭菜单栏
					const ev = new MouseEvent('mouseup');
					document.dispatchEvent(ev);
					// 如果是通过键盘触发的，那么就不是通过大按钮的 mouseup 关闭菜单，而是手动关闭
					appStore.showMenuCenter = 0;
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

const handleParaButtonClicked = (index: number) => {
	animationName.value = index < selectedPanelIndex.value ? 'animationUp' : 'animationDown';
	selectedPanelIndex.value = index;
}

onMounted(() => {
	// 挂载菜单点击监控
	nodeBridge.ipcRenderer?.removeAllListeners('menuItemClicked');
	nodeBridge.ipcRenderer?.on('menuItemClicked', (event, value: any) => {
		handleMenuItemClicked(event, value);
	});
	// 挂载 Alt 键响应
	const keydownListener = (event: KeyboardEvent) => {
		if (event.key === 'Alt' && appStore.showMenuCenter === 0) {
			appStore.showMenuCenter = 1;
		} else if (event.altKey) {
			const index = [65, 83, 84, 86].indexOf(event.keyCode);
			if (index > -1) {
				selectedMenuIndex.value = index;
			}
		}
	}
	const keyupListener = (event: KeyboardEvent) => {
		if (event.key === 'Alt' && appStore.showMenuCenter === 1 && selectedMenuIndex.value === -1) {
			appStore.showMenuCenter = 0;
		}
	}
	document.addEventListener('keydown', keydownListener);
	document.addEventListener('keyup', keyupListener);
});

</script>

<template>
	<div class="pad" :style="menuCenterPadStyle">
	</div>
	<div class="container" :style="menuCenterContainerStyle">
		<div class="topDragger"></div>
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
		<div class="lrCenter">
			<div>
				<div class="selectors">
					<button v-for="index in [0, 1, 2]" :key="index" :aria-label="sidebarTexts[index]" @click="handleParaButtonClicked(index)">
						<component :is="sidebarIcons[index]" :style="getButtonColorStyle(index)" />
						<span :style="getButtonColorStyle(index)">{{ sidebarTexts[index] }}</span>
					</button>
				</div>
				<div class="content">
					<Transition :name="animationName">
						<LocalSettings v-if="selectedPanelIndex === 0" />
					</Transition>
					<Transition :name="animationName">
						<SponsorPanel v-if="selectedPanelIndex === 1" />
					</Transition>
					<Transition :name="animationName">
						<Terms v-if="selectedPanelIndex === 2" />
					</Transition>
				</div>
			</div>
		</div>
		<h1 class="title">{{ sidebarTexts[selectedPanelIndex] }}</h1>
		<!-- <div class="hline"></div> -->
		<!-- <div class="vline"></div> -->
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
					background: 0.15s;
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
		.topDragger {
			position: absolute;
			left: 0;
			top: 0;
			right: 0;
			height: 92px;
			-webkit-app-region: drag;
		}
		.topMenu {
			position: absolute;
			left: 85px;
			top: 8px;
			width: 362px;
			height: 28px;
			font-size: 14px;
			-webkit-app-region: none;
			.menu {
				display: inline-block;
				padding: 0 16px;
				line-height: 28px;
				border-radius: 8px;
				&:not(.menuSelected):hover {
					box-shadow: 0 1px 4px hwb(var(--hoverShadow) / 0.2),
								0 4px 2px -2px hwb(var(--highlight) / 0.5) inset;
				}
				&:not(.menuSelected):active {
					box-shadow: 0 0px 1px hwb(var(--hoverShadow) / 0.2),
								0 20px 15px -10px hwb(var(--hoverShadow) / 0.15) inset;
					transform: translateY(0.25px);
				}
			}
			.menuSelected {
				background-color: hwb(220 25% 10%);
				box-shadow: 0 1px 4px hwb(220 25% 10% / 0.5);
				color: #FFF;
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
	// 切换动画（向上）
	.animationUp-enter-from {
		/* z-index: 0; */
		opacity: 0;
		transform: translateY(-30px);
	}
	.animationUp-enter-active, .animationUp-leave-active {
		transition: opacity 0.3s, transform 0.5s cubic-bezier(0.2, 1.25, 0.3, 1);
	}
	.animationUp-enter-to, .animationUp-leave-from {
		/* z-index: 1; */
		opacity: 1;
		transform: translateY(0);
	}
	.animationUp-leave-active {
		transition: opacity 0.3s, transform 0.3s cubic-bezier(0.5, 0, 1, 1);
	}
	.animationUp-leave-to {
		opacity: 0;
		transform: translateY(30px);
	}
	// 切换动画（向下）
	.animationDown-enter-from {
		/* z-index: 0; */
		opacity: 0;
		transform: translateY(30px);
	}
	.animationDown-enter-active, .animationDown-leave-active {
		transition: opacity 0.3s, transform 0.5s cubic-bezier(0.2, 1.25, 0.3, 1);
	}
	.animationDown-enter-to, .animationDown-leave-from {
		/* z-index: 1; */
		opacity: 1;
		transform: translateY(0);
	}
	.animationDown-leave-active {
		transition: opacity 0.3s, transform 0.3s cubic-bezier(0.5, 0, 1, 1);
	}
	.animationDown-leave-to {
		opacity: 0;
		transform: translateY(-30px);
	}
	.lrCenter {
		position: absolute;
		top: 96px;
		left: 0;
		right: 0;
		// left: calc(15% - 80px);
		// right: calc(15% - 80px);
		bottom: 0px;
		display: flex;
		justify-content: center;
		margin: auto;
		&>div {
			position: relative;
			width: calc(70vw + 160px);
			flex: 0 0 auto;
			.selectors {
				position: absolute;
				left: 0;
				top: 0;
				bottom: 0;
				width: 128px;
				padding: 4px 4px;
				overflow: auto;
				box-shadow: 0.5px 0.5px 1px 0px hwb(var(--hoverLightBg) / 0.95),
							20px 20px 20px 0px hwb(var(--hoverShadow) / 0.02),
							6px 6px 6px 0px hwb(var(--hoverShadow) / 0.02);
				// box-shadow: 12px 0 12px -12px hwb(0 50% 50% / 1);
				button {
					text-align: center;
					width: 120px;
					height: 40px;
					padding: 0;
					background-color: transparent;
					border: none;
					border-radius: 8px;
					transition: width 0.3s ease;
					&:hover {
						background-color: hwb(var(--hoverLightBg) / 0.4);
						// box-shadow: 0px 2px 2px rgba(127,127,127,0.5);
						// box-shadow: 0 0 4px 2px hwb(0 0% 100% / 0.05);
						box-shadow: 0 0 1px 0.5px hwb(var(--hoverLightBg)),
									0 1.5px 4px 0 hwb(var(--hoverShadow) / 0.15),
									0 1px 0.5px 0px hwb(var(--hoverLightBg)) inset;	// 上高光
					}
					&:active {
						background-color: transparent;
						box-shadow: 0 0 2px 1px hwb(var(--hoverShadow) / 0.05), // 外部阴影
									0 6px 12px hwb(var(--hoverShadow) / 0.1) inset; // 内部凹陷阴影
						transform: translateY(0.25px);
					}
					svg {
						width: 24px;
						height: 24px;
						margin: 0 2px 0 4px;
						vertical-align: middle;
						filter: var(--paraBoxButtonDropFilterSvg);
					}
					span {
						display: inline-block;
						width: 80px;
						vertical-align: -4.5px;
						padding-left: 4px;
						letter-spacing: 2px;
						white-space: nowrap;
						overflow: hidden;
						transition: width 0.3s ease, padding 0.3s ease;
						filter: var(--paraBoxButtonDropFilterSvg);
					}
					// @media only screen and (max-width: 600px) {
					// 	width: 50px;
					// 	span {
					// 		// display: none;
					// 		width: 0px;
					// 		padding: 0px;
					// 	}
					// }
				}
			}
			.content {
				position: absolute;
				left: 144px;
				right: 0;
				top: 0;
				bottom: 0;
				&>* {
					position: absolute;
					width: 100%;
					height: 100%;
					overflow: auto;
					&::-webkit-scrollbar {
						width: 10px;
						background: transparent;
					}
					&::-webkit-scrollbar-thumb {
						border-radius: 10px;
						background: rgba(128, 128, 128, 0.2);
					}
					&::-webkit-scrollbar-track {
						border-radius: 10px;
						background: rgba(128, 128, 128, 0.1);
					}
				}
			}
		}
	}
	.title {
		position: absolute;
		top: 32px;
		left: calc(15% - 80px + 144px);
		right: calc(15% - 80px);
		font-size: 22px;
		text-align: center;
		color: var(--titleText);
	}
	.hline {
		position: absolute;
		top: 84px;
		left: calc(15% - 80px + 144px);
		right: calc(15% - 80px);
		height: 1px;
		background: linear-gradient(90deg, rgba(128, 128, 128, 0.1), rgba(128, 128, 128, 0.4), rgba(128, 128, 128, 0.1));
	}
	.vline {
		position: absolute;
		top: 84px;
		bottom: 8px;
		left: calc(15% - 80px + 144px);
		width: 1px;
		// background: linear-gradient(0deg, rgba(128, 128, 128, 0.1), rgba(128, 128, 128, 0.4), rgba(128, 128, 128, 0.1));
		background: hwb(0 50% 50% / 0.3);
		box-shadow: 1px 1px 6px hwb(0 50% 50% / 1);
	}
</style>

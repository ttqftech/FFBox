<script setup lang="ts">
import { MenuItemConstructorOptions, MenuItem } from 'electron';
import { useAppStore } from '@renderer/stores/appStore';
import IconX from '../assets/×.svg?component';
import IconAdd from '../assets/add.svg?component';
import IconMinimize from '../assets/minimize.svg?component';
import IconMaximize from '../assets/maximize.svg?component';
import IconClose from '../assets/close.svg?component';

// const menu = undefined;
const appStore = useAppStore();

// 最小化按钮点击响应
const handleMinimizeClicked = () => {
	window.electron.ipcRenderer.send('minimize');
};

// 窗口模式按钮点击响应
const handleWindowmodeClicked = () => {
	window.electron.ipcRenderer.send('windowmode');
};

// 关闭按钮
const handleCloseClicked = () => {
	window.electron.ipcRenderer.send('close');
};

// let currentServer: Server = this.$store.getters.currentServer;
// if (!currentServer) {
// 	return 'startbutton-gray';
// }
const startButtonClass = /*currentServer.workingStatus > 0*/ false ? 'startbutton-yellow' : 'startbutton-green';
const startButtonText = false ? '⏸暂停' : '▶开始'

const paraSelected = 0;

</script>

<template>
	<div class="container">
		<div class="titlebar">
			<div class="tabArea">
				<div class="tab">
					<span>本地服务器</span>
					<div class="progress" style="width: 50%"></div>
					<div class="close">
						<img src="../assets/×.svg" alt="" srcset="">
					</div>
				</div>
				<div class="tab">
					<span>{{ appStore?.ipAddress }}</span>
					<div class="progress" style="width: 50%"></div>
				</div>
			</div>
			<div class="buttonArea">
				<button class="normalButton">
					<IconAdd />
				</button>
				<button class="normalButton" @click="handleMinimizeClicked">
					<IconMinimize />
				</button>
				<button class="normalButton" @click="handleWindowmodeClicked">
					<IconMaximize />
				</button>
				<button class="redButton" @click="handleCloseClicked">
					<IconClose />
					<!-- <IconX /> -->
					<!-- <img :src="IconX" alt="my-logo" /> -->
					<!-- <img src="../assets/×.svg" alt="" srcset=""> -->
				</button>
			</div>
		</div>
		<div class="actionbar">
			<div class="left">
				<button class="startbutton startbutton-gray">➕添加</button>
			</div>
			<div class="right">
				<button class="startbutton" :class="startButtonClass">{{ startButtonText }}</button>
			</div>
		</div>
		<div class="mainarea">
			<div class="listarea"></div>
			<div class="parabox">
				<div class="upper">
					<div class="devider">
						<div class="buttons">
							<button v-for="value in [0, 1, 2, 3, 4, 5]" :key="value" :aria-label="['快捷参数', '输入参数', '视频参数', '音频参数', '效果参数', '输出参数'][value]">
								<div class="icon" :class="{'icon-selected': paraSelected == value}" :style="{ backgroundPositionY: `${(value + 2) / 7 * 100}%` }"></div>
							</button>
						</div>
					</div>
					<div class="globalparam">
					</div>
				</div>
				<div class="lower">
				</div>
			</div>
		</div>
		<div class="statusbar"></div>
	</div>
	<div class="bigicon">
		<img :src="'./images/icon_256_transparent.png'" />
	</div>
</template>

<style lang="less" scoped>
	.container {
		position: relative;
		display: flex;
		flex-direction: column;		
		height: 100%;
		transform: translateZ(0); // 尝试使用 z-index 分离层叠上下文，但 devtools 报错 The intl string context variable "REASON_PROPERTY_DECLARATION_CODE" was not provided to the string
		.titlebar {
			position: relative;
			height: 36px;
			padding-left: 92px;
			display: flex;
			// background-color: hwb(220 25% 10%);
			background-color: hwb(220 92% 4%);
			box-shadow: 0 -32px 32px -16px hwb(0 0% 100% / 0.02) inset,
						0 -8px 8px -4px hwb(0 0% 100% / 0.02) inset;
			.tabArea {
				// height: 100%;
				// box-sizing: border-box;
				flex: 1 1 auto;
				display: flex;
				padding: 8px 6px 0;
				margin-left: -2px;
				overflow: auto hidden;
				-webkit-app-region: drag;
				&>* {
					-webkit-app-region: none;
				}
				&::-webkit-scrollbar {
					height: 0;
				}
				.tab {
					position: relative;
					flex: 0 1 200px;
					min-width: 140px;
					margin-right: 8px;
					border-radius: 6px 6px 0 0;
					background-color: hwb(0 97% 3%);
					box-shadow: 0 0 6px hwb(0 0% 100% / 0.2),
								0 -24px 12px -12px hwb(0 100% 0%) inset,
								0 4px 2px -2px hwb(0 100% 0% / 0.5) inset;
					span {
						font-size: 14px;
						line-height: 28px;
					}
					.progress {
						position: absolute;
						left: 0;
						height: 100%;
					}
					.close {
						position: absolute;
						right: 4px;
						top: 4px;
						width: 20px;
						height: 20px;
						border-radius: 2px;
						&:hover {
							box-shadow: 0 1px 4px hwb(0 0% 100% / 0.2),
										0 4px 2px -2px hwb(0 100% 0% / 0.5) inset;
						}
						&:active {
							box-shadow: 0 0px 1px hwb(0 0% 100% / 0.2),
										0 20px 15px -10px hwb(0 0% 100% / 0.15) inset;
							transform: translateY(0.25px);
						}
						img {
							width: 100%;
						}
					}
				}
			}
			.buttonArea {
				// height: 100%;
				padding-bottom: 8px;
				flex: 0 0 auto;
				button {
					width: 44px;
					height: 100%;
					display: inline-flex;
					justify-content: center;
					align-items: center;
					border: none;
					outline: none;
					background: none;
					svg {
						fill: hwb(0 30% 70%);
						width: 10px;
						height: 10px;
					}
				}
				.normalButton:hover {
					background-color: hwb(0 0% 100% / 0.10);
				}
				.normalButton:active {
					box-shadow: 0 1px 2px hwb(0 0% 100% / 0.3) inset;
					transform: translateY(0.5px);
				}
				.redButton:hover {
					background-color: hwb(0 15% 0% / 0.8);
					svg {
						fill: white;
					}
				}
				.redButton:active {
					box-shadow: 0 2px 4px hwb(0 0% 100% / 0.6) inset;
					transform: translateY(0.5px);
				}
			}
		}
		.actionbar {
			position: relative;
			width: 100%;
			height: 56px;
			display: flex;
			justify-content: space-between;
			background-color: hwb(220 97% 3%);
			box-shadow: 0 3px 2px -2px hwb(0 100% 0%) inset,
						0 20px 20px 0px hwb(0 0% 100% / 0.02),
						0 6px 6px 0px hwb(0 0% 100% / 0.02);
			z-index: 1;
			-webkit-app-region: drag;
			&>* {
				-webkit-app-region: none;
			}
			.left, .right {
				display: flex;
				justify-content: center;
				align-items: center;
				height: 100%;
			}
			.left {
				padding-left: 96px;
			}
			.right {
				padding-right: 16px;
			}
			.startbutton {
				position: relative;
				width: 120px;
				height: 36px;
				text-align: center;
				line-height: 36px;
				font-size: 20px;
				letter-spacing: 4px;
				text-indent: 2px;
				color: #FFF;
				text-shadow: 0px 1px 1px rgba(0, 0, 0, 0.5);
				border-radius: 10px;
				border: none;
				outline: none;
				&:hover:before {
					position: absolute;
					left: 0;
					content: "";
					width: 100%;
					height: 100%;
					border-radius: 10px;
					background: -webkit-linear-gradient(-90deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
				}
			}
			.startbutton-green {
				background: linear-gradient(180deg, hsl(120, 80%, 65%), hsl(120, 60%, 50%));
				box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
							0px 1px 1px 0px rgba(16, 16, 16, 0.15),
							0px 2px 6px 0px rgba(0, 0, 0, 0.15),
							0px 4px 16px -4px hsl(120, 80%, 65%);
			}
			.startbutton-green:active {
				background: linear-gradient(180deg, hsl(120, 65%, 35%), hsl(120, 60%, 50%));
			}
			.startbutton-green:hover {
				box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
							0px 1px 1px 0px rgba(16, 16, 16, 0.15),
							0px 2px 6px 0px rgba(0, 0, 0, 0.15),
							0px 4px 24px 0px hsl(120, 80%, 65%);
			}
			.startbutton-yellow {
				background: linear-gradient(180deg, hsl(54, 80%, 65%), hsl(54, 60%, 50%));
				box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
							0px 1px 1px 0px rgba(16, 16, 16, 0.15),
							0px 2px 6px 0px rgba(0, 0, 0, 0.15),
							0px 4px 16px -4px hsl(54, 80%, 65%);
			}
			.startbutton-yellow:active {
				background: linear-gradient(180deg, hsl(54, 65%, 35%), hsl(54, 60%, 50%));
			}
			.startbutton-yellow:hover {
				box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
							0px 1px 1px 0px rgba(16, 16, 16, 0.15),
							0px 2px 6px 0px rgba(0, 0, 0, 0.15),
							0px 4px 24px 0px hsl(54, 80%, 65%);
			}
			.startbutton-gray {
				color: hwb(0 20% 80%);
				text-shadow: none;
				background: linear-gradient(180deg, hsl(0, 0%, 100%), hsl(0, 0%, 90%));
				box-shadow: 0px -1px 1px 0px rgba(255, 255, 255, 0.3),
							0px 1px 1px 0px rgba(16, 16, 16, 0.15),
							0px 2px 6px 0px rgba(0, 0, 0, 0.15),
							0px 4px 16px -4px hsl(0, 0%, 100%);
			}
			.startbutton-gray:active {
				background: linear-gradient(180deg, #BBB, #DDD);
			}

		}
		.mainarea {
			position: relative;
			width: 100%;
			// height: 24px;
			background-color: hwb(0 92% 8%);
			flex: 1 0 auto;
			.parabox  {
				position: absolute;
				bottom: 0;
				width: 100%;
				min-height: 28px;
				height: 40%;
				background-color: hwb(0 94% 6%);
				box-shadow: 0px 0px 8px hwb(0 0% 100% / 0.05), // 远距离上阴影
							0px 1px 1px hwb(0 100% 0% / 0.25) inset; // 内部上阴影
				overflow: hidden;
				.upper {
					height: 30px;
					background-color: hwb(0 97% 3%);
					box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.02), // 远距离下阴影
								0px -2px 1px -1px rgba(0, 0, 0, 0.1) inset; // 内部下阴影
					.devider {
						.buttons {
							height: 28px;
							overflow: hidden;
							button {
								display: inline-block;
								text-align: center;
								width: 80px;
								height: 28px;
								padding: 0;
								background-color: transparent;
								border: none;
								&:hover {
									background-color: hwb(0 100% 0% / 0.5);
									box-shadow: 0 0 4px 2px hwb(0 0% 100% / 0.05);
								}
								&:active {
									background-color: transparent;
									box-shadow: 0 0 2px 1px hwb(0 0% 100% / 0.05), // 外部阴影
												0 6px 12px hwb(0 0% 100% / 0.1) inset; // 内部凹陷阴影
									transform: translateY(0.25px);
								}
								.icon {
									display: inline-block;
									width: 65px;
									height: 20px;
									vertical-align: middle;
									background-image: url('../assets/sidebar-icon-white.png');
									background-size: cover;
								}
								.icon-selected {
									background-image: url('../assets/sidebar-icon-colored.png');
								}
							}
						}
					}
					.globalparam {

					}
				}
				.lower {

				}
			}
		}
		.statusbar {
			width: 100%;
			height: 24px;
			background-color: hwb(220 25% 10%);
			/* box-shadow: 0 3px 2px -2px hwb(0deg 100% 0%) inset; */
		}
	}
	.bigicon {
		position: absolute;
		top: 8px;
		left: 8px;
		width: 76px;
		height: 76px;
		background-color: hwb(0 98% 2%);
		border-radius: 8px;
		box-shadow: 0 2px 6px hwb(0 0% 100% / 0.2);
		img {
			width: 100%;
			height: 100%;
		}
	}
</style>

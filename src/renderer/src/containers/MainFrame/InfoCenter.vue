<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@renderer/stores/appStore';
import { ServerData } from '@renderer/types';
import { Notification } from '@common/types';
import { getTimeString } from '@common/utils';
import IconDelete from '@renderer/assets/titleBar/×.svg?component';
import IconInfo from '@renderer/assets/infoCenter/info.svg?component';
import IconTick from '@renderer/assets/infoCenter/tick.svg?component';
import IconWarning from '@renderer/assets/infoCenter/warning.svg?component';
import IconError from '@renderer/assets/infoCenter/error.svg?component';

interface NotificationGroup {
	name: string,
	serverId: string | undefined;
	notifications: (Notification & {
		notificationId: number;
	})[],
}

const appStore = useAppStore();

const notificationGroups = computed(() => {
		let local: NotificationGroup = {
			name: '',
			serverId: undefined,
			notifications: Object.entries(appStore.notifications).map(([key, value]) => ({
				...value,
				notificationId: Number(key),
			})),
		};
		let remotes: NotificationGroup[] = [];
		for (const [key, server] of Object.entries(appStore.servers)) {
			remotes = remotes.concat({
				name: server.data.name,
				serverId: server.data.id,
				notifications: Object.entries(server.data.notifications).map(([key, value]) => ({
					...value,
					notificationId: Number(key),
				})),
			});
		}
		let ret = [local, ...remotes];
		return ret;
});

const handleDelete = (serverId: string, notificationId: number) => {
	if (serverId) {
		const server = appStore.servers.find((server) => server.data.id === serverId);
		server.entity.deleteNotification(notificationId);
	} else {
		delete appStore.notifications[notificationId];
	}
}

</script>

<template>
	<Transition name="trans">
		<div class="mask" v-if="appStore.showInfoCenter">
			<div class="container">
				<h1 class="title">消息中心</h1>
				<div class="crossline"></div>
				<ul class="box">
					<div v-for="(notificationGroup, index) in notificationGroups" :key="index" class="group">
						<span class="servername">{{ notificationGroup.name || '本界面' }}</span>
						<li v-for="notification in notificationGroup.notifications" :key="notification.notificationId" class="info">
							<IconInfo v-if="notification.level === 0" class="statusIcon" />
							<IconTick v-else-if="notification.level === 1" class="statusIcon" />
							<IconWarning v-else-if="notification.level === 2" class="statusIcon" />
							<IconError v-else-if="notification.level === 3" class="statusIcon" />
							<p>{{ notification.content }}</p>
							<span>{{ getTimeString(new Date(notification.time), false) }}</span>
							<button class="delete" aria-label="删除此消息" @click="() => handleDelete(notificationGroup.serverId, notification.notificationId)">
								<IconDelete />
							</button>
						</li>
						<li v-if="!notificationGroup.notifications.length" class="noinfo">无消息</li>
					</div>
				</ul>
			</div>
		</div>
	</Transition>
</template>

<style lang="less" scoped>
	.mask {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background-color: hwb(0 10% 90% / 0.3);
		overflow: hidden;
		z-index: 2;
		.container {
			position: absolute;
			top: 0;
			width: 100%;
			height: 100%;
			background: linear-gradient(to bottom, hwb(0 97% 3%), hwb(0 95% 5%));
			box-shadow: 0 0 32px 8px hwb(0 10% 90% / 0.5);
			-webkit-app-region: none;
			.title {
				position: absolute;
				top: 10px;
				left: 0;
				right: 0;
				font-size: 22px;
				font-weight: normal;
				text-align: center;
				color: #2255ee;
				margin: 0;
				-webkit-app-region: drag;
			}
			.crossline {
				position: absolute;
				top: 48px;
				height: 1px;
				left: 48px;
				right: 48px;
				background: linear-gradient(90deg, rgba(128, 128, 128, 0.1), rgba(128, 128, 128, 0.4), rgba(128, 128, 128, 0.1));
			}
			.box {
				position: absolute;
				top: 60px;
				bottom: 20px;
				left: calc(10% - 32px);
				right: calc(10% - 32px);
				overflow-y: auto;
				margin: 0;
				padding: 0;
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
				.group {
					position: relative;
					width: 100%;
					.servername {
						display: block;
						height: 22px;
						margin: 10px 0 6px;
						line-height: 22px;
						font-size: 16px;
						font-weight: 700;
						list-style-type: none;
					}
					.info {
						position: relative;
						padding: 4px 0px;
						list-style-type: none;
						border-bottom: #DDD 1px solid;
						.statusIcon {
							position: absolute;
							left: 8px;
							top: 50%;
							transform: translateY(-50%);
							height: 16px;
							width: 16px;
							background-position: center;
							background-size: contain;
							background-repeat: no-repeat;
						}
						p {
							font-size: 14px;
							line-height: 1.4em;
							color: #555;
							margin: 0px 160px 0px 32px;
							text-align: left;
						}
						span {
							position: absolute;
							right: 28px;
							top: 50%;
							transform: translateY(-50%);
							font-size: 12px;
							line-height: 1.4em;
							color: #777;
						}
						.delete {
							position: absolute;
							top: 2px;
							right: 4px;
							bottom: 2px;
							width: 20px;
							border: none;
							outline: none;
							background: none;
							padding: 0;
							display: flex;
							justify-content: center;
							align-items: center;
							opacity: 0.5;
							border-radius: 4px;
							&:hover {
								box-shadow: 0 1px 4px hwb(0 0% 100% / 0.2),
											0 4px 2px -2px hwb(0 100% 0% / 0.5) inset;
							}
							&:active {
								box-shadow: 0 0px 1px hwb(0 0% 100% / 0.2),
											0 15px 20px -10px hwb(0 0% 100% / 0.15) inset;
								transform: translateY(0.25px);
							}
							// &:hover {
							// 	opacity: 1;
							// }
							// &:active {
							// 	opacity: 0.7;
							// }
							img {
								width: 16px;
							}
						}
					}
					.noinfo {
						position: relative;
						padding: 10px 0px;
						font-size: 14px;
						color: #777;
						list-style-type: none;
						border-bottom: #DDD 1px solid;
					}
				}
			}
		}
	}
	.trans-enter-from, .trans-leave-to {
		opacity: 0;
		.container {
			opacity: 0;
			transform: translateY(20%);
		}
	}
	.trans-enter-to, .trans-leave-from {
		opacity: 1;
		.container {
			opacity: 1;
			transform: translateY(0%);
		}
	}
	.trans-enter-active {
		transition: opacity 0.3s, transform 0.3s cubic-bezier(0.2, 1.0, 0.3, 1);
		.container {
			transition: opacity 0.3s, transform 0.3s cubic-bezier(0.2, 1.0, 0.3, 1);
		}
	}
	.trans-leave-active {
		transition: opacity 0.3s, transform 0.3s cubic-bezier(0.5, 0, 1, 1);
		.container {
			transition: opacity 0.3s, transform 0.3s cubic-bezier(0.5, 0, 1, 1);
		}
	}
</style>

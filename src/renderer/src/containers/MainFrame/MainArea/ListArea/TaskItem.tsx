import { computed, defineComponent, FunctionalComponent, onBeforeUnmount, ref, Transition, VNodeRef, watch, onUnmounted } from 'vue'; // defineComponent 的主要功能是提供类型检查
import { TaskStatus, TransferStatus, UITask } from '@common/types';
import { generator as vGenerator } from '@common/params/vcodecs';
import { generator as aGenerator } from '@common/params/acodecs';
import { useAppStore } from '@renderer/stores/appStore';
import Tooltip from '@renderer/components/Tooltip/Tooltip';
import nodeBridge from '@renderer/bridges/nodeBridge';
import { stringifyTimeValue } from '@common/utils';
import { getOutputDuration } from '@renderer/common/dashboardCalc';
import IconPreview from '@renderer/assets/video.svg';
import IconRightArrow from '@renderer/assets/mainArea/swap_right.svg';
import style from './TaskItem.module.less';

const EmptyComponent = defineComponent({
	render: () => (<i />),
});

interface Props {
	task: UITask;
	id: number;
	selected?: boolean;
	onClick?: (event: MouseEvent) => any;
	onDblClick?: (event: MouseEvent) => any;
	onPauseOrRemove?: () => any;
}

export const TaskItem: FunctionalComponent<Props> = (props) => {
	const { task } = props;
	const appStore = useAppStore();
	const settings = appStore.taskViewSettings;

	// #region 预先计算以减少下方计算量

	const outputDuration = computed(() => getOutputDuration(task));

	// #endregion

	// #region 参数

	const beforeBitrateFilter = (kbps: number) => {
		if (isNaN(kbps)) {
			return '读取中';
		} else if (kbps >= 10000) {
			return (kbps / 1000).toFixed(1) + ' Mbps';
		} else {
			return kbps + ' kbps';
		}
	};
	const durationBefore = computed(() => stringifyTimeValue(task.before.duration));
	const durationAfter = computed(() => stringifyTimeValue(outputDuration.value));
	const smpteBefore = computed(() => task.before.vresolution && task.before.vframerate ? `${task.before.vresolution.replace('<br />', '×')}@${task.before.vframerate}` : '-');
	const videoRateControlValue = computed(() => vGenerator.getRateControlParam(task.after.video).value);
	const audioRateControlValue = computed(() => aGenerator.getRateControlParam(task.after.audio).value);
	const videoRateControl = computed(() => (videoRateControlValue.value === '-' ? '' : `@${task.after.video.ratecontrol} ${videoRateControlValue.value}`));
	const audioRateControl = computed(() => (audioRateControlValue.value === '-' ? '' : `@${task.after.audio.ratecontrol} ${audioRateControlValue.value}`));
	const videoInputBitrate = computed(() => task.before.vbitrate > 0 ? `@${beforeBitrateFilter(task.before.vbitrate)}` : '');
	const audioInputBitrate = computed(() => task.before.abitrate > 0 ? `@${beforeBitrateFilter(task.before.abitrate)}` : '');

	// #endregion

	// #region 仪表盘

	const graphBitrateFilter = (kbps: number) => {
		if (kbps >= 10000) {
			return (kbps / 1000).toFixed(1) + ' M';
		} else {
			return (kbps / 1000).toFixed(2) + ' M';
		}
	};
	const graphBitrate = computed(() => graphBitrateFilter(task.dashboard_smooth.bitrate));
	const speedFilter = (value: number) => {
		if (value < 10) {
			return value.toFixed(2) + ' ×';
		} else {
			return value.toFixed(1) + ' ×';
		}
	};
	const graphSpeed = computed(() => speedFilter(task.dashboard_smooth.speed));
	const timeFilter = (value: number) => {
		let left = value;
		let hour = Math.floor(left / 3600); left -= hour * 3600;
		let minute = Math.floor(left / 60); left -= minute * 60;
		let second = left;
		if (hour) {
			return `${hour}:${minute.toString().padStart(2, '0')}:${second.toFixed(0).toString().padStart(2, '0')}`;
		} else if (minute) {
			return `${minute}:${second.toFixed(1).padStart(4, '0')}`;
		} else {
			return second.toFixed(2);
		}
	};
	const graphTime = computed(() => timeFilter(task.dashboard_smooth.time));
	const graphLeftTime = computed(() => {
		const totalDuration = outputDuration.value;
		const needTime = totalDuration / task.dashboard_smooth.speed;
		const remainTime = (totalDuration - task.dashboard_smooth.time) / totalDuration * needTime;	// 剩余进度比例 * 全进度耗时
		return timeFilter(remainTime);
	});
	const graphSizeFilter = (kb: number) => {
		if (kb >= 1000000) {
			return (kb / 1000000).toFixed(2) + ' GB';
		} else if (kb >= 100000) {
			return (kb / 1000).toFixed(0) + ' MB';
		} else if (kb >= 10000) {
			return (kb / 1000).toFixed(1) + ' MB';
		} else {
			return (kb / 1000).toFixed(2) + ' MB';
		}
	};
	const graphSize = computed(() => graphSizeFilter(task.dashboard_smooth.size));
	const transferSpeedFilter = (KBps: number) => {
		if (KBps >= 100000) {
			return (KBps / 1000).toFixed(0) + ' MB';
		} else if (KBps >= 10000) {
			return (KBps / 1000).toFixed(1) + ' MB';
		} else if (KBps >= 1000) {
			return (KBps / 1000).toFixed(2) + ' MB';
		} else {
			return KBps.toFixed(0) + ' KB';
		}
	};
	const graphTransferSpeed = computed(() => transferSpeedFilter(task.dashboard_smooth.transferSpeed));
	const graphTransferred = computed(() => graphSizeFilter(task.dashboard_smooth.transferred / 1000));

	// 圆环 style 部分
	// 计算方式：(log(数值) / log(底，即每增长多少倍数为一格) + 数值为 1 时偏移多少格) / 格数
	// 　　　或：(log(数值 / 想要以多少作为最低值) / log(底，即每增长多少倍数为一格)) / 格数
	const graphBitrateStyle = computed(() => {
		let value = Math.log(task.dashboard_smooth.bitrate / 62.5) / Math.log(8) / 4;		// 62.5K, 500K, 4M, 32M, 256M
		value = Math.min(Math.max(value, 0), 1);
		return `background: conic-gradient(#36D 0%, #36D ${value * 75}%, #DDD ${value * 75}%, #DDD 75%, transparent 75%)`;
	});
	const graphSpeedStyle = computed(() => {
		let value = Math.log(task.dashboard_smooth.speed / 0.04) / Math.log(5) / 6;			// 0.04, 0.2, 1, 5, 25, 125, 625
		value = Math.min(Math.max(value, 0), 1);
		return `background: conic-gradient(#36D 0%, #36D ${value * 75}%, #DDD ${value * 75}%, #DDD 75%, transparent 75%)`;
	});
	const graphTransferSpeedStyle = computed(() => {
		let value = Math.log(task.dashboard_smooth.transferSpeed / 62.5) / Math.log(10) / 4;	// 62.5K, 500K, 4M, 32M, 256M, 512M, 1024M
		value = Math.min(Math.max(value, 0), 1);
		return `background: conic-gradient(#36D 0%, #36D ${value * 75}%, #DDD ${value * 75}%, #DDD 75%, transparent 75%)`;
	});
	// 线性 style 部分
	const graphTimeStyle = computed(() => {
		const valueOdd = Math.min(task.dashboard_smooth.time % 2, 1);
		const valueEven = Math.max(task.dashboard_smooth.time % 2 - 1, 0);
		return `background: linear-gradient(to right, #DDD 0%, #DDD ${valueEven * 100}%, #36D ${valueEven * 100}%, #36D ${valueOdd * 100}%, #DDD ${valueOdd * 100}%, #DDD 100%, transparent 100%)`;
	});
	const graphFrameStyle = computed(() => {
		const valueOdd = Math.min(task.dashboard_smooth.frame % 2, 1);
		const valueEven = Math.max(task.dashboard_smooth.frame % 2 - 1, 0);
		return `background: linear-gradient(to right, #DDD 0%, #DDD ${valueEven * 100}%, #36D ${valueEven * 100}%, #36D ${valueOdd * 100}%, #DDD ${valueOdd * 100}%, #DDD 100%, transparent 100%)`;
	});

	const overallProgress = computed(() => task.transferStatus === 'normal' ? task.dashboard_smooth.progress : task.dashboard_smooth.transferred / task.transferProgressLog.total);
	// const overallProgress = { value: 0.99 };
	const overallProgressDescription = computed(() => task.transferStatus === 'normal' ? '转码进度' : '上传进度');

	// #endregion

	// #region 其他样式

	const showDashboard = computed(() => [TaskStatus.TASK_RUNNING, TaskStatus.TASK_PAUSED, TaskStatus.TASK_STOPPING].includes(task.status) || task.transferStatus !== TransferStatus.normal);
	const dashboardType = computed(() => showDashboard ? (task.transferStatus !== TransferStatus.normal ? 'transfer' : 'convert') : 'none');

	const taskNameWidth = computed(() => {
		let shrinkSpace = 80;
		shrinkSpace += [0, 13 + 96, 13 + 96 + 14 + 120 ][['none', 'input', 'all'].indexOf(settings.paramsVisibility.audio)];
		shrinkSpace += [0, 13 + 96, 13 + 96 + 14 + 120 ][['none', 'input', 'all'].indexOf(settings.paramsVisibility.video)];
		shrinkSpace += [0, 13 + 88, 13 + 88 + 14 + 88 ][['none', 'input', 'all'].indexOf(settings.paramsVisibility.smpte)];
		shrinkSpace += [0, 13 + 36, 13 + 36 + 14 + 36 ][['none', 'input', 'all'].indexOf(settings.paramsVisibility.format)];
		shrinkSpace += [0, 13 + 64, 13 + 64 + 14 + 64 ][['none', 'input', 'all'].indexOf(settings.paramsVisibility.duration)];
		if (showDashboard.value) {
			shrinkSpace = Math.max(shrinkSpace, 784);
		}
		return `max(calc(100% - ${shrinkSpace}px), 64px)`;
	});

	const deleteButtonBackgroundPositionX = computed(() => {
		switch (task.status) {
			case TaskStatus.TASK_STOPPED:
				return '0px';	// 删除按钮
			case TaskStatus.TASK_RUNNING:
				return '-100%';	// 暂停按钮
			case TaskStatus.TASK_PAUSED: case TaskStatus.TASK_STOPPING: case TaskStatus.TASK_FINISHING: case TaskStatus.TASK_FINISHED: case TaskStatus.TASK_ERROR:
				return '-200%';	// 重置按钮
		}
		return '';
	});

	// 整个任务项的高度，包括上下 margin
	const taskHeight = computed(() => {
		let height = 4;
		height += settings.showParams ? 24 : 0;
		height += showDashboard.value ? 72 : 0;
		height += settings.showCmd ? 64 : 0;
		height = Math.max(24, height);
		return height;
	});

	const taskBackgroundStyle = computed(() => {
		if (props.selected) {
			return {
				background: 'hsl(210, 100%, 90%)',
				border: 'hsl(210, 100%, 80%) 1px solid',
			};
		} else {
			return {};
		}
	});

	const taskBackgroundProgressStyle = computed(() => ({
		width: (task.transferStatus === 'normal' ? task.dashboard_smooth.progress : task.dashboard_smooth.transferred / task.transferProgressLog.total) * 100 + '%' }
	));

	// #endregion

	const cmdRef = ref<VNodeRef>(null);
	const cmdText = computed(() => settings.cmdDisplay === 'input' ? ['ffmpeg', ...task.paraArray].join(' ') : task.cmdData);
	// watch(() => task.cmdData, () => {
	// 	console.log('变化');
	// 	const elem = cmdRef.value as Element;
	// 	if (elem) {
	// 		const scrollBottom = elem?.scrollTop + elem.getBoundingClientRect().height;
	// 		if (elem.scrollHeight - scrollBottom < 1) {
	// 			console.log('到底');
	// 			setTimeout(() => {
	// 				elem.scrollTo(0, Number.MAX_SAFE_INTEGER);
	// 			}, 0);
	// 		}
	// 	}
	// });
	// console.log('props', props);

	// 监听窗口宽度变化
	// const windowWidth = ref(0);
	// const windowWidthListener = ref<() => void>(() => {
	// 	console.log('宽度变化', window.innerWidth);
	// 	windowWidth.value = window.innerWidth;
	// });
	// watch(() => windowWidthListener.value, () => {
	// 	console.log('ref 变化');
	// })

	const handleMouseEnter = (event: MouseEvent) => {
		if (task.status === TaskStatus.TASK_FINISHED) {
			Tooltip.show({
				text: `双击以${appStore.currentServer.entity.ip === 'localhost' ? '打开' : '下载'}输出文件`,
				position: {
					right: `calc(100vw - ${event.pageX}px)`,
					top: `${event.pageY}px`,
				},
			})
		}
	};

	const handleTaskDblClicked = (event: MouseEvent) => {
		const serverName = appStore.currentServer.data.name;
		const bridge = appStore.currentServer.entity;
		if (task.status === TaskStatus.TASK_FINISHED && task.transferStatus === TransferStatus.normal) {
			if (appStore.currentServer.entity.ip === 'localhost') {
				nodeBridge.openFile(`"${task.outputFile}"`);
			} else {
				const url = `http://${bridge.ip}:${bridge.port}/download/${task.outputFile}`;
				nodeBridge.ipcRenderer?.send('downloadFile', { url, serverName, taskId: props.id });
				appStore.downloadMap.set(url, { serverId: appStore.currentServer.data.id, taskId: props.id });
			}
			Tooltip.hide();
		}
	};

	return (
		<div class={style.taskWrapper1}>
			{/* <EmptyComponent
				onVnodeMounted={() => {
					debugger;
					window.addEventListener('resize', windowWidthListener.value)
				}}
				onVnodeUnmounted={() => {
					debugger;
					window.removeEventListener('resize', windowWidthListener.value)
				}}
			/> */}
			<div class={style.taskWrapper2}>
				<div class={style.task} style={{ height: `${taskHeight.value}px` }} onMouseenter={handleMouseEnter} onMouseleave={() => Tooltip.hide()} onDblclick={handleTaskDblClicked}>
					<div class={style.backgroundWhite} style={taskBackgroundStyle.value} />
					<div class={`${style.backgroundProgress} ${style.progressBlue}`} style={{ ...taskBackgroundProgressStyle.value, opacity: task.status === TaskStatus.TASK_INITIALIZING ? 1: 0}} />
					<div class={`${style.backgroundProgress} ${style.progressGreen}`} style={{ ...taskBackgroundProgressStyle.value, opacity: [TaskStatus.TASK_RUNNING, TaskStatus.TASK_FINISHING].includes(task.status) ? 1: 0}} />
					<div class={`${style.backgroundProgress} ${style.progressYellow}`} style={{ ...taskBackgroundProgressStyle.value, opacity: [TaskStatus.TASK_PAUSED, TaskStatus.TASK_STOPPING].includes(task.status) ? 1: 0}} />
					<div class={`${style.backgroundProgress} ${style.progressGray}`} style={{ ...taskBackgroundProgressStyle.value, opacity: [TaskStatus.TASK_FINISHED, TaskStatus.TASK_STOPPED].includes(task.status) ? 1: 0}} />
					<div class={`${style.backgroundProgress} ${style.progressRed}`} style={{ ...taskBackgroundProgressStyle.value, opacity: task.status === TaskStatus.TASK_ERROR ? 1: 0}} />
					<div class={style.previewIcon} style={{ bottom: settings.showCmd ? '66px' : undefined}}>
						<IconPreview />
					</div>
					<div
						class={style.taskName}
						style={{
							...(showDashboard.value ? {} : { maxHeight: '26px', '-webkit-line-clamp': 1 }),
							width: taskNameWidth.value,
							...(!showDashboard.value ? { fontSize: '16px' } : {}),	// 不显示 dashboard 时不允许文字放大
						}}
					>
						{task.fileBaseName ?? '读取中'}
					</div>
					{settings.showParams && (
						<div class={style.paraArea}>
							{/* 时间 */}
							<div class={style.divider}><div></div></div>
							<div class={style.durationBefore}>{durationBefore.value}</div>
							{settings.paramsVisibility.duration === 'all' && (
								<>
									<div class={style.durationTo}><IconRightArrow /></div>
									<div class={style.durationAfter}>{durationAfter.value}</div>
								</>
							)}
							{/* 容器 */}
							<div class={style.divider}><div></div></div>
							<div class={style.formatBefore}>{task.before.format}</div>
							{settings.paramsVisibility.format === 'all' && (
								<>
									<div class={style.formatTo}><IconRightArrow /></div>
									<div class={style.formatAfter}>{task.after.output.format}</div>
								</>
							)}
							{/* 分辨率码率 */}
							{settings.paramsVisibility.smpte !== 'none' && (
								<>
									<div class={style.divider}><div></div></div>
									<div class={style.smpteBefore}>{smpteBefore.value}</div>
									{settings.paramsVisibility.smpte === 'all' && (
										<>
											<div class={style.smpteTo}><IconRightArrow /></div>
											<div class={style.smpteAfter}>{task.after.video.resolution}@{task.after.video.framerate}</div>
										</>
									)}
								</>
							)}
							{/* 视频 */}
							{settings.paramsVisibility.video !== 'none' && (
								<>
									<div class={style.divider}><div></div></div>
									<div class={style.videoBefore}>{task.before.vcodec}{videoInputBitrate.value}</div>
									{settings.paramsVisibility.video === 'all' && (
										<>
											<div class={style.videoTo}><IconRightArrow /></div>
											<div class={style.videoAfter}>{task.after.video.vcodec}{videoRateControl.value}</div>
										</>
									)}
								</>
							)}
							{/* 音频 */}
							{settings.paramsVisibility.audio !== 'none' && (
								<>
									<div class={style.divider}><div></div></div>
									<div class={style.audioBefore}>{task.before.acodec}{audioInputBitrate.value}</div>
									{settings.paramsVisibility.audio === 'all' && (
										<>
											<div class={style.audioTo}><IconRightArrow /></div>
											<div class={style.audioAfter}>{task.after.audio.acodec}{audioRateControl.value}</div>
										</>
									)}
								</>
							)}
						</div>
					)}
					<Transition enterActiveClass={style['dashboardTrans-enter-active']} leaveActiveClass={style['dashboardTrans-leave-active']}>
						{showDashboard.value && (
							<div class={style.dashboardArea} style={{ top: `${(settings.showParams ? 1 : 0) * 24 + 2}px` }}>
								{dashboardType.value === 'convert' ? (
									<>
										<div class={style.linearGraphItems}>
											<div class={style.linearGraphItem}>
												<div class={style.line} style={graphTimeStyle.value}></div>
												<span class={style.data}>{ graphTime.value }</span>
												<span class={style.description}>时间</span>
											</div>
											<div class={style.linearGraphItem}>
												<div class={style.line} style={graphFrameStyle.value}></div>
												<span class={style.data}>{ task.dashboard_smooth.frame.toFixed(0) }</span>
												<span class={style.description}>帧</span>
											</div>
										</div>
										<div class={style.roundGraphItem}>
											<div class={style.ring} style={graphBitrateStyle.value}></div>
											<span class={style.data}>{ graphBitrate.value }</span>
											<span class={style.description}>码率</span>
										</div>
										<div class={style.roundGraphItem}>
											<div class={style.ring} style={graphSpeedStyle.value}></div>
											<span class={style.data}>{ graphSpeed.value }</span>
											<span class={style.description}>速度</span>
										</div>
										<div class={style.textItem}>
											<span class={style.data}>{ graphSize.value }</span>
											<span class={style.description}>输出大小</span>
										</div>
									</>
								) : (
									<>
										<div class={style.roundGraphItem}>
											<div class={style.ring} style={graphTransferSpeedStyle.value}></div>
											<span class={style.data}>{ graphTransferSpeed.value }</span>
											<span class={style.description}>传输速度</span>
										</div>
										<div class={style.textItem}>
											<span class={style.data}>{graphTransferred.value}</span>
											<span class={style.description}>传输总量</span>
										</div>
									</>
								)}
								<div class={style.textItem}>
									<span class={style.data}>{ graphLeftTime.value }</span>
									<span class={style.description}>预计剩余时间</span>
								</div>
								<div class={style.textItem}>
									<span class={`${style.data} ${style.dataLarge}`}>{ overallProgress.value === 1 ? '🆗' : `${(overallProgress.value * 100).toFixed(1)}%` }</span>
									<span class={style.description}>{ overallProgressDescription.value }</span>
								</div>
							</div>
						)}
					</Transition>
					{settings.showCmd && (
						<div class={style.cmdArea} style={{ top: `${(settings.showParams ? 1 : 0) * 24 + (showDashboard.value ? 1 : 0) * 72 + 2}px` }}>
							<div class={style.margin}>
								<div class={style.switch}>
									<button
										class={`${style.item} ${settings.cmdDisplay === 'input' ? style.itemSelected : ''}`}
										onMousedown={() => settings.cmdDisplay = 'input'}
									>
										输入
									</button>
									<button
										class={`${style.item} ${settings.cmdDisplay === 'output' ? style.itemSelected : ''}`}
										onMousedown={() => settings.cmdDisplay = 'output'}
									>
										输出
									</button>
								</div>
								<div class={style.code}>
									<textarea
										aria-label="任务命令行"
										readonly
										value={cmdText.value}
										ref={cmdRef}
									/>
								</div>
							</div>
						</div>
					)}
					<div class={style.vline} style={{ bottom: settings.showCmd ? '66px' : undefined}}><div></div></div>
					<button aria-label='重置或删除任务' class={style.button} style={{ bottom: settings.showCmd ? '64px' : undefined}} onClick={props.onPauseOrRemove}>
						<div style={{ backgroundPositionX: deleteButtonBackgroundPositionX.value }}></div>
					</button>
				</div>
			</div>
		</div>
	);
};

// export const TaskItem = defineComponent({
// 	setup() {
// 		return () => (
// 			<div class={style.red}>Helloo!!!</div>
// 		);
// 	}
// });

// export const TaskJtem = defineComponent({
// 	render() {
// 		return <div>Vue 3.0</div>;
// 	},
// });

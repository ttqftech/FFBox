import { computed, defineComponent, ref, Transition, TransitionGroup } from 'vue';
import { deleteNode } from '@common/params/filter';
import { NotificationLevel, Permission } from '@common/types';
import InputAutoSize from '@renderer/components/InputAutoSize/InputAutoSize.vue';
import { durationFixer, durationValidator } from '../../../../components/validatorAndFixer';
import { hwaccels, builtInDemuxers, allDemuxers, Demuxer, skipFrame } from '@common/params/formats'
import { getMenuItemByValue } from '@common/menu';
import { renderDetailParameters } from './utils';
import { useAppStore } from '@renderer/stores/appStore';
import { getLimitation } from '@renderer/logic/limitations';
import { addUploadTask } from '@renderer/logic/transferManager2';
import nodeBridge from '@renderer/bridges/nodeBridge';
import AutoSizeWrapper from '@renderer/components/AutoSizeWrapper/AutoSizeWrapper.vue';
import WaveGrid from '@renderer/components/WaveGrid/WaveGrid.vue';
import Popup from '@renderer/components/Popup/Popup';
import Button, { ButtonType } from '@renderer/components/Button/Button';
import BoxedDropdownInput from '@renderer/components/DropdownInput/BoxedDropdownInput.vue';
import BoxedNormalInput from '@renderer/components/NormalInput/BoxedNormalInput.vue';
import BoxedCutTimeInput from '@renderer/components/CutTimeInput/BoxedCutTimeInput.vue';
import BoxedSwitch from '@renderer/components/Switch/BoxedSwitch.vue';
import DropdownInput from '@renderer/components/DropdownInput/DropdownInput.vue';
import IconDelete from '@renderer/assets/×.svg?component';
import ImageFind from './find.svg?component';
import css from './InputView.module.less';

interface Props {}

const InputView = defineComponent((props: Props) => {
	const appStore = useAppStore();
	const editingIndex = ref(0);
	const centerDraggerPos = ref(50);
	const showDetailParams = ref(true);
	const draggingStatus = ref<{ count: number, fileCount: number }>();

	const inputParams = computed(() => appStore.globalParams.input);

	// 在一个输入文件都没有的情况下，应该编辑默认输入
	const editingInput = computed(() => inputParams.value.files[editingIndex.value]);

	const editingInputParams = computed(() => {
		const demuxerName = inputParams.value.files[editingIndex.value]?.demuxer;
		return demuxerName ? (getMenuItemByValue(allDemuxers, demuxerName) as any)?.extra as Demuxer : undefined;
	});

	// 往尾部新增一个空白项
	const extendedFiles = computed(() => (
		inputParams.value.files.concat({
			filePath: '',
			demuxer: '自动',
			begin: '',
			end: '',
			custom: '',
			hwaccel: '',
			skipFrame: '',
			readrate: '',
			detail: {},
		})
	));

	const combinedDemuxersList = computed(() => (
		[
			...builtInDemuxers,
			{ type: 'separator' },
			{ type: 'submenu', label: '全部可用复用器', subMenu: [
				{ type: 'normal', label: '从服务器获取', value: 'fetchFromService', icon: <span>🔄️</span>, onClick: () => {
					appStore.fetchAVOptions();
				} },
				...(allDemuxers.length ? [{ type: 'separator' }] : []),
				...allDemuxers,
			] },
		] as typeof builtInDemuxers
	));

	const listContainerStyle = computed(() => extendedFiles.value.length >= 11 ? "--itemHeight: 26px" : "--itemHeight: 34px")

	const handleCenterDraggerDragStart = (event: MouseEvent | TouchEvent) => {
		const draggerRect = (event.target as HTMLElement).getBoundingClientRect();
		const mainAreaRect = (event.target as HTMLElement).parentElement!.getBoundingClientRect();
		const inElementX = ((event as MouseEvent).pageX ?? (event as TouchEvent).touches[0].pageX) - draggerRect.x;	// 鼠标在元素内的 X
		// 添加鼠标事件捕获
		let handleMouseMove = (event: Partial<MouseEvent | TouchEvent>) => {
			const mouseX = (event as MouseEvent).pageX ?? (event as TouchEvent).touches[0].pageX;	// 鼠标在窗口内的 X
			let listPercent = (mouseX - inElementX + 8) / mainAreaRect.width;
			listPercent = Math.min(Math.max(listPercent, 0.2), 0.8);
			centerDraggerPos.value = listPercent * 100;
		}
		let handleMouseUp = () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('touchmove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
			window.removeEventListener('touchend', handleMouseUp);
		}
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('touchmove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('touchend', handleMouseUp);
	};

	const handleParamChange = (sName: string, value: any) => {
		// @ts-ignore
		inputParams.value.files[editingIndex.value][sName] = value;
		appStore.applyParameters();
	};
	const handleDetailChange = (sName: string, value: any) => {
		// @ts-ignore
		inputParams.value.files[editingIndex.value].detail[sName] = value;
		appStore.applyParameters();
	};
	const handleDetailApplyToAll = (index: number) => {
		const files = inputParams.value.files;
		for (let i = 0; i < files.length; i++) {
			files[i].begin = files[index].begin;
			files[i].end = files[index].end;
			files[i].hwaccel = files[index].hwaccel;
			files[i].skipFrame = files[index].skipFrame;
			files[i].readrate = files[index].readrate;
			files[i].custom = files[index].custom;
		}
	};

	const handleFileNameChange = (index: number, value: string) => {
		if (value === extendedFiles.value[index].filePath) {
			return;	// 没有修改
		}
		if (index === extendedFiles.value.length - 1) {
			if (value) {
				// 新增文件
				inputParams.value.files.push({
					filePath: value,
					demuxer: '自动',
					begin: '',
					end: '',
					custom: '',
					hwaccel: '',
					skipFrame: '',
					readrate: '',
					detail: {},
				});
				if (appStore.globalParams.filter.nodes.length) {
					const nodes = appStore.globalParams.filter.nodes;
					const maxNodeId = nodes.reduce((prev, curr) => curr.id > prev ? curr.id : prev, -1) ?? -1;
					const lastInputNode = nodes.find((node) => node.name === `in_${index - 1}`);
					nodes.push({
						name: `in_${index}`,
						id: maxNodeId + 1,
						x: lastInputNode?.x ?? -180,
						y: (lastInputNode?.y ?? -90) + 60,
						params: {},
					});
				}
			}
		} else {
			if (value) {
				// 修改文件
				inputParams.value.files[index].filePath = value;
			} else {
				// 删除文件
				inputParams.value.files.splice(index, 1);
			}
		}
		appStore.applyParameters();
	};
	const handleFileNameKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'ArrowUp' && editingIndex.value !== 0) {
			if (event.altKey) {
				handleFileMove(event as any, editingIndex.value, 'u');
			} else {
				editingIndex.value--;
			}
		} else if (event.key === 'ArrowDown' && editingIndex.value !== extendedFiles.value.length - 1) {
			if (event.altKey) {
				handleFileMove(event as any, editingIndex.value, 'd');
			} else {
				editingIndex.value++;
			}
		} else if (event.key === 'Delete' && event.altKey) {
			handleFileDelete(event as any, editingIndex.value);
			// @ts-ignore
			editingIndex.value = undefined;	// 不取消选择会触发奇怪的 bug，比如 InputAutoSize 会出现 resizeOvserver 已卸载、有 TransitionGroup 时一次性清空列表等等
		}
	};
	const handleFileDelete = (event: MouseEvent, index: number) => {
		event.stopPropagation();
		inputParams.value.files.splice(index, 1);
		if (appStore.globalParams.filter.nodes.length) {
			const nodes = appStore.globalParams.filter.nodes;
			const lines = appStore.globalParams.filter.lines;
			const node = nodes.find((node) => node.name === `in_${index}`);
			deleteNode(nodes, lines, node!);
		}
		appStore.applyParameters();
	};
	const handleFileMove = (event: MouseEvent, index: number, direction: 'u' | 'd') => {
		event.stopPropagation();
		if (direction === 'u' && index > 0) {
			const prevFile = inputParams.value.files[index - 1];
			inputParams.value.files[index - 1] = inputParams.value.files[index];
			inputParams.value.files[index] = prevFile;
			if (editingIndex.value === index) editingIndex.value--;
		} else if (direction === 'd' && index < inputParams.value.files.length - 1) {
			const nextFile = inputParams.value.files[index + 1];
			inputParams.value.files[index + 1] = inputParams.value.files[index];
			inputParams.value.files[index] = nextFile;
			if (editingIndex.value === index) editingIndex.value++;
		}
		appStore.applyParameters();
	};
	const handleDragEnter = (event: DragEvent) => {
		// event.preventDefault();
		// console.log('dragenter', event);
		if (draggingStatus.value) {
			draggingStatus.value.count++;
		} else {
			let fileCount = 0;
			for (const item of event.dataTransfer?.items || []) {
				if (item.kind === 'file') {
					fileCount++;
				} else if (item.kind === 'string') {
					fileCount = -1;	// 文本类需要 drop 时才能拿到数据
					break;
				}
			}
			draggingStatus.value = { count: 1, fileCount };
		}
	}
	const handleDragLeave = (event: DragEvent) => {
		if (draggingStatus.value) {
			if (draggingStatus.value.count <= 1) {
				draggingStatus.value = undefined;
			} else {
				draggingStatus.value.count--;
			}
		}
	}
	const handleDrop = async (event: DragEvent) => {
		event.preventDefault();
		draggingStatus.value = undefined;
		const urls = [];
		if (event.dataTransfer?.files?.length && appStore.currentServer) {
			if (appStore.currentServer.entity.ip === 'localhost') {
				for (const file of event.dataTransfer?.files) {
					const filePath = nodeBridge.getPathForFile(file);
					filePath && urls.push(filePath);
				}
			} else {
				const firstTaskId = [...appStore.selectedTask][0];
				if (!isFinite(firstTaskId)) return;

				for (const file of event.dataTransfer?.files) {
					const limitedFileSizeGB = getLimitation('maxUploadSizeGB');
					if (file.size > limitedFileSizeGB * 1000 * 1000 * 1000) {
						Popup({
							message: `${file.name} 文件大小超过 ${limitedFileSizeGB} GB，暂不支持上传操作`,
							level: 2,
						});
						continue;
					}
					const inputName = `[uploading] ${file.name}`
					const uploadFile = await addUploadTask(appStore.currentServer as any, file, firstTaskId, file.name, inputName);
					appStore.currentServer.data.uploadFiles.push(uploadFile);
					urls.push(inputName);
				}
			}
		} else if (event.dataTransfer?.items) {
			const textUrls = event.dataTransfer?.getData('text/plain').replaceAll('\r\n', '\n').split('\n');
			urls.push(...textUrls.filter((url) => url.length));
		}

		for (const url of urls) {
			if (appStore.globalParams.filter.nodes.length) {
				const nodes = appStore.globalParams.filter.nodes;
				const maxNodeId = nodes.reduce((prev, curr) => curr.id > prev ? curr.id : prev, -1) ?? -1;
				const lastInputNode = nodes.find((node) => node.name === `in_${inputParams.value.files.length - 1}`);
				nodes.push({
					name: `in_${inputParams.value.files.length}`,
					id: maxNodeId + 1,
					x: lastInputNode?.x ?? -180,
					y: (lastInputNode?.y ?? -90) + 60,
					params: {},
				});
			}
			inputParams.value.files.push({
				filePath: url,
				demuxer: '自动',
				begin: '',
				end: '',
				custom: '',
				hwaccel: '',
				skipFrame: '',
				readrate: '',
				detail: {},
			});
		}
		appStore.applyParameters();
	};	

	return () => (
		<div class={css.container}>
			<div class={css.left} style={{ width: `${centerDraggerPos.value}%`}}>
				<div class={css.title}>输入列表</div>
				<div
					class={css.listContainer}
					style={listContainerStyle.value}
					onDrop={handleDrop}
					onDragenter={handleDragEnter}
					onDragover={(e) => e.preventDefault()}
					onDragleave={handleDragLeave}
				>
					<TransitionGroup
						moveClass={css.listItemMove}
						enterActiveClass={css.listItemMove}
						leaveActiveClass={`${css.listItemMove} ${css.listItemLeaveActive}`}
						enterFromClass={css.listItemFromTo}
						leaveToClass={css.listItemFromTo}
					>
						{extendedFiles.value.map((file, index) => (
							<div key={file.filePath} class={`${css.listItem} ${editingIndex.value === index ? css.listItemSelected : ''}`} onClick={() => editingIndex.value = index}>
								{file.filePath !== '' && (
									<DropdownInput class={css.dropdownInput} list={combinedDemuxersList.value} text={file.demuxer} onChange={(value: string) => handleParamChange('demuxer', value)} />
								)}
								{editingIndex.value === index && appStore.currentServer?.entity.permissions.includes(Permission.FileSystem) ? (
									<InputAutoSize
										class={css.inputAutoSize}
										value={file.filePath}
										focusOnMounted={false}
										onBlur={(value) => handleFileNameChange(index, value)}
										onPressEnter={(value) => handleFileNameChange(index, value)}
										onKeyDown={handleFileNameKeyDown}
									/>
								) : (
									<span
										style={file.filePath !== '' ? {} : { opacity: 0.5 }}
									>
										{file.filePath || '【拖入】或【点击填入】新文件/路径'}
									</span>
								)}
								{file.filePath !== '' && (
									<div class={css.operations}>
										<button class={css.delete} aria-label="删除输入文件" onClick={(event) => handleFileDelete(event, index)}>
											<IconDelete />
										</button>
										<button class={css.delete} aria-label="向前移动文件" onClick={(event) => handleFileMove(event, index, 'u')}>
											⬆️
										</button>
										<button class={css.delete} aria-label="向后移动文件" onClick={(event) => handleFileMove(event, index, 'd')}>
											⬇️
										</button>
									</div>
								)}
							</div>
						))}
					</TransitionGroup>
					<Transition leaveFromClass={css.dragFrameLeaveFrom} leaveActiveClass={css.dragFrameLeaveActive} leaveToClass={css.dragFrameLeaveTo}>
						{draggingStatus.value ? (
							<WaveGrid class={css.dragFrame}>
								<div class={css.inner}>
									<p style={{ fontSize: '2em' }}>{Math.abs(draggingStatus.value.fileCount)}</p>
									<p>{draggingStatus.value.fileCount === -1 ? '堆文本组成的多' : ''}个路径</p>
								</div>
							</WaveGrid>
						) : null}
					</Transition>
				</div>
			</div>
			<div class={css.dragger} style={{ left: `${centerDraggerPos.value}%`}} onMousedown={handleCenterDraggerDragStart} onTouchstart={handleCenterDraggerDragStart} />
			<div class={css.right} style={{ width: `${100 - centerDraggerPos.value}%`}}>
				{editingInput.value ? (<>
					<BoxedDropdownInput title="硬件解码" text={editingInput.value.hwaccel} placeholder="不使用" list={hwaccels} onChange={(value) => handleParamChange('hwaccel', value)} />
					<BoxedDropdownInput title="跳过帧" text={editingInput.value.skipFrame} placeholder="默认" list={skipFrame} onChange={(value) => handleParamChange('skipFrame', value)} />
					<BoxedCutTimeInput title="切割时间" value={[editingInput.value.begin, editingInput.value.end]} onChange={(value) => {
						inputParams.value.files[editingIndex.value].begin = value[0];
						inputParams.value.files[editingIndex.value].end = value[1];
						appStore.applyParameters();
					}} onButtonClick={() => appStore.openCutOperator('input')} />
					<BoxedNormalInput title="限制解码倍速" value={editingInput.value.readrate} placeholder="不限制" onChange={(value) => handleParamChange('readrate', value)} />
					<BoxedNormalInput title="自定义参数" value={editingInput.value.custom} onChange={(value) => handleParamChange('custom', value)} long={true} />
					{(editingInputParams.value?.parameters || []).filter((parameter) => parameter.optional).length && (
						<AutoSizeWrapper class={css.detailParameters} style={({ height }) => ({ height: showDetailParams.value ? `${height}px` : '42px' })} useResizeObserver={true}>
							<div class={css.bar}>
								<Button type={ButtonType.NoBg} onClick={() => showDetailParams.value = !showDetailParams.value}>点击{showDetailParams.value ? '隐藏' : '显示'}·详细参数</Button>
							</div>
							{renderDetailParameters(editingInputParams.value?.parameters || [], inputParams.value.files[editingIndex.value].detail!, (parameter, value) => handleDetailChange(parameter.parameter, value), true)}
							<div class={css.bar}>
								<Button type={ButtonType.NoBg} onClick={() => showDetailParams.value = !showDetailParams.value}>点击{showDetailParams.value ? '隐藏' : '显示'}·详细参数</Button>
							</div>
						</AutoSizeWrapper>
					) || null}
					<div style={{ margin: '12px' }}>
						<Button onClick={() => handleDetailApplyToAll(editingIndex.value)}>
							应用参数到全部输入
						</Button>
					</div>
				</>) : (
					inputParams.value.files.length ? (
						<div>
							<p style={{ fontSize: '3em', margin: '0 0 0.5em' }}>👈</p>
							<p>请选择一个输入文件</p>
						</div>
					) : (
						<div>
							<ImageFind width={128} />
							<p>巧妇难为无米之炊～</p>
							<p>请先在左边的列表【拖入】或【填入】至少 1 个路径</p>
						</div>
					)
				)}
			</div>
		</div>
	);
}, {
	props: [],
});

export default InputView;
<template>
	<div id="app">
		<content-wrapper></content-wrapper>
		<floating-content></floating-content>
	</div>
</template>

<script>
const version = '2.0'
const buildNumber = 3

import ContentWrapper from './App/ContentWrapper'
import FloatingContent from './App/FloatingContent'
import Vue from 'vue'
import Vuex from 'vuex'
const ElectronStore = window.require('electron-store')
const electronStore = new ElectronStore()
const ipc = window.require('electron').ipcRenderer
const remote = window.require('electron').remote
const currentWindow = remote.getCurrentWindow();
const maxThreads = 2

import { FFmpeg } from '@/App/FFmpegInvoke'
import { generator as fGenerator } from '@/App/Codecs/formats'
import { generator as vGenerator } from '@/App/Codecs/vcodecs'
import { generator as aGenerator } from '@/App/Codecs/acodecs'
import commonfunc from '@/App/commonfunc'

const TASK_DELETED = -2;
const TASK_PENDING = -1;
const TASK_STOPPED = 0;
const TASK_RUNNING = 1;
const TASK_PAUSED = 2;
const TASK_STOPPING = 3;
const TASK_FINISHING = 4;
const TASK_FINISHED = 5;
const TASK_ERROR = 6;

Vue.use(Vuex)

var saveAllParaTimer

const store = new Vuex.Store({
	state: {
		version, buildNumber,
		// 是否显示通知中心
		showInfoCenter: false,
		// 所有未删除通知
		infos: [],
		// 当前在屏幕上显示的气泡
		popups: [],
		// Tooltip
		showTooltip: false,
		tooltipText: '',
		tooltipPosition: {
		},
		// 当前在屏幕上显示的弹窗
		msgboxs: [],
		// 组合列表
		showCombomenu: false,
		comboList: [],
		comboDefault: '',
		comboDescription: '暂无描述',
		comboPosition: {
			left: '0px',
			top: '0px',
			height: '0px'
		},
		comboSelectionHandler: null,
		// 左边栏选择的项目
		listselected: 0,
		paraselected: 1,
		// 拖动器位置，数值越高越往下
		draggerPos: 60,
		// 所有任务
		tasks: new Map(),
		// 任务的显示顺序
		taskOrder: [],
		// 选中的任务
		taskSelection: new Set(),
		// 所有控件需要截获的鼠标操作都可以加到这些列表里捕获
		onPointerEvents: {
			onMouseDown: [],
			onMouseMove: [],
			onMouseUp: []
		},
		// 全局参数
		globalParams: {
			format: {
				format: 'MP4',
				moveflags: false,
				hwaccel: '不使用'
			},
			video: {
				vcodec: 'HEVC',
				vencoder: '默认',
				resolution: '不改变',
				framerate: '不改变',
				detail: {
					preset: 0.5,
					tune: '默认',
					profile: '自动',
					level: '自动',
					quality: 'balanced',
					ratecontrol: 'CRF',
					crf: 0.5,
					qp: 0.5,
					q: 0.5,
					vbitrate: 0.5,
					pix_fmt: '自动'	
				}
			},
			audio: {
				enable: 1,
				acodec: '不重新编码',
				aencoder: '默认',
				vol: 0.5,
				detail: {
					ratecontrol: 'Q',
					abitrate: 0.5,
					q: 0.5,
					sample_fmt: '自动',
					channel_layout: '自动'
				}
			}
		},
		// 全局命令行接收到的信息
		cmdData: '',
		// FFmpeg 是否已安装以及版本
		FFmpegVersion: '',
		// 是否正在执行任务
		workingStatus: 0,			// -1：暂停　0：停止　1：运行
		progress: 0.0,
		overallProgressTimerID: NaN
	},
	getters: {
		// 进度条按 taskArray 里的所有任务之和算（未运行、运行中、暂停、已完成）
		// queueTaskCount：运行中、暂停、正在停止
		// workingTaskCount：运行中
		workingTaskCount (state) {
			var count = 0
			for (const task of state.tasks.values()) {
				if (task.status == TASK_RUNNING) {
					count++
				}
			}
			// console.log(`workingTaskCount: ${count}`)
			return count
		},
		queueTaskCount (state) {
			var count = 0
			for (const task of state.tasks.values()) {
				if (task.status == TASK_RUNNING || task.status == TASK_PAUSED || task.status == TASK_STOPPING || task.status == TASK_FINISHING) {
					count++
				}
			}
			// console.log(`queueTaskCount: ${count}`)
			return count
		}
	},
	mutations: {
		// 点击开始/暂停按钮
		startNpause (state) {
			if ((state.workingStatus == 0 && state.taskOrder.length > 0) || state.workingStatus == -1) {		// 开始任务
				state.workingStatus = 1
				this.commit('taskArrange')
			} else if (state.workingStatus == 1) {
				state.workingStatus = -1
				this.commit('taskArrange')
			}
		},
		pauseNremove (state, id) {
			var task = state.tasks.get(id)
			switch (task.status) {
				case TASK_STOPPED:		// 未运行，点击直接删除任务
					this.commit('taskDelete', id)
					break;
				case TASK_RUNNING:		// 正在运行，暂停
					this.commit('taskPause', id)
					break;
				case TASK_PAUSED:		// 已经暂停，点击重置任务
				case TASK_FINISHED:		// 运行完成，点击重置任务
				case TASK_STOPPING:		// 正在停止，点击强制重置（taskReset 自动判断）
				case TASK_ERROR:		// 任务出错，点击重置任务
					this.commit('taskReset', id)
					break;
				case TASK_PENDING:		// 未定义行为
					break;
			}
		},
		// workingStatus == 0 状态下调用：把所有任务暂停；workingStatus == 1/-1 状态下调用，按最大运行数运行队列任务
		taskArrange (state, startFrom = 0) {
			if (state.workingStatus == 1) {		// 开始安排任务
				// if (getters.queueTaskNumber == 0) {					// 队列为空，开始进行第一个任务。该功能反函数对应于 overallProgressTimer();
				// }
				var started_atLeast = false
				while (this.getters.workingTaskCount < maxThreads) {
					var started_thisTime = false;
					for (let index = startFrom; index < state.taskOrder.length; index++) {
						let id = state.taskOrder[index]
						let task = state.tasks.get(id)
						if (task.status == TASK_STOPPED) {			// 从还没开始干活的抽一个出来干
							this.commit('taskStart', id)
							started_thisTime = true
							started_atLeast = true
							break
						} else if (task.status == TASK_PAUSED) {	// 从暂停开始干活的抽一个出来干
							this.commit('taskResume', id)
							started_thisTime = true
							started_atLeast = true
							break
						}
					}
					if (!started_thisTime) {			// 遍历完了，没有可以继续开始的任务，停止安排新工作
						break;
					}
				}
				state.tasks = new Map(state.tasks)		// 刷新所有单个任务
				if (this.getters.queueTaskCount == 0) {			// 遍历完了也没有开始新任务
					state.workingStatus = 0
				} else {						// 队列中有新增任务了
					clearInterval(state.overallProgressTimerID)
					state.overallProgressTimerID = setInterval(() => {
						this.commit('overallProgressTimer')
					}, 80);
				}
			} else {							// 暂停所有任务
				for (const id of state.taskOrder) {
					let task = state.tasks.get(id)
					if (task.status == TASK_RUNNING) {
						this.commit('taskPause', id)
					}
				}
				this.commit('overallProgressTimer')
			}
			this.commit('overallProgressTimer')
			state.tasks = new Map(state.tasks)	// 刷新所有单个任务
		},
		// 【TASK_STOPPED / TASK_ERROR】 => 【TASK_RUNNING】 => 【TASK_FINISHED / TASK_ERROR】
		taskStart (state, id) {
			var task = state.tasks.get(id)
			task.status = TASK_RUNNING
			task.taskProgress = []
			task.taskProgress_size = []
			var newFFmpeg = new FFmpeg(0, getFFmpegParaArray(task.filepath, task.after.format, task.after.video, task.after.audio))
			newFFmpeg.on('finished', () => {
				task.status = TASK_FINISHED
				task.progress_smooth.progress = 1
				this.commit('pushMsg', {
					msg: '文件【' + task.filename + '】已转码完成',
					level: 1
				})
				clearInterval(task.dashboardTimer)
				state.tasks = new Map(state.tasks)		// 刷新所有单个任务
				var pos = state.taskOrder.findIndex(value => {	// 开始下一个任务，但是不要开始上一个任务
					return value == id
				})
				this.commit('taskArrange', pos)
			})
			newFFmpeg.on('status', (status) => {
				task.taskProgress.push([new Date().getTime() / 1000, status.frame, status.time])
				if (status.size != task.taskProgress_size.slice(-1)) {
					task.taskProgress_size.push([new Date().getTime() / 1000, status.size])
				}
			})
			newFFmpeg.on('data', (data) => {
				this.commit('cmdDataArrived', { id, msg: data })
			})
			newFFmpeg.on('error', (error) => {
				task.errorInfo.push(error.description)
			})
			newFFmpeg.on('warning', (warning) => {
				this.commit('pushMsg', {
					msg: task.filename + '：' + warning.description,
					level: 2
				})
			})
			newFFmpeg.on('critical', (errors) => {
				task.status = TASK_ERROR
				this.commit('pushMsg', {
					msg: '文件【' + task.filename + '】转码失败。' + [...errors].join('') + '请到左侧的指令面板查看详细原因。',
					level: 3
				})
				clearInterval(task.dashboardTimer)
				if (task.progress_smooth.progress == 0) {
					task.progress_smooth.progress = 1
				}
				state.tasks = new Map(state.tasks)		// 刷新所有单个任务
				this.commit('taskArrange')
			})
			task.taskProgress_size.push([new Date().getTime() / 1000, 0])
			task.taskProgress.push([new Date().getTime() / 1000, 0, 0])
			task.FFmpeg = newFFmpeg
			task.dashboardTimer = setInterval(() => {
				this.commit('dashboardTimer', id)
			}, 40);
			state.tasks = new Map(state.tasks)		// 刷新所有单个任务
		},
		// 【TASK_RUNNING】 => 【TASK_PAUSED】
		taskPause (state, id) {
			var task = state.tasks.get(id)
			task.status = TASK_PAUSED
			task.FFmpeg.pause()
			clearInterval(task.dashboardTimer)
			task.lastPaused = new Date().getTime() / 1000
			state.tasks = new Map(state.tasks)		// 刷新所有单个任务
		},
		// 【TASK_PAUSED】 => 【TASK_RUNNING】
		taskResume (state, id) {
			var task = state.tasks.get(id)
			task.status = TASK_RUNNING
			var nowSysTime = new Date().getTime() / 1000
			for (const item of task.taskProgress) {
				item[0] += nowSysTime - task.lastPaused
			}
			for (const item of task.taskProgress_size) {
				item[0] += nowSysTime - task.lastPaused
			}
			task.dashboardTimer = setInterval(() => {
				this.commit('dashboardTimer', id)
			}, 40);
			task.FFmpeg.resume()
			state.tasks = new Map(state.tasks)		// 刷新所有单个任务
		},
		// 【TASK_PAUSED / TASK_STOPPING / TASK_FINISHED】 => 【TASK_STOPPED】
		taskReset (state, id) {
			var task = state.tasks.get(id)
			// if 语句两个分支的代码重合度很高，区分的原因是因为暂停状态下重置是异步的
			if (task.status == TASK_PAUSED) {				// 暂停状态下重置
				task.status = TASK_STOPPING
				clearInterval(task.dashboardTimer)
				task.FFmpeg.exit(() => {
					task.status = TASK_STOPPED
					task.progress_smooth.progress = 0
					task.FFmpeg = null
					state.tasks = new Map(state.tasks)		// 刷新所有单个任务
					this.commit('overallProgressTimer')
				})
			} else if (task.status == TASK_STOPPING) {		// 正在停止状态下强制重置
				task.status = TASK_STOPPED
				clearInterval(task.dashboardTimer)
				task.FFmpeg.forceKill(() => {
					task.progress_smooth.progress = 0
					task.FFmpeg = null
					state.tasks = new Map(state.tasks)		// 刷新所有单个任务
					this.commit('overallProgressTimer')
				})
			} else if (task.status == TASK_FINISHED || task.status == TASK_ERROR) {		// 完成状态下重置
				task.status = TASK_STOPPED
				task.progress_smooth.progress = 0
				state.tasks = new Map(state.tasks)		// 刷新所有单个任务
				this.commit('overallProgressTimer')
			}
		},
		// 【TASK_STOPPED / TASK_FINISHED / TASK_ERROR】 => 【TASK_DELETED】
		taskDelete (state, id) {
			var task = state.tasks.get(id)
			task.status = TASK_DELETED
			state.taskOrder.splice(state.taskOrder.indexOf(id), 1)
			state.tasks = new Map(state.tasks)		// 刷新所有单个任务
			this.commit('overallProgressTimer')
		},
		dashboardTimer (state, id) {
			var task = state.tasks.get(id)
			var index = task.taskProgress.length - 1;			// 上标 = 长度 - 1
			var avgTotal = 6, avgCount = 0;						// avgTotal 为权重值，每循环一次 - 1；avgCount 每循环一次加一次权重
			var deltaSysTime = 0, deltaFrame = 0, deltaTime = 0
			while (index > 1 && task.taskProgress.length - index < 6) {													// 数据量按最大 6 条算，忽略第 1 条
				deltaSysTime += (task.taskProgress[index][0] - task.taskProgress[index - 1][0]) * avgTotal;				// x 轴
				deltaFrame += (task.taskProgress[index][1] - task.taskProgress[index - 1][1]) * avgTotal;					// y 轴
				deltaTime += (task.taskProgress[index][2] - task.taskProgress[index - 1][2]) * avgTotal;					// y 轴
				avgCount += avgTotal;
				avgTotal--;
				index--;
			}
			deltaSysTime /= avgCount; deltaFrame /= avgCount; deltaTime /= avgCount;							// 取平均
			index = task.taskProgress.length - 1			// 上标 = 长度 - 1
			var frameK = (deltaFrame / deltaSysTime); var frameB = task.taskProgress[index][1] - frameK * task.taskProgress[index][0];		// b = y1 - x1 * k;
			var timeK = (deltaTime / deltaSysTime); var timeB = task.taskProgress[index][2] - timeK * task.taskProgress[index][0];

			// size 专属处理区域
			var index = task.taskProgress_size.length - 1;	// 上标 = 长度 - 1
			var avgTotal = 3, avgCount = 0;					// avgTotal 为权重值，每循环一次 - 1；avgCount 每循环一次加一次权重
			var deltaSysTime = 0, deltaSize = 0;
			while (index > 0 && task.taskProgress_size.length - index < 3) {												// 数据量按最大 3 条算，无需忽略第 1 条
				deltaSysTime += (task.taskProgress_size[index][0] - task.taskProgress_size[index - 1][0]) * avgTotal;		// x 轴
				deltaSize += (task.taskProgress_size[index][1] - task.taskProgress_size[index - 1][1]) * avgTotal;		// y 轴
				avgCount += avgTotal;
				avgTotal--;
				index--;
			}
			deltaSysTime /= avgCount; deltaSize /= avgCount;	// 取平均
			index = task.taskProgress_size.length - 1;		// 上标 = 长度 - 1
			var sizeK = (deltaSize / deltaSysTime); var sizeB = task.taskProgress_size[index][1] - sizeK * task.taskProgress_size[index][0];

			var sysTime = new Date().getTime() / 1000;
			var currentFrame = frameK * sysTime + frameB;
			var currentTime = timeK * sysTime + timeB;		// 单位：s
			var currentSize = sizeK * sysTime + sizeB;		// 单位：kB
			// console.log("frameK: " + frameK + ", timeK: " + timeK + ", sizeK: " + sizeK);
			// console.log("currentFrame: " + currentFrame + ", currentTime: " + currentTime + ", currentSize: " + currentSize);

			// 界面显示内容：码率、速度、时间、帧
			// 计算方法：码率：Δ大小/Δ时间　速度：（带视频：Δ帧/视频帧速/Δ系统时间　纯音频：Δ时间/Δ系统时间（秒））　时间、帧：平滑
			if (task.before.duration != -1) {
				var progress = currentTime / task.before.duration
				if (isNaN(progress) || progress == Infinity) {
					task.progress.progress = 0
				} else {
					task.progress.progress = progress
				}
			} else {
				task.progress.progress = 0.5;
			}
			if (task.progress.progress < 0.995) {				// 进度满了就别更新了
				task.progress.bitrate = (sizeK / timeK) * 8;
				if (task.before.vframerate != "-") {				// 可以读出帧速，用帧速算更准确
					task.progress.speed = frameK / task.before.vframerate;
				} else {
					task.progress.speed = 0;
				}
				task.progress.time = currentTime;
				task.progress.frame = currentFrame;

				// 平滑处理
				task.progress_smooth.progress = task.progress_smooth.progress * 0.7 + task.progress.progress * 0.3;
				task.progress_smooth.bitrate  = task.progress_smooth.bitrate * 0.9 + task.progress.bitrate * 0.1;
				task.progress_smooth.speed    = task.progress_smooth.speed * 0.6 + task.progress.speed * 0.4;
				task.progress_smooth.time     = task.progress_smooth.time * 0.7 + task.progress.time * 0.3;
				task.progress_smooth.frame    = task.progress_smooth.frame * 0.7 + task.progress.frame * 0.3;
				if (isNaN(task.progress_smooth.bitrate) || task.progress_smooth.bitrate == Infinity) {task.progress_smooth.bitrate = 0;} 
				if (isNaN(task.progress_smooth.speed)) {task.progress_smooth.speed = 0;} 
				if (isNaN(task.progress_smooth.time)) {task.progress_smooth.time = 0;} 
				if (isNaN(task.progress_smooth.frame)) {task.progress_smooth.frame = 0;} 
			} else {
				task.progress.progress = 1;
			}
			task.progress_smooth = JSON.parse(JSON.stringify(task.progress_smooth))
			state.taskOrder = [...state.taskOrder]			// 刷新 TasksView 的 taskList
		},
		overallProgressTimer (state) {
			if (this.getters.queueTaskCount > 0) {
				var totalTime = 0.000001;
				var totalProcessedTime = 0;
				for (const id of state.taskOrder) {
					var task = state.tasks.get(id)
					totalTime += task.before.duration;
					totalProcessedTime += task.progress_smooth.progress * task.before.duration;
				}
				var progress = totalProcessedTime / totalTime;
				state.progress = progress
				if (this.getters.workingTaskCount > 0) {
					currentWindow.setProgressBar(parseFloat(progress * 0.99 + 0.01), {mode: "normal"});
				} else {
					state.workingStatus = -1
					currentWindow.setProgressBar(parseFloat(progress * 0.99 + 0.01), {mode: "paused"});
					clearInterval(state.overallProgressTimerID);
				}
			} else {			// 任务全部结束
				if (state.workingStatus == 1) {
					if (!currentWindow.isVisible()) {
						currentWindow.flashFrame(true);
					}
					clearInterval(state.overallProgressTimerID);
				}
				state.workingStatus = 0
				currentWindow.setProgressBar(0, {mode: "none"});
				clearInterval(state.overallProgressTimerID);
			}
		},
		// 切换显示/不显示通知中心
		showInfoCenter_update (state, value) {
			state.showInfoCenter = value
		},
		// 发布消息（args：msg, level）
		pushMsg (state, args) {
			let id = Symbol()
			state.infos.push({
				msg: args.msg, level: args.level, time: + new Date(), id
			})
			state.popups.push({
				msg: args.msg, level: args.level, id
			})
		},
		// 仅弹出气泡，不记录消息
		popup (state, args) {
			state.popups.push({
				msg: args.msg, level: args.level, id: Symbol()
			})
		},
		// 删除第 index 条消息
		deleteMsg (state, index) {
			state.infos.splice(index, 1)
		},
		// 删除 popup 元素
		popupDisappear (state, id) {
			let index = state.popups.find((value) => {
				if (id == value.id) {
					return true
				}
			})
			state.popups.splice(index, 1)
		},
		// 显示 Tooltip（args：text, position）
		showTooltip (state, args) {
			if (args.text == '') {
				return
			}
			state.showTooltip = true
			state.tooltipText = args.text
			state.tooltipPosition = args.position
		},
		// 清除 Tooltip
		clearTooltip (state) {
			state.showTooltip = false
		},
		// 发布弹窗（args：title, content, onOK, onCancel）
		msgbox (state, args) {
			let id = Symbol()
			state.msgboxs.push({
				title: args.title, content: args.content, onOK: args.onOK, onCancel: args.onCancel, id
			})
		},
		// 删除弹窗
		msgboxDisappear (state, id) {
			let index = state.msgboxs.findIndex((value) => {
				if (id == value.id) {
					return true
				}
			})
			state.msgboxs.splice(index, 1)
		},
		// 弹出组合框（args：list, default, position, handler）
		showCombomenu (state, args) {
			state.showCombomenu = true
			state.comboList = args.list
			state.comboDefault = args.default
			state.comboPosition = args.position
			state.comboSelectionHandler = args.handler
		},
		// 关闭组合框
		combomenuDisappear (state) {
			state.showCombomenu = false
		},
		// 更改左侧边栏选择的项目，其中（0~1）更改 list，（2~8）更改 para
		listNparaSelect (state, value) {
			if (value < 2) {
				state.listselected = value
			} else {
				state.paraselected = value - 2
			}
		},
		// 处理所有控件需要截获的鼠标操作添加操作（args：type("mousedown"|"mousemove"|"mouseup"), id, func）
		addPointerEvents (state, args) {
			if (typeof args.func != "function") {
				return
			}
			switch (args.type) {
				case "mousedown":
					state.onPointerEvents.onMouseDown.push({func: args.func, id: args.id})
					break;
				case "mousemove":
					state.onPointerEvents.onMouseMove.push({func: args.func, id: args.id})
					break;
				case "mouseup":
					state.onPointerEvents.onMouseUp.push({func: args.func, id: args.id})
					break;
			}
		},
		removePointerEvents (state, args) {
			var iterator 
			switch (args.type) {
				case "mousedown":
					iterator = state.onPointerEvents.onMouseDown
					break;
				case "mousemove":
					iterator = state.onPointerEvents.onMouseMove
					break;
				case "mouseup":
					iterator = state.onPointerEvents.onMouseUp
					break;
			}
			var index = iterator.findIndex((value) => {
				if (value.id == args.id) {
					return true
				}
			})
			if (index != -1) {
				iterator.splice(index, 1)
			}
		},
		// 拖动参数盒的横杠
		dragParabox (state, value) {
			state.draggerPos = value
		},
		// 修改参数，保存到本地磁盘（args：type (format | video | videoDetail | audio), key, value）
		changePara (state, args) {
			switch (args.type) {
				case 'format':
					state.globalParams.format[args.key] = args.value
					break;
				case 'video':
					state.globalParams.video[args.key] = args.value
					break;
				case 'videoDetail':
					state.globalParams.video.detail[args.key] = args.value
					break;
				case 'audio':
					state.globalParams.audio[args.key] = args.value
					break;
				case 'audioDetail':
					state.globalParams.audio.detail[args.key] = args.value
					break;
			}
			// 更改到一些不匹配的值后会导致 getFFmpegParaArray 出错，但是修正代码就在后面，因此仅需忽略它，让它继续运行下去，不要急着更新
			Vue.nextTick(() => {
				state.globalParams.paraArray = getFFmpegParaArray('[输入文件名]', state.globalParams.format, state.globalParams.video, state.globalParams.audio)
				state.globalParams = JSON.parse(JSON.stringify(state.globalParams))

				for (const id of state.taskSelection) {
					var task = state.tasks.get(id)
					task.after = JSON.parse(JSON.stringify(state.globalParams))
					task.paraArray = getFFmpegParaArray(task.filepath, task.after.format, task.after.video, task.after.audio, true)
					task.computedAfter = {
						vrate: vGenerator.getRateControlParam(task.after.video),
						arate: aGenerator.getRateControlParam(task.after.audio)
					}
				}

				// 刷新所有单个任务
				state.tasks = new Map(state.tasks)	// 更新整个 tasks，因为 TasksView -> computed -> taskList -> this.$store.state.tasks.get(id) 仅监听到 tasks 这层，无法获知取出的单个 task 的变化
				// this.commit('taskSelection_update', new Set([...state.taskSelection]))
				// paraPreview();					// 这句要在上面 for 之后，因为上面的 for 用于同步全局与单个文件
			})

			// 存盘
			clearTimeout(saveAllParaTimer)
			saveAllParaTimer = setTimeout(() => {
				electronStore.set('format', state.globalParams.format)
				electronStore.set('video', state.globalParams.video)
				electronStore.set('audio', state.globalParams.audio)
				console.log("参数已保存")
			}, 700);
		},
		// 使用任务的参数替换参数盒
		replacePara (state, after) {
			state.globalParams = after
		},
		// 添加任务
		addTask (state, file) {
			var id = Symbol()
			state.tasks.set(id, {
				filename: file.name,
				filepath: file.path,
				before: {
					format: '读取中',
					duration: '--:--:--.--',
					vcodec: '读取中',
					acodec: '读取中',
					vresolution: '读取中',
					vframerate: '读取中',
					vbitrate: '读取中',
					abitrate: '读取中',
				},
				after: JSON.parse(JSON.stringify(state.globalParams)),
				computedAfter: {},					// 一些用于给 taskitem 显示的数据，没有其他用途。尽量不往 taskitem 引入那么多需要它自己计算的东西了
				paraArray: [],
				progress: {
					progress: 0,
					bitrate: 0,
					speed: 0,
					time: 0,
					frame: 0,
				},
				progress_smooth: {
					progress: 0,
					bitrate: 0,
					speed: 0,
					time: 0,
					frame: 0,
				},
				FFmpeg: null,
				status: TASK_STOPPED,
				taskProgress: [],					// 用于动态显示进度
				taskProgress_size: [],				// 因为 size 的更新速度很慢，所以单独拎出来
				dashboardTimer: NaN,				// 刷新进度的计时器，刷新间隔 40ms
				lastPaused: new Date().getTime() / 1000,	// 用于暂停后恢复时计算速度
				cmdData: '',
				errorInfo: []
			})
			state.taskOrder.push(id)
			var task = state.tasks.get(id)

			// FFmpeg 读取媒体信息
			var ffmpeg = new FFmpeg(2, ["-hide_banner", "-i", file.path, "-f", "null"])
			ffmpeg.on("data", (data) => {
				this.commit('cmdDataArrived', { id, msg: data })
			});
			ffmpeg.on('metadata', (input) => {
				task.before.format = input.format
				task.before.duration = input.duration
				task.before.vcodec = input.vcodec == undefined ? "-" : input.vcodec
				task.before.vresolution = input.vcodec == undefined ? "-" : input.vresolution.replace("x", "<br />")
				task.before.vbitrate = input.vbitrate == undefined ? "-" : input.vbitrate
				task.before.vframerate = input.vframerate == undefined ? "-" : input.vframerate
				task.before.format = input.format
				task.before.acodec = input.acodec == undefined ? "-" : input.acodec
				task.before.abitrate = input.abitrate == undefined ? "-" : input.abitrate
			})
			ffmpeg.on("critical", (errors) => {
				var reason = '';
				errors.forEach((value) => {
					reason += value;
				})
				this.commit('pushMsg', { msg: file.path + "：" + reason, level: 2 });
				setTimeout(() => {
					// pauseNremove(currentTaskCount);
					state.tasks.delete(id)
					state.taskOrder.pop(id)
				}, 100);
			})

			// 更新命令行参数
			task.paraArray = getFFmpegParaArray(task.filepath, task.after.format, task.after.video, task.after.audio, true)
			task.computedAfter = {
				vrate: vGenerator.getRateControlParam(task.after.video),
				arate: aGenerator.getRateControlParam(task.after.audio)
			}
		},
		taskSelection_update (state, set) {
			// console.log('taskSelection updated at ' + new Date().getTime())
			state.taskSelection = set
			if (set.size > 0) {
				for (const id of set) {
					this.commit('replacePara', state.tasks.get(id).after)
					break
				}
			}
		},
		// 接收到 cmd 消息（args：msg, id）
		cmdDataArrived (state, args) {
			// console.log(args.msg)
			if (args.msg.slice(-1) != '\n') {
				args.msg += '\n'
			}
			if (typeof args.id == 'undefined') {
				state.cmdData += args.msg
				if (state.cmdData.length > 40000) {
					state.cmdData = state.cmdData.slice(4000)
				}
			} else {
				var task = state.tasks.get(args.id)
				task.cmdData += args.msg
				if (task.cmdData.length > 40000) {
					task.cmdData = task.cmdData.slice(4000)
				}
			}
			state.taskSelection = new Set(state.taskSelection)
		},
		// 刷新 FFmpeg 版本信息
		FFmpegVersion_update (state, info) {
			state.FFmpegVersion = info
		},
		// 关闭窗口事件触发时调用
		closeConfirm (state) {
			function readyToClose () {
				ipc.send('exitConfirm');
				ipc.send('close');
			}
			if (this.getters.queueTaskCount > 0) {
				this.commit('msgbox', {
					title: '要退出咩？',
					content: `您还有 ${this.getters.queueTaskCount} 个任务未完成，要退出🐴？`,
					onOK: readyToClose,
				})
			} else {
				readyToClose();
			}
		}
	}
})

export default {
	name: 'App',
	components: {
		ContentWrapper, FloatingContent
	},
	methods: {
		async initFFmpeg () {
			var ffmpeg = new FFmpeg(1);
			ffmpeg.on("data", (data) => {
				this.$store.commit('cmdDataArrived', { msg: data })
			});
			ffmpeg.on("version", (data) => {
				if (data[0] != null) {
					this.$store.commit('FFmpegVersion_update', data)
				} else {
					this.$store.commit('FFmpegVersion_update', '-')
					// document.getElementById("dropfilesimage").style.backgroundImage = "image/drop_files_noffmpeg.png";
				}
			})
		}
			},
	beforeCreate: function () {
		document.querySelector('body').className = "body"
	},
	mounted: function () {
		document.title = 'FFBox v' + version

		// 全局鼠标拖动响应注册
		window.addEventListener('mousedown', (event) => {
			for (const iterator of this.$store.state.onPointerEvents.onMouseDown) {
				iterator.func(event)
			}
		})
		window.addEventListener('mousemove', (event) => {
			for (const iterator of this.$store.state.onPointerEvents.onMouseMove) {
				iterator.func(event)
			}
		})
		window.addEventListener('mouseup', (event) => {
			for (const iterator of this.$store.state.onPointerEvents.onMouseUp) {
				iterator.func(event)
			}
		})
		// 更新全局参数输出
		this.$store.state.globalParams.paraArray = getFFmpegParaArray('[输入文件名]', this.$store.state.globalParams.format, this.$store.state.globalParams.video, this.$store.state.globalParams.audio)
		this.$store.state.globalParams = JSON.parse(JSON.stringify(this.$store.state.globalParams))

		console.log(remote.app.getPath('exe'))
		// 初始化 FFmpeg
		setTimeout(() => {
			this.initFFmpeg()
			if (!electronStore.has('ffbox.buildNumber') || electronStore.get('ffbox.buildNumber') != buildNumber) {
				this.$store.commit('pushMsg', {
					msg: '欢迎使用 FFBox v' + version + '！',
					level: 0
				})
				electronStore.set('ffbox.buildNumber', buildNumber)
			} else {
				this.$store.commit('replacePara', {
					format: electronStore.get('format'),
					video: electronStore.get('video'),
					audio: electronStore.get('audio'),
				})
			}
		}, 1);

		// 挂载退出确认
		ipc.on("exitConfirm", () => this.$store.commit('closeConfirm'));
	},
	store
}

function getFFmpegParaArray (filepath, fParams, vParams, aParams, withQuotes = false) {
	var ret = []
	ret.push('-hide_banner')
	ret.push(...fGenerator.getHwaccelParam(fParams))
	ret.push('-i')
	ret.push((withQuotes ? '"' : '') + filepath + (withQuotes ? '"' : ''))
	ret.push(...fGenerator.getPreProcessParam(fParams))
	ret.push(...vGenerator.getVideoParam(vParams))
	ret.push(...aGenerator.getAudioParam(aParams))
	ret.push(...fGenerator.getOutputParam(fParams, commonfunc.getFilePathWithoutPostfix(filepath) + '_converted', withQuotes))
	ret.push('-y')
	return ret
}

</script>

<style>
	.body {
		margin: 0;
		padding: 0;
		background-color: transparent;
		user-select: none;
	}
	#app {
		font-family: 苹方, "苹方 中等", 微软雅黑, "Segoe UI", Consolas, Avenir, Helvetica, Arial, sans-serif, 黑体;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-align: center;
		color: hsl(0, 0%, 20%);
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}
	content-wrapper {
		border: red 1px solid;
	}

</style>

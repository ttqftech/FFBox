import { SingleProgressLog, TransferStatus, UITask, Server } from "@common/types";
import { parseTimeString } from "@common/utils";

export function getOutputDuration(task: UITask): number {
	let duration = task.before.duration;
	if (isNaN(duration)) {
		return NaN;
	}
	if (task.after.input.begin || task.after.input.end) {
		const begin = task.after.input.begin ? parseTimeString(task.after.input.begin) : 0;
		let end = task.after.input.end ? parseTimeString(task.after.input.end) : duration;
		if (begin === -1 || end === -1 || begin > end || begin > duration) {
			return NaN;
		}
		end = Math.min(end, duration);
		duration = end - begin;
	}
	if (task.after.output.begin || task.after.output.end) {
		const begin = task.after.output.begin ? parseTimeString(task.after.output.begin) : 0;
		let end = task.after.output.end ? parseTimeString(task.after.output.end) : duration;
		if (begin === -1 || end === -1 || begin > end || begin > duration) {
			return NaN;
		}
		end = Math.min(end, duration);
		duration = end - begin;
	}
	return duration;
}

/**
 * 计算整体进度的 timer，根据计算结果修改 currentServer.progress
 * （progressBar 的修改由 titlebar.vue 负责）
 */
export function overallProgressTimer(currentServer: Server) {
	let tasks = currentServer.tasks;
	let totalTime = 0.000001;
	let totalProcessedTime = 0;
	for (const task of Object.values(tasks)) {
		if (!task.before.duration) {
			continue;
		}
		totalTime += task.before.duration;
		totalProcessedTime += task.dashboard_smooth.progress * task.before.duration;
	}
	let progress = totalProcessedTime / totalTime;
	currentServer.progress = progress;
}

/**
 * 用于 dashboardTimer
 * 通过线性加权移动平均获取数值变化的速率（k 值）
 */
function getKbyLWMA_obj(sampleCount: number, xFactorName: string, yFactorsName: Array<string>, data: Array<any>): Array<number> {
	let deltaXFactorSum = 0;
	let deltaYFactorsSum = Array(yFactorsName.length).fill(0);
	// 对于数据，在区间 [data.length - sampleCount, data.length - 1] 内，其权重在 [1, sampleCount] 之间递增
	// 因为采样数可能大于总样本数，所以倒序遍历，先计算最大的权重（index 最大），直到无法继续计算
	for (let weight = sampleCount, index = data.length - 1; index > 0 && weight > 0; weight--, index--) {
		deltaXFactorSum += weight * (data[index][xFactorName] - data[index - 1][xFactorName]);
		yFactorsName.forEach((factorName, i) => {
			deltaYFactorsSum[i] += weight * (data[index][factorName] - data[index - 1][factorName]);
		});
	}
	// 分子分母都有 totalWeight，所以消了，因此算式里就没有 totalWeight 出现
	return yFactorsName.map((factorName, i) => {
		return deltaYFactorsSum[i] / deltaXFactorSum;
	})
}

/**
 * 用于 dashboardTimer
 * 通过线性加权移动平均获取数值变化的速率（k 值）
 * 如果采样数量少于 sampleCount，低权重的缺失值相当于填充 0
 */
function getKbyLWMA(sampleCount: number, data: SingleProgressLog): number {
	// xFactor：时间　yFactor：参数值
	let deltaXFactorSum = 0;
	let deltaYFactorSum = 0;
	// 对于数据，在区间 [data.length - sampleCount, data.length - 1] 内，其权重在 [1, sampleCount] 之间递增
	// 因为采样数可能大于总样本数，所以倒序遍历，先计算最大的权重（index 最大），直到无法继续计算
	for (let weight = sampleCount, index = data.length - 1; index > 0 && weight > 0; weight--, index--) {
		deltaXFactorSum += weight * (data[index][0] - data[index - 1][0]);
		deltaYFactorSum += weight * (data[index][1] - data[index - 1][1]);
	}
	// 分子分母都有 totalWeight，所以消了，因此算式里就没有 totalWeight 出现
	return deltaYFactorSum / deltaXFactorSum;
}

/**
 * 对单个数据计算数据变化速率（k）和初值（b），获得该数据在指定时间的预估值（current）
 * 将对整个数组进行采样。因此如果要限定采样长度，先对数组进行裁剪处理
 */
function calcDashboard(progressLog: SingleProgressLog, time = new Date()) {
	const K = getKbyLWMA(progressLog.length, progressLog);
	const B = progressLog[progressLog.length - 1][1] - K * progressLog[progressLog.length - 1][0];	// b = y - k * x
	const systime = new Date().getTime() / 1000;
	const currentValue = systime * K + B;
	return { K, B, currentValue };
}

/**
 * 计算单个任务的 timer 函数，根据计算结果原地修改 progress 和 progress_smooth
 */
export function dashboardTimer(task: UITask) {
	if (task.transferStatus === TransferStatus.normal) {
		if (task.progressLog.time.length <= 2) {
			// 任务刚开始时显示的数据不准确
			return;
		}

		const { K: frameK, B: frameB, currentValue: currentFrame } = calcDashboard(task.progressLog.frame);
		const { K: timeK, B: timeB, currentValue: currentTime } = calcDashboard(task.progressLog.time);
		const { K: sizeK, B: sizeB, currentValue: currentSize } = calcDashboard(task.progressLog.size);
		// console.log("frameK: " + frameK + ", timeK: " + timeK + ", sizeK: " + sizeK);
		// console.log("currentFrame: " + currentFrame + ", currentTime: " + currentTime + ", currentSize: " + currentSize);

		// 任务进度计算
		let progress: number;
		if (task.before.duration !== -1) {
			progress = currentTime / getOutputDuration(task);
			progress = isNaN(progress) || progress === Infinity || progress < 0 ? 0 : progress;
		} else {
			progress = 0;
		}

		// 进度细节计算
		if (progress < 0.995) {
			task.dashboard = {
				...task.dashboard,
				progress,
				bitrate: (sizeK / timeK) * 8,
				speed: frameK / task.before.vframerate || timeK,	// 如果可以读出帧速，或者输出的是视频，用帧速算 speed 更准确；否则用时间算 speed
				time: currentTime,
				frame: currentFrame,
				size: currentSize,
			};

			// 平滑处理
			let { bitrate, speed, time, frame, size } = task.dashboard_smooth;
			progress = progress * 0.7 + task.dashboard.progress * 0.3;
			bitrate  = bitrate * 0.9 + task.dashboard.bitrate * 0.1;
			speed    = speed * 0.6 + task.dashboard.speed * 0.4;
			time     = time * 0.7 + task.dashboard.time * 0.3;
			frame    = frame * 0.7 + task.dashboard.frame * 0.3;
			size    = size * 0.9 + task.dashboard.size * 0.1;
			if (isNaN(bitrate) || bitrate == Infinity) { bitrate = 0 }
			if (isNaN(speed)) { speed = 0 }
			if (isNaN(time)) { time = 0 }
			if (isNaN(frame)) { frame = 0 }
			if (isNaN(size)) { size = 0 }
			task.dashboard_smooth = { ...task.dashboard_smooth, progress, bitrate, speed, time, frame, size };
		} else {
			// 进度满了就别更新了
			task.dashboard.progress = 1;
		}
	} else {
		if (task.transferProgressLog.transferred.length <= 2) {
			// 任务刚开始时显示的数据不准确
			return;
		}

		const { K: transferredK, B: transferredB, currentValue: currentTransferred } = calcDashboard(task.transferProgressLog.transferred);
		// console.log(`transferredK: ${transferredK}`);
		// console.log(`currentTransferred: ${currentTransferred}`);

		// 任务进度计算
		let progress: number;
		const total = task.transferProgressLog.total;
		progress = currentTransferred / total;
		progress = progress === Infinity ? 0 : progress;

		// 进度细节计算
		if (progress < 0.995) {
			task.dashboard = {
				...task.dashboard,
				transferred: currentTransferred,
				transferSpeed: transferredK / 1000,
			};

			// 平滑处理
			let { transferred, transferSpeed } = task.dashboard_smooth;
			transferred = transferred * 0.7 + task.dashboard.transferred * 0.3;
			transferSpeed = transferSpeed * 0.9 + task.dashboard.transferSpeed * 0.1;
			task.dashboard_smooth = { ...task.dashboard_smooth, transferred, transferSpeed };
		} else {
			// 进度满了就别更新了
			task.dashboard.transferred = 0.995 * total;
		}
	}
	// task.progress_smooth = Object.assign({}, task.progress_smooth); 
}

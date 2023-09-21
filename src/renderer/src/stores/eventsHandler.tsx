import nodeBridge from "@renderer/bridges/nodeBridge";
import { Notification, Task, TaskStatus, TransferStatus, WorkingStatus } from "@common/types";
import { Server, UITask } from '@renderer/types';
import { getInitialUITask, mergeTaskFromService } from "@common/utils";
import { dashboardTimer, overallProgressTimer } from "@renderer/common/dashboardCalc";
import { useAppStore } from "./appStore";
import Popup from "@renderer/components/Popup/Popup";
import Msgbox from "@renderer/components/Msgbox/Msgbox";
import IconExitConfirm from "@renderer/assets/exitConfirm.svg";
import { ButtonType } from "@renderer/components/Button/Button";

// #region server events

export function handleFFmpegVersion(server: Server, content: string) {
    server.data.ffmpegVersion = content || '-';
};
export function handleWorkingStatusUpdate(server: Server, workingStatus: WorkingStatus) {
    const serverData = server.data;
    serverData.workingStatus = workingStatus;
    // 处理 overallProgressTimer
    if (workingStatus === WorkingStatus.running && !serverData.overallProgressTimerID) {
        let timerID = setInterval(overallProgressTimer, 80, serverData);
        serverData.overallProgressTimerID = timerID;
        overallProgressTimer(serverData);
    } else if (workingStatus === WorkingStatus.stopped && serverData.overallProgressTimerID) {
        clearInterval(serverData.overallProgressTimerID);
        serverData.overallProgressTimerID = NaN;
        overallProgressTimer(serverData);
        // if (nodeBridge.remote && nodeBridge.remote.getCurrentWindow().isFocused()) {
            nodeBridge.flashFrame(true);
        // }
    } else if (workingStatus === WorkingStatus.paused && serverData.overallProgressTimerID) {
        clearInterval(serverData.overallProgressTimerID);
        serverData.overallProgressTimerID = NaN;
        overallProgressTimer(serverData);
    }
};
export function handleTasklistUpdate(server: Server, content: Array<number>) {
    const 这 = useAppStore();
    const serverData = server.data;
    let localI = 0;
    let remoteI = 0;
    let localKeys = Object.keys(serverData.tasks).map(Number).filter((value) => value >= 0);	// [1,3,4,5]
    let remoteKeys = content.filter((value) => value >= 0);										// [1,3,5,6,7]
    let newTaskIds: Array<number> = [];
    let newTaskList: Array<UITask> = [];
    while (localI < localKeys.length || remoteI < remoteKeys.length) {
        let localKey = localKeys[localI];
        let remoteKey = remoteKeys[remoteI];
        if (localI >= localKeys.length) {
            // 本地下标越界，说明远端添加任务了
            let newTask = getInitialUITask('');
            // newTask = mergeTaskFromService(newTask, ffboxService.getTask(remoteKey) as Task);
            // 先用一个 InitialUITask 放在新位置，完成列表合并后再统一 getTask() 获取任务信息
            newTaskIds.push(remoteKey);
            newTaskList[remoteKey] = newTask;
            remoteI++;
        } else if (remoteI >= remoteKeys.length) {
            // 远端下标越界，说明远端删除了最后面的若干个任务
            break;
        } else if (localKey < remoteKey) {
            // 远端跳号了，说明远端删除了中间的任务
            localI++;
        } else if (localKey === remoteKey) {
            // 从 local 处直接复制
            newTaskList[localKey] = serverData.tasks[localKey];
            localI++;
            remoteI++;
        }
    }
    serverData.tasks = Object.assign(newTaskList, {'-1': serverData.tasks[-1]});
    // 依次获取所有新增任务的信息
    for (const newTaskId of newTaskIds) {
        这.updateTask(server, newTaskId);
    }
};
/**
 * 更新整个 task
 */
export function handleTaskUpdate(server: Server, id: number, content: Task) {
    const serverData = server.data;
    const localTask = serverData.tasks[id];
    if (!localTask) {
        // 本地不存在此任务，则新增
        serverData.tasks[id] = getInitialUITask('');
    }
    const task = mergeTaskFromService(serverData.tasks[id], content);
    serverData.tasks[id] = task;
    // timer 相关处理
    if (task.status === TaskStatus.TASK_RUNNING && !task.dashboardTimer) {
        task.dashboardTimer = setInterval(dashboardTimer, 50, task) as any;
    } else if (task.dashboardTimer) {
        clearInterval(task.dashboardTimer);
        task.dashboardTimer = NaN;
    }
    // 进度条相关处理
    if (task.status === TaskStatus.TASK_FINISHED || task.status === TaskStatus.TASK_ERROR) {
        task.dashboard.progress = 1;
        task.dashboard_smooth.progress = 1;
    } else if (task.status === TaskStatus.TASK_STOPPED) {
        task.dashboard.progress = 0;
        task.dashboard_smooth.progress = 0;
    }
    // serverData.tasks = Object.assign({}, serverData.tasks);
};
/**
 * 增量更新 cmdData
 */
export function handleCmdUpdate(server: Server, id: number, content: string) {
    let task = server.data.tasks[id];
    if (task.cmdData.slice(-1) !== '\n' && task.cmdData.length) {
        task.cmdData += '\n';
    }
    task.cmdData += content;
};
/**
 * 整个更新 progressLog
 */
export function handleProgressUpdate(server: Server, id: number, progressLog: Task['progressLog'], functionLevel: number) {
    server.data.tasks[id].progressLog = progressLog;
    if (functionLevel < 50) {
        if (progressLog.time.slice(-1)[0][1] > 671 ||
            progressLog.elapsed + new Date().getTime() / 1000 - progressLog.lastStarted > 671) {
            server.entity.trailLimit_stopTranscoding(id);
            return;
        }
    }
};
/**
 * 增量更新 notifications
 */
export function handleNotificationUpdate(server: Server, notificationId: number, notification?: Notification) {
    const 这 = useAppStore();
    if (notification) {
        server.data.notifications[notificationId] = notification;
        Popup({
            message: notification.content,
            level: notification.level,
        });
        这.setUnreadNotifationCount();
    } else {
        delete server.data.notifications[notificationId];
    }
};

// #endregion

// #region ipc events

export function handleDownloadStatusChange(task: UITask, status: TransferStatus) {
	// timer 相关处理
	if (task.transferStatus === TransferStatus.normal && status === TransferStatus.downloading) {
		task.transferProgressLog.transferred = [];
		task.dashboardTimer = setInterval(dashboardTimer, 50, task) as any;
	} else {
		clearInterval(task.dashboardTimer);
		task.dashboardTimer = 0;
	}
	task.transferStatus = status;
}

export function handleDownloadProgress(task: UITask, progress: { loaded: number, total: number }) {
	task.transferProgressLog.total = progress.total;
	const transferred = task.transferProgressLog.transferred;
	transferred.push([new Date().getTime() / 1000, progress.loaded]);
	transferred.splice(0, transferred.length - 3);	// 限制列表最大长度为 3
}

export function handleCloseConfirm(localServer?: Server) {
    function readyToClose () {
        nodeBridge.ipcRenderer?.send('exitConfirm');
        setTimeout(() => {
            nodeBridge.ipcRenderer?.send('close');
        }, 0);
    }
    // getQueueTaskCount 拷贝自 FFBoxService
    function getQueueTaskCount(server: Server) {
        let count: number = 0;
        for (const task of Object.values(server.data.tasks)) {
            if (task.status === TaskStatus.TASK_RUNNING || task.status === TaskStatus.TASK_PAUSED || task.status === TaskStatus.TASK_STOPPING || task.status === TaskStatus.TASK_FINISHING) {
                count++;
            }
        }
        return count;
    }
    if (!localServer) {
        readyToClose();
    } else {
        let queueTaskCount = getQueueTaskCount(localServer);
        if (queueTaskCount > 0) {
            Msgbox({
                container: document.body,
                // container: containerRef.value,
                image: <IconExitConfirm />,
                title: '要退出吗？',
                content: `本地服务器还有 ${queueTaskCount} 个任务未完成，退出将会强制停止任务哦～`,
                buttons: [
                    { text: '退退退', callback: readyToClose, type: ButtonType.Danger, role: 'confirm' },
                    { text: '再等等', role: 'cancel' },
                ]
            })
        } else {
            readyToClose();
        }
    }
}

// #endregion

import { ServiceTask, Task, UITask } from "@/types/types";

/**
 * 任务信息在进行网络传送前调用此函数，过滤掉仅存在于 ServiceTask | UITask 的属性
 */
export function convertAnyTaskToTask(task: ServiceTask | UITask): Task {
    return {
        fileName: task.fileName,
        filePath: task.filePath,
        before: task.before,
        after: task.after,
        paraArray: task.paraArray,
        status: task.status,
        progressHistory: task.progressHistory,
        cmdData: task.cmdData,
        errorInfo: task.errorInfo,
        notifications: task.notifications,
    }
}

/**
 * 来自 FFBoxService 的任务信息自网络接收后与现存的 UITask 进行合并
 */
 export function mergeTaskFromService(self: UITask, remote: Task): UITask {
    let ret = self;
    Object.assign(ret, JSON.parse(JSON.stringify(remote)));
    return ret;
}
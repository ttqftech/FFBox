import { ServiceTask, Task, UITask } from "@/types/types";

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

export function mergeTaskFromService(self: UITask, remote: Task): UITask {
    let ret = self;
    Object.assign(ret, JSON.parse(JSON.stringify(remote)));
    return ret;
}
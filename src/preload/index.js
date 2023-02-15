import { contextBridge, ipcRenderer, webFrame } from 'electron';
// import { spawn, exec } from 'child_process';    // 不可用
// import { domReady } from './utils'
// import { useLoading } from './loading'

// const { appendLoading, removeLoading } = useLoading()
// window.removeLoading = removeLoading

// domReady().then(appendLoading)

const jsb = {
    ipcRenderer: {
        send(channel, ...args) {
            ipcRenderer.send(channel, ...args);
        },
        sendTo(webContentsId, channel, ...args) {
            ipcRenderer.sendTo(webContentsId, channel, ...args);
        },
        sendSync(channel, ...args) {
            ipcRenderer.sendSync(channel, ...args);
        },
        sendToHost(channel, ...args) {
            ipcRenderer.sendToHost(channel, ...args);
        },
        postMessage(channel, message, transfer) {
            if (!process.contextIsolated) {
                ipcRenderer.postMessage(channel, message, transfer);
            }
        },
        invoke(channel, ...args) {
            return ipcRenderer.invoke(channel, ...args);
        },
        on(channel, listener) {
            ipcRenderer.on(channel, listener);
            return this;
        },
        once(channel, listener) {
            ipcRenderer.once(channel, listener);
            return this;
        },
        removeListener(channel, listener) {
            ipcRenderer.removeListener(channel, listener);
            return this;
        },
        removeAllListeners(channel) {
            ipcRenderer.removeAllListeners(channel);
            return this;
        }
    },
    webFrame: {
        insertCSS(css) {
            return webFrame.insertCSS(css);
        },
        setZoomFactor(factor) {
            if (typeof factor === 'number' && factor > 0) {
                webFrame.setZoomFactor(factor);
            }
        },
        setZoomLevel(level) {
            if (typeof level === 'number') {
                webFrame.setZoomLevel(level);
            }
        }
    },
    process,
    spawn: () => {},
    exec: () => {},
};

contextBridge.exposeInMainWorld('jsb', jsb);

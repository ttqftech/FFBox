import { contextBridge, ipcRenderer, webFrame } from 'electron';

import { domReady } from './utils'
// import { useLoading } from './loading'

// const { appendLoading, removeLoading } = useLoading()
// window.removeLoading = removeLoading

// domReady().then(appendLoading)

const electronAPI = {
    ipcRenderer: {
        send(channel, ...args) {
            electron.ipcRenderer.send(channel, ...args);
        },
        sendTo(webContentsId, channel, ...args) {
            electron.ipcRenderer.sendTo(webContentsId, channel, ...args);
        },
        sendSync(channel, ...args) {
            electron.ipcRenderer.sendSync(channel, ...args);
        },
        sendToHost(channel, ...args) {
            electron.ipcRenderer.sendToHost(channel, ...args);
        },
        postMessage(channel, message, transfer) {
            if (!process.contextIsolated) {
                electron.ipcRenderer.postMessage(channel, message, transfer);
            }
        },
        invoke(channel, ...args) {
            return electron.ipcRenderer.invoke(channel, ...args);
        },
        on(channel, listener) {
            electron.ipcRenderer.on(channel, listener);
            return this;
        },
        once(channel, listener) {
            electron.ipcRenderer.once(channel, listener);
            return this;
        },
        removeListener(channel, listener) {
            electron.ipcRenderer.removeListener(channel, listener);
            return this;
        },
        removeAllListeners(channel) {
            electron.ipcRenderer.removeAllListeners(channel);
            return this;
        }
    },
    webFrame: {
        insertCSS(css) {
            return electron.webFrame.insertCSS(css);
        },
        setZoomFactor(factor) {
            if (typeof factor === 'number' && factor > 0) {
                electron.webFrame.setZoomFactor(factor);
            }
        },
        setZoomLevel(level) {
            if (typeof level === 'number') {
                electron.webFrame.setZoomLevel(level);
            }
        }
    },
    process,
};

contextBridge.exposeInMainWorld('electron', electronAPI);

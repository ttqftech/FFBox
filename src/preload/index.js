import { contextBridge, ipcRenderer, webFrame, webUtils } from 'electron';

const jsb = {
	getPathForFile (file) {
		return webUtils.getPathForFile(file);
	},
	ipcRenderer: {
		send: ipcRenderer.send.bind(ipcRenderer),
		sendSync: ipcRenderer.sendSync.bind(ipcRenderer),
		sendToHost: ipcRenderer.sendToHost.bind(ipcRenderer),
		postMessage: ipcRenderer.postMessage.bind(ipcRenderer),
		invoke: ipcRenderer.invoke.bind(ipcRenderer),
		on: ipcRenderer.on.bind(ipcRenderer),
		once: ipcRenderer.once.bind(ipcRenderer),
		removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
		removeAllListeners: ipcRenderer.removeAllListeners.bind(ipcRenderer),
	},
	webFrame: {
		insertCSS: webFrame.insertCSS.bind(webFrame),
		setZoomFactor: webFrame.setZoomFactor.bind(webFrame),
		setZoomLevel: webFrame.setZoomLevel.bind(webFrame),
		get zoomLevel() {
			return webFrame.getZoomLevel();
		},
	},
	webFrame: {
		insertCSS: webFrame.insertCSS.bind(webFrame),
		setZoomFactor: webFrame.setZoomFactor.bind(webFrame),
		setZoomLevel: webFrame.setZoomLevel.bind(webFrame),
		getZoomLevel: webFrame.getZoomLevel.bind(webFrame),
	},
};

contextBridge.exposeInMainWorld('jsb', jsb);
ipcRenderer.send('rendererReady');

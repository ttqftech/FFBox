import type { IpcRenderer as ElectronIpcRenderer, WebFrame as ElectronWebFrame } from 'electron';

export declare interface JSBridge {
	getPathForFile(file: File): string; // electron 32 起 File.path 移除，需用这个
	ipcRenderer: IpcRenderer;
	webFrame: WebFrame;
}

export declare const jsb: JSBridge;

/**
 * Expose Electron APIs from your preload script, the API
 * will be accessible from the website on `window.electron`.
 */
export declare function exposeElectronAPI(): void;

export declare type IpcRenderer = Pick<ElectronIpcRenderer,
	'send' | 'sendSync' | 'sendToHost' | 'invoke' | 'postMessage' | 'on' | 'once' | 'removeListener' | 'removeAllListeners'
>;

export declare type WebFrame = Pick<ElectronWebFrame,
	'insertCSS' | 'setZoomFactor' | 'setZoomLevel' | 'getZoomLevel'
>;

export { }

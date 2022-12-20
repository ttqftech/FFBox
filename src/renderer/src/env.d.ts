/// <reference types="vite/client" />
import { ElectronAPI } from '@preload/index';

// export {} // 使 ts 认为这个文件是一个 module 而不是 script，否则不能 extend global
declare global {
	interface Window {
		electron: ElectronAPI
	}
}

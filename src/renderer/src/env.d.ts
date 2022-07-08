/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare global {
  interface Window {
    electron: unknown
    api: unknown
  }
}

// declare interface Window {
//   electron: ElectronAPI
//   api: unknown
// }

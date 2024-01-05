import { app, BrowserWindow, nativeTheme } from 'electron';
import osBridge from './osBridge';

app.commandLine.appendSwitch("enable-transparent-visuals");

const windowInstances = new WeakMap<BrowserWindow, BlurWindowManager>();

class BlurWindowManager {
    private window: BrowserWindow;
    private on = false;
    private marginTimer = 0;

    constructor(window: BrowserWindow) {
        this.window = window;
    }

    mountEvents() {
        let onWindowShow = () => {
            this.applyEffect();
            setTimeout(() => {
                this.window.hide();
                this.window.show();
            }, 60);
        }
        this.window.on('show', onWindowShow);
        this.window.on('close', this.disableEffect);
    }

    applyEffect() {
        osBridge.setBlurBehindWindow(this.window, this.on ? 1 : 0);
    }

    enableEffect() {
        if (this.on) {
            return;
        }
        this.on = true;
        osBridge.setBlurBehindWindow(this.window, 1);
        if (this.marginTimer) {
            clearInterval(this.marginTimer);
            this.marginTimer = 0;
        }
        this.marginTimer = setInterval(() => {
            try {
               osBridge.setBlurBehindWindow(this.window, 2);
            } catch (error) {
                clearInterval(this.marginTimer);
                this.marginTimer = null;
            }
        }, 40) as any;
        setTimeout(() => {
            this.window.hide();
            this.window.show();
        }, 60);
    }

    disableEffect() {
        if (!this.on) {
            return;
        }
        this.on = false;
        osBridge.setBlurBehindWindow(this.window, 0);
        if (this.marginTimer) {
            clearInterval(this.marginTimer);
            this.marginTimer = 0;
        }
        setTimeout(() => {
            this.window.hide();
            this.window.show();
        }, 60);
    }
}

export function setBlur(window: BrowserWindow, on: boolean) {
    if (!windowInstances.has(window)) {
        windowInstances.set(window, new BlurWindowManager(window));
    }
    if (on) {
        windowInstances.get(window).enableEffect();
    } else {
        windowInstances.get(window).disableEffect();
    }
}

export function destroy(window: BrowserWindow) {
    windowInstances.delete(window);
}

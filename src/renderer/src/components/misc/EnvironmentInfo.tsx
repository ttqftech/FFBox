import { Fragment, h } from "vue";
import { version } from "@common/constants";
import { useAppStore } from "@renderer/stores/appStore";
import { ServiceBridgeStatus } from "@renderer/bridges/serviceBridge";
import Msgbox from "../Msgbox/Msgbox";
import nodeBridge from "@renderer/bridges/nodeBridge";

export function showEnvironmentInfo() {
    const appStore = useAppStore();
    const backendInfo = [];
    if (appStore.currentServer?.entity.status === ServiceBridgeStatus.Connected) {
        backendInfo.push(
            `当前后端版本：${appStore.currentServer.data.version}`,
            h('br'),
            `当前后端连接形式：${appStore.currentServer.entity.ip === 'localhost' ? '本地' : '远程'}`,
            h('br'),
            `当前后端 ffmpeg 版本：${appStore.currentServer.data.ffmpegVersion}`,
        )
    }
    Msgbox({
        container: document.body,
        title: '版本信息',
        content: h(Fragment, [
            `前端版本：${version}`,
            h('br'),
            `前端 OS 环境：${navigator.platform}`,
            h('br'),
            `前端引擎环境：${nodeBridge.env === 'electron' ? 'electron' : navigator.userAgent}`,
            ...(backendInfo.length ? [h('br'), ...backendInfo] : []),
        ]),
        buttons: [
            { text: '关闭', role: 'cancel' },
        ]
    });
}

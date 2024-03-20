#pragma once
/**
 * 1：FFBox electron 主进程启动完成
 * 2：FFBox 渲染进程初始化完毕
 * 4：FFBox 窗口展示完成
 * 8：FFBox App 应用初始化完毕
 * 16：FFBox 服务启动成功
 **/
short loadStatus = 0;

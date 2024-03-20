#pragma once
#include "setORrestoreBlur.hpp"
#include "pauseORresumeProcess.hpp"
#include "triggerKeyboardCombination.hpp"
#include "common.hpp"

const UINT8 OP_BUFFER_LENGTH = 9;	// 最后一位恒为 0，所以最终可用的大小是它减去 1

// char chr;					// 当前读入的字符
char status = '0';			// 状态定义：　0：初始　1：传入 PID，暂停或恢复进程　2：传入 hWnd，设置毛玻璃或恢复　3：触发键盘快捷键　4：传入启动状态　z：退出本程序　　　　　
char opSymbol;				// 一般用作操作方向开关，具体行为由操作定义
char opBuffer[OP_BUFFER_LENGTH] = { 0, 0, 0, 0, 0, 0, 0, 0, 0 };
UINT8 opBufferIndex = 0;	// 循环读入 opBuffer 时的序号

void stateMachineStep(char chr);
void resetOpBuffer(char* pointer, UINT8* opBufferIndex);

void stateMachineStep(char chr) {
	// std::cout << "获得字符" << chr << std::endl;
	switch (status) {
	case '0':
		status = chr;
		break;
	case '1':
		if (opBufferIndex == 0) {
			opSymbol = chr;
		}
		else if (opBufferIndex < OP_BUFFER_LENGTH) {
			opBuffer[opBufferIndex - 1] = chr;
		}
		opBufferIndex++;
		if (opBufferIndex == OP_BUFFER_LENGTH) {
			pauseORresumeProcess(atoi(opBuffer), opSymbol != '0');
			resetOpBuffer(opBuffer, &opBufferIndex);
			status = '0';
		}
		break;
	case '2':
		if (opBufferIndex == 0) {
			opSymbol = chr;
		}
		else if (opBufferIndex < OP_BUFFER_LENGTH) {
			opBuffer[opBufferIndex - 1] = chr;
		}
		opBufferIndex++;
		if (opBufferIndex == OP_BUFFER_LENGTH) {
			setORrestoreBlur(atoi(opBuffer), opSymbol - 48);
			resetOpBuffer(opBuffer, &opBufferIndex);
			status = '0';
		}
		break;
	case '3':
		if (opBufferIndex == 0) {
			opSymbol = chr;
		}
		else if (opBufferIndex < OP_BUFFER_LENGTH) {
			opBuffer[opBufferIndex - 1] = chr;
		}
		opBufferIndex++;
		if (opBufferIndex == OP_BUFFER_LENGTH) {
			triggerKeyboardCombination(atoi(opBuffer));
			resetOpBuffer(opBuffer, &opBufferIndex);
			status = '0';
		}
		break;
	case '4':
		if (opBufferIndex == 0) {
			opSymbol = chr;
		}
		else if (opBufferIndex < OP_BUFFER_LENGTH) {
			opBuffer[opBufferIndex - 1] = chr;
		}
		opBufferIndex++;
		if (opBufferIndex == OP_BUFFER_LENGTH) {
			loadStatus |= atoi(opBuffer);
			resetOpBuffer(opBuffer, &opBufferIndex);
			status = '0';
		}
		break;
	case 'z':
	case '\n':
		exit(0);
	default:
		exit(999);
		break;
	}
	// 使用 cout 输出的信息可在渲染器进程和主进程看到，但使用 printf 输出的信息似乎不能在渲染器进程看到，目前猜测是换行符不能正确识别或其他问题，导致 spawn 认为还没输出完，不触发 console.log 事件
	// cout << "status: " << status << "  opBuffer: " << opBuffer << endl;
}

void resetOpBuffer(char* pointer, UINT8* opBufferIndex) {
	for (UINT8 i = 0; i < OP_BUFFER_LENGTH; i++)
	{
		*(pointer + i) = 0;
	}
	*opBufferIndex = 0;
}

#define _CRT_SECURE_NO_WARNINGS
#include <windows.h>
#include <iostream>
#include <thread>
#include <string>

#include "stateMachine.hpp"
#include "splashScreen.hpp"

#ifdef _DEBUG
	#define FFBoxProcessName "mspaint.exe"
#else
	#define FFBoxProcessName "FFBox.exe"
	// 不弹黑框可以用这个：https://blog.csdn.net/sunmingming512/article/details/23842571 ，但这样做会导致程序无法接收标准输入流
	#pragma comment(linker, "/subsystem:\"windows\" /entry:\"mainCRTStartup\"")
#endif

extern char** environ;

using namespace std;

HANDLE hFFBoxProcess;
HANDLE hFFBoxPipe;

int main(int argc, char* argv[]);
void stateMachineStep(char chr);
void resetOpBuffer(char* pointer, UINT8* opBufferIndex);
void waitForFFBoxExit();
std::string LPWCH2STDString(const LPWCH strcs);

int main(int argc, char* argv[]) {
	// 检查是否需要启动 FFBox（默认是需要）。如果是则作为父进程，使用命名管道方式通讯；否则作为子进程，使用标准输入输出流
	bool needToLaunchFFBox = true;
	for (int i = 0; i < argc; i++)
	{
		if (_stricmp(argv[i], "--standalone") == 0) {
			needToLaunchFFBox = false;
		}
	}
	if (needToLaunchFFBox) {
		initSplashScreen();

		std::cout << "FFBox 主进程正在启动" << std::endl;
		// 启动 FFBox 主进程 
		// 获取当前进程的环境变量
		// LPWCH pOldEnv = GetEnvironmentStrings(); // 该函数是废弃函数
		// auto envold = SetEnvironmentVariable(TEXT("ELECTRON_NO_ATTACH_CONSOLE"), TEXT("true")); // 该函数似乎无用
		// std::string newEnvVar = "ELECTRON_NO_ATTACH_CONSOLE='true'";
		// std::string newEnvBlock = LPWCH2STDString(pOldEnv);
		// newEnvBlock += newEnvVar;
		// std::cout << "新环境变量：" << newEnvBlock << std::endl;

		// char** pEnvLine = environ;
		// char newEnv[32767];
		// int pNewEnv = 0;
		// for (; *pEnvLine; pEnvLine++) {
		//	char* pEnvChar = *pEnvLine;
		//	while (*pEnvChar) {
		//		newEnv[pNewEnv++] = *pEnvChar;
		//		pEnvChar++;
		// 	}
		// 	newEnv[pNewEnv++] = '\0'; // 分割标记
		// }
		// strcpy(&newEnv[pNewEnv], newEnvVar.c_str());
		// pNewEnv += newEnvVar.size();
		// newEnv[pNewEnv++] = '\0';
		// newEnv[pNewEnv++] = '\0';
		// TCHAR envVar[] = TEXT("ELECTRON_NO_ATTACH_CONSOLE=true\0");

		STARTUPINFO si;
		PROCESS_INFORMATION pi;
		ZeroMemory(&si, sizeof(si));
		si.cb = sizeof(si);
		ZeroMemory(&pi, sizeof(pi));
		TCHAR pName[]= TEXT(FFBoxProcessName);
		//if (auto result = CreateProcess(NULL, pName, NULL, NULL, false, 0, (LPVOID)newEnvBlock.c_str(), NULL, &si, &pi)) {
		if (!CreateProcess(NULL, pName, NULL, NULL, false, 0, NULL, NULL, &si, &pi)) {
			std::cout << "FFBox 主进程启动失败" << GetLastError() << " FFBoxHelper 即将退出" << endl;
		};
		hFFBoxProcess = pi.hProcess;
		// 创建一个新的线程来等待 FFBox 进程结束
		std::thread(waitForFFBoxExit).detach();

		// 创建命名管道
		hFFBoxPipe = CreateNamedPipe(
			TEXT("\\\\.\\pipe\\FFBoxPipe"),
			PIPE_ACCESS_DUPLEX, // 必须使用双工（哪怕不需要接收任何消息），否则 node.js 那端会自动把连接关掉
			PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_WAIT,
			1,
			0, 22,
			0, NULL
		);
		if (hFFBoxPipe == INVALID_HANDLE_VALUE) {
			cout << "管道通信创建失败: " << GetLastError() << " FFBoxHelper 即将退出" << endl;
			return -1;
		}

		// 第二个参数设为NULL，阻塞执行，否则会出现链接问题
		if (!ConnectNamedPipe(hFFBoxPipe, NULL)) {
			cout << "管道通信连接失败: " << GetLastError() << " FFBoxHelper 即将退出" << endl;
			return -1;
		}

		char buff[22];
		unsigned long readLength;
		while (true)
		{
			memset(buff, NULL, 22);
			// cout << "准备读取" << endl;
			if (!ReadFile(hFFBoxPipe, buff, 22, &readLength, NULL)) {
				cout << "管道读取错误: " << GetLastError() << " FFBoxHelper 即将退出" << endl;
				return -1;
			}
			else {
				std::cout << "收到指令：" << buff << std::endl;
				short i = 0;
				while (buff[i]) {
					stateMachineStep(buff[i++]);
				}
			}
		}
	}
	else {
		while (char c = getchar()) {
			stateMachineStep(c);
		}
	}

	return 1;
}

std::string LPWCH2STDString(const LPWCH strcs) {
	const UINT wLen = lstrlenW(strcs) + 1;
	UINT aLen = WideCharToMultiByte(CP_ACP, 0, strcs, wLen, NULL, 0, NULL, NULL);
	char* lpa = new char[aLen + 1];
	memset(lpa, 0, aLen + 1);
	WideCharToMultiByte(CP_ACP, 0, strcs, wLen, lpa, aLen, NULL, NULL);
	std::string stdStr(lpa);
	delete[] lpa;
	return stdStr;
}

void waitForFFBoxExit() {
	WaitForSingleObject(hFFBoxProcess, INFINITE);
	std::cout << "FFBox 进程结束，FFBoxHelper 退出" << std::endl;
	exit(0);
}

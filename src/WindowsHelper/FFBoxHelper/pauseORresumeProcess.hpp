#include <Windows.h>
#include <iostream>

//////////////// 类型定义 ////////////////

typedef HANDLE(WINAPI* pfnOpenProcess)(DWORD dwDesiredAccess, BOOL bInheritHandle, DWORD dwProcessId);

typedef HANDLE(WINAPI* pfnCloseHandle)(HANDLE hObject);

typedef DWORD(WINAPI* pfnNtSuspendProcess)(HANDLE hProcess);
typedef DWORD(WINAPI* pfnNtResumeProcess)(HANDLE hProcess);


//////////////// 函数实现 ////////////////

bool pauseORresumeProcess(int processId, bool turnON) {
	std::cout << (turnON ? "pause" : "resume") << "Process: " << processId << std::endl;

	// 检查 API 可用性
	HMODULE hKernel = LoadLibrary(L"kernel32.dll");
	HMODULE hNtdll = LoadLibrary(L"ntdll.dll");
	pfnOpenProcess openProcess = (pfnOpenProcess)GetProcAddress(hKernel, "OpenProcess");
	pfnCloseHandle closeHandle = (pfnCloseHandle)GetProcAddress(hKernel, "CloseHandle");
	pfnNtSuspendProcess ntSuspendProcess = (pfnNtSuspendProcess)GetProcAddress(hNtdll, "NtSuspendProcess");
	pfnNtResumeProcess ntResumeProcess = (pfnNtResumeProcess)GetProcAddress(hNtdll, "NtResumeProcess");
	// printf("OpenProcess: %d, CloseHandle: %d\n", openProcess, closeHandle);
	// printf("NtSuspendProcess: %d, NtResumeProcess: %d\n", ntSuspendProcess, ntResumeProcess);
	if (!openProcess || !closeHandle || !ntSuspendProcess || !ntResumeProcess) {
		std::cout << "操作系统不支持 API! " << openProcess << ', ' << closeHandle << ', ' << ntSuspendProcess << ', ' << ntResumeProcess << std::endl;
		return false;
	}
	
	// 打开进程
	HANDLE hProcess = openProcess(PROCESS_SUSPEND_RESUME, false, processId);
	if (!hProcess) {
		std::cout << "openProcess 失败! " << std::endl;
		return false;
	}

	// 进行处理
	DWORD result;
	if (turnON) {
		result = ntSuspendProcess(hProcess);
	} else {
		result = ntResumeProcess(hProcess);
	}

	// 关闭句柄
	closeHandle(hProcess);

	std::cout << "执行结果: " << result << std::endl;
	return true;
}

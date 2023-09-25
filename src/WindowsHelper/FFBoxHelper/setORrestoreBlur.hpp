#include <Windows.h>
#include <iostream>

//////////////// 类型定义 ////////////////

enum WINDOWCOMPOSITIONATTRIB
{
	WCA_UNDEFINED = 0,
	WCA_NCRENDERING_ENABLED = 1,
	WCA_NCRENDERING_POLICY = 2,
	WCA_TRANSITIONS_FORCEDISABLED = 3,
	WCA_ALLOW_NCPAINT = 4,
	WCA_CAPTION_BUTTON_BOUNDS = 5,
	WCA_NONCLIENT_RTL_LAYOUT = 6,
	WCA_FORCE_ICONIC_REPRESENTATION = 7,
	WCA_EXTENDED_FRAME_BOUNDS = 8,
	WCA_HAS_ICONIC_BITMAP = 9,
	WCA_THEME_ATTRIBUTES = 10,
	WCA_NCRENDERING_EXILED = 11,
	WCA_NCADORNMENTINFO = 12,
	WCA_EXCLUDED_FROM_LIVEPREVIEW = 13,
	WCA_VIDEO_OVERLAY_ACTIVE = 14,
	WCA_FORCE_ACTIVEWINDOW_APPEARANCE = 15,
	WCA_DISALLOW_PEEK = 16,
	WCA_CLOAK = 17,
	WCA_CLOAKED = 18,
	WCA_ACCENT_POLICY = 19,
	WCA_FREEZE_REPRESENTATION = 20,
	WCA_EVER_UNCLOAKED = 21,
	WCA_VISUAL_OWNER = 22,
	WCA_LAST = 23
};

enum ACCENT_STATE
{
	ACCENT_DISABLED = 0,
	ACCENT_ENABLE_GRADIENT = 1,
	ACCENT_ENABLE_TRANSPARENTGRADIENT = 2,
	ACCENT_ENABLE_BLURBEHIND = 3,
	ACCENT_ENABLE_FLUENT = 4,
	ACCENT_NORMAL = 150,
};

struct ACCENT_POLICY
{
	ACCENT_STATE AccentState;
	DWORD AccentFlags;
	DWORD GradientColor;
	DWORD AnimationId;
};

struct WINDOWCOMPOSITIONATTRIBDATA
{
	WINDOWCOMPOSITIONATTRIB attribute;
	PVOID pointerData;
	SIZE_T sizeofData;
};

typedef BOOL(WINAPI* pfnSetWindowCompositionAttribute)(HWND, WINDOWCOMPOSITIONATTRIBDATA*);

// typedef int(WINAPI* pfnDwmExtendFrameIntoClientArea)(HWND, RECT*);

// typedef BOOL(WINAPI* pfnSetWindowLong)(HWND, DWORD, DWORD);

// typedef BOOL(WINAPI* pfnGetWindowLong)(HWND, DWORD);

// typedef BOOL(WINAPI* pfnSetLayeredWindowAttributes)(HWND, COLORREF, BYTE, DWORD);


//////////////// 函数实现 ////////////////

bool setORrestoreBlur(int hWnd, bool turnON) {
	std::cout << (turnON ? "set" : "restore") << "Blur: " << hWnd << std::endl;
	// 如果新建一个 C++ 桌面程序，那么创建窗口时需要使用下面这句使其变成可支持透明通道的窗口
	// HWND hWnd = CreateWindowEx(WS_EX_NOREDIRECTIONBITMAP, L"Acrylic Window", L"Acrylic Window using Direct Composition", WS_OVERLAPPEDWINDOW, CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT, NULL, NULL, hInstance, NULL);

	// 检查 API 可用性
	HMODULE hUser = LoadLibrary(L"user32.dll");
	// HMODULE hDwm = LoadLibrary(L"dwmapi.dll");
	pfnSetWindowCompositionAttribute setWindowCompositionAttribute = (pfnSetWindowCompositionAttribute)GetProcAddress(hUser, "SetWindowCompositionAttribute");
	// pfnDwmExtendFrameIntoClientArea dwmExtendFrameIntoClientArea = (pfnDwmExtendFrameIntoClientArea)GetProcAddress(hDwm, "DwmExtendFrameIntoClientArea");
	// pfnSetWindowLong setWindowLong = (pfnSetWindowLong)GetProcAddress(hUser, "SetWindowLongA");
	// pfnGetWindowLong getWindowLong = (pfnGetWindowLong)GetProcAddress(hUser, "GetWindowLongA");
	// pfnSetLayeredWindowAttributes setLayeredWindowAttributes = (pfnSetLayeredWindowAttributes)GetProcAddress(hUser, "SetLayeredWindowAttributes");
	// printf("setWindowCompositionAttribute: %d\n", setWindowCompositionAttribute);
	if (!setWindowCompositionAttribute) {
		std::cout << "操作系统不支持 setWindowCompositionAttribute API! " << std::endl;
		return false;
	}
	
	// 进行处理
	ACCENT_POLICY accent;
	accent.AccentState = turnON ? ACCENT_ENABLE_BLURBEHIND : ACCENT_DISABLED;
	accent.AccentFlags = 2;
	accent.GradientColor = RGB(127, 127, 127);
	accent.AnimationId = 0;
	WINDOWCOMPOSITIONATTRIBDATA data;
	data.attribute = WCA_ACCENT_POLICY;
	data.pointerData = &accent;
	data.sizeofData = sizeof(accent);
	int result;
	result = setWindowCompositionAttribute((HWND)hWnd, &data);
	if (result == 1) {
		std::cout << "结果：成功：1" << std::endl;
		return true;
	} else {
		std::cout << "结果：失败：" << result << std::endl;
		return false;
	}
}

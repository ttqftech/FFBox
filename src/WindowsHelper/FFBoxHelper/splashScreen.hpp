// 微软：你的第一个 Direct2D 计划：https://learn.microsoft.com/zh-cn/windows/win32/learnwin32/your-first-direct2d-program
// 知乎：借助 DirectX 的窗口半透明：https://zhuanlan.zhihu.com/p/402835148

#include <Windows.h>
#include <iostream>

#include "common.hpp"

// #include <future>
// #include <format>
#include <wrl.h>
#include <dcomp.h>
// #include <dwrite.h>
#include <d2d1_2.h>
#include <dxgi1_3.h>
#include <d3d11_2.h>
#include <d2d1_2helper.h>
#pragma comment(lib, "d2d1.lib")
// #pragma comment(lib, "dwrite.lib")
#pragma comment(lib, "dxgi.lib")
#pragma comment(lib, "d3d11.lib")
#pragma comment(lib, "dcomp.lib")
#pragma comment(lib, "dxguid.lib")

// DPI
#include <shellscalingapi.h>
#pragma comment(lib, "Shcore.lib")

// 位图相关
#include <wincodec.h>

// D2D
Microsoft::WRL::ComPtr<ID2D1Device1> d2dDevice;
Microsoft::WRL::ComPtr<ID2D1Factory2> d2dFactory;
Microsoft::WRL::ComPtr<ID2D1DeviceContext> dc;
Microsoft::WRL::ComPtr<ID2D1Bitmap1> bitmap;
// Dwrite工厂接口
// Microsoft::WRL::ComPtr<IDWriteFactory> dWriteFactory;
// D3D设备
Microsoft::WRL::ComPtr<ID3D11Device> d3dDevice;
// DXGI
Microsoft::WRL::ComPtr<IDXGIDevice> dxgiDevice;
Microsoft::WRL::ComPtr<IDXGIFactory2> dxgiFactory;
Microsoft::WRL::ComPtr<IDXGISurface2> surface;
// 交换链
Microsoft::WRL::ComPtr<IDXGISwapChain1> swapChain;
// Direct Composition
Microsoft::WRL::ComPtr<IDCompositionDevice> dCompDevice;
Microsoft::WRL::ComPtr<IDCompositionTarget> composTarget;
Microsoft::WRL::ComPtr<IDCompositionVisual> dCompVisual;

ID2D1Bitmap* FFBoxBitmap; // FFBox 图标

HWND hWndWindow;
float zoomFactor = 1;

void initSplashScreen();
void drawUI(short progress);
static inline void TryThrow(const char* active, HRESULT hr);
template <class T> void SafeRelease(T** ppT);
LRESULT CALLBACK WindowMsgProcess(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam);
HRESULT LoadBitmapFromFile(ID2D1RenderTarget* pRenderTarget, IWICImagingFactory* pIWICFactory, PCWSTR uri, UINT destinationWidth, UINT destinationHeight, ID2D1Bitmap** ppBitmap);
void zhihuPaintPrep(HWND hWnd);


void initSplashScreen() {
	// DPI 感知
	SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_SYSTEM_AWARE);

	auto createSplashScreen = [] {
		std::cout << "正在创建开屏窗口" << std::endl;
		// 创建窗口
		HINSTANCE hInstance = GetModuleHandle(NULL);
		WNDCLASS myClass;
		myClass.cbClsExtra = 0; // 类的额外内存
		myClass.cbWndExtra = 0; // 窗口的额外内存
		// myClass.hbrBackground = (HBRUSH)GetStockObject(WHITE_BRUSH); // 获取画刷句柄
		myClass.hbrBackground = (HBRUSH)BLACK_BRUSH;
		// myClass.hbrBackground = (HBRUSH)DC_BRUSH;
		// myClass.hbrBackground = 0;
		myClass.hCursor = LoadCursor(NULL, IDC_CROSS); // 光标
		myClass.hIcon = LoadIcon(NULL, IDI_APPLICATION); // 窗体左上角的图标
		myClass.hInstance = hInstance; // 窗体所述应用程序实例
		myClass.lpfnWndProc = WindowMsgProcess; // 窗体消息回调函数
		myClass.lpszMenuName = NULL; // 窗体菜单
		myClass.style = CS_HREDRAW | CS_VREDRAW | CS_OWNDC; // 窗体风格为水平重画和垂直重画
		myClass.lpszClassName = TEXT("myclass");
		RegisterClass(&myClass);

		// 先以一个大致的大小创建窗口
		int windowWidth = 192;
		int windowHeight = 160;
		int left = (GetSystemMetrics(SM_CXSCREEN) - 192) / 2;
		int top = (GetSystemMetrics(SM_CYSCREEN) - 160) / 2;

		// AdjustWindowRectExForDpi
		HWND hWnd = CreateWindowEx(
			// WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_TOPMOST | WS_EX_TRANSPARENT | WS_EX_NOACTIVATE, //窗口的扩展风格
			// WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_TOPMOST | WS_EX_APPWINDOW, // 分层窗口
			WS_EX_NOREDIRECTIONBITMAP | WS_EX_TOPMOST, // 不创建缓冲层，改由使用 Direct 3D 绘制
			myClass.lpszClassName,
			TEXT("FFBox 初始化"),
			WS_POPUP, // 无边框窗口
			// WS_OVERLAPPEDWINDOW, // 非工作区镶边窗口
			left, top,
			windowWidth, windowHeight,
			NULL, NULL, // 父窗口，菜单
			hInstance,
			NULL // 附加数据
		);
		if (hWnd) {
			std::cout << "开屏窗口创建成功" << std::endl;

			hWndWindow = hWnd;
			// 获取窗口所在的显示器，依此获得 DPI 以更改窗口大小
			HMONITOR hMonitor = MonitorFromWindow(hWnd, MONITOR_DEFAULTTONEAREST);
			MONITORINFO mi = { sizeof(mi) };
			GetMonitorInfo(hMonitor, &mi);
			UINT monitorWidth = mi.rcMonitor.right - mi.rcMonitor.left;
			UINT monitorHeight = mi.rcMonitor.bottom - mi.rcMonitor.top;
			UINT dpi = 0;
			GetDpiForMonitor(hMonitor, MDT_EFFECTIVE_DPI, &dpi, &dpi);
			zoomFactor = dpi / 96;
			windowWidth = 192 * zoomFactor;
			windowHeight = 160 * zoomFactor;
			left = (monitorWidth - windowWidth) / 2;
			top = (monitorHeight - windowHeight) / 2;
			SetWindowPos(hWnd, NULL, left, top, windowWidth, windowHeight, SWP_NOZORDER);

			try {
				ShowWindow(hWnd, SW_SHOWNORMAL);
			}
			catch (...) {
				std::cout << "开屏窗口创建失败" << GetLastError() << std::endl;
			}
			std::cout << "开屏窗口显示成功" << std::endl;
			UpdateWindow(hWnd);

			// 窗口消息循环
			MSG msg;
			while (GetMessage(&msg, NULL, 0, 0)) {
				TranslateMessage(&msg);
				DispatchMessage(&msg);
			}
		}
		else {
			std::cout << "开屏窗口创建失败" << GetLastError() << std::endl;
			// Gdiplus::GdiplusShutdown(m_pGdiToken);
		}
	};
	//auto monitorThread = [createSplashScreen] {
	//	std::thread(createSplashScreen).join();
	//	std::cout << "开屏窗口线程完成" << std::endl;
	//};
	//std::thread t1(monitorThread);
	//t1.detach();
	std::thread(createSplashScreen).detach();
	
	//std::packaged_task task(createSplashScreen);
	//std::future<void> future = task.get_future();
	//std::thread t(createSplashScreen, std::ref(task));
	//auto createSplashScreenCallback = [&future] {
	//	future.get(); // 等待线程完成
	//	std::cout << "开屏窗口线程完成" << std::endl;
	//};
	//std::thread cb(createSplashScreenCallback);
}

void drawUI(short progress) {
	//std::cout << "WM_PAINT" << loadStatus << std::endl;
	// 一切完成。来画点什么东东验证一下它吧！
	//auto drawRectWithShadow = [](D2D1_RECT_F rectangle, bool activeColor) {
	//	// 创建一个兼容的渲染目标
	//	Microsoft::WRL::ComPtr<ID2D1BitmapRenderTarget> bitmapRenderTarget;
	//	dc->CreateCompatibleRenderTarget(&bitmapRenderTarget);
	//	bitmapRenderTarget->BeginDraw();

	//	// 创建一个纯色刷子
	//	Microsoft::WRL::ComPtr<ID2D1SolidColorBrush> rectBrush;
	//	bitmapRenderTarget->CreateSolidColorBrush(activeColor ? D2D1::ColorF(0.2, 0.45, 0.95, 1) : D2D1::ColorF(0.5, 0.5, 0.5, 0.5), &rectBrush);

	//	// 在位图渲染目标上填充矩形
	//	bitmapRenderTarget->FillRectangle(&rectangle, rectBrush.Get());

	//	// 获取位图
	//	Microsoft::WRL::ComPtr<ID2D1Bitmap> rectBitmap;
	//	bitmapRenderTarget->GetBitmap(&rectBitmap);

	//	// 创建阴影效果
	//	Microsoft::WRL::ComPtr<ID2D1Effect> shadowEffect;
	//	dc->CreateEffect(CLSID_D2D1Shadow, &shadowEffect);

	//	// 设置阴影效果的输入为位图，设置阴影参数
	//	shadowEffect->SetInput(0, rectBitmap.Get());
	//	shadowEffect->SetValue(D2D1_SHADOW_PROP_BLUR_STANDARD_DEVIATION, 6.0f);
	//	D2D1_VECTOR_4F color = { 0.2, 0.45, 0.95, 0.5 };
	//	if (!activeColor) color = { 0.5, 0.5, 0.5, 0.25 };
	//	shadowEffect->SetValue(D2D1_SHADOW_PROP_COLOR, color);

	//	// 绘制阴影效果
	//	dc->DrawImage(shadowEffect.Get());
	//	bitmapRenderTarget->EndDraw();
	//	
	//	SafeRelease(bitmapRenderTarget.GetAddressOf());
	//	SafeRelease(rectBrush.GetAddressOf());
	//	SafeRelease(rectBitmap.GetAddressOf());
	//	SafeRelease(shadowEffect.GetAddressOf());
	//};

	// 画色块有了这些就是很简单的啦，因为 ID2D1DeviceContext 继承自 ID2D1RenderTarget，因此可以用 dc->xxxx 的方式来画画
	dc->BeginDraw();
	dc->Clear();


	// FFBox 图标
	dc->DrawBitmap(FFBoxBitmap, { 32 * zoomFactor, 0, 160 * zoomFactor, 128 * zoomFactor });

	// 进度条
	Microsoft::WRL::ComPtr<ID2D1SolidColorBrush> brush;
	// 刷子最好复用, 这里作为例子没有处理, 要记得喵
	D2D_RECT_F rc1 = {
		.left = 0.4f * zoomFactor,
		.top = 152.4f * zoomFactor,
		.right = 191.6f * zoomFactor,
		.bottom = 159.6f * zoomFactor
	};
	dc->CreateSolidColorBrush(D2D1::ColorF(0.5, 0.5, 0.5, 0.25), brush.GetAddressOf());
	dc->FillRectangle(rc1, brush.Get());
	SafeRelease(brush.GetAddressOf());
	dc->CreateSolidColorBrush(D2D1::ColorF(0.5, 0.5, 0.5, 0.25), brush.GetAddressOf());
	dc->DrawRectangle(rc1, brush.Get(), 0.8f * zoomFactor);
	SafeRelease(brush.GetAddressOf());
	//drawRectWithShadow(rc1, false);
	//dc->EndDraw();
	//dc->BeginDraw();
	D2D_RECT_F rc2 = {
		.left = 0.4f * zoomFactor,
		.top = 152.4f * zoomFactor,
		.right = 191.6f * (progress / 5.0f) * zoomFactor,
		.bottom = 159.6f * zoomFactor
	};
	dc->CreateSolidColorBrush(D2D1::ColorF(0.2, 0.45, 0.95, 1), brush.GetAddressOf());
	dc->FillRectangle(rc2, brush.Get());
	SafeRelease(brush.GetAddressOf());
	dc->CreateSolidColorBrush(D2D1::ColorF(0.6, 0.733, 1, 1), brush.GetAddressOf());
	dc->DrawRectangle(rc2, brush.Get(), 0.8f * zoomFactor);
	SafeRelease(brush.GetAddressOf());
	//drawRectWithShadow(rc2, true);

	// TODO 记得查一下EndDraw的用法喵
	// 这里其实是不完全正确的
	// 因为...诶嘿有些图形API画到一半居然会丢设备，然后要重新创建资源...
	TryThrow("draw GUI", dc->EndDraw());
	swapChain->Present(1, 0);
	// 提交, 让DirectComposition去完成混合
	TryThrow("commit drawcall", dCompDevice->Commit());
}

// 检查hr, 失败抛出TE异常
static inline void TryThrow(const char* active, HRESULT hr)
{
	if (FAILED(hr))
	{
		std::cout << std::format(
			"Failed to {}, HRESULT = {:#x}",
			active,
			static_cast<uint32_t>(hr)
		) << std::endl;
	}
}

// 微软：单纯调用一下 d2d1 相关指针的 Release 方法
template <class T> void SafeRelease(T** ppT)
{
	if (*ppT)
	{
		(*ppT)->Release();
		*ppT = NULL;
	}
}

// 窗口消息处理
LRESULT CALLBACK WindowMsgProcess(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
	switch (uMsg)
	{
	case WM_SHOWWINDOW:
		zhihuPaintPrep(hWnd);

		// 位图相关
		IWICImagingFactory* pWICFactory;
		// 初始化位图
		CoInitialize(nullptr);
		CoCreateInstance(CLSID_WICImagingFactory, nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pWICFactory));
		HRESULT res;
		if (res = LoadBitmapFromFile(dc.Get(), pWICFactory, TEXT("resources/app/app/renderer/images/icon_256.png"), 0, 0, &FFBoxBitmap)) {
			// fallback 到系统图像
			TCHAR systemPath[MAX_PATH];
			GetSystemDirectory(systemPath, MAX_PATH);
			std::wstring filePath = systemPath;
			filePath += L"\\SecurityAndMaintenance_Alert.png";
			if (res = LoadBitmapFromFile(dc.Get(), pWICFactory, filePath.c_str(), 0, 0, &FFBoxBitmap)) {
				std::cout << "无法加载启动画面：" << GetLastError() << std::endl;
				break;
			}
		}
		pWICFactory->Release();
		break;
	case WM_PAINT:
	{
		short progress = 0;
		short num = loadStatus;
		while (num)
		{
			progress += num & 1;
			num >>= 1;
		}
		drawUI(progress);

		if (progress == 5) {
			Sleep(150);
			DestroyWindow(hWnd);
		}
		break;
	}
	case WM_NCHITTEST:
		return HTCAPTION; // 返回 HTCAPTION 表示整个窗口都可以用来拖动
		break;
	case WM_DESTROY:
		SafeRelease(&FFBoxBitmap);
		SafeRelease(d2dDevice.GetAddressOf());
		SafeRelease(d2dFactory.GetAddressOf());
		SafeRelease(dc.GetAddressOf());
		SafeRelease(bitmap.GetAddressOf());
		// SafeRelease(dWriteFactory.GetAddressOf());
		SafeRelease(d3dDevice.GetAddressOf());
		SafeRelease(dxgiDevice.GetAddressOf());
		SafeRelease(dxgiFactory.GetAddressOf());
		SafeRelease(surface.GetAddressOf());
		SafeRelease(swapChain.GetAddressOf());
		SafeRelease(dCompDevice.GetAddressOf());
		SafeRelease(composTarget.GetAddressOf());
		SafeRelease(dCompVisual.GetAddressOf());
		break;
	default:
		return DefWindowProc(hWnd, uMsg, wParam, lParam); // 缺省处理
	}
	return 0;
}

HRESULT LoadBitmapFromFile(
	ID2D1RenderTarget* pRenderTarget,
	IWICImagingFactory* pIWICFactory,
	PCWSTR uri,
	UINT destinationWidth, UINT destinationHeight,
	ID2D1Bitmap** ppBitmap
)
{
	IWICBitmapDecoder* pDecoder = NULL;
	IWICBitmapFrameDecode* pSource = NULL;
	IWICStream* pStream = NULL;
	IWICFormatConverter* pConverter = NULL;
	IWICBitmapScaler* pScaler = NULL;

	HRESULT hr = pIWICFactory->CreateDecoderFromFilename(
		uri,
		NULL,
		GENERIC_READ,
		WICDecodeMetadataCacheOnLoad,
		&pDecoder
	);
	if (SUCCEEDED(hr))
	{
		// Create the initial frame.
		hr = pDecoder->GetFrame(0, &pSource);
	}
	if (SUCCEEDED(hr))
	{
		// Convert the image format to 32bppPBGRA
		// (DXGI_FORMAT_B8G8R8A8_UNORM + D2D1_ALPHA_MODE_PREMULTIPLIED).
		hr = pIWICFactory->CreateFormatConverter(&pConverter);
	}

	if (SUCCEEDED(hr))
	{
		hr = pConverter->Initialize(
			pSource,
			GUID_WICPixelFormat32bppPBGRA,
			WICBitmapDitherTypeNone,
			NULL,
			0.f,
			WICBitmapPaletteTypeMedianCut
		);
	}
	if (SUCCEEDED(hr))
	{

		// Create a Direct2D bitmap from the WIC bitmap.
		hr = pRenderTarget->CreateBitmapFromWicBitmap(
			pConverter,
			NULL,
			ppBitmap
		);
	}

	SafeRelease(&pDecoder);
	SafeRelease(&pSource);
	SafeRelease(&pStream);
	SafeRelease(&pConverter);
	SafeRelease(&pScaler);

	return hr;
}

// 知乎上的绘图初始化函数
void zhihuPaintPrep(HWND hWnd) {
	const D2D1_FACTORY_OPTIONS options =
	{
	#if _DEBUG
		D2D1_DEBUG_LEVEL_INFORMATION,
	#else
		D2D1_DEBUG_LEVEL_NONE,
	#endif // _DEBUG
	};

	// 获取窗口大小
	RECT rc;
	GetClientRect(hWnd, &rc);

	D2D1_SIZE_U size = D2D1::SizeU(rc.right, rc.bottom);

	// 接下来是知乎的初始化
	TryThrow("create Direct2D factory", D2D1CreateFactory(
		D2D1_FACTORY_TYPE_SINGLE_THREADED,
		options,
		d2dFactory.GetAddressOf()
	));
	// Direct3D 11
	TryThrow("create Direct3D 11 device", D3D11CreateDevice(
		nullptr,
		D3D_DRIVER_TYPE_HARDWARE,
		nullptr,
		D3D11_CREATE_DEVICE_BGRA_SUPPORT,
		nullptr, 0,
		D3D11_SDK_VERSION,
		d3dDevice.GetAddressOf(),
		nullptr,
		nullptr
	));
	// DXGI
	TryThrow("create DXGI device", d3dDevice.As(
		&dxgiDevice
	));
	TryThrow("create DXGI factory", CreateDXGIFactory2(
		// DXGI_CREATE_FACTORY_DEBUG,
		0,
		__uuidof(dxgiFactory),
		reinterpret_cast<void**>(dxgiFactory.GetAddressOf())
	));
	// DirectWrite
	//TryThrow("create DirectWrite factory", DWriteCreateFactory(
	//	DWRITE_FACTORY_TYPE_SHARED,
	//	__uuidof(IDWriteFactory),
	//	reinterpret_cast<IUnknown**>(dWriteFactory.GetAddressOf())
	//));
	// D2D设备
	TryThrow("create Direct2D device", d2dFactory->CreateDevice(
		dxgiDevice.Get(),
		d2dDevice.GetAddressOf()
	));
	// Direct Composition
	TryThrow("create DirectComposition device", DCompositionCreateDevice(
		dxgiDevice.Get(),
		__uuidof(dCompDevice),
		reinterpret_cast<void**>(dCompDevice.GetAddressOf())
	));
	// Direct Composition混合目标
	TryThrow("create DirectComposition target", dCompDevice->CreateTargetForHwnd(
		hWnd,
		// 因为我的窗口不是TOPMOST的, 因此是false
		// 如果加了TOPMOST样式要改成true哈
		true,
		composTarget.GetAddressOf()
	));
	// Visual
	TryThrow("create DirectComposition visual", dCompDevice->CreateVisual(
		dCompVisual.GetAddressOf()
	));

	DXGI_SWAP_CHAIN_DESC1 description =
	{
		// 窗口客户区宽度放到这里~
		// 即right - left
		.Width = static_cast<UINT>(size.width),
		// 窗口客户区的高度放到这里~
		// 即bottom - top
		.Height = static_cast<UINT>(size.height),
		// 自然的...透明的肯定是RGBA
		.Format = DXGI_FORMAT_B8G8R8A8_UNORM,
		.SampleDesc = {
			.Count = 1
		},
		.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT,
		.BufferCount = 2,
		.Scaling = DXGI_SCALING_STRETCH,
		.SwapEffect = DXGI_SWAP_EFFECT_FLIP_SEQUENTIAL,
		// 混合模式
		// 这个模式带来的就是半透明的感觉
		.AlphaMode = DXGI_ALPHA_MODE_PREMULTIPLIED,
	};
	TryThrow("create swapchain", dxgiFactory->CreateSwapChainForComposition(
		dxgiDevice.Get(),
		&description,
		nullptr,
		swapChain.GetAddressOf()
	));

	// 然后，创建 surface
	//TryThrow("create DXGI surface", swapChain->GetBuffer(
	//	// Buffer index
	//	0,
	//	__uuidof(surface),
	//	reinterpret_cast<void**>(surface.GetAddressOf())
	//));
	swapChain->GetBuffer(0, __uuidof(surface), &surface);

	// 回到 D2D，需要准备一个 DC
	TryThrow("create Direct2D device context", d2dDevice->CreateDeviceContext(
		D2D1_DEVICE_CONTEXT_OPTIONS_NONE,
		dc.GetAddressOf()
	));

	// 然后给它绑定一张位图，类似 GDI 那样
	D2D1_BITMAP_PROPERTIES1 properties =
	{
		.pixelFormat = {
			.format = DXGI_FORMAT_B8G8R8A8_UNORM,
			.alphaMode = D2D1_ALPHA_MODE_PREMULTIPLIED,
		},
		.bitmapOptions = D2D1_BITMAP_OPTIONS_TARGET
						| D2D1_BITMAP_OPTIONS_CANNOT_DRAW
	};
	TryThrow("create Direct2D bitmap for DXGI", dc->CreateBitmapFromDxgiSurface(
		surface.Get(),
		properties,
		bitmap.GetAddressOf()
	));
	// 绑定到dc
	dc->SetTarget(bitmap.Get());

	// 现在就差不多了，最后，告诉 DirectComposition 要显示什么内容，以及要混合什么
	dCompVisual->SetContent(swapChain.Get());
	composTarget->SetRoot(dCompVisual.Get());
}

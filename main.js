const electron = require("electron");
// import electron from "electron";
const {app, ipcMain, BrowserWindow, session} = electron;

let mainWindow;

function createMainWindow () {
	mainWindow = new BrowserWindow({
		width: 960,
		height: 640,
		minWidth: 600,
		minHeight: 300,
		resizable: true,
		maximizable: true,
		center: true,
		transparent: true,
		frame: false,
		webPreferences: {
			plugins: true,
			allowDisplayingInsecureContent: true,
			allowRunningInsecureContent: true,
			nodeIntegration: true
		}
	});
	mainWindow.loadFile('index.html');
	mainWindow.loadURL(__dirname + "/index.html");
	mainWindow.show();
	// mainWindow.openDevTools();
}

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on("ready", () => {
	createMainWindow();

	// 退出确认
    var exitConfirm = false;
    mainWindow.on('close', (e) => {
		if (!exitConfirm) {
			e.preventDefault();
			mainWindow.webContents.send('exitConfirm');  
		}
    })
    ipcMain.on('exitConfirm', () => {
		exitConfirm = true;
    })
    ipcMain.on('close', () => {
		mainWindow.close();
	});
});

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
	// 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
	// 否则绝大部分应用及其菜单栏会保持激活。
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// 在macOS上，当单击dock图标并且没有其他窗口打开时，
	// 通常在应用程序中重新创建一个窗口。
	if (mainWindow === null) {
		createWindow()
	}
})

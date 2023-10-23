import { Menu, MenuItem } from 'electron';

export function getOs() {
	let platform : NodeJS.Platform = process.platform;
	switch (platform) {
		case 'win32':
			return 'Windows';
		case 'linux':
			return 'Linux';
		case 'darwin':
			return 'MacOS';
		default:
			return 'unknown';
	}
};

export function convertFFBoxMenuToElectronMenuTemplate(menuStr: string, webContents: Electron.WebContents): Partial<MenuItem>[] {
	const inputObj = JSON.parse(menuStr) as any[];
	function dfs(input: any[]): Partial<MenuItem>[] {
		const output: Partial<MenuItem>[] = [];
		for (const inputMenuItem of input) {
			const value = inputMenuItem.value ?? inputMenuItem.label;
			const label = inputMenuItem.label ?? inputMenuItem.value;
			const outputMenuItem: Partial<Electron.MenuItem> = {
				checked: inputMenuItem.checked ?? false,
				enabled: inputMenuItem.disabled === true ? false : true,
				id: value,
				label,
				type: inputMenuItem.type,
				toolTip: inputMenuItem.toolTip,
				click: (event: Event) => webContents.send('menuItemClicked', value),
				submenu: inputMenuItem.subMenu ? dfs(inputMenuItem.subMenu) as any : undefined,
			};
			// if ('submenu' in inputMenuItem) {
			// 	const menu = dfs(inputMenuItem.submenu);
			// 	outputMenuItem.submenu = menu;
			// }
			output.push(outputMenuItem);
		}
		// console.log('buildFrom', output);
		// const menu = Menu.buildFromTemplate(output as any);
		return output;
	}
	const outputObj = dfs(inputObj);
	return outputObj;
}

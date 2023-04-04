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

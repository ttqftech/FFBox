import { FFBoxService } from './FFBoxService';

const service = new FFBoxService();
service.on('serverError', () => {
	process.exit();
});
service.on('serverClose', () => {
	process.exit();
});

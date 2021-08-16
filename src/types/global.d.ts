import { FFBoxService } from "../service/FFBoxService";

declare global {
	interface Window {
		ffboxService: FFBoxService;
	}
	interface Element {
		focus(): void;
		readonly offsetLeft: number;
		readonly offsetTop: number;
		readonly offsetWidth: number;
		readonly offsetHeight: number;
	}
	interface EventTarget {
		focus(): void;
		readonly offsetLeft: number;
		readonly offsetTop: number;
		readonly offsetWidth: number;
		readonly offsetHeight: number;
		getBoundingClientRect(): DOMRect;
		className: string;
		parentElement?: Element;
		selectionStart: number;
		selectionEnd: number;
		value: any;
	}
}

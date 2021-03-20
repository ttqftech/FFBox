import { FFBoxService } from "../service/FFBoxService";

declare global {
    interface Window {
        ffboxService: FFBoxService;
    }
}
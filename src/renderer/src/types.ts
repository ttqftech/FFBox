import { Server as ServerData } from '@common/types';
import { ServiceBridge } from '@renderer/bridges/serviceBridge'

export interface Server {
	data: ServerData;
	entity: ServiceBridge;
}

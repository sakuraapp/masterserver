import { Service, ServiceObject } from '.'
import { Manager } from '../manager'

export class ServiceManager extends Manager<ServiceObject, Service> {
    createItem(data: ServiceObject): Service {
        return new Service(this.server, data)
    }

    async createWatcher() {
        return await this.client.api.v1.watch.services.getObjectStream()
    }
}

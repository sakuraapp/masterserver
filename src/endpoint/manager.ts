import { Stream } from 'stream'
import { Endpoint, EndpointObject } from '.'
import { Manager } from '../manager'

export class EndpointManager extends Manager<EndpointObject, Endpoint> {
    createItem(data: EndpointObject): Endpoint {
        return new Endpoint(this.server, data)
    }

    async createWatcher(): Promise<Stream> {
        return await this.client.api.v1.watch.endpoints.getObjectStream()
    }
}

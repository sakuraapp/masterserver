import { DataObject, DataType } from '../manager'
import { Metadata, Reference, Protocol } from '../types'

export interface SubsetAddress {
    ip: string
    nodeName?: string
    targetRef?: Reference
}

export interface SubsetPort {
    name?: string
    port: number
    protocol: Protocol
}

export interface Subset {
    addresses: SubsetAddress[]
    ports: SubsetPort[]
}

export interface EndpointObject extends DataObject {
    apiVersion?: string
    kind?: string
    metadata: Metadata
    subsets: Subset[]
}

export class Endpoint extends DataType<EndpointObject> {
    create() {
        return this.client.api.v1
            .ns('default')
            .endpoints.post({ body: this.data })
    }
}

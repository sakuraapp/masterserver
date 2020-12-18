import { DataObject, DataType } from '../manager'
import { Metadata, Protocol } from '../types'

type ServiceType = 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName'

export interface ServicePort {
    name?: 'string'
    protocol: Protocol
    port: number
    targetPort: number
}

export interface ServiceObject extends DataObject {
    apiVersion?: string
    kind?: string
    metadata: Metadata
    spec: {
        ports: ServicePort[]
        selector: {
            [key: string]: any
        }
        clusterIP: string
        type: ServiceType
        sessionAffinity: 'ClientIP' | 'None'
    }
}

export class Service extends DataType<ServiceObject> {
    create() {
        return this.client.api.v1
            .ns('default')
            .services.post({ body: this.data })
    }
}

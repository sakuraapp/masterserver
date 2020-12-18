import { EventEmitter } from 'events'
import { ApiRoot } from 'kubernetes-client'
import { NamespaceManager } from './namespace/manager'
import MasterServer from './net/server'
import { NodeManager } from './node/manager'
import { RemoteServiceManager } from './remote-service/manager'
import { RoomManager } from './room/manager'
import { SecretManager } from './secret/manager'
import { ServiceManager } from './service/manager'

export class Child extends EventEmitter {
    public readonly server: MasterServer

    get client(): ApiRoot {
        return this.server.client
    }

    get namespaceManager(): NamespaceManager {
        return this.server.namespaceManager
    }

    get nodeManager(): NodeManager {
        return this.server.nodeManager
    }

    get roomManager(): RoomManager {
        return this.server.roomManager
    }

    get secretManager(): SecretManager {
        return this.server.secretManager
    }

    get serviceManager(): ServiceManager {
        return this.server.serviceManager
    }

    get remoteServiceManager(): RemoteServiceManager {
        return this.server.remoteServiceManager
    }

    constructor(server: MasterServer, registerEvents = true) {
        super()

        this.server = server

        if (registerEvents) {
            this.registerEvents()
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    registerEvents(): void {}
}

export interface Metadata {
    name: string
    namespace?: string
    selfLink?: string
    uid: string
    resourceVersion?: string
    creationTimestamp?: string
    labels?: {
        [key: string]: string
    }
    annotations?: {
        [key: string]: string
    }
    managedFields?: Array<{
        manager: string
        operation: string // Update
        apiVersion: string
        time: string
        fieldsType: string
        fieldsV1: {
            'f:metadata'?: any
            'f:status'?: any
        }
    }>
}

export interface Reference {
    kind: string
    namespace: string
    name: string
    uid: string
    resourceVersion: string
}

export type AddressType =
    | 'InternalIP'
    | 'ExternalIP'
    | 'InternalDNS'
    | 'ExternalDNS'
    | 'Hostname'

export interface Address {
    type: AddressType
    address: string
}

export type Protocol = 'TCP' | 'UDP' | 'SCTP'

export interface Condition {
    // NOTE: This enum is NOT complete
    type:
        | 'Ready'
        | 'DiskPressure'
        | 'MemoryPressure'
        | 'PIDPressure'
        | 'NetworkUnavailable'
        | 'Initialized'
    status: 'True' | 'False' | 'Unknown'
    lastHeartbeatTime?: string
    lastProbeTime?: string
    lastTransitionTime: string
    reason: string
    message: string
}

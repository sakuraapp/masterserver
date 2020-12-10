import { EventEmitter } from 'events'
import MasterServer from './net/server'

export class Child extends EventEmitter {
    public readonly server: MasterServer

    get client() {
        return this.server.client
    }

    get namespaceManager() {
        return this.server.namespaceManager
    }

    get nodeManager() {
        return this.server.nodeManager
    }

    get roomManager() {
        return this.server.roomManager
    }

    get serviceManager() {
        return this.server.serviceManager
    }

    constructor(server: MasterServer, registerEvents = true) {
        super()

        this.server = server

        if (registerEvents) {
            this.registerEvents()
        }
    }

    registerEvents() {}
}

export interface Metadata {
    name: string
    selfLink?: string
    uid: string
    resourceVersion?: string
    creationTimestamp?: string
    labels?: {
        [key: string]: string
    },
    annotations?: {
        [key: string]: string
    },
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

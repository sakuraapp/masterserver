import geoip, { Lookup } from 'geoip-lite'
import { DataType } from '../manager'
import { FileSize } from '../utils/filesize'
import { Address, AddressType, Metadata, Condition } from '../types'
import { getCountryName } from '../utils/countrycode'
import { Room } from '~/room'
import { ChakraClient } from '@sakuraapp/chakra-client'
import { isDev, isEnvVarTruthy } from '../utils'

export interface NodeCapacity {
    cpu: string
    'ephemeral-storage': string
    memory: string
    pods: string
}

export interface NodeStatus {
    capacity: NodeCapacity
    allocatable: NodeCapacity
    conditions: Condition[]
    addresses: Address[]
    nodeInfo: {
        machineID: string
        systemUUID: string
        bootID: string
        kernelVersion: string
        osImage: string
        containerRuntimeVersion: string
        kubeletVersion: string
        kubeProxyVersion: string
        operatingSystem: string
        architecture: string
    }
    images: {
        names: string[]
        sizeBytes: number
    }
}

export interface NodeObject {
    metadata: Metadata
    //spec: Object
    status: NodeStatus
}

export class Node extends DataType<NodeObject> {
    private lookup: Lookup

    get metadata(): Metadata {
        return this.data.metadata
    }

    get status(): NodeStatus {
        return this.data.status
    }

    get capacity(): NodeCapacity {
        return this.status.capacity
    }

    get memory(): number {
        return FileSize.parse(this.capacity.memory)
    }

    get allocatableMemory(): number {
        return FileSize.parse(this.status.allocatable.memory)
    }

    get cpu(): string {
        return this.capacity.cpu
    }

    get role(): string {
        const prefix = 'node-role.kubernetes.io/'
        const value = Object.keys(this.metadata.labels).find((key) =>
            key.startsWith(prefix)
        )

        if (value) {
            return value.substr(prefix.length)
        } else {
            return value
        }
    }

    get externalIP(): string {
        return this.getAddress('ExternalIP')
    }

    get internalIP(): string {
        return this.getAddress('InternalIP')
    }

    get location(): Lookup {
        return (
            this.lookup ||
            (this.lookup = geoip.lookup(
                this.externalIP || this.server.externalIP
            ))
        )
    }

    get country(): string {
        return getCountryName(this.location.country)
    }

    get prettyLocation(): string {
        return `${this.location.city}, ${this.country}`
    }

    get rooms(): Room[] {
        return this.roomManager.items.filter(
            (room) => room.data.spec.nodeName === this.metadata.name
        )
    }

    get maxRooms(): number {
        return Math.floor(
            this.allocatableMemory /
                FileSize.parse(process.env.ROOM_MEMORY_LIMIT)
        )
    }

    get availableRooms(): number {
        return this.maxRooms - this.rooms.length
    }

    get chakraHost(): string {
        return this.roomManager.masterServerHost
    }

    get playingUrl(): string {
        const protocol = isEnvVarTruthy('CHAKRA_USE_SSL') ? 'wss' : 'ws'
        const host = isDev() ? '127.0.0.1' : this.server.externalIP
        
        return `${protocol}://${host}:${process.env.CHAKRA_PORT}`
    }

    get chakraClient(): ChakraClient {
        return this.server.chakraClient
    }

    getAddress(type: AddressType): string {
        return this.status.addresses.find((addr) => addr.type === type)?.address
    }

    isBusy(): boolean {
        return this.nodeManager.busyNodes.includes(this.metadata.uid)
    }
}

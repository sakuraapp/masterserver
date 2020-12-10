import { DataType } from '../manager'
import { FileSize } from '../utils/filesize'
import { Address, AddressType, Metadata } from '../types'

export interface NodeCapacity {
    cpu: string
    'ephemeral-storage': string
    memory: string
    pods: string
}

export interface NodeStatus {
    capacity: NodeCapacity
    allocatable: NodeCapacity
    conditions: {
        type: string
        status: 'True' | 'False'
        lastHeartbeatTime: string
        lastTransitionTime: string
        reason: string
        message: string
    }
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
        const capacity = this.capacity

        return FileSize.parse(capacity.memory)
    }

    get cpu(): string {
        return this.capacity.cpu
    }

    get role(): string {
        const prefix = 'node-role.kubernetes.io/'
        const value = Object.keys(this.metadata.labels).find((key) => key.startsWith(prefix))

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

    getAddress(type: AddressType): string {
        return this.status.addresses.find((addr) => addr.type === type)?.address
    }
}

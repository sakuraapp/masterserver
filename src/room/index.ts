import { Node, NodeCapacity } from '../node'
import { DataObject, DataType } from '../manager'
import { Metadata, Protocol } from '../types'

const { env } = process
const DEFAULT_STREAM_CONFIG = {
    fps: env.VIDEO_FPS || 30,
    resolution: env.DISPLAY_WIDTH
        ? `${env.DISPLAY_WIDTH}x${env.DISPLAY_HEIGHT}`
        : '1280x720',
    bitrate: env.VIDEO_BITRATE || '500k',
    audioBitrate: env.AUDIO_BITRATE || 44100,
    videoCodec: env.VIDEO_CODEC || 'libx264',
    audioCodec: env.AUDIO_CODEC || 'aac',
    bufferSize: env.BUFFER_SIZE || '100M',
    format: env.FORMAT || 'rtp',
}

export interface RoomMetadata extends Metadata {
    generateName: string
    //ownerReferences: []
}

export interface Volume {
    name: string
    secret: {
        secretName: string
        defaultMode: number
    }
}

export interface VolumeMount {
    name: string
    readOnly: boolean
    mountPath: string
}

export interface SecurityContext {
    capabilities: Capabilities
    readOnlyRootFilesystem: boolean
    allowPrivilegeEscalation: boolean
}

export interface Capabilities {
    add: string[]
    drop: string[]
}

export interface ContainerPort {
    name: string
    containerPort: number
    protocol: Protocol
}

export interface ContainerStatus {
    name: string
    state: {
        running: {
            startedAt: string
        }
    }
    lastState: {
        terminated?: {
            exitCode: 0
            reason: string
            startedAt: string
            finishedAt: string
            containerID: string
        }
    }
    ready: boolean
    restartCount: string
    image: string
    imageID: string
    containerID: string
    started: boolean
}

export interface Container {
    name: string
    image: string
    args: string[]
    ports: ContainerPort[]
    resources: {
        limits: NodeCapacity
        requests: NodeCapacity
    }
    volumeMounts: VolumeMount[]
    terminationMessagePath: string
    terminationMessagePolicy: string
    imagePullPolicy: string
    securityContext: SecurityContext
}

export interface Toleration {
    operator: string
    effect: string
}

export interface RoomSpec {
    volumes: Volume[]
    containers: Container[]
    restartPolicy: string
    terminationGracePeriodSeconds: number
    dnsPolicy: string
    nodeSelector: {
        [key: string]: string
    }
    serviceAccountName: string
    serviceAccount: string
    nodeName: string
    securityContext: unknown
    schedulerName: string
    tolerations: Toleration[]
    priority: number
    enableServiceLinks: boolean
    preemptionPolicy: string
}

export interface RoomStatus {
    phase: string
    conditions: unknown[]
    hostIP: string
    podIP: string
    podIPs: { ip: string }[]
    startTime: string
    containerStatuses: ContainerStatus[]
}

export interface RoomObject extends DataObject {
    kind: string
    apiVersion: string
    metadata: RoomMetadata
    spec: RoomSpec
    status: RoomStatus
}

export class Room extends DataType<RoomObject> {
    public id: string
    public chakraPort: number

    private _node: Node

    get name(): string {
        return `room-${this.id}`.toLowerCase()
    }

    get node(): Node {
        return this._node || this.nodeManager.items.find(
            (node) => node.metadata.name === this.data.spec.nodeName
        )
    }

    get streamingUrl(): string {
        return `rtp://${this.node.chakraHost}:${this.chakraPort}`
    }

    get playingUrl(): string {
        return this.node.playingUrl
    }

    get controllerSvcName(): string {
        return `controller-${this.id}`
    }

    async deploy(node: Node): Promise<void> {
        await this.namespaceManager.ensureNamespace('rooms')

        if (node.isBusy()) {
            throw new Error('Node is busy')
        }

        this._node = node

        const streamInfo = await node.chakraClient.createStream(this.id)

        this.chakraPort = streamInfo.port

        const idx = this.nodeManager.busyNodes.push(node.metadata.uid) - 1
        const res = await this.client.api.v1.ns('rooms').pods.post({
            body: {
                apiVersion: 'v1',
                kind: 'Pod',
                metadata: {
                    name: this.name,
                    labels: {
                        room: this.id.toString(),
                        kind: 'room',
                        chakraPort: this.chakraPort.toString(),
                    },
                    namespace: 'rooms',
                },
                spec: {
                    nodeName: node.metadata.name,
                    volumes: [
                        {
                            name: 'dshm',
                            emptyDir: { medium: 'Memory' },
                        },
                    ],
                    containers: [
                        {
                            name: this.name,
                            image: process.env.ROOM_IMAGE_URL,
                            resources: {
                                limits: {
                                    cpu: process.env.ROOM_CPU_LIMIT,
                                    memory: process.env.ROOM_MEMORY_LIMIT,
                                },
                                requests: {
                                    cpu: process.env.ROOM_CPU_REQUESTS,
                                    memory: process.env.ROOM_MEMORY_REQUESTS,
                                },
                            },
                            volumeMounts: [
                                {
                                    mountPath: '/dev/shm',
                                    name: 'dshm',
                                },
                            ],
                            //imagePullPolicy: 'Always',
                            env: [
                                {
                                    name: 'ROOM_ID',
                                    value: this.id.toString(),
                                },
                                {
                                    name: 'MASTER_SERVER_HOST',
                                    value: this.roomManager.masterServerHost,
                                },
                                {
                                    name: 'MASTER_SERVER_PORT',
                                    value: this.server.info.port.toString(),
                                },
                                {
                                    name: 'STREAMING_URL',
                                    value: this.streamingUrl,
                                },
                                {
                                    name: 'STREAMING_TOKEN',
                                    value: this.server.serviceToken,
                                },
                                {
                                    name: 'CONTROLLER_SERVICE',
                                    value: this.controllerSvcName,
                                },
                                {
                                    name: 'STREAMS',
                                    value: JSON.stringify([
                                        DEFAULT_STREAM_CONFIG,
                                    ]),
                                },
                            ],
                        },
                    ],
                },
            },
        })

        this.nodeManager.busyNodes.splice(idx, 1)
    }

    delete() {
        return this.client.api.v1.ns('rooms').pods.delete(this.name)
    }
}

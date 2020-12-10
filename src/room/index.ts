import { Node } from '../node'
import { DataObject, DataType } from '../manager'
import { Metadata } from '../types'

export interface RoomMetadata extends Metadata {
    generateName: string
    //ownerReferences: []
}

export interface RoomSpec {
    //volumes: []
    //containers: []
    restartPolicy: string
    terminationGracePeriodSeconds: number
    dnsPolicy: string
    //nodeSelector: {}
    serviceAccountName: string
    serviceAccount: string
    nodeName: string
    //securityContext: {}
    schedulerName: string
    //tolerations: []
    priority: number
    enableServiceLinks: boolean
    preemptionPolicy: string
}

export interface RoomObject extends DataObject {
    kind: string
    apiVersion: string
    metadata: RoomMetadata
    spec: RoomSpec
    status: unknown
}

export class Room extends DataType<RoomObject> {
    public id: number

    async deploy(node: Node) {
        await this.namespaceManager.ensure('rooms')

        const name = `room-${this.id}`
        const res = await this.client.api.v1.ns('rooms').pods.post({
            body: {
                apiVersion: 'v1',
                kind: 'Pod',
                metadata: {
                    name,
                    labels: {
                        room: this.id.toString(),
                        kind: 'room',
                    },
                    namespace: 'rooms',
                },
                spec: {
                    nodeName: node.metadata.name,
                    volumes: [
                        {
                            name: 'dshm',
                            emptyDir: { medium: 'Memory' }
                        }
                    ],
                    containers: [
                        {
                            name,
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
                                    name: 'STREAMING_URL',
                                    value: this.roomManager.streamingUrl,
                                },
                                {
                                    name: 'STREAMING_TOKEN',
                                    value: 'abcd',
                                },
                            ],
                        }
                    ]
                }
            }
        })

        console.log(res.body)
        console.log(res.body.spec.containers)
    }
}

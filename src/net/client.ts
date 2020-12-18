import WebSocket from 'ws'
import MasterServer from './server'
import { Child } from '../types'
import { parseJSON } from '../utils'

export type PacketType = 'call' | 'watch' | 'callback'

export interface PacketData<T = unknown> {
    s?: string // service name
    n?: string // action name
    t: PacketType // action type
    d?: T // data
    i: string // id used for callbacks
}

export class Packet<T = unknown> {
    public readonly data: PacketData<T>
    public readonly client: Client

    get type(): string {
        return this.data.t
    }

    get service(): string {
        return this.data.s
    }

    constructor(data: PacketData<T>, client: Client) {
        this.data = data
        this.client = client
    }

    respond(data: unknown): void {
        this.client.write({
            d: data,
            t: 'callback',
            i: this.data.i,
        })
    }
}

export type ClientType = 'service' | 'user'

export class Client extends Child {
    public socket: WebSocket
    public authorized = false

    constructor(socket: WebSocket, server: MasterServer) {
        super(server, false)

        this.socket = socket
        this.registerEvents()
    }

    registerEvents(): void {
        this.socket.on('message', (data) => {
            const packet = parseJSON(data.toString('utf8'), null)

            if (packet) {
                if (!packet.t) {
                    throw new Error(`Malformed packet: ${packet}`)
                }

                this.remoteServiceManager.handle(new Packet(packet, this))
            }
        })

        this.socket.on('close', () => {
            this.emit('disconnect')
        })
    }

    write(data: PacketData): void {
        this.socket.send(JSON.stringify(data))
    }

    destroy(): void {
        this.socket.close()
    }
}

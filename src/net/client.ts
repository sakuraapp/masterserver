import { Socket } from 'net'
import MasterServer from './server'
import { Child } from '../types'
import { parseJSON } from '../utils'

type PacketType = 'call' | 'watch' | 'callback'

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

    get type() {
        return this.data.t
    }

    get service() {
        return this.data.s
    }

    constructor(data: PacketData<T>, client: Client) {
        this.data = data
        this.client = client
    }

    respond(data: unknown) {
        this.client.write({
            d: data,
            t: 'callback',
            i: this.data.i,
        })
    }
}

export type ClientType = 'service' | 'user'

export class Client extends Child {
    public socket: Socket
    public authorized = false

    get address() {
        return this.socket.remoteAddress.replace(/^.*:/, '')
    }

    constructor(socket: Socket, server: MasterServer) {
        super(server, false)

        this.socket = socket
        this.registerEvents()
    }

    registerEvents() {
        this.socket.on('data', (data) => {
            const packets: PacketData[] = data
                .toString('utf8')
                .split('\0')
                .map((rawPacket) => parseJSON(rawPacket, null))
                .filter((packet) => packet) // remove invalid packets

            packets.forEach((packet) => {
                if (!packet.t) {
                    throw new Error(`Malformed packet: ${packet}`)
                }

                this.serviceManager.handle(new Packet(packet, this))
            })
        })
    }

    inCluster() {
        return this.server.authorizedAddresses.includes(this.address)
    }

    write(data: PacketData) {
        this.socket.write(JSON.stringify(data) + '\0')
    }

    destroy() {
        this.socket.destroy()
    }
}

import { Child } from '../types'
import { Client, Packet, PacketType } from '../net/client'

type Handler = (packet: Packet) => void

interface Callback {
    i: string
    p?: Packet
    h?: Handler
}

export class RemoteService extends Child {
    public name: string
    public requiresAuth = true
    public remoteClient?: Client
    public callbacks: Callback[] = []

    findCallback(id: string): Callback {
        return this.callbacks.find((callback) => callback.i === id)
    }

    handle(packet: Packet): void {
        if (packet.data.t !== 'callback') {
            const id = `ms-${this.callbacks.length}`

            this.callbacks.push({ i: id, p: packet })
            this.remoteClient.write({
                d: packet.data.d,
                s: this.name,
                n: packet.data.n,
                i: id,
                t: packet.data.t,
            })
        } else {
            const callback = this.findCallback(packet.data.i)

            if (!callback) {
                return console.warn('Invalid callback')
            }

            if (callback.h) {
                callback.h(packet)
            } else {
                callback.p.respond(packet.data.d)
            }

            this.callbacks.splice(this.callbacks.indexOf(callback), 1)
        }
    }

    public send<T = unknown>(
        type: PacketType,
        path: string,
        data: unknown
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const parts = path.split('/')

            const targetName = parts.shift()
            const targetAction = parts.join('/')

            const service = this.remoteServiceManager.find(targetName)

            if (!service) {
                return reject(new Error(`Service "${targetName}" not found`))
            }

            const id = `${this.name}-${this.callbacks.length}`

            service.callbacks.push({
                i: id,
                h: (packet: Packet<T>) => {
                    const data = packet.data.d as { status?: number }

                    if (typeof data.status !== 'undefined') {
                        if (data.status === 200) {
                            resolve(packet.data.d)
                        } else {
                            reject(new Error(`Response code: ${data.status}`))
                        }
                    } else {
                        resolve(packet.data.d)
                    }
                },
            })

            service.remoteClient.write({
                s: targetName,
                n: targetAction,
                d: data,
                i: id,
                t: type,
            })
        })
    }

    public call<T = unknown>(path: string, data?: unknown): Promise<T> {
        return this.send('call', path, data)
    }

    public watch<T = unknown>(path: string, data: unknown): Promise<T> {
        return this.send('watch', path, data)
    }
}

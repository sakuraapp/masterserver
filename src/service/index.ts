import { Child } from '../types'
import { Client, Packet } from '../net/client'
import MasterServer from '~/net/server'

interface Callback {
    i: string
    p: Packet
}

export class Service extends Child {
    public name: string
    public requiresAuth = true
    public remoteClient?: Client
    public callbacks: Callback[] = []

    findCallback(id: string) {
        return this.callbacks.find(
            (callback) =>
                callback.i === id
        )
    }

    handle(packet: Packet) {
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
            console.log('haha')
            const callback = this.findCallback(packet.data.i)

            if (!callback) {
                return console.warn('Invalid callback')
            }

            callback.p.respond(packet.data.d)
            this.callbacks.splice(this.callbacks.indexOf(callback), 1)
        }
    }
}

import { Child } from '../types'
import { RemoteService } from '.'
import { Client, Packet } from '../net/client'

export class RemoteServiceManager extends Child {
    public services: RemoteService[] = []

    public find(name: string): RemoteService {
        return this.services.find((service) => service.name === name)
    }

    public findByClient(client: Client): RemoteService {
        return this.services.find((service) => service.remoteClient === client)
    }

    public has(name: string): boolean {
        return Boolean(this.find(name))
    }

    public register(service: RemoteService): void {
        this.services.push(service)
        this.emit('register', service)
    }

    public remove(service: RemoteService): void {
        const i = this.services.indexOf(service)

        if (i > -1) {
            this.services.splice(i, 1)
        }
    }

    public handle(packet: Packet): void {
        const { client } = packet
        const service = this.find(packet.data.s)

        if (packet.data.t === 'callback') {
            if (!this.findByClient(client)) {
                return console.warn('Invalid callback')
            }
        }

        if (!service) {
            return console.warn(`Service ${packet.data.s} not found.`)
        }

        if (!client.authorized && service.requiresAuth) {
            return packet.respond({ status: 401 })
        }

        service.handle(packet)
    }
}

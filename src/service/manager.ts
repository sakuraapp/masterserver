import { Child } from '../types'
import { Service } from '../service'
import { Client, Packet } from '../net/client'

export class ServiceManager extends Child {
    public services: Service[] = []

    public find(name: string) {
        console.log(name)
        return this.services.find(
            (service) =>
                service.name === name
        )
    }

    public findByClient(client: Client) {
        return this.services.find(
            (service) =>
                service.remoteClient === client
        )
    }

    public register(service: Service) {
        this.services.push(service)
    }

    public handle(packet: Packet) {
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

import { Packet } from '../../net/client'
import { RemoteService } from '..'

interface AuthData {
    s: string // service name
}

export class AuthService extends RemoteService {
    public name = 'auth'
    public requiresAuth = false

    handle(packet: Packet<AuthData>): void {
        const { client } = packet
        const { s } = packet.data.d

        if (!s) {
            return packet.respond({ status: 500 })
        }

        let service = this.remoteServiceManager.find(s)
        let register = false

        if (!service) {
            service = new RemoteService(this.server)
            register = true
        }

        service.name = s
        service.remoteClient = client

        if (register) {
            this.remoteServiceManager.register(service)
        }

        client.on('disconnect', () => {
            this.remoteServiceManager.remove(service)
        })

        client.authorized = true

        packet.respond({ status: 200 })
    }
}

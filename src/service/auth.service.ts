import { Packet } from '../net/client'
import { Service } from '.'

interface AuthData {
    t: string // token
    s: string // service name
}

export class AuthService extends Service {
    public name = 'auth'
    public requiresAuth = false

    handle(packet: Packet<AuthData>) {
        const { client } = packet
        const { t, s } = packet.data.d

        if (!t || !s) {
            return packet.respond({ status: 500 })
        }
        
        if (t === process.env.SERVER_SECRET && client.inCluster()) {
            // client is a service

            let service = this.serviceManager.find(s)
            let register = false
            
            if (!service) {
                service = new Service(this.server)
                register = true
            }

            service.name = s
            service.remoteClient = client
            
            if (register) {
                this.serviceManager.register(service)
            }

            client.authorized = true

            packet.respond({ status: 200 })
        } else {
            // authenticate through api
        }

        console.log(this.serviceManager.services)
    }
}
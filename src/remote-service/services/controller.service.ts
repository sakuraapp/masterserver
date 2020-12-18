import { Packet } from '../../net/client'
import { RemoteService } from '..'

interface DispatchData {
    type: string
    room: string
    data: {
        x?: number
        y?: number
        key?: string
    }
}

export class ControllerService extends RemoteService {
    public name = 'controller'
    public requiresAuth = false

    async handle(packet: Packet<DispatchData>): Promise<void> {
        const { type, data, room: roomId } = packet.data.d

        if (!type || !data || !roomId) {
            return packet.respond({ status: 400 })
        }

        const room = this.roomManager.find(roomId)

        if (!room) {
            return packet.respond({ status: 404 })
        }

        const serviceName = room.controllerSvcName

        try {
            const res = await this.call(
                `${serviceName}/dispatch`,
                packet.data.d
            )

            packet.respond(res)
        } catch (err) {
            console.error(err)
            packet.respond({ status: 500 })
        }
    }
}

import { RoomObject, Room } from '.'
import { Manager } from '../manager'
import { Node } from '../node'

export class RoomManager extends Manager<RoomObject, Room> {   
    private usePubAddress = false

    get streamingUrl(): string {
        let address

        if (this.usePubAddress) {
            address = this.server.externalIP
        } else {
            address = this.server.internalIP
        }

        return `rtmp://${address}:${process.env.STREAMING_SERVER_PORT}/live`
    }
    
    createItem(data: RoomObject) {
        return new Room(this.server, data)
    }

    async createWatcher() {
        return await this.client.api.v1.watch.ns('rooms').pods.getObjectStream()
    }

    registerEvents() {
        this.nodeManager.on('add-item', (node: Node) => {
            const extIP = node.externalIP

            if (extIP && extIP !== this.server.externalIP) {
                this.usePubAddress = true
            }

            const r = new Room(this.server)

            r.id = 1
            //r.deploy(this.nodeManager.items[0])
        })
    }
}

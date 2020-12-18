import { RoomObject, Room } from '.'
import { Manager } from '../manager'
import { Node } from '../node'
import { Stream } from 'stream'

export class RoomManager extends Manager<RoomObject, Room> {
    private usePubAddress = false

    get masterServerHost(): string {
        if (this.usePubAddress) {
            return this.server.externalIP
        } else {
            return this.server.internalIP
        }
    }

    createItem(data: RoomObject): Room {
        const room = new Room(this.server, data)

        room.id = data.metadata.labels.room
        room.chakraPort = Number(data.metadata.labels.chakraPort)

        return room
    }

    async createWatcher(): Promise<Stream> {
        return await this.client.api.v1.watch.ns('rooms').pods.getObjectStream()
    }

    public find(id: string): Room {
        return this.items.find((room) => room.id === id)
    }

    registerEvents(): void {
        this.nodeManager.on('add-item', (node: Node) => {
            const extIP = node.externalIP

            if (extIP && extIP !== this.server.externalIP) {
                this.usePubAddress = true
            }
        })
    }
}

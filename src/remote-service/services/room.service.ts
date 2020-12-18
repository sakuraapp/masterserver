import { Packet } from '../../net/client'
import { RemoteService } from '..'
import { Queue, Item } from '../../queue'
import { Room } from '../../room'
import MasterServer from '../../net/server'

interface DeployData {
    id: string
    location: string
    priority: boolean
}

interface DestroyData {
    id: string
}

// todo: catch errors and requeue
export class RoomService extends RemoteService {
    public name = 'room'

    private queue: Queue
    private pending = 0

    constructor(server: MasterServer) {
        super(server, false)

        this.queue = new Queue()
        this.registerEvents()
    }

    registerEvents(): void {
        this.remoteServiceManager.on('register', (service: RemoteService) => {
            if (service.name === 'api') {
                this.sendRooms()
            }
        })

        this.roomManager.on('add-item', (room: Room) => {
            // if (this.pending > 0) {
            if (this.remoteServiceManager.has('api')) {
                this.onDeployed(room)
            }
            // }
        })

        this.roomManager.on('remove-item', (room: Room) => {
            const node = room.node

            this.queue.next(node.prettyLocation)
        })

        this.queue.on('add', (item: Item) => {
            const nodes = this.nodeManager.getAvailableNodes(item.location)

            if (nodes.length > 0) {
                this.queue.next(item.location)
            }
        })

        this.queue.on('next', (item: Item) => {
            this.deploy(item)
        })
    }

    handle(packet: Packet<any>): void {
        switch (packet.data.n) {
            case 'deploy':
                this.handleDeploy(packet)
                break
            case 'destroy':
                this.handleDestroy(packet)
                break
        }
    }

    handleDeploy(packet: Packet<DeployData>): void {
        const { id, location, priority } = packet.data.d
        const position = this.queue.add({ id, location, priority })

        packet.respond({ status: 200, position })
    }

    deploy(item: Item): Promise<void> {
        const nodes = this.nodeManager.availableNodes

        if (nodes.length === 0) {
            throw new Error('No nodes available')
        }

        const room = new Room(this.server)

        this.pending++

        room.id = item.id
        return room.deploy(nodes[0])
    }

    async onDeployed(room: Room): Promise<void> {
        this.pending--

        await this.call('api/deploy', {
            id: room.id,
            playingUrl: room.playingUrl,
        })
    }

    async handleDestroy(packet: Packet<DestroyData>): Promise<void> {
        const room = this.roomManager.items.find(
            (room) => room.id === packet.data.d.id
        )

        if (room) {
            await room.delete()
        }

        packet.respond({ status: 200 })
    }

    private sendRooms(): Promise<void[]> {
        return Promise.all(
            this.roomManager.items.map((room) => this.onDeployed(room))
        )
    }
}

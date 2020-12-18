import { Stream } from 'stream'
import { Node, NodeObject } from '.'
import { Manager } from '../manager'

export const ALL_LOCATIONS = 'all'

export class NodeManager extends Manager<NodeObject, Node> {
    public master: Node
    public map: Map<string, Node[]> = new Map()

    public busyNodes: string[] = [] // array of node uids

    get availableRoomCount(): number {
        return this.getAvailableRoomCount()
    }

    get availableNodes(): Node[] {
        return this.getAvailableNodes()
    }

    getAvailableRoomCount(location?: string): number {
        const items = this.getAvailableNodes(location)

        return items.reduce((a, b) => a + b.availableRooms, 0)
    }

    getAvailableNodes(location = ALL_LOCATIONS): Node[] {
        return this.items.filter(
            (node) =>
                !node.isBusy() &&
                node.availableRooms > 0 &&
                (location === ALL_LOCATIONS || node.prettyLocation === location)
        )
    }

    createItem(data: NodeObject): Node {
        return new Node(this.server, data)
    }

    async createWatcher(): Promise<Stream> {
        return await this.client.api.v1.watch.nodes.getObjectStream()
    }

    registerEvents(): void {
        this.on('add-item', (node: Node) => {
            if (node.role === 'master') {
                this.master = node
            }

            /* const area = loc.timezone.split('/')
            const location = `${area[1]}, ${area[0]}` */

            const location = node.prettyLocation

            if (!this.map.has(location)) {
                this.map.set(location, [])
            }

            this.map.get(location).push(node)
        })
    }
}

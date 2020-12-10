import { Node, NodeObject } from '.'
import { Manager } from '../manager'

export class NodeManager extends Manager<NodeObject, Node> {
    public master: Node

    createItem(data: NodeObject) {
        return new Node(this.server, data)
    }

    async createWatcher() {
        return await this.client.api.v1.watch.nodes.getObjectStream()
    }

    registerEvents() {
        this.on('add-item', (node: Node) => {
            if (node.role === 'master') {
                this.master = node
            }
        })
    }
}

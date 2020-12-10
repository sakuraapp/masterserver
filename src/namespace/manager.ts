import { Namespace, NamespaceObject } from '.'
import { Manager } from '../manager'

export class NamespaceManager extends Manager<NamespaceObject, Namespace> {
    private namespaces: Namespace[] = []

    createItem(data: NamespaceObject) {
        return new Namespace(this.server, data)
    }

    async createWatcher() {
        return await this.client.api.v1.watch.namespaces.getObjectStream()
    }

    async ensure(name: string) {
        let namespace = this.namespaces.find((ns) => ns.data.metadata.name === name)

        if (namespace) {
            return true
        }

        namespace = new Namespace(this.server, {
            metadata: {
                uid: null,
                name: 'rooms',
            },
        })

        try {
            await namespace.create()
        } catch(err) {
            if (err.code !== 409) {
                throw err
            }
        }
    }
}
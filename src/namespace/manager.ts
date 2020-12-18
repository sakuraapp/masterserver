import { Stream } from 'stream'
import { Namespace, NamespaceObject } from '.'
import { Manager } from '../manager'

export class NamespaceManager extends Manager<NamespaceObject, Namespace> {
    createData(name: string): NamespaceObject {
        return {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: {
                name: name,
                uid: null,
            },
        }
    }

    createItem(data: NamespaceObject): Namespace {
        return new Namespace(this.server, data)
    }

    async createWatcher(): Promise<Stream> {
        return await this.client.api.v1.watch.namespaces.getObjectStream()
    }

    ensureNamespace(name: string): Promise<boolean> {
        return this.ensure({
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: {
                name: name,
                uid: null,
            },
        })
    }
}

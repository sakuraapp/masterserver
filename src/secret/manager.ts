import { ApiV1NamespacesNameSecretsName } from 'kubernetes-client'
import { Secret, SecretObject } from '.'
import { Manager } from '../manager'

export interface SearchOptions {
    name: string
    namespace: string
}

export class SecretManager extends Manager<SecretObject, Secret> {
    createItem(data: SecretObject): Secret {
        return new Secret(this.server, data)
    }

    async fetch(opts: SearchOptions): Promise<Secret> {
        const cached = this.items.find(
            (item) =>
                item.data.metadata.name === opts.name &&
                item.data.metadata.namespace === opts.namespace
        )

        if (cached) {
            return cached
        }

        const res = await this.client.api.v1
            .ns(opts.namespace)
            .secret(opts.name)
            .get()

        return res.body ? this.createItem(res.body) : null
    }

    async createWatcher() {
        return await this.client.api.v1.watch.secrets.getObjectStream()
    }
}

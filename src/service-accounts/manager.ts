import { ServiceAccount, ServiceAccountObject } from '.'
import { Manager } from '../manager'

export interface SearchOptions {
    name: string
    namespace: string
}

export class ServiceAccountManager extends Manager<
    ServiceAccountObject,
    ServiceAccount
> {
    createItem(data: ServiceAccountObject): ServiceAccount {
        return new ServiceAccount(this.server, data)
    }

    async createWatcher() {
        return await this.client.api.v1.watch.serviceaccounts.getObjectStream()
    }

    async fetch(opts: SearchOptions): Promise<ServiceAccount> {
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
            .serviceaccount(opts.name)
            .get()

        return res.body ? this.createItem(res.body) : null
    }
}

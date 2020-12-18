import { Secret } from '~/secret'
import { DataObject, DataType } from '../manager'
import { Metadata } from '../types'

interface SecretInfo {
    name: string
}

export interface ServiceAccountObject extends DataObject {
    apiVersion?: string
    kind?: string
    metadata: Metadata
    secrets: SecretInfo[]
}

export class ServiceAccount extends DataType<ServiceAccountObject> {
    create() {
        return this.client.api.v1
            .ns('default')
            .serviceaccounts.post({ body: this.data })
    }

    get secrets(): Secret[] {
        return this.secretManager.items.filter((secret) => {
            const name = secret.data.metadata.name
            const match = this.data.secrets.find((item) => item.name === name)

            return Boolean(match)
        })
    }
}

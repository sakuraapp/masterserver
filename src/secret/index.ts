import { decodeBase64 } from '../utils/crypto'
import { DataObject, DataType } from '../manager'
import { Metadata } from '../types'

export interface SecretData {
    'ca.crt': string
    namespace: string
    token: string
}

export interface SecretObject extends DataObject {
    apiVersion?: string
    kind?: string
    metadata: Metadata
    data: SecretData
}

export class Secret extends DataType<SecretObject> {
    create() {
        return this.client.api.v1
            .ns('default')
            .secrets.post({ body: this.data })
    }

    get namespace(): string {
        return decodeBase64(this.data.data.namespace)
    }

    get token(): string {
        return decodeBase64(this.data.data.token)
    }
}

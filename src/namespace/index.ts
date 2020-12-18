import { DataObject, DataType } from '../manager'
import { Metadata } from '../types'

export interface NamespaceObject extends DataObject {
    apiVersion?: string
    kind?: string
    metadata: Metadata
    spec?: {
        finalizers: string[]
    }
    status?: {
        phase: string
    }
}

export class Namespace extends DataType<NamespaceObject> {
    create() {
        return this.client.api.v1.namespaces.post({ body: this.data })
    }
}

import { Client1_13 as K8sClient, ApiRoot } from 'kubernetes-client'
import { NamespaceManager } from '../namespace/manager'
import { Node } from '../node'
import { NodeManager } from '../node/manager'
import { RoomManager } from '../room/manager'
import { Address, AddressType } from '../types'
import { getServerInfo } from '../utils'
import { createServer, Server } from 'net'
import { Client } from './client'
import { ServiceManager } from '../service/manager'
import { AuthService } from '../service/auth.service'

export interface ServerInfo {
    addresses: Address[]
    port: number
}

export default class MasterServer {
    private clients: Client[] = []

    public client: ApiRoot
    public server: Server
    
    public namespaceManager: NamespaceManager
    public nodeManager: NodeManager
    public roomManager: RoomManager
    public serviceManager: ServiceManager

    public info: ServerInfo

    get externalIP(): string {
        return this.getAddress('ExternalIP')
    }

    get internalIP(): string {
        return this.getAddress('InternalIP')
    }

    get authorizedAddresses() {
        return [
            '127.0.0.1',
            this.externalIP,
            this.internalIP,
            ...this.nodeManager.items
                .map((node: Node) => node.externalIP)
                .filter((ip) => ip), // remove blank ips
            ...this.nodeManager.items
                .map((node: Node) => node.internalIP),
        ]
    }

    constructor() {
        this.client = new K8sClient({})

        this.namespaceManager = new NamespaceManager(this)
        this.nodeManager = new NodeManager(this)
        this.roomManager = new RoomManager(this)
        
        this.serviceManager = new ServiceManager(this)
        this.serviceManager.register(new AuthService(this))

        this.init()
    }

    async init() {
        this.info = await getServerInfo()

        await this.namespaceManager.init()
        await this.nodeManager.init()
        await this.roomManager.init()

        this.server = createServer((socket) => {
            this.clients.push(new Client(socket, this))
        }).listen(this.info.port, () => {
            console.log(`Master Server listening on port ${this.info.port}.`)
        })
    }

    private getAddress(type: AddressType): string {
        return this.info.addresses.find((addr) => addr.type === type).address
    }
}

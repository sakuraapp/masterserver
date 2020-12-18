import { Client1_13 as K8sClient, ApiRoot } from 'kubernetes-client'
import Request, { config } from 'kubernetes-client/backends/request'
import path from 'path'
import { NamespaceManager } from '../namespace/manager'
import { Node } from '../node'
import { NodeManager } from '../node/manager'
import { RoomManager } from '../room/manager'
import { Address, AddressType } from '../types'
import { getServerInfo, loadYAML } from '../utils'
import { Client } from './client'
import { RemoteServiceManager } from '../remote-service/manager'
import { AuthService } from '../remote-service/services/auth.service'
import { EndpointManager } from '../endpoint/manager'
import { EndpointObject } from '../endpoint'
import { ServiceManager } from '../service/manager'
import { ServiceObject } from '../service'
import { ServiceAccountManager } from '../service-accounts/manager'
import { SecretManager } from '../secret/manager'
import { ServiceAccountObject } from '../service-accounts'
import { SecretObject } from '../secret'
import { decodeBase64 } from '../utils/crypto'
import { RoomService } from '../remote-service/services/room.service'
import fastify, { FastifyInstance } from 'fastify'
import FastifyWebsocket from 'fastify-websocket'
import { IncomingMessage, ServerResponse } from 'http'
import routes from './routes'
import { ControllerService } from '../remote-service/services/controller.service'
import { ChakraClient } from '@sakuraapp/chakra-client'

export interface ServerInfo {
    addresses: Address[]
    port: number
}

export type ServerMode = 'service' | 'standalone'

export default class MasterServer {
    private clients: Client[] = []

    public client: ApiRoot
    public server: FastifyInstance

    public namespaceManager: NamespaceManager
    public nodeManager: NodeManager
    public roomManager: RoomManager
    public endpointManager: EndpointManager
    public secretManager: SecretManager
    public serviceManager: ServiceManager
    public serviceAccountManager: ServiceAccountManager
    public remoteServiceManager: RemoteServiceManager

    public info: ServerInfo
    public readonly mode: ServerMode = process.env.KUBERNETES_SERVICE_HOST
        ? 'service'
        : 'standalone'
    public serviceToken: string

    public chakraClient: ChakraClient

    get externalIP(): string {
        return this.getAddress('ExternalIP')
    }

    get internalIP(): string {
        return this.getAddress('InternalIP')
    }

    get authorizedAddresses(): string[] {
        return [
            '127.0.0.1',
            this.externalIP,
            this.internalIP,
            ...this.nodeManager.items
                .map((node: Node) => node.externalIP)
                .filter((ip) => ip), // remove blank ips
            ...this.nodeManager.items.map((node: Node) => node.internalIP),
        ]
    }

    constructor() {
        // support running in standalone or as a pod
        const k8sOptions =
            this.mode === 'service'
                ? {
                      backend: new Request(config.getInCluster()),
                  }
                : {}

        this.client = new K8sClient(k8sOptions)

        this.namespaceManager = new NamespaceManager(this)
        this.nodeManager = new NodeManager(this)
        this.roomManager = new RoomManager(this)
        this.endpointManager = new EndpointManager(this)
        this.secretManager = new SecretManager(this)
        this.serviceManager = new ServiceManager(this)
        this.serviceAccountManager = new ServiceAccountManager(this)

        this.remoteServiceManager = new RemoteServiceManager(this)

        this.remoteServiceManager.register(new AuthService(this))
        this.remoteServiceManager.register(new RoomService(this))
        this.remoteServiceManager.register(new ControllerService(this))

        this.init()
    }

    async init(): Promise<void> {
        this.info = await getServerInfo()
        this.serviceToken = await this.getServiceToken()

        this.chakraClient = new ChakraClient({
            host: process.env.CHAKRA_HOST || '127.0.0.1',
            port: Number(process.env.CHAKRA_PORT),
            token: this.serviceToken,
        })

        await this.namespaceManager.init()
        await this.nodeManager.init(true)
        await this.roomManager.init()
        //await this.endpointManager.init()
        //await this.secretManager.init()
        //await this.serviceManager.init()
        //await this.serviceAccountManager.init()

        /* if (this.mode === 'standalone') {
            await this.registerAsEndpoint()
        } */

        this.server = fastify()

        this.server.addHook('onRequest', (req, res, next) => {
            req.masterServer = this
            next()
        })
        this.server.addHook('preHandler', this.verifyClient.bind(this))
        this.server.register(routes)
        this.server.register(FastifyWebsocket, {
            handle: (conn) => {
                console.debug('A client connected.')

                this.clients.push(new Client(conn.socket, this))
            },
            options: {
                verifyClient: (info, next) => {
                    this.verifyClient(info.req, null, next)
                },
            },
        })

        this.server.listen(this.info.port, '0.0.0.0', () => {
            console.log(`Master Server listening on port ${this.info.port}`)
        })
    }

    async getServiceToken(accountName?: string): Promise<string> {
        if (!accountName) {
            accountName = process.env.SERVICE_ACCOUNT || 'sakura'
        }

        const svcAccRes: {
            body: ServiceAccountObject
        } = await this.client.api.v1
            .ns('default')
            .serviceaccounts(accountName)
            .get()

        const secretName = svcAccRes.body.secrets[0].name
        const secretRes: { body: SecretObject } = await this.client.api.v1
            .ns('default')
            .secrets(secretName)
            .get()

        return decodeBase64(secretRes.body.data.token)
    }

    private async registerAsEndpoint() {
        const basePath = path.join(__dirname, '..', '..', 'objects')
        const data = process.env

        if (this.mode === 'standalone') {
            const endpointManifest = (await loadYAML(
                path.join(basePath, 'masterserver.endpoint.yml'),
                data
            )) as EndpointObject
            const serviceManifest = (await loadYAML(
                path.join(basePath, 'masterserver.service.yml'),
                data
            )) as ServiceObject

            await this.endpointManager.ensure(endpointManifest)
            await this.serviceManager.ensure(serviceManifest)
        }
    }

    private verifyClient(
        req: IncomingMessage,
        res: ServerResponse,
        next: (res?: boolean, code?: number) => void
    ) {
        const address = req.socket.remoteAddress.replace(/^.*:/, '')
        const token = req.headers.authorization?.slice(7)

        if (token !== this.serviceToken || !this.ipInCluster(address)) {
            console.log(address)
            console.log('test')
            next(false, 401)
        } else {
            const status = res ? undefined : true

            next(status)
        }
    }

    private getAddress(type: AddressType): string {
        return this.info.addresses.find((addr) => addr.type === type).address
    }

    public ipInCluster(address: string): boolean {
        return this.authorizedAddresses.includes(address)
    }
}

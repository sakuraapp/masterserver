import MasterServer from '~/net/server'

declare module 'fastify' {
    interface FastifyRequest {
        masterServer: MasterServer
    }
}

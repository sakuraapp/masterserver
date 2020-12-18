import { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import NodeController from '../controllers/node'

const controller: FastifyPluginCallback<unknown> = (fastify, options, next) => {
    fastify.register(NodeController, { prefix: '/nodes' })

    next()
}

export default fp(controller)

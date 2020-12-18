import { FastifyPluginCallback } from 'fastify'
import MasterServer from '../net/server'

interface NodeMap {
    [key: string]: number
}

function getNodes(server: MasterServer) {
    const map: NodeMap = {}

    server.nodeManager.map.forEach((nodes, location) => {
        // sum of available rooms
        map[location] = nodes.reduce((a, b) => a + b.availableRooms, 0)
    })

    return map
}

const controller: FastifyPluginCallback<unknown> = (fastify, options, next) => {
    fastify.get('/', (req, res) => {
        res.send(getNodes(req.masterServer))
    })

    next()
}

export default controller

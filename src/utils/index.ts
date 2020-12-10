import { promises } from 'dns'
import { hostname } from 'os'
import { v4 } from 'public-ip'
import { ServerInfo } from '~/net/server'
import { Address } from '~/types'

const { lookup } = promises

export async function getServerInfo(): Promise<ServerInfo> {
    const addresses: Address[] = []
    const localAddr = await lookup(hostname())

    addresses.push({
        type: 'InternalIP',
        address: localAddr.address
    })

    addresses.push({
        type: 'ExternalIP',
        address: await v4(),
    })

    return {
        addresses,
        port: Number(process.env.SERVER_PORT),
    }
}

export function parseJSON<T>(str: string, def: T): string | T {
    let res

    try {
        res = JSON.parse(str)
    } catch(err) {
        res = def
    }

    return res
}

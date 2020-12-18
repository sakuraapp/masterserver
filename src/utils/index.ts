import { promises as dns } from 'dns'
import { hostname } from 'os'
import { v4 } from 'public-ip'
import { safeLoad } from 'js-yaml'
import { promises as fs } from 'fs'
import { ServerInfo } from '~/net/server'
import { Address } from '~/types'
import pupa from 'pupa'
import { EventEmitter } from 'events'

export async function getServerInfo(): Promise<ServerInfo> {
    const addresses: Address[] = []
    const localAddr = await dns.lookup(hostname())
    const externalAddr = await v4()

    addresses.push({
        type: 'InternalIP',
        address: localAddr.address,
    })

    addresses.push({
        type: 'ExternalIP',
        address: externalAddr,
    })

    process.env.SERVER_INTERNAL_IP = localAddr.address
    process.env.SERVER_EXTERNAL_IP = externalAddr

    return {
        addresses,
        port: Number(process.env.SERVER_PORT),
    }
}

export function parseJSON<T>(str: string, def: T): string | T {
    let res

    try {
        res = JSON.parse(str)
    } catch (err) {
        res = def
    }

    return res
}

interface TemplateData {
    [key: string]: any
}

export function parseYAML(str: string, data: TemplateData = {}) {
    return safeLoad(pupa(str, data))
}

export async function loadYAML(path: string, data: TemplateData = {}) {
    const body = await fs.readFile(path, 'utf8')

    return parseYAML(body, data)
}

export function onAsync<T>(emitter: EventEmitter, evt: string): Promise<T> {
    return new Promise((resolve) => {
        emitter.on(evt, resolve)
    })
}

export function isEnvVarTruthy(name: string): boolean {
    const val = process.env[name]

    return val && val !== '0'
}

export function isDev(): boolean {
    const env = process.env.NODE_ENV || 'development'

    return env === 'development'
}

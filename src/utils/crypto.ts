import { Buffer } from 'buffer'

export function encodeBase64(input: string): string {
    const buf = Buffer.from(input, 'utf8')

    return buf.toString('base64')
}

export function decodeBase64(input: string): string {
    const buf = Buffer.from(input, 'base64')

    return buf.toString('utf8')
}

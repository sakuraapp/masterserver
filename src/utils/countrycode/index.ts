import codes from './codes.json'

interface CodeMap {
    [code: string]: string
}

const codeMap: CodeMap = codes

export function getCountryName(code: string): string {
    return codeMap[code]
}

export function getCountryCode(name: string): string {
    const lowerName = name.toLowerCase()

    for (const i in codeMap) {
        if (codeMap[i].toLowerCase() === lowerName) {
            return i
        }
    }
}

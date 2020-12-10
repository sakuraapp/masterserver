type FormatType = 'iec' | 'si'

export class FileSize {
    static symbols = ['b', 'k', 'm', 'g', 't', 'p', 'e', 'z', 'y']

    static toReadable(bytes: number, format: FormatType = 'si'): string {
        let unit
        let parts

        if (format === 'si') {
            unit = 1e3
            parts = ['k', 'B']
        } else {
            unit = 1024
            parts = ['K', 'iB']
        }
        
        const value = Math.log(bytes) / Math.log(unit) | 0
        
        return (bytes / Math.pow(unit, value)).toFixed(2) + ' ' + (value ? (parts[0] + 'MGTPEZY')[value - 1] + parts[1] : 'bytes')
    }

    static parse(input: string): number {
        let str = ''
        let rawNum = ''

        for (const char of input.split('')) {
            if (!isNaN(Number(char))) {
                rawNum += char
            } else if (rawNum.length > 0) {
                str += char

                if (str.length === 3) {
                    break
                }
            }
        }

        str = str.trim().toLowerCase()
        const num = Number(rawNum)
        const unit = str.charAt(1) == 'i' ? 1024 : 1000 // si or iec
        const multiplier = unit * FileSize.symbols.indexOf(str.charAt(0))

        return num * (multiplier || 1)
    }
}

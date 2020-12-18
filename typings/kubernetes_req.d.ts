declare module 'kubernetes-client/backends/request' {
    import { Configuration } from 'kubernetes-client'

    export default class Request {
        constructor(opts: any)
    }

    export const config: Configuration
}

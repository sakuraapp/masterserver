import { Stream } from "stream";

declare module 'kubernetes-client' {
    export interface ApiV1WatchPods {
        getObjectStream(opts?: any): Stream
    }

    export interface ApiV1WatchNodes {
        getObjectStream(opts?: any): Stream
    }

    export interface ApiV1WatchNamespaces {
        getObjectStream(opts?: any): Stream
    }

    export interface ApiV1WatchNamespacesNamePods {
        getObjectStream(opts?: any): Stream
    }

    export interface WatchEvent<T> {
        type: 'ADDED' | 'MODIFIED' | 'DELETED' | 'ERROR'
        object: T
    }
}
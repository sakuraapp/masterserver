import { Stream } from 'stream'
import { Child } from './types'
import { WatchEvent } from 'kubernetes-client'
import MasterServer from './net/server'
import { EventEmitter } from 'events'

export class DataType<T> extends Child {
    data: T

    constructor(server: MasterServer, data?: T,) {
        super(server)

        this.data = data
    }
}

export interface DataObject {
    metadata: {
        uid: string
    }
}

export class Manager<A extends DataObject, T extends DataType<A>> extends Child {
    public items: T[] = []
    public watcher = new EventEmitter()
    
    private updateStream: Stream
    private fetched: boolean = false

    async createWatcher(): Promise<Stream> { return null }

    createItem(data: unknown): T { return null }

    handleFirstFetch(event: WatchEvent<A>) {}

    async init() {
        this.updateStream = await this.createWatcher()
        this.updateStream.on('data', (event: WatchEvent<A>) => {
            switch (event.type) {
                case 'ADDED':
                    const item = this.createItem(event.object)

                    this.items.push(item)
                    this.emit('add-item', item)
                    break
                case 'MODIFIED':
                    this.updateItem(event.object)
                    break
                case 'DELETED':
                    this.deleteItem(event.object)
            }

            if (!this.fetched) {
                this.fetched = true
                this.handleFirstFetch(event)
            }

            this.watcher.emit('data', event)
        })
    }

    findItemIndex(item: A): number {
        for (var i in this.items) {
            if (this.items[i].data.metadata.uid === item.metadata.uid) {
                return Number(i)
            }
        }

        return -1
    }

    updateItem(item: A) {
        const i = this.findItemIndex(item)

        if (i > -1) {
            this.items[i].data = item
        }
    }

    deleteItem(item: A) {
        const i = this.findItemIndex(item)

        if (i > -1) {
            this.items.splice(i, 1)
        }
    }
}
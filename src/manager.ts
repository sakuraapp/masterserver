/* eslint-disable @typescript-eslint/no-empty-function */
import { Stream } from 'stream'
import { Child } from './types'
import { WatchEvent } from 'kubernetes-client'
import MasterServer from './net/server'
import { EventEmitter } from 'events'

export class DataType<T> extends Child {
    data: T

    constructor(server: MasterServer, data?: T) {
        super(server)

        this.data = data
    }

    async create() {
        console.log(
            `Unhandled create call for data of type ${this.constructor.name}`
        )
    }
}

export interface DataObject {
    metadata: {
        uid: string
        name?: string
    }
}

export class Manager<
    A extends DataObject,
    T extends DataType<A>
> extends Child {
    public items: T[] = []
    public watcher = new EventEmitter()

    public fetched = false
    private updateStream: Stream

    async createWatcher(): Promise<Stream> {
        return null
    }

    createItem(data: unknown): T {
        return null
    }

    handleFirstFetch(event: WatchEvent<A>): void {}

    init(waitForFetch = false): Promise<void> {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            this.updateStream = await this.createWatcher()
            this.updateStream.on('data', (event: WatchEvent<A>) => {
                switch (event.type) {
                    case 'ADDED': {
                        const item = this.createItem(event.object)

                        this.items.push(item)
                        this.emit('add-item', item)
                        break
                    }
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

            if (!waitForFetch) {
                resolve()
            } else {
                this.updateStream.once('data', resolve)
            }
        })
    }

    async ensure(manifest: A): Promise<boolean> {
        let item = this.items.find(
            (item: T) => item.data.metadata.name === manifest.metadata.name
        )

        if (item) {
            return true
        }

        item = this.createItem(manifest)

        try {
            await item.create()
            return true
        } catch (err) {
            if (err.code !== 409) {
                throw err
            }
        }
    }

    findItemIndex(item: A): number {
        for (const i in this.items) {
            if (this.items[i].data.metadata.uid === item.metadata.uid) {
                return Number(i)
            }
        }

        return -1
    }

    updateItem(item: A): void {
        const i = this.findItemIndex(item)

        if (i > -1) {
            this.items[i].data = item
        }
    }

    deleteItem(item: A): void {
        const i = this.findItemIndex(item)

        if (i > -1) {
            this.items.splice(i, 1)
        }
    }
}

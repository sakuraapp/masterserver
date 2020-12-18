import { EventEmitter } from 'events'
import { ALL_LOCATIONS } from './node/manager'

export interface Item {
    id: string
    location: string
    priority: boolean
}

export class Queue extends EventEmitter {
    private items: Item[] = []

    add(item: Item): number {
        this.items.push(item)

        this.update()
        this.emit('add', item)

        return this.items.indexOf(item)
    }

    remove(index: number): Item {
        const item = this.items[index]

        this.items.splice(index, 1)
        this.emit('remove', item)

        return item
    }

    update(): void {
        this.items = this.items.sort((a, b) => {
            if (a.priority && !b.priority) {
                return -1
            } else if (!a.priority && b.priority) {
                return 1
            } else {
                return 0
            }
        })
    }

    next(location: string): Item {
        let idx: number

        for (const i in this.items) {
            const item = this.items[i]

            if (item.location === ALL_LOCATIONS || item.location === location) {
                idx = Number(i)
                break
            }
        }

        if (idx > -1) {
            const item = this.remove(idx)

            this.emit('next', item)
            return item
        }
    }
}

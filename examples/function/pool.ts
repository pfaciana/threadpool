const start = performance.now()

import { setTimeout } from 'node:timers'
import { URL } from 'node:url'
import { FunctionPool, importTaskWorker, importWorker, StatusType } from './../../src/index.ts'
import type * as mathType from './../common/math.ts'

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const pool = (new FunctionPool({ poolSize: 15 }))
	.allSettled(() => {
		const completed = pool.status('completed', StatusType.RAW)

		for (const thread of completed) {
			console.log(thread.message, thread.status.SUCCESS ? 'Success' : 'Error', thread.meta)
		}

		console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
		console.log('\n\nScript runtime: ' + (Math.round(performance.now() - start) / 1000) + ' sec\n\n')
	})

const filename = new URL('./../common/math.ts', import.meta.url)
// @ts-ignore
const { add, fib, getState, state } = await importTaskWorker<typeof mathType>(filename)
// @ts-ignore
pool.addTask(fib('42'), { meta: 1 })
pool.addTask(fib(42), { meta: 2 })
pool.addTask(fib(42), { meta: 3 })
pool.addTask(fib(42), { meta: 4 })
pool.addTask(fib(42), { meta: 5 })

const { fib: fib2 } = await importWorker<typeof mathType>(filename)

// @ts-ignore
pool.addTask(() => fib2('42'), { meta: 11 })
pool.addTask(() => fib2(42), { meta: 21 })
pool.addTask(() => fib2(42), { meta: 31 })
await delay(2000)
pool.addTask(() => fib2(42), { meta: 41 })
pool.addTask(() => fib2(42), { meta: 51 })


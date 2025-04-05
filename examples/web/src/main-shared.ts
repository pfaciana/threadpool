const start = performance.now()

import { StatusType, WebFunctionPool, importWebWorker, type WorkerOptions } from './../../../src/web'
import type * as mathType from './../../common/math.ts'

console.log('Starting...')

const filename = new URL('./../../common/math.js', import.meta.url)
const WorkerOptions = { type: 'module', credentials: 'same-origin' } as WorkerOptions

const pool = new WebFunctionPool()
pool.allSettled(() => {
	const completed = pool.status('completed', StatusType.RAW)

	for (const thread of completed) {
		console.log(thread.message, thread.status.SUCCESS ? 'Success' : 'Error', thread.meta)
	}

	console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
	console.log('\n\nScript runtime: ' + (Math.round(performance.now() - start) / 1000) + ' sec\n\n')
}).then((data, thread) => {
	console.log(data, thread)
})

const { add, fib, getState, state } = await importWebWorker<typeof mathType>(filename, WorkerOptions, { WorkerType: SharedWorker })

let threads = Array.from({ length: 10 })
for (const i in threads) {
	pool.addTask(() => fib(42), +i + 1)
}
pool.addTask(() => getState(), 11)
pool.addTask(() => add(1, 2), 12)
pool.addTask(() => getState(), 13)
pool.addTask(() => add(34, 56), 14)
pool.addTask(() => getState(), 15)
pool.addTask(() => state(), 16)

/**
 * The output should be:
 *
<output>
267914296 'Success' 3
267914296 'Success' 5
267914296 'Success' 4
267914296 'Success' 1
267914296 'Success' 6
267914296 'Success' 7
267914296 'Success' 2
0 'Success' 15
0 'Success' 11
3 'Success' 12
1 'Success' 13
90 'Success' 14
2 'Success' 16
267914296 'Success' 8
267914296 'Success' 10
267914296 'Success' 9

DONE! 16

Script runtime: 3.768 sec
</output>
 */

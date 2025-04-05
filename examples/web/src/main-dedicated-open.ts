const start = performance.now()

import { StatusType, WebFunctionPool, importPersistentWebWorker } from './../../../src/web'
import type * as mathType from './../../common/math.ts'

console.log('Starting...')
console.log(`Number of Treads: ${navigator.hardwareConcurrency}`)

const filename = new URL('./../../common/math.js', import.meta.url)

const mathB = await importPersistentWebWorker<typeof mathType>(filename)

const pool = new WebFunctionPool()
pool.allSettled(() => {
	const completed = pool.status('completed', StatusType.RAW)
	for (const thread of completed) {
		console.log(thread.message, thread.status.SUCCESS ? 'Success' : 'Error', thread.meta)
		if (thread.meta === 'B2') {
			mathB.terminate()
		}
	}

	console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
	console.log('\n\nScript runtime: ' + (Math.round(performance.now() - start) / 1000) + ' sec\n\n')
})

pool.addTask(async () => {
	const math = await importPersistentWebWorker<typeof mathType>(filename)
	console.log('A: getState(): ', await math.state())
	console.log('A: add(1, 2): ', await math.add(1, 2))
	console.log('A: getState(1, 2): ', await math.state())
	console.log('A: add(3, 4): ', await math.add(3, 4))
	console.log('A: getState(3, 4): ', await math.state())
	console.log('A: fib(): ', await math.fib(42))
	math.terminate()
	return 'Done A!'
}, 'A')

pool.addTask(async () => {
	console.log('B: getState(): ', await mathB.state())
	console.log('B: add(5, 6): ', await mathB.add(5, 6))
	console.log('B: getState(5, 6): ', await mathB.state())
	console.log('B: add(7, 8): ', await mathB.add(7, 8))
	console.log('B: getState(7, 8): ', await mathB.state())
	console.log('B: fib(): ', await mathB.fib(41))
	return 'Done B!'
}, 'B')

pool.addTask(async () => {
	const math = await importPersistentWebWorker<typeof mathType>(filename)
	console.log('C: getState(): ', await math.state())
	console.log('C: add(9, 10): ', await math.add(9, 10))
	console.log('C: getState(9, 10): ', await math.state())
	console.log('C: add(11, 12): ', await math.add(11, 12))
	console.log('C: getState(11, 12): ', await math.state())
	console.log('C: fib(): ', await math.fib(40))
	math.terminate()
	return 'Done C!'
}, 'C')

setTimeout(() => {
	pool.addTask(async () => {
		console.log('B2: getState(): ', await mathB.state())
		console.log('B2: add(5, 6): ', await mathB.add(5, 6))
		console.log('B2: getState(5, 6): ', await mathB.state())
		console.log('B2: add(7, 8): ', await mathB.add(7, 8))
		console.log('B2: getState(7, 8): ', await mathB.state())
		console.log('B2: fib(): ', await mathB.fib(41))
		return 'Done B2!'
	}, 'B2')
}, 2000)

/**
 * The output should be:
 *
<output>
B: getState():  0
A: getState():  0
B: add(5, 6):  11
A: add(1, 2):  3
B: getState(5, 6):  1
A: getState(1, 2):  1
B: add(7, 8):  15
A: add(3, 4):  7
B: getState(7, 8):  2
A: getState(3, 4):  2
C: getState():  0
C: add(9, 10):  19
C: getState(9, 10):  1
C: add(11, 12):  23
C: getState(11, 12):  2
C: fib():  102334155
B: fib():  165580141
A: fib():  267914296
Done C! Success C
Done B! Success B
Done A! Success A

DONE! 3

Script runtime: 1.997 sec

B2: getState():  2
B2: add(5, 6):  11
B2: getState(5, 6):  3
B2: add(7, 8):  15
B2: getState(7, 8):  4
B2: fib():  165580141
Done C! Success C
Done B! Success B
Done A! Success A
Done B2! Success B2

DONE! 4

Script runtime: 3.166 sec
</output>
 */

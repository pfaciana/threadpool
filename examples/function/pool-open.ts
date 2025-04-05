import { setTimeout } from 'node:timers'
import { importPersistentWorker, FunctionPool, StatusType } from './../../src/index.ts'
import type * as mathType from './../common/math.ts'

const start = performance.now()

const pool = (new FunctionPool({ poolSize: 3 }))
	.allSettled(() => {
		const completed = pool.status('completed', StatusType.RAW)

		for (const thread of completed) {
			console.log(thread.message, thread.status.SUCCESS ? 'Success' : 'Error', thread.meta)
		}

		console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
		console.log('\n\nScript runtime: ' + (Math.round(performance.now() - start) / 1000) + ' sec\n\n')
	})

console.log('Available Thread: ', pool.hasAvailableThread() ? 'Yes' : 'No')

pool.addTask(async () => {
	const math = await importPersistentWorker<typeof mathType>(new URL('./../common/math.ts', import.meta.url))
	console.log('A: getState(): ', await math.state())
	console.log('A: add(1, 2): ', await math.add(1, 2))
	console.log('A: getState(1, 2): ', await math.state())
	console.log('A: add(3, 4): ', await math.add(3, 4))
	console.log('A: getState(3, 4): ', await math.state())
	console.log('A: fib(): ', await math.fib(42))
	math.terminate()
	console.log(pool.status('completed', StatusType.PERCENT), `%`)
	return 'Done A!'
}, { meta: 1 })

const mathB = await importPersistentWorker<typeof mathType>(new URL('./../common/math.ts', import.meta.url))
pool.addTask(async () => {
	console.log('B: getState(): ', await mathB.state())
	console.log('B: add(5, 6): ', await mathB.add(5, 6))
	console.log('B: getState(5, 6): ', await mathB.state())
	console.log('B: add(7, 8): ', await mathB.add(7, 8))
	console.log('B: getState(7, 8): ', await mathB.state())
	console.log('B: fib(): ', await mathB.fib(41))
	console.log(pool.status('completed', StatusType.PERCENT), `%`)
	return 'Done B!'
}).on('exit', () => {
	pool.addTask(async () => {
		console.log('B2: getState(): ', await mathB.state())
		console.log('B2: add(15, 16): ', await mathB.add(15, 16))
		console.log('B2: getState(15, 16): ', await mathB.state())
		console.log('B2: add(17, 18): ', await mathB.add(17, 18))
		console.log('B2: getState(17, 18): ', await mathB.state())
		console.log('B2: fib(): ', await mathB.fib(39))
		mathB.terminate()
		console.log(pool.status('completed', StatusType.PERCENT), `%`)
		return 'Done B2!'
	})
})

pool.addTask(async () => {
	const math = await importPersistentWorker<typeof mathType>(new URL('./../common/math.ts', import.meta.url))
	console.log('C: getState(): ', await math.state())
	console.log('C: add(9, 10): ', await math.add(9, 10))
	console.log('C: getState(9, 10): ', await math.state())
	console.log('C: add(11, 12): ', await math.add(11, 12))
	console.log('C: getState(11, 12): ', await math.state())
	console.log('C: fib(): ', await math.fib(40))
	math.terminate()
	console.log(pool.status('completed', StatusType.PERCENT), `%`)
	return 'Done C!'
})

console.log('Available Thread: ', pool.hasAvailableThread() ? 'Yes' : 'No')

setTimeout(() => {
	pool.addTask(async () => {
		return new Promise((resolve) => {
			setTimeout(async () => {
				const math = await importPersistentWorker<typeof mathType>(new URL('./../common/math.ts', import.meta.url))
				console.log('C2: getState(): ', await math.state())
				console.log('C2: add(19, 110): ', await math.add(19, 110))
				console.log('C2: getState(19, 110): ', await math.state())
				console.log('C2: add(111, 112): ', await math.add(111, 112))
				console.log('C2: getState(111, 112): ', await math.state())
				console.log('C2: fib(): ', await math.fib(40))
				math.terminate()
				console.log(pool.status('completed', StatusType.PERCENT), `%`)
				resolve('Done C2!')
			}, 2000)
		})
	})
}, 2000)
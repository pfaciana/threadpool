import { FunctionPool, importPersistentWorker, StatusType } from './../../src/index.ts'
import type * as mathType from './../common/math.ts'

const startTime = performance.now()

const mathB = await importPersistentWorker<typeof mathType>(new URL('./../common/math.ts', import.meta.url))

const pool = (new FunctionPool())
	.race((data, thread) => {
		console.log(`Finished First: ${thread.meta} = ${Array.isArray(data) ? data.length : data}\n`)
	})
	.then((data, thread) => {
		console.log(thread.meta, Array.isArray(data) ? data.length : data)
		if (thread.meta === 'findPrimesUpTo(17000000)') {
			mathB.terminate()
		}
	})
	.allSettled(() => {
		console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
		const endTime = performance.now()
		const elapsedTime = endTime - startTime
		console.log('\n\nScript runtime: ' + (Math.round(elapsedTime) / 1000) + ' sec')
	})

pool.addTask(async () => {
	const mathA = await importPersistentWorker<typeof mathType>(new URL('./../common/math.ts', import.meta.url))
	const result = await mathA.fib(42)
	// Do more stuff here
	mathA.terminate() // terminate to close the port when done
	return result
}, 'fib(42)')

pool.addTask(async () => {
	const result = await mathB.findPrimesUpTo(17000000)
	// Do more stuff here
	// We are leaving the port open for now, and closing it in the allSettled callback
	return result
}, 'findPrimesUpTo(17000000)')

pool.addTask(async () => {
	const mathC = await importPersistentWorker<typeof mathType>(new URL('./../common/math.ts', import.meta.url))
	const result = await mathC.tribonacci(32)
	// Do more stuff here
	mathC.terminate() // terminate to close the port when done
	return result
}, 'tribonacci(32)')

const mathD = await importPersistentWorker<typeof mathType>(new URL('./../common/math.ts', import.meta.url))
pool.addTask(async () => {
	const result1 = await mathD.estimatePi(25)
	const result2 = await mathD.estimatePi(25)
	// Do more stuff here
	return result1 + result2
}, 'estimatePi(25)').then((data) => {
	pool.addTask(async () => {
		const result3 = await mathD.estimatePi(25)
		mathD.terminate() // terminate to close the port when done
		return result3 + data
	}, 'estimatePi(25) #2')
})

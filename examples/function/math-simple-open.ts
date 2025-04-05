import { FunctionPool, importPersistentWorker, StatusType } from './../../src/index.ts'
import type * as mathType from './../common/math.ts'

const startTime = performance.now()

const pool = (new FunctionPool())
	.race((data, thread) => {
		console.log(`Finished First: ${thread.meta} = ${data}\n`)
	})
	.then((data, thread) => {
		console.log(thread.meta, Array.isArray(data) ? data.length : data)
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
	mathA.terminate()
	return result
}, 'fib(42)')

pool.addTask(async () => {
	const mathB = await importPersistentWorker<typeof mathType>(new URL('./../common/math.ts', import.meta.url))
	const result = await mathB.findPrimesUpTo(17000000)
	mathB.terminate()
	return result
}, 'findPrimesUpTo(17000000)')

pool.addTask(async () => {
	const mathC = await importPersistentWorker<typeof mathType>(new URL('./../common/math.ts', import.meta.url))
	const result = await mathC.tribonacci(32)
	mathC.terminate()
	return result
}, 'tribonacci(32)')

pool.addTask(async () => {
	const mathD = await importPersistentWorker<typeof mathType>(new URL('./../common/math.ts', import.meta.url))
	const result = await mathD.estimatePi(25)
	mathD.terminate()
	return result
}, 'estimatePi(25)')
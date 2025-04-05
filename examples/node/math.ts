import { WorkerPool, StatusType } from './../../src/index.ts'

const startTime = performance.now()

const manager = (new WorkerPool(new URL('./math-worker.ts', import.meta.url)))
	.race((data, thread) => {
		console.log(`Finished First: ${thread.meta} = ${data}\n`)
	})
	.then((data, thread) => {
		console.log(`*`, thread.meta, Array.isArray(data) ? data.length : data)
	})
	.allSettled(() => {
		console.log(`\nDONE! Completed: ${manager.status('completed', StatusType.COUNT)} Tasks.`)
		const endTime = performance.now()
		const elapsedTime = endTime - startTime
		console.log(`\n\nScript runtime: ${(Math.round(elapsedTime) / 1000)} sec\n`)
	})

await manager.enableExitEventFallback()

manager.addTask({ fn: 'fib', args: [42] }, 'fib(42)')
manager.addTask({ fn: 'findPrimesUpTo', args: [17000000] }, 'findPrimesUpTo(17000000)')
manager.addTask({ fn: 'tribonacci', args: [32] }, 'tribonacci(32)')
manager.addTask({ fn: 'estimatePi', args: [25] }, 'estimatePi(25)')

/**
 * Should have output similar to:

Finished First: ??? = ???

 * estimatePi(25) 3.141592653589787
 * tribonacci(32) 45152016
 * findPrimesUpTo(17000000) 1091314
 * fib(42) 267914296

DONE! Completed: 4 Tasks.


Script runtime: ??? sec

 */
import { FunctionPool, importTaskWorker, StatusType } from './../../src/index.ts'

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

type M = typeof import('./../common/math.ts')
const filename = new URL('./../common/math.ts', import.meta.url)
const { fib, findPrimesUpTo, estimatePi, tribonacci } = await importTaskWorker<M>(filename)

pool.addTask(fib(42), 'fib(42)')
pool.addTask(findPrimesUpTo(17000000), 'findPrimesUpTo(17000000)')
pool.addTask(tribonacci(32), 'tribonacci(32)')
pool.addTask(estimatePi(25), 'estimatePi(25)')

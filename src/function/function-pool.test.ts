import os from 'node:os'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FunctionPool, FunctionThread, StatusAllField, StatusType, importTaskWorker } from '@/index'
import type * as mathType from './../fixtures/math.ts'

// Mock system-resource-monitor
vi.mock('system-resource-monitor', () => ({
	getLogicalCoreCount: () => os.cpus().length,
	getPhysicalCoreCount: () => Math.max(1, Math.floor(os.cpus().length / 2)),
	getTotalMemory: () => os.totalmem(),
	startProfilingCpu: vi.fn().mockReturnValue(undefined),
	isAnyThreadBelow: vi.fn().mockReturnValue(true),
	round: (num: number, precision: number) => Number(num.toFixed(precision)),
}))

describe('FunctionPool', () => {
	let pool: FunctionPool

	beforeEach(() => {
		pool = new FunctionPool()
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.clearAllMocks()
		vi.clearAllTimers()
		vi.useRealTimers()
	})

	describe('Constructor and Initialization', () => {
		it('should initialize with default values', () => {
			expect(pool.maxThreadThreshold).toBe(98)
			expect(pool.system).toEqual({
				cores: Math.max(1, Math.floor(os.cpus().length / 2)),
				threads: os.cpus().length,
				memory: os.totalmem(),
			})
		})

		it('should accept custom options', () => {
			const customPool = new FunctionPool({
				pingInterval: 200,
				maxThreadThreshold: 80,
				poolSize: 2,
			})
			expect(customPool.maxThreadThreshold).toBe(80)
		})

		it('should set poolSize with minimum value validation', () => {
			pool.poolSize = -5
			expect(pool.poolSize).toBe(1) // Should enforce minimum value of 1

			pool.poolSize = 4
			expect(pool.poolSize).toBe(4)
		})
	})

	describe('Task Management', () => {
		it('should add task and return FunctionThread instance', () => {
			const task = () => Promise.resolve('test')
			const meta = { id: 1 }
			const thread = pool.addTask(task, meta)

			expect(thread).toBeInstanceOf(FunctionThread)
			expect(thread.meta).toBe(meta)
			// This will be ACTIVE here because the task will immediately run when added
			expect(thread.status.ACTIVE).toBe(true)
		})

		it('should respect poolSize limit', async () => {
			pool.poolSize = 2
			const tasks = Array.from({ length: 5 }, (_, i) => () => Promise.resolve(i))

			tasks.forEach(task => pool.addTask(task))
			vi.advanceTimersByTime(100)

			let status = pool.status('*')
			expect(status.active).toBe(2)
			expect(status.queued).toBe(3)
		})
	})

	describe('Status Management', () => {
		it('should return correct status counts', async () => {
			const successTask = () => Promise.resolve('success')
			const errorTask = () => Promise.reject(new Error('error'))

			pool.addTask(successTask)
			pool.addTask(errorTask)
			vi.advanceTimersByTime(100)

			{
				let status = pool.status('*')
				expect(status.queued).toBe(0)
				expect(status.active).toBe(2)
				expect(status.completed).toBe(0)
				expect(status.total).toBe(2)
			}

			await vi.runAllTimersAsync()

			{
				let status = pool.status(StatusAllField, StatusType.RAW)
				expect(status.queued!.length).toBe(0)
				expect(status.active!.length).toBe(0)
				expect(status.completed!.length).toBe(2)

				const succeeded = status.completed!.filter(thread => thread.status.SUCCESS)
				const failed = status.completed!.filter(thread => thread.status.ERROR)
				expect(succeeded.length).toBe(1)
				expect(failed.length).toBe(1)
			}
		})

		it('should handle percentage status', () => {
			const tasks = Array.from({ length: 4 }, () => () => Promise.resolve())
			tasks.forEach(task => pool.addTask(task))
			vi.advanceTimersByTime(100)

			const status = pool.status('*', StatusType.PERCENT)
			expect(status.queued).toBe(0)
			expect(status.active).toBe(100)
			expect(status.completed).toBe(0)
			expect(status.total).toBe(100)
		})
	})

	describe('Event Handling', () => {
		it('should emit worker events', async () => {
			const initSpy = vi.fn()
			const messageSpy = vi.fn()
			const errorSpy = vi.fn()
			const exitSpy = vi.fn()
			const statusSpy = vi.fn()

			pool.on('worker.init', initSpy)
			pool.on('worker.message', messageSpy)
			pool.on('worker.error', errorSpy)
			pool.on('worker.exit', exitSpy)
			pool.on('worker.status', statusSpy)

			const successResult = 'success'
			pool.addTask(() => Promise.resolve(successResult))

			vi.advanceTimersByTime(100)
			await vi.runAllTimersAsync()

			expect(initSpy).toHaveBeenCalled()
			expect(messageSpy).toHaveBeenCalledWith(
				successResult,
				expect.any(FunctionThread),
			)
			expect(statusSpy).toHaveBeenCalled()
			expect(exitSpy).toHaveBeenCalledWith(0, expect.any(FunctionThread))
			expect(errorSpy).not.toHaveBeenCalled()
		})

		it('should emit complete event when all tasks are done', async () => {
			const completeSpy = vi.fn()
			pool.on('complete', completeSpy)

			const task = () => Promise.resolve()
			pool.addTask(task)

			vi.advanceTimersByTime(100)
			await vi.runAllTimersAsync()

			expect(completeSpy).toHaveBeenCalled()
		})

		it('should register a callback via allSettled that fires when all tasks complete', async () => {
			const allSettledSpy = vi.fn()
			pool.allSettled(allSettledSpy)

			// Add some tasks
			const tasks = Array.from({ length: 3 }, () => () => Promise.resolve())
			tasks.forEach(task => pool.addTask(task))

			// Initially the callback shouldn't be called
			expect(allSettledSpy).not.toHaveBeenCalled()

			// Complete all tasks
			vi.advanceTimersByTime(100)
			await vi.runAllTimersAsync()

			// Now the callback should have been called
			expect(allSettledSpy).toHaveBeenCalledTimes(1)
		})

		it('should call allSettled multiple times when new tasks are added after previous completion', async () => {
			const allSettledSpy = vi.fn()
			pool.allSettled(allSettledSpy)

			// First batch of tasks
			const tasksBatch1 = Array.from({ length: 2 }, () => () => Promise.resolve())
			tasksBatch1.forEach(task => pool.addTask(task))

			// Complete first batch
			vi.advanceTimersByTime(100)
			await vi.runAllTimersAsync()

			// Check first call
			expect(allSettledSpy).toHaveBeenCalledTimes(1)

			// Second batch of tasks
			const tasksBatch2 = Array.from({ length: 3 }, () => () => Promise.resolve())
			tasksBatch2.forEach(task => pool.addTask(task))

			// Initially the callback shouldn't be called again yet
			expect(allSettledSpy).toHaveBeenCalledTimes(1)

			// Complete second batch
			vi.advanceTimersByTime(100)
			await vi.runAllTimersAsync()

			// The callback should have been called again
			expect(allSettledSpy).toHaveBeenCalledTimes(2)

			// Third batch - add just one more task
			pool.addTask(() => Promise.resolve())
			vi.advanceTimersByTime(100)
			await vi.runAllTimersAsync()

			// The callback should have been called a third time
			expect(allSettledSpy).toHaveBeenCalledTimes(3)
		})

		it('should register complete event handler with allSettled', () => {
			// Spy on the 'on' method
			const onSpy = vi.spyOn(pool, 'on')

			// Create a test callback
			const callback = vi.fn()

			// Register the callback
			pool.allSettled(callback)

			// Verify that a listener was registered for the 'complete' event
			expect(onSpy).toHaveBeenCalledWith('complete', expect.any(Function))

			// Get the registered wrapper function
			const registeredFn = onSpy.mock.calls[0][1]

			// Call the wrapper function
			registeredFn()

			// Verify the original callback was called with the correct arguments
			expect(callback).toHaveBeenCalledWith(expect.any(Array))
		})

		describe('Promise-like Methods', () => {
			it('should handle all() with successful completion', async () => {
				const allSpy = vi.fn()
				pool.all(allSpy)

				const tasks = Array.from({ length: 3 }, (_, i) => () => Promise.resolve(i))
				tasks.forEach(task => pool.addTask(task))

				expect(allSpy).not.toHaveBeenCalled()

				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				expect(allSpy).toHaveBeenCalledTimes(1)
				expect(allSpy).toHaveBeenCalledWith(expect.any(Array))
				const threads = allSpy.mock.calls[0][0]
				expect(threads).toHaveLength(3)
				expect(threads.every(t => t.status.SUCCESS)).toBe(true)
			})

			it('should handle all() with error', async () => {
				const error = new Error('Task failed')
				const allSpy = vi.fn()
				pool.all(allSpy)

				pool.addTask(() => Promise.resolve(1))
				pool.addTask(() => Promise.reject(error))

				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				expect(allSpy).toHaveBeenCalledTimes(1)
				expect(allSpy).toHaveBeenCalledWith(error)
			})

			it('should handle any() with success', async () => {
				const anySpy = vi.fn()
				pool.any(anySpy)

				const successValue = 'success'
				pool.addTask(() => Promise.resolve(successValue))
				pool.addTask(() => new Promise(resolve => setTimeout(resolve, 1000)))

				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				expect(anySpy).toHaveBeenCalledTimes(1)
				expect(anySpy.mock.calls[0][0]).toBe(successValue)
				expect(anySpy.mock.calls[0][1]).toBeInstanceOf(FunctionThread)
			})

			it('should handle any() with all failures', async () => {
				const anySpy = vi.fn()
				pool.any(anySpy)

				pool.addTask(() => Promise.reject(new Error('error 1')))
				pool.addTask(() => Promise.reject(new Error('error 2')))

				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				expect(anySpy).toHaveBeenCalledTimes(1)
				// @ts-ignore
				expect(anySpy.mock.calls[0][0]).toBeInstanceOf(AggregateError)
				expect(anySpy.mock.calls[0][1]).toBeUndefined()
			})

			it('should handle race() with success', async () => {
				const raceSpy = vi.fn()
				pool.race(raceSpy)

				const successValue = 'first'
				pool.addTask(() => Promise.resolve(successValue))
				pool.addTask(() => new Promise(resolve => setTimeout(resolve, 1000)))

				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				expect(raceSpy).toHaveBeenCalledTimes(1)
				expect(raceSpy.mock.calls[0][0]).toBe(successValue)
				expect(raceSpy.mock.calls[0][1]).toBeInstanceOf(FunctionThread)
			})

			it('should handle race() with error', async () => {
				const raceSpy = vi.fn()
				pool.race(raceSpy)

				const error = new Error('Task failed')
				pool.addTask(() => Promise.reject(error))
				pool.addTask(() => new Promise(resolve => setTimeout(resolve, 1000)))

				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				expect(raceSpy).toHaveBeenCalledTimes(1)
				expect(raceSpy.mock.calls[0][0]).toBe(error)
				expect(raceSpy.mock.calls[0][1]).toBeInstanceOf(FunctionThread)
			})

			it('should handle method chaining', () => {
				const allSpy = vi.fn()
				const anySpy = vi.fn()
				const raceSpy = vi.fn()

				expect(pool.all(allSpy)).toBe(pool)
				expect(pool.any(anySpy)).toBe(pool)
				expect(pool.race(raceSpy)).toBe(pool)
				expect(pool.allSettled(() => {
				})).toBe(pool)
			})

			it('should handle successful resolution with then()', async () => {
				const thenSpy = vi.fn()
				pool.then(thenSpy)

				const successValue = 'success'
				pool.addTask(() => Promise.resolve(successValue))
				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				expect(thenSpy).toHaveBeenCalledWith(successValue, expect.any(FunctionThread))
			})

			it('should handle errors with catch()', async () => {
				const catchSpy = vi.fn()
				pool.catch(catchSpy)

				const error = new Error('Task failed')
				pool.addTask(() => Promise.reject(error))
				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				expect(catchSpy).toHaveBeenCalledWith(error, 'error', expect.any(FunctionThread))
			})

			it('should handle completion with finally()', async () => {
				const finallySpy = vi.fn()
				pool.finally(finallySpy)

				pool.addTask(() => Promise.resolve('success'))
				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				expect(finallySpy).toHaveBeenCalledWith(0, expect.any(FunctionThread))
			})
		})
	})

	describe('Resource Management', () => {
		it('should check thread availability', () => {
			// Fill up to poolSize
			for (let i = 0; i < pool.poolSize + 1; i++) {
				pool.addTask(() => Promise.resolve())
			}

			expect(pool.hasAvailableThread()).toBe(false)

			vi.advanceTimersByTime(100)

			expect(pool.hasAvailableThread()).toBe(false)
		})

		it('should handle completion status correctly', async () => {
			expect(pool.isCompleted()).toBe(true)

			const task = () => Promise.resolve()
			pool.addTask(task)

			vi.advanceTimersByTime(100)
			expect(pool.isCompleted()).toBe(false)

			await vi.runAllTimersAsync()
			expect(pool.isCompleted()).toBe(true)
		})
	})

	describe('Error Handling', () => {
		it('should handle task rejection', async () => {
			const error = new Error('Task failed')
			const errorSpy = vi.fn()
			pool.on('worker.error', errorSpy)

			pool.addTask(() => Promise.reject(error))

			vi.advanceTimersByTime(100)
			await vi.runAllTimersAsync()

			expect(errorSpy).toHaveBeenCalledWith(error, expect.any(FunctionThread))
		})
	})
})

describe.concurrent('WorkerPool - Math Worker Test', () => {
	it('should execute multiple math tasks in parallel', async () => {
		const startTime = performance.now()
		const messages: string[] = []

		// Properly mock console.log to capture output without printing
		const consoleLogMock = vi.spyOn(console, 'log').mockImplementation((...args) => {
			messages.push(args.join(' '))
		})

		// Create worker pool using the test-math-worker.ts fixture
		const pool = (new FunctionPool())
			.race((data, thread) => {
				console.log(`Finished First: ${thread.meta} = ${data}\n`)
			})
			.then((data, thread) => {
				console.log(`*`, thread.meta, Array.isArray(data) ? data.length : data)
			})
			.allSettled(() => {
				console.log(`\nDONE! Completed: ${pool.status('completed', StatusType.COUNT)} Tasks.`)
				const endTime = performance.now()
				const elapsedTime = endTime - startTime
				console.log(`\n\nScript runtime: ${(Math.round(elapsedTime) / 1000)} sec\n`)
			})

		const filename = new URL(`./../fixtures/math${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url)
		const { fib, findPrimesUpTo, estimatePi, tribonacci } = await importTaskWorker<typeof mathType>(filename)

		// Add the tasks that were in the original math.ts file
		pool.addTask(fib(42), 'fib(42)')
		pool.addTask(findPrimesUpTo(17000000), 'findPrimesUpTo(17000000)')
		pool.addTask(tribonacci(32), 'tribonacci(32)')
		pool.addTask(estimatePi(25), 'estimatePi(25)')

		// Wait for all tasks to complete
		await new Promise<void>((resolve) => {
			const checkInterval = setInterval(() => {
				if (pool.status('completed', StatusType.COUNT) === 4) {
					clearInterval(checkInterval)
					resolve()
				}
			}, 100)
		})

		// Add a small delay to ensure all console logs have been processed
		await new Promise(resolve => setTimeout(resolve, 250))

		// Verify message order and content
		expect(messages.length).toBeGreaterThan(5) // 1 race + 4 tasks + 1 done + 1 runtime

		// First message should be "Finished First"
		expect(messages[0]).toMatch(/^Finished First: .* = .*\n$/)

		// Middle messages should be the task results in any order
		const taskMessages = messages.slice(1, 5)
		expect(taskMessages).toContain('* fib(42) 267914296')
		expect(taskMessages).toContain('* tribonacci(32) 45152016')
		expect(taskMessages).toContain('* findPrimesUpTo(17000000) 1091314')
		expect(taskMessages).toContain('* estimatePi(25) 3.141592653589787')

		// Second to last message should be the DONE message
		expect(messages[5]).toBe('\nDONE! Completed: 4 Tasks.')

		// Restore console.log
		consoleLogMock.mockRestore()
	})
})


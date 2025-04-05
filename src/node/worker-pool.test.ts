// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

import { WorkerPool, WorkerThread, Worker, StatusAllField, StatusType } from '@/index'

// Mock system-resource-monitor
vi.mock('system-resource-monitor', () => ({
	getLogicalCoreCount: () => os.cpus().length,
	getPhysicalCoreCount: () => Math.max(1, Math.floor(os.cpus().length / 2)),
	getTotalMemory: () => os.totalmem(),
	startProfilingCpu: vi.fn().mockReturnValue(undefined),
	isAnyThreadBelow: vi.fn().mockReturnValue(true),
	round: (num: number, precision: number) => Number(num.toFixed(precision)),
}))

const isDeno = !!(typeof Deno !== 'undefined' || process?.env?.DENO)
const isBun = !!(typeof Bun !== 'undefined' || process?.env?.BUN)
const isNode = !isDeno && !isBun && typeof process !== 'undefined'
const delay = (ms): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

describe.concurrent('WorkerPool', () => {
	describe.concurrent('Constructor and Initialization', () => {
		let manager: WorkerPool

		beforeEach(() => {
			manager = new WorkerPool(``, { eval: true })
			vi.useFakeTimers()
		})

		afterEach(() => {
			vi.clearAllMocks()
			vi.clearAllTimers()
			vi.useRealTimers()
		})

		it('should initialize with default values', () => {
			expect(manager.maxThreadThreshold).toBe(98)
			expect(manager.system).toEqual({
				cores: Math.max(1, Math.floor(os.cpus().length / 2)),
				threads: os.cpus().length,
				memory: os.totalmem(),
			})
		})

		it('should accept custom options', () => {
			const customManager = new WorkerPool(``, {}, {
				pingInterval: 200,
				maxThreadThreshold: 80,
				poolSize: 2,
			})
			expect(customManager.maxThreadThreshold).toBe(80)
		})

		it('should handle empty arguments', () => {
			const worker = manager.addWorker()
			expect(worker).toBeInstanceOf(WorkerThread)
		})
	})

	describe.concurrent('Status Management', () => {
		let manager: WorkerPool

		beforeEach(() => {
			manager = new WorkerPool(``, { eval: true })
			vi.useFakeTimers()
		})

		afterEach(() => {
			vi.clearAllMocks()
			vi.clearAllTimers()
			vi.useRealTimers()
		})

		it('should return correct status counts', () => {
			let status, isError, isSuccess
			const worker1 = manager.addWorker(``)
			const worker2 = manager.addWorker(``)

			status = manager.status('*')
			expect(status.queued).toBe(0)
			expect(status.active).toBe(2)
			expect(status.completed).toBe(0)
			expect(status.total).toBe(2)

			worker2.worker?.emit('exit', 0)

			status = manager.status(StatusAllField, StatusType.PERCENT)
			expect(status.queued).toBe(0)
			expect(status.active).toBe(50)
			expect(status.completed).toBe(50)
			expect(status.total).toBe(100)

			const worker3 = manager.addWorker(``)

			status = manager.status(StatusAllField, 0)
			expect(status.queued).toBe(0)
			expect(status.active).toBe(67)
			expect(status.completed).toBe(33)
			expect(status.total).toBe(100)

			worker1.worker?.emit('error', new Error('some error'))
			worker1.worker?.emit('exit', 1)

			status = manager.status('*', StatusType.RAW)
			expect(status.queued.length).toBe(0)
			expect(status.active.length).toBe(1)
			expect(status.completed.length).toBe(2)
			expect(status.total.length).toBe(3)

			isError = status.completed.filter(thread => thread.status.ERROR)
			isSuccess = status.completed.filter(thread => thread.status.SUCCESS)
			expect(isError.length).toBe(1)
			expect(isSuccess.length).toBe(1)

			worker3.worker?.emit('error', new Error('some error'))

			status = manager.status('*', StatusType.RAW)
			expect(status.queued.length).toBe(0)
			expect(status.active.length).toBe(1)
			expect(status.completed.length).toBe(2)
			expect(status.total.length).toBe(3)

			isError = status.completed.filter(thread => thread.status.ERROR)
			isSuccess = status.completed.filter(thread => thread.status.SUCCESS)
			expect(isError.length).toBe(1)
			expect(isSuccess.length).toBe(1)

			worker3.worker?.emit('exit', 1)

			status = manager.status('*', StatusType.RAW)
			expect(status.queued.length).toBe(0)
			expect(status.active.length).toBe(0)
			expect(status.completed.length).toBe(3)
			expect(status.total.length).toBe(3)

			isError = status.completed.filter(thread => thread.status.ERROR)
			isSuccess = status.completed.filter(thread => thread.status.SUCCESS)
			expect(isError.length).toBe(2)
			expect(isSuccess.length).toBe(1)

		})
	})

	describe.concurrent('Thread Management', () => {
		let manager: WorkerPool

		beforeEach(() => {
			manager = new WorkerPool(``, { eval: true })
			vi.useFakeTimers()
		})

		afterEach(() => {
			vi.clearAllMocks()
			vi.clearAllTimers()
			vi.useRealTimers()
		})

		it('should respect poolSize limit', async () => {
			let status
			manager.poolSize = 2
			const workers = Array.from({ length: 5 }, () => manager.addWorker(``))

			vi.advanceTimersByTime(100)

			status = manager.status()
			expect(status.active).toBe(2)
			expect(status.queued).toBe(3)

			workers[0].worker?.emit('exit', 0)

			status = manager.status()
			expect(status.active).toBe(2)
			expect(status.queued).toBe(2)

			workers[1].worker?.emit('exit', 1)
			workers[2].worker?.emit('exit', 0)
			workers[3].worker?.emit('exit', 2)
			workers[4].worker?.emit('exit', 0)

			status = manager.status()
			expect(status.active).toBe(0)
			expect(status.queued).toBe(0)
		})
	})

	describe.concurrent('Math Worker Test', () => {
		it('should execute multiple math tasks in parallel', async () => {
			const startTime = performance.now()
			const messages: string[] = []

			// Properly mock console.log to capture output without printing
			const consoleLogMock = vi.spyOn(console, 'log').mockImplementation((...args) => {
				messages.push(args.join(' '))
			})

			// Create worker pool using the test-math-worker.ts fixture
			const manager = (new WorkerPool(new URL(`./../fixtures/test-math-worker${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url)))
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

			// Add the tasks that were in the original math.ts file
			manager.addTask({ fn: 'fib', args: [42] }, 'fib(42)')
			manager.addTask({ fn: 'findPrimesUpTo', args: [17000000] }, 'findPrimesUpTo(17000000)')
			manager.addTask({ fn: 'tribonacci', args: [32] }, 'tribonacci(32)')
			manager.addTask({ fn: 'estimatePi', args: [25] }, 'estimatePi(25)')

			// Wait for all tasks to complete
			await new Promise<void>((resolve) => {
				const checkInterval = setInterval(() => {
					if (manager.status('completed', StatusType.COUNT) === 4) {
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

	describe.sequential('Sequential Tests', () => {
		describe.sequential('Worker Two-Way Communication', () => {
			let manager: WorkerPool
			let worker: Worker
			const testData = { taskId: 1, data: 'Process this data' }

			beforeEach(async () => {
				manager = new WorkerPool(fileURLToPath(new URL(`./../fixtures/test-simple-two-way-com-worker${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url)))
				const thread = manager.addTask(testData)
				worker = await thread.getWorker()
			})

			afterEach(async () => {
				if (worker) {
					await worker.terminate()
				}
			})

			it('should handle two-way communication between main thread and worker', async () => {
				return new Promise<void>((resolve) => {
					const messages: string[] = []

					let messageCount = 0
					const MAX_MESSAGES = 5

					worker.on('message', (message) => {
						messages.push(message)

						if (++messageCount < MAX_MESSAGES) {
							worker.postMessage(`Main response #${messageCount}`)
						} else {
							worker.terminate()
						}
					})

					worker.on('exit', (code) => {
						expect(code).toBe(isDeno ? 0 : 1)

						// Verify message sequence
						expect(messages).toHaveLength(5)
						expect(messages[0]).toMatch(/Worker processed message #1: Start processing/)
						expect(messages[1]).toMatch(/Worker processed message #2: Main response #1/)
						expect(messages[2]).toMatch(/Worker processed message #3: Main response #2/)
						expect(messages[3]).toMatch(/Worker processed message #4: Main response #3/)
						expect(messages[4]).toMatch(/Worker processed message #5: Main response #4/)

						resolve()
					})

					worker.postMessage('Start processing')
				})
			})

			it('should initialize worker with correct data', async () => {
				return new Promise<void>((resolve) => {
					worker.once('message', (message) => {
						expect(message).toMatch(/Worker processed message #1: Start processing/)
						worker.terminate()
					})

					worker.on('exit', () => {
						resolve()
					})

					worker.postMessage('Start processing')
				})
			})
		})

		describe.sequential('Edge Cases and Error Handling', () => {
			let manager: WorkerPool

			beforeEach(() => {
				manager = new WorkerPool(``, { eval: true })
				vi.useFakeTimers()
			})

			afterEach(() => {
				vi.clearAllMocks()
				vi.clearAllTimers()
				vi.useRealTimers()
			})

			it('should handle worker errors gracefully', () => {
				const errorSpy = vi.fn()
				manager.on('worker.error', errorSpy)

				const worker = manager.addWorker(``)
				vi.advanceTimersByTime(100)

				worker.worker?.emit('error', new Error('Test error'))
				expect(errorSpy).toHaveBeenCalled()
			})

			it('should handle message errors', () => {
				const errorSpy = vi.fn()
				manager.on('worker.messageerror', errorSpy)

				const worker = manager.addWorker(``)
				vi.advanceTimersByTime(100)

				worker.worker?.emit('messageerror', new Error('Message error'))
				expect(errorSpy).toHaveBeenCalled()
			})

			it('should handle invalid status field requests', () => {
				expect(() => manager.status('invalidField')).toThrow()
			})

			it('should handle rapid worker creation and termination', () => {
				const workers = Array.from({ length: 100 }, () => manager.addWorker(``))

				expect(manager.isCompleted()).toBe(false)

				workers.forEach(worker => {
					worker.worker?.emit('exit', 0)
				})

				expect(manager.isCompleted()).toBe(true)
			})

			it('should emit complete event when all workers are done', async () => {
				const completeSpy = vi.fn()
				manager.on('complete', completeSpy)
				const worker = manager.addWorker(``)
				vi.advanceTimersByTime(100)

				expect(completeSpy).not.toHaveBeenCalled()

				worker.worker?.emit('exit', 0)

				// Allow microtask queued to process
				await Promise.resolve()

				expect(completeSpy).toHaveBeenCalled()
			})

			it('should handle worker creation with invalid options', () => {
				const worker = manager.addWorker({ invalidOption: true })
				expect(worker).toBeInstanceOf(WorkerThread)
			})
		})

		describe.sequential('WorkerPool with Real Worker', () => {
			it('should handle echo messages', async () => {
				const manager: WorkerPool = new WorkerPool(new URL(`./../fixtures/test-different-types-of-response${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url))
				return new Promise<void>(async (resolve) => {
					const messageSpy = vi.fn()
					const exitSpy = vi.fn()
					manager.on('worker.message', (message, thread) => {
						messageSpy(message)
					})
					manager.on('worker.exit', (exitCode, thread) => {
						exitSpy(0)
					})
					manager.on('complete', () => {
						expect(messageSpy).toHaveBeenCalledWith(expect.objectContaining({ data: 'hello' }))
						expect(messageSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'echo', data: 'world' }))
						expect(messageSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'long-task', data: 'Long task completed' }))
						expect(messageSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'delay-task', data: 'Delay task completed' }))
						expect(exitSpy).toHaveBeenCalledWith(0)
						resolve()
					})

					// Deno has a quirk in vitest where it doesn't detect correctly, but it is correct in the real world
					await manager.enableExitEventFallback(isDeno ? true : undefined)
					const thread = manager.addTask({ data: 'hello' })
					thread.worker?.postMessage({ type: 'echo', data: 'world' })
					await delay(100)
					await delay(100)
					thread.worker?.postMessage({ type: 'long-task', delay: 100 })
					await delay(100)
					await delay(100)
					thread.worker?.postMessage({ type: 'delay', delay: 150 })
					await delay(100)
					await delay(100)
					thread.worker?.postMessage({ type: 'safe-close' })
				})
			})

			it('should handle successful task completion', async () => {
				const manager: WorkerPool = new WorkerPool(new URL(`./../fixtures/test-different-types-of-response${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url))
				await manager.enableExitEventFallback(isDeno ? true : undefined)

				const messageSpy = vi.fn()
				const exitSpy = vi.fn()
				manager.on('worker.message', messageSpy)
				manager.on('worker.exit', exitSpy)

				const thread = manager.addTask()
				await delay(100)
				thread.worker?.postMessage({ type: 'success' })
				await delay(100)
				thread.worker?.postMessage({ type: 'safe-close' })
				await delay(100)
				expect(messageSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', data: 'Task completed' }), thread)
				expect(exitSpy).toHaveBeenCalledWith(0, thread)
			})

			it('should handle worker errors', async () => {
				const manager: WorkerPool = new WorkerPool(new URL(`./../fixtures/test-different-types-of-response${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url))
				const errorSpy = vi.fn()
				manager.on('worker.error', (error, thread) => {
					errorSpy(-1)
				})

				await manager.enableExitEventFallback(isDeno ? true : undefined)
				const thread = manager.addTask()
				await delay(100)
				thread.worker?.postMessage({ type: 'error' })
				await delay(100)
				thread.worker?.postMessage({ type: 'safe-close' })
				await delay(100)
				expect(errorSpy).toHaveBeenCalledWith(-1)
			})

			it('should handle once event listeners correctly', async () => {
				const manager: WorkerPool = new WorkerPool(new URL(`./../fixtures/test-different-types-of-response${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url))
				return new Promise<void>(async (resolve) => {
					const messageSpy = vi.fn()
					await manager.enableExitEventFallback(isDeno ? true : undefined)
					const thread = manager.addTask({ data: 'test' })

					// Should only be called once even though we send multiple messages
					manager.once('worker.message', (message, thread) => {
						messageSpy(message)
					})
					await delay(100)

					{
						thread.worker?.postMessage({ type: 'echo', data: 'first' })
						thread.worker?.postMessage({ type: 'echo', data: 'second' })
						await delay(100)
					}
					{
						thread.worker?.postMessage({ type: 'safe-close' })
						await delay(100)
					}
					expect(messageSpy).toHaveBeenCalledTimes(1)
					expect(messageSpy).toHaveBeenCalledWith(expect.objectContaining({ data: 'test' }))
					expect(messageSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'echo', data: 'first' }))
					expect(messageSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'echo', data: 'second' }))
					resolve()
				})
			})

			it('should properly remove event listeners with off', async () => {
				const manager: WorkerPool = new WorkerPool(new URL(`./../fixtures/test-different-types-of-response${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url))
				return new Promise<void>(async (resolve) => {
					const messageSpy = vi.fn()
					await manager.enableExitEventFallback(isDeno ? true : undefined)
					const thread = manager.addTask({ data: 'test' })

					const messageHandler = (message, thread) => {
						messageSpy(message)
					}

					// Add and then remove the listener
					manager.on('worker.message', messageHandler)
					manager.off('worker.message', messageHandler)
					await delay(100)

					thread.worker?.postMessage({ type: 'echo', data: 'test message' })
					await delay(100)

					thread.worker?.postMessage({ type: 'safe-close' })
					await delay(100)

					expect(messageSpy).not.toHaveBeenCalled()
					resolve()
				})
			})

			it('should handle multiple event listeners with on/once/off correctly', async () => {
				const manager: WorkerPool = new WorkerPool(new URL(`./../fixtures/test-different-types-of-response${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url))
				return new Promise<void>(async (resolve) => {
					const onSpy = vi.fn()
					const onceSpy = vi.fn()
					const removedSpy = vi.fn()

					await manager.enableExitEventFallback(isDeno ? true : undefined)
					manager.once('worker.message', (message, thread) => {
						onceSpy(message)
					})
					const thread = manager.addTask({ data: 'test' })
					await delay(100)

					// Handler that will be removed
					const removedHandler = (message, thread) => {
						removedSpy(message)
					}

					// Add different types of listeners
					manager.on('worker.message', (message, thread) => {
						onSpy(message)
					})

					manager.on('worker.message', removedHandler)
					manager.off('worker.message', removedHandler)
					{
						await delay(100)
					}
					{
						thread.worker?.postMessage({ type: 'echo', data: 'first' })
						thread.worker?.postMessage({ type: 'echo', data: 'second' })
						await delay(200)
					}
					{
						thread.worker?.postMessage({ type: 'safe-close' })
						await delay(100)
					}

					expect(onceSpy).toHaveBeenCalledTimes(1)
					expect(removedSpy).not.toHaveBeenCalled()
					expect(onSpy).toHaveBeenCalledWith(expect.objectContaining({ data: 'first' }))
					expect(onSpy).toHaveBeenCalledWith(expect.objectContaining({ data: 'second' }))
					expect(onceSpy).toHaveBeenCalledWith(expect.objectContaining({ data: 'test' }))
					resolve()
				})
			})

			it('should handle worker-level once event listeners correctly', async () => {
				const manager: WorkerPool = new WorkerPool(new URL(`./../fixtures/test-different-types-of-response${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url))
				return new Promise<void>(async (resolve) => {
					const messageSpy = vi.fn()
					await manager.enableExitEventFallback(isDeno ? true : undefined)
					const thread = manager.addTask({ data: 'test' })

					thread.worker?.once('message', (message) => {
						messageSpy(message)
					})
					await delay(100)

					{
						thread.worker?.postMessage({ type: 'echo', data: 'first' })
						thread.worker?.postMessage({ type: 'echo', data: 'second' })
						await delay(100)
					}
					{
						thread.worker?.postMessage({ type: 'safe-close' })
						await delay(100)
					}

					expect(messageSpy).toHaveBeenCalledTimes(1)
					expect(messageSpy).toHaveBeenCalledWith(expect.objectContaining({ data: 'test' }))
					expect(messageSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'echo', data: 'first' }))
					expect(messageSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'echo', data: 'second' }))
					resolve()
				})
			})

			it('should properly remove worker-level event listeners with off', async () => {
				const manager: WorkerPool = new WorkerPool(new URL(`./../fixtures/test-different-types-of-response${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url))
				return new Promise<void>(async (resolve) => {
					const messageSpy = vi.fn()
					await manager.enableExitEventFallback(isDeno ? true : undefined)
					const thread = manager.addTask({ data: 'test' })

					const messageHandler = (message) => {
						messageSpy(message)
					}

					thread.worker?.on('message', messageHandler)
					thread.worker?.off('message', messageHandler)

					await delay(100)

					thread.worker?.postMessage({ type: 'echo', data: 'test message' })
					await delay(100)

					thread.worker?.postMessage({ type: 'safe-close' })
					await delay(100)

					expect(messageSpy).not.toHaveBeenCalled()
					resolve()
				})
			})

			it('should handle multiple worker-level event listeners with on/once/off correctly', async () => {
				const manager: WorkerPool = new WorkerPool(new URL(`./../fixtures/test-different-types-of-response${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url))
				return new Promise<void>(async (resolve) => {
					const onSpy = vi.fn()
					const onceSpy = vi.fn()
					const removedSpy = vi.fn()

					await manager.enableExitEventFallback(true)
					const thread = manager.addTask({ data: 'test' })
					thread.worker?.once('message', (message) => {
						onceSpy(message)
					})
					await delay(100)

					const removedHandler = (message) => {
						removedSpy(message)
					}

					thread.worker?.on('message', (message) => {
						onSpy(message)
					})

					thread.worker?.on('message', removedHandler)
					thread.worker?.off('message', removedHandler)

					{
						await delay(100)
						await delay(100)
						thread.worker?.postMessage({ type: 'echo', data: 'first' })
						thread.worker?.postMessage({ type: 'echo', data: 'second' })
						await delay(100)
						await delay(100)
					}
					{
						thread.worker?.postMessage({ type: 'safe-close' })
						await delay(100)
						await delay(100)
					}

					expect(onSpy).toHaveBeenCalledTimes(2)
					expect(onceSpy).toHaveBeenCalledTimes(1)
					expect(removedSpy).not.toHaveBeenCalled()
					expect(onSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'echo', data: 'first' }))
					expect(onSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'echo', data: 'second' }))
					expect(onceSpy).toHaveBeenCalledWith(expect.objectContaining({ data: 'test' }))
					resolve()
				})
			})
		})

		describe.sequential('Worker Lifecycle', () => {
			it('should handle multiple workers with different states', async () => {
				let status
				const manager = new WorkerPool(new URL(`./../fixtures/test-different-types-of-response${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url))
				await manager.enableExitEventFallback()

				const workers = [
					manager.addTask(undefined, 0),
					manager.addTask(undefined, 1),
					manager.addTask(undefined, 2),
				]

				{
					workers[0].worker?.postMessage({ type: 'safe-close' })
					workers[1].worker?.postMessage({ type: 'error' })
					workers[1].worker?.terminate()
					workers[2].worker?.postMessage({ type: 'long-task' })
					await delay(250)
				}
				await delay(100)
				status = manager.status('*')
				expect(status.completed).toBe(2)
				expect(status.active).toBe(1)
				{
					workers[2].worker?.postMessage({ type: 'safe-close' })
					await delay(100)
					// NOTE: now the 3rd worker is closed because the delay allow the next tick to run
				}
				await delay(100)
				status = manager.status('*')
				expect(status.completed).toBe(3)
				expect(status.active).toBe(0)
			})
		})

		describe.sequential('Resource Management', () => {
			it('should handle maximum concurrent workers', async () => {
				let status
				const manager = new WorkerPool(fileURLToPath(new URL(`./../fixtures/test-different-types-of-response${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url)))
				await manager.enableExitEventFallback(isDeno ? true : undefined)
				manager.poolSize = 2
				expect(manager.hasAvailableThread()).toBe(true)
				expect(manager.isCompleted()).toBe(true)
				const workers = Array.from({ length: 5 }, (v, k) => manager.addTask({}, k))
				expect(manager.hasAvailableThread()).toBe(false)
				expect(manager.isCompleted()).toBe(false)

				{
					await delay(100)
				}
				status = manager.status('*')

				expect(status.queued).toBe(3)
				expect(status.active).toBe(2)
				expect(status.completed).toBe(0)

				{
					workers[0].worker?.postMessage({ type: 'safe-close' })
					await delay(100)
				}
				status = manager.status('*')
				expect(status.queued).toBe(2)
				expect(status.active).toBe(2)
				expect(status.completed).toBe(1)
				expect(manager.hasAvailableThread()).toBe(false)
				expect(manager.isCompleted()).toBe(false)

				{
					workers[2].worker?.terminate()
					await delay(100)
				}
				status = manager.status('*')
				expect(status.queued).toBe(1)
				expect(status.active).toBe(2)
				expect(status.completed).toBe(2)

				{
					workers[1].worker?.postMessage({ type: 'safe-close' })
					workers[3].worker?.terminate()
					await delay(100)
				}
				expect(manager.hasAvailableThread()).toBe(true)
				expect(manager.isCompleted()).toBe(false)
				{
					workers[4].worker?.postMessage({ type: 'safe-close' })
					await delay(100)
				}
				status = manager.status('*')
				expect(status.queued).toBe(0)
				expect(status.active).toBe(0)
				expect(status.completed).toBe(5)
				expect(manager.hasAvailableThread()).toBe(true)
				expect(manager.isCompleted()).toBe(true)
			})
		})

		describe.sequential('Promise-like methods', () => {
			let manager: WorkerPool

			beforeEach(() => {
				manager = new WorkerPool(``, { eval: true })
				vi.useFakeTimers()
			})

			afterEach(() => {
				vi.clearAllMocks()
				vi.clearAllTimers()
				vi.useRealTimers()
			})

			it('should register a callback via allSettled that fires when all tasks complete', async () => {
				const allSettledSpy = vi.fn()
				manager.allSettled(allSettledSpy)

				// Add some tasks
				const tasks = Array.from({ length: 3 }, () => manager.addTask())

				// Initially the callback shouldn't be called
				expect(allSettledSpy).not.toHaveBeenCalled()

				// Complete all tasks
				tasks.forEach(task => task.worker?.emit('exit', 0))
				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				// Now the callback should have been called
				expect(allSettledSpy).toHaveBeenCalledTimes(1)
				expect(allSettledSpy).toHaveBeenCalledWith(expect.any(Array))
				const threads = allSettledSpy.mock.calls[0][0]
				expect(threads).toHaveLength(3)
			})

			it('should call allSettled multiple times when new tasks are added after previous completion', async () => {
				const allSettledSpy = vi.fn()
				manager.allSettled(allSettledSpy)

				// First batch of tasks
				const tasksBatch1 = Array.from({ length: 2 }, () => manager.addTask())

				// Complete first batch
				tasksBatch1.forEach(task => task.worker?.emit('exit', 0))
				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				// Check first call
				expect(allSettledSpy).toHaveBeenCalledTimes(1)

				// Second batch of tasks
				const tasksBatch2 = Array.from({ length: 3 }, () => manager.addTask())

				// Initially the callback shouldn't be called again yet
				expect(allSettledSpy).toHaveBeenCalledTimes(1)

				// Complete second batch
				tasksBatch2.forEach(task => task.worker?.emit('exit', 0))
				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				// The callback should have been called again
				expect(allSettledSpy).toHaveBeenCalledTimes(2)

				// Third batch - add just one more task
				const task = manager.addTask()
				task.worker?.emit('exit', 0)
				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				// The callback should have been called a third time
				expect(allSettledSpy).toHaveBeenCalledTimes(3)
			})

			it('should handle all() with successful completion', async () => {
				const allSpy = vi.fn()
				manager.all(allSpy)

				// Add three workers
				const threads = Array.from({ length: 3 }, () => manager.addTask())

				// Initially the callback shouldn't be called
				expect(allSpy).not.toHaveBeenCalled()

				// Complete all workers
				threads.forEach(thread => thread.worker?.emit('exit', 0))
				vi.advanceTimersByTime(100)
				await vi.runAllTimersAsync()

				// Verify the callback was called with completed threads
				expect(allSpy).toHaveBeenCalledTimes(1)
				expect(allSpy).toHaveBeenCalledWith(expect.any(Array))
				const completedThreads = allSpy.mock.calls[0][0]
				expect(completedThreads).toHaveLength(3)
			})

			it('should handle all() with error', async () => {
				const allSpy = vi.fn()
				manager.all(allSpy)

				// Add some workers
				const thread1 = manager.addTask()
				const thread2 = manager.addTask()

				// Emit an error on the second thread
				const error = new Error('Task failed')
				thread2.worker?.emit('error', error)
				thread2.worker?.emit('exit', 1)

				// Complete the first thread
				thread1.worker?.emit('exit', 0)

				// Verify callback was called with the error
				expect(allSpy).toHaveBeenCalledTimes(1)
				expect(allSpy).toHaveBeenCalledWith(error)
			})

			it('should handle any() with success', async () => {
				const anySpy = vi.fn()
				manager.any(anySpy)

				// Add two workers
				const thread1 = manager.addTask()
				const thread2 = manager.addTask()

				// Make sure event handlers are properly attached
				await Promise.resolve()

				// Complete the first thread with a success message
				const data = { success: true, value: 'test result' }
				thread1.worker?.emit('message', data)

				// We need to manually trigger the complete event response
				await Promise.resolve()

				// Verify callback was called with the successful thread and data
				expect(anySpy).toHaveBeenCalledTimes(1)
				expect(anySpy.mock.calls[0][0]).toBe(data)
				expect(anySpy.mock.calls[0][1]).toBe(thread1)
			})

			it('should handle any() with all failures', async () => {
				const anySpy = vi.fn()
				manager.any(anySpy)

				// Add two workers that will fail
				const thread1 = manager.addTask()
				const thread2 = manager.addTask()

				// Make sure event handlers are properly attached
				await Promise.resolve()

				// Both threads exit with errors
				thread1.worker?.emit('exit', 1)
				thread2.worker?.emit('exit', 1)

				// Manually trigger 'complete' event since we're in a test environment
				manager.emit('complete')

				// We need to wait for the promise to resolve
				await Promise.resolve()

				// Verify callback was called with undefined thread and AggregateError
				expect(anySpy).toHaveBeenCalledTimes(1)
				// @ts-ignore
				expect(anySpy.mock.calls[0][0]).toBeInstanceOf(AggregateError)
				expect(anySpy.mock.calls[0][1]).toBeUndefined()
			})

			it('should handle race() with success', async () => {
				const raceSpy = vi.fn()
				manager.race(raceSpy)

				// Add two workers
				const thread1 = manager.addTask()
				const thread2 = manager.addTask()

				// Make sure event handlers are properly attached
				await Promise.resolve()

				// First worker completes with a success message
				const data = { result: 'first worker finished' }
				thread1.worker?.emit('message', data)

				// Wait for event handling
				await Promise.resolve()

				// Verify callback was called with the first thread and data
				expect(raceSpy).toHaveBeenCalledTimes(1)
				expect(raceSpy.mock.calls[0][0]).toBe(data)
				expect(raceSpy.mock.calls[0][1]).toBe(thread1)

				// Second thread completes later, callback should not be called again
				thread2.worker?.emit('message', { result: 'second worker finished' })
				expect(raceSpy).toHaveBeenCalledTimes(1)
			})

			it('should handle race() with error', async () => {
				const raceSpy = vi.fn()
				manager.race(raceSpy)

				// Add two workers
				const thread1 = manager.addTask()
				const thread2 = manager.addTask()

				// Make sure event handlers are properly attached
				await Promise.resolve()

				// First worker fails with an error
				const error = new Error('Worker failed')
				thread1.worker?.emit('error', error)

				// Wait for event handling
				await Promise.resolve()

				// Verify callback was called with the first thread and error
				expect(raceSpy).toHaveBeenCalledTimes(1)
				expect(raceSpy.mock.calls[0][0]).toBe(error)
				expect(raceSpy.mock.calls[0][1]).toBe(thread1)
			})

			it('should handle method chaining', () => {
				const allSpy = vi.fn()
				const anySpy = vi.fn()
				const raceSpy = vi.fn()
				const allSettledSpy = vi.fn()

				expect(manager.all(allSpy)).toBe(manager)
				expect(manager.any(anySpy)).toBe(manager)
				expect(manager.race(raceSpy)).toBe(manager)
				expect(manager.allSettled(allSettledSpy)).toBe(manager)
			})
		})

		describe.sequential('Promise-like Methods', () => {
			let manager: WorkerPool

			beforeEach(() => {
				manager = new WorkerPool(``, { eval: true })
				vi.useFakeTimers()
			})

			afterEach(() => {
				vi.clearAllMocks()
				vi.clearAllTimers()
				vi.useRealTimers()
			})

			it('should handle successful resolution with then()', async () => {
				const thenSpy = vi.fn()
				manager.then(thenSpy)

				// Add a task that will succeed
				const thread = manager.addTask()
				const data = { result: 'success' }

				// Make sure event handlers are properly attached
				await Promise.resolve()

				// Emit a success message
				thread.worker?.emit('message', data)

				// Wait for event handling
				await Promise.resolve()

				expect(thenSpy).toHaveBeenCalledWith(data, thread)
			})

			it('should handle errors with catch()', async () => {
				const catchSpy = vi.fn()
				manager.catch(catchSpy)

				// Add a task that will fail
				const thread = manager.addTask()
				const error = new Error('Task failed')

				// Make sure event handlers are properly attached
				await Promise.resolve()

				// Emit an error
				thread.worker?.emit('error', error)
				thread.worker?.emit('exit', 1)

				// Wait for event handling
				await Promise.resolve()

				expect(catchSpy).toHaveBeenCalledWith(error, 'error', thread)
			})

			it('should handle message errors with catch()', async () => {
				const catchSpy = vi.fn()
				manager.catch(catchSpy)

				// Add a task that will fail
				const thread = manager.addTask()
				const error = new Error('Task failed')

				// Make sure event handlers are properly attached
				await Promise.resolve()

				// Emit an error
				thread.worker?.emit('messageerror', error)
				thread.worker?.emit('exit', 1)

				// Wait for event handling
				await Promise.resolve()

				expect(catchSpy).toHaveBeenCalledWith(error, 'messageerror', thread)
			})

			it('should handle completion with finally()', async () => {
				const finallySpy = vi.fn()
				manager.finally(finallySpy)

				// Add and complete a task
				const thread = manager.addTask()

				// Make sure event handlers are properly attached
				await Promise.resolve()

				// Emit exit event
				thread.worker?.emit('exit', 0)

				// Wait for event handling
				await Promise.resolve()

				expect(finallySpy).toHaveBeenCalledWith(0, thread)
			})
		})
	})
})

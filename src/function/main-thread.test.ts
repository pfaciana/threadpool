import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { importTaskWorker, importWorker, importPersistentWorker } from '@/index'
import { Worker } from 'node:worker_threads'

import type * as testType from './../fixtures/test-module.ts'

const testModulePath = new URL(`./../fixtures/test-module${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url)

describe('Main Thread Module', () => {
	describe('Main Thread Module w/ mocks', () => {
		let mockWorkerInstance: any

		beforeEach(() => {
			vi.mock('node:worker_threads', () => {
				const Worker = vi.fn(() => ({
					on: vi.fn(),
					postMessage: vi.fn(),
					removeAllListeners: vi.fn(),
					terminate: vi.fn(),
				}))
				return { Worker: Worker, default: { Worker } }
			})

			vi.mock('node:url', () => ({ URL: vi.fn((path) => ({ href: `file://${path}` })) }))

			vi.clearAllMocks()

			// Setup mock worker behavior
			mockWorkerInstance = {
				on: vi.fn((event, callback) => {
					// Store callbacks for later triggering
					if (event === 'message') {
						mockWorkerInstance._messageCallback = callback
					} else if (event === 'error') {
						mockWorkerInstance._errorCallback = callback
					} else if (event === 'messageerror') {
						mockWorkerInstance._messageErrorCallback = callback
					}
				}),
				postMessage: vi.fn(),
				removeAllListeners: vi.fn(),
				terminate: vi.fn(),
				_messageCallback: null,
				_errorCallback: null,
				_messageErrorCallback: null,
			}

			// Make the Worker constructor return our mock instance
			vi.mocked(Worker).mockImplementation(() => mockWorkerInstance)
		})

		afterEach(() => {
			vi.resetModules() // Reset modules to clear mocks
			vi.restoreAllMocks() // Restore all mocks to their original implementations
		})

		describe('importTaskWorker', () => {
			it('should create a non-persistent, non-direct thread with correct proxy methods', async () => {
				const { add } = await importTaskWorker<typeof testType>(testModulePath)

				// Should return a proxy function that returns a function
				expect(typeof add).toBe('function')
				const addFn = add(2, 3)
				expect(typeof addFn).toBe('function')

				// Should create a worker when the returned function is called
				const resultPromise = addFn()

				expect(Worker).toHaveBeenCalledTimes(1)
				expect(mockWorkerInstance.on).toHaveBeenCalledTimes(3) // message, messageerror, error

				// Simulate worker response
				mockWorkerInstance._messageCallback(5)

				const result = await resultPromise
				expect(result).toBe(5)
				expect(mockWorkerInstance.terminate).toHaveBeenCalled() // Should terminate for non-persistent
			})
		})

		describe('importWorker', () => {
			it('should create a non-persistent, direct thread with immediate execution', async () => {
				const { add } = await importWorker<typeof testType>(testModulePath)

				// Should return a proxy function that executes immediately
				expect(typeof add).toBe('function')
				const resultPromise = add(2, 3)

				expect(Worker).toHaveBeenCalledTimes(1)
				expect(mockWorkerInstance.on).toHaveBeenCalledTimes(3) // message, messageerror, error

				// Simulate worker response
				mockWorkerInstance._messageCallback(5)

				const result = await resultPromise
				expect(result).toBe(5)
				expect(mockWorkerInstance.terminate).toHaveBeenCalled() // Should terminate for non-persistent
			})
		})

		describe('importPersistantWorker', () => {
			it('should create a persistent thread that reuses the worker', async () => {
				const { add, multiply } = await importPersistentWorker<typeof testType>(testModulePath)

				// First call
				const firstPromise = add(2, 3)
				mockWorkerInstance._messageCallback(5)
				const firstResult = await firstPromise

				// Second call with same worker
				const secondPromise = multiply(4, 5)
				mockWorkerInstance._messageCallback(20)
				const secondResult = await secondPromise

				expect(firstResult).toBe(5)
				expect(secondResult).toBe(20)
				expect(Worker).toHaveBeenCalledTimes(1) // Worker created only once
				expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(2) // Two postMessage calls
				expect(mockWorkerInstance.terminate).not.toHaveBeenCalled() // Should not terminate for persistent
			})

			it('should provide a terminate method with default key', async () => {
				const module = await importPersistentWorker<typeof testType>(testModulePath)

				expect(typeof module.terminate).toBe('function')
				module.terminate()

				expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1)
			})

			it('should allow custom terminate key', async () => {
				const module = await importPersistentWorker<typeof testType>(testModulePath, undefined, { terminateKey: 'close' })

				// Use type assertion to handle the custom property
				expect(typeof (module as any).terminate).toBe('undefined')
				expect(typeof (module as any).close123).toBe('undefined')

				expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(0)

				// Use type assertion to handle the custom property
				expect(typeof (module as any).close).toBe('function')
				// Use type assertion to handle the custom property
				expect(typeof (module as any).close).toBe('function')
				;(module as any).close()

				expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1)
			})
		})

		describe('error handling', () => {
			it('should handle worker errors', async () => {
				const module = await importWorker<typeof testType>(testModulePath)

				const promise = module.add(1, 2)

				// Simulate error
				mockWorkerInstance._errorCallback(new Error('Worker error'))

				await expect(promise).rejects.toThrow('Worker error')
			})

			it('should handle timeout errors', async () => {
				// Override postMessage to not trigger any callbacks
				mockWorkerInstance.postMessage.mockImplementation(() => {
				})

				const module = await importWorker<typeof testType>(testModulePath)

				// Mock setTimeout
				vi.useFakeTimers()

				const promise = module.add(1, 2)

				// Fast-forward time
				vi.advanceTimersByTime(31000) // Default timeout is 30000ms

				await expect(promise).rejects.toThrow('Worker timeout after 30000ms')

				vi.useRealTimers()
			})
		})

		describe('property access', () => {
			it('should access module properties directly', async () => {
				const module = await importWorker<typeof testType>(testModulePath)

				// Verify that accessing properties doesn't create workers
				expect(Worker).not.toHaveBeenCalled()

				// Check direct property access
				const propResult = module.someProperty()
				mockWorkerInstance._messageCallback('test value')
				expect(await propResult).toBe('test value')
				expect(Worker).toHaveBeenCalledTimes(1)

				// Verify that methods still work through workers
				const result = module.add(2, 3)
				mockWorkerInstance._messageCallback(5)
				expect(await result).toBe(5)
				expect(Worker).toHaveBeenCalledTimes(2)
			})
		})

		describe('workerPromise function', () => {
			it('should clean up listeners on successful completion', async () => {
				const module = await importWorker<typeof testType>(testModulePath)

				const promise = module.multiply(2, 3)

				mockWorkerInstance._messageCallback(6)

				await promise

				expect(mockWorkerInstance.removeAllListeners).toHaveBeenCalledTimes(3) // message, messageerror, error
			})

			it('should clean up listeners on error', async () => {
				const module = await importWorker<typeof testType>(testModulePath)

				const promise = module.add(2, 3)

				mockWorkerInstance._errorCallback(new Error('Test error'))

				await expect(promise).rejects.toThrow('Test error')

				expect(mockWorkerInstance.removeAllListeners).toHaveBeenCalledTimes(3) // message, messageerror, error
			})

			it('should clean up listeners on messageerror', async () => {
				const module = await importWorker<typeof testType>(testModulePath)

				const promise = module.add(2, 3)

				mockWorkerInstance._messageErrorCallback(new Error('Message error'))

				await expect(promise).rejects.toThrow('Message error')

				expect(mockWorkerInstance.removeAllListeners).toHaveBeenCalledTimes(3) // message, messageerror, error
			})
		})
	})

	// Real Worker integration tests - using actual Worker implementation
	describe('Real Worker Integration Tests', async () => {
		const testTypeModule = await import('./../fixtures/test-module.ts')

		beforeEach(() => {
			// Ensure any mocks are cleared before these tests
			vi.resetModules()
			// Explicitly restore the real Worker implementation
			vi.doUnmock('node:worker_threads')
			vi.doUnmock('node:url')
		})

		it('should work with real workers for importWorker', async () => {
			const { importWorker } = await import('./main-thread.ts')
			const { add, multiply, someProperty } = await importWorker<typeof testTypeModule>(testModulePath)

			const sum = await add(5, 7)
			expect(sum).toBe(12)

			const product = await multiply(3, 4)
			expect(product).toBe(12)

			const somePropertyProp = await someProperty()
			expect(somePropertyProp).toBe('test value')
		})

		it('should work with real workers for importTaskWorker', async () => {
			const { importTaskWorker } = await import('./main-thread.ts')
			const { add, someProperty } = await importTaskWorker<typeof testTypeModule>(testModulePath)

			const addFn = add(5, 7)
			expect(typeof addFn).toBe('function')
			const sum = await addFn()
			expect(sum).toBe(12)

			const somePropertyFn = someProperty()
			expect(typeof somePropertyFn).toBe('function')
			const somePropertyProp = await somePropertyFn()
			expect(somePropertyProp).toBe('test value')
		})

		it('should work with real workers for importPersistentWorker', async () => {
			const { importPersistentWorker } = await import('./main-thread.ts')
			const module = await importPersistentWorker<typeof testTypeModule>(testModulePath)
			const { add, multiply, terminate } = module

			// First operation
			const sum = await add(5, 7)
			expect(sum).toBe(12)

			// Second operation with same worker
			const product = await multiply(3, 4)
			expect(product).toBe(12)

			// Make sure terminate works
			expect(typeof terminate).toBe('function')
			terminate()
		})

		it('should work with real workers for importPersistentWorker', async () => {
			const { importPersistentWorker } = await import('./main-thread.ts')
			const module = await importPersistentWorker<typeof testTypeModule>(testModulePath, undefined, { terminateKey: 'close' })
			// @ts-ignore
			const { add, multiply, someProperty, someProperty123, close, close123, terminate } = module

			const sum = await add(5, 7)
			expect(sum).toBe(12)

			const product = await multiply(3, 4)
			expect(product).toBe(12)

			expect(typeof someProperty).toBe('function')
			const somePropertyProp = await someProperty()
			expect(somePropertyProp).toBe('test value')

			expect(typeof someProperty123).toBe('undefined')

			// Make sure default terminate does not work
			expect(typeof terminate).toBe('undefined')
			expect(typeof close123).toBe('undefined')

			// Make sure terminate works
			expect(typeof close).toBe('function')
			close()
		})
	})
})

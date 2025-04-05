import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { importTaskWebWorker, importWebWorker, importPersistentWebWorker, setWorkerUrl, getWorkerUrl } from '@/index'

import type * as testType from './../fixtures/test-module.ts'

const testModulePath = new URL(`./../fixtures/test-module${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url)

// Type for test module with custom terminate key
type CustomTerminateModule<T> = Omit<T, 'terminate'> & { close(): void }

describe('Web Main Thread Module', () => {
	let mockWorkerInstance: any
	let mockSharedWorkerInstance: any
	const originalSelf = globalThis.self

	beforeEach(() => {
		// Mock Worker constructor
		mockWorkerInstance = {
			addEventListener: vi.fn((event, callback) => {
				if (event === 'message') {
					mockWorkerInstance._messageCallback = (e) => {
						callback(e?.data)
					}
				} else if (event === 'error') {
					mockWorkerInstance._errorCallback = (e) => {
						callback(e?.error)
					}
				} else if (event === 'messageerror') {
					mockWorkerInstance._messageErrorCallback = callback
				}
			}),
			postMessage: vi.fn(),
			terminate: vi.fn(),
			_triggerMessage: function(data: any) {
				this._messageCallback?.({ data })
			},
			_triggerError: function(error: Error) {
				this._errorCallback?.(error)
			},
			_triggerMessageError: function(error: Error) {
				this._messageErrorCallback?.(error)
			},
			_messageCallback: null,
			_errorCallback: null,
			_messageErrorCallback: null,
		}

		// Mock SharedWorker constructor with proper port setup
		mockSharedWorkerInstance = {
			port: {
				addEventListener: vi.fn((event, callback) => {
					if (event === 'message') {
						mockSharedWorkerInstance._messageCallback = callback
					} else if (event === 'error') {
						mockSharedWorkerInstance._errorCallback = callback
					} else if (event === 'messageerror') {
						mockSharedWorkerInstance._messageErrorCallback = callback
					}
				}),
				postMessage: vi.fn(),
				start: vi.fn(),
				close: vi.fn(),
			},
			_triggerMessage: function(data: any) {
				this._messageCallback?.({ data })
			},
			_triggerError: function(error: Error) {
				this._errorCallback?.(error)
			},
			_triggerMessageError: function(error: Error) {
				this._messageErrorCallback?.(error)
			},
			_messageCallback: null,
			_errorCallback: null,
			_messageErrorCallback: null,
		}

		// Mock global Worker and SharedWorker constructors with proper scope types
		globalThis.Worker = vi.fn(() => mockWorkerInstance)
		globalThis.SharedWorker = vi.fn(() => mockSharedWorkerInstance)

		// Cast partial self implementation to avoid type conflicts
		Object.defineProperty(globalThis, 'self', {
			value: {
				Worker: globalThis.Worker,
				SharedWorker: globalThis.SharedWorker,
				DedicatedWorkerGlobalScope: undefined as unknown as typeof DedicatedWorkerGlobalScope,
				SharedWorkerGlobalScope: undefined as unknown as typeof SharedWorkerGlobalScope,
			},
			configurable: true,
		})
	})

	afterEach(() => {
		globalThis.self = originalSelf
		vi.clearAllMocks()
	})

	describe('Worker File Management', () => {
		it('should generate default worker file URL if not set', () => {
			setWorkerUrl('')
			const workerFile = getWorkerUrl()
			expect(workerFile.toString()).toContain('data:application/javascript,')
		})

		it('should set and get worker file correctly', () => {
			const testFile = 'test-worker.ts'
			setWorkerUrl(testFile)
			expect(getWorkerUrl()).toBe(testFile)
		})
	})

	describe('importThread', () => {
		it('should create a non-persistent, non-direct thread with correct proxy methods', async () => {
			const { add } = await importTaskWebWorker<typeof testType>(testModulePath)

			expect(typeof add).toBe('function')
			const addFn = add(2, 3)
			expect(typeof addFn).toBe('function')

			const resultPromise = addFn()

			expect(globalThis.Worker).toHaveBeenCalledTimes(1)
			expect(mockWorkerInstance.addEventListener).toHaveBeenCalledTimes(3)

			mockWorkerInstance._messageCallback({ data: 5 })

			const result = await resultPromise
			expect(result).toBe(5)
		})
	})

	describe('importWebWorker', () => {
		it('should create a non-persistent, direct thread with immediate execution', async () => {
			const { add } = await importWebWorker<typeof testType>(testModulePath)

			expect(typeof add).toBe('function')
			const resultPromise = add(2, 3)

			expect(globalThis.Worker).toHaveBeenCalledTimes(1)
			expect(mockWorkerInstance.addEventListener).toHaveBeenCalledTimes(3)

			mockWorkerInstance._messageCallback({ data: 5 })

			const result = await resultPromise
			expect(result).toBe(5)
		})

		it('should handle worker errors', async () => {
			const { add } = await importWebWorker<typeof testType>(testModulePath)
			const promise = add(2, 3)

			mockWorkerInstance._triggerError({ error: new Error('Worker error') })
			await expect(promise).rejects.toThrow('Worker error')
		})

		it('should handle message errors', async () => {
			const { add } = await importWebWorker<typeof testType>(testModulePath)
			const promise = add(2, 3)

			mockWorkerInstance._triggerMessageError(new Error('Message error'))
			await expect(promise).rejects.toThrow('Message error')
		})

		it('should handle timeouts', async () => {
			const { add } = await importWebWorker<typeof testType>(testModulePath, {}, { timeout: 100 })
			const promise = add(2, 3)

			vi.useFakeTimers()
			vi.advanceTimersByTime(101)

			await expect(promise).rejects.toThrow('Worker timeout after 100ms')
			vi.useRealTimers()
		})
	})

	describe('importPersistentWebWorker', () => {
		it('should create a persistent thread that reuses the worker', async () => {
			const { add, multiply } = await importPersistentWebWorker<typeof testType>(testModulePath)

			// First call
			const firstPromise = add(2, 3)
			mockWorkerInstance._messageCallback({ data: 5 })
			const firstResult = await firstPromise

			// Second call with same worker
			const secondPromise = multiply(4, 5)
			mockWorkerInstance._messageCallback({ data: 20 })
			const secondResult = await secondPromise

			expect(firstResult).toBe(5)
			expect(secondResult).toBe(20)
			expect(globalThis.Worker).toHaveBeenCalledTimes(1)
			expect(mockWorkerInstance.terminate).not.toHaveBeenCalled()
		})

		it('should provide terminate method with default key', async () => {
			const module = await importPersistentWebWorker<typeof testType>(testModulePath)
			expect(typeof module.terminate).toBe('function')
			module.terminate()
			expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1)
		})

		it('should support custom terminate key', async () => {
			type TestTypeWithCustomTerminate = CustomTerminateModule<typeof testType & { terminate?: never }>
			const module = await importPersistentWebWorker<typeof testType>(testModulePath, {}, { terminateKey: 'close' }) as unknown as TestTypeWithCustomTerminate

			expect(typeof (module as any).terminate).toBe('undefined')
			expect(typeof module.close).toBe('function')
			module.close()
			expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1)
		})
	})
})

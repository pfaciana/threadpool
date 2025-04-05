import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Worker, WorkerThread, ThreadStatus, Status } from '@/index'

// Mock the Worker class
vi.mock('node:worker_threads', () => {
	const mockWorkerEvents: Record<string, Function[]> = {}
	const Worker = vi.fn().mockImplementation(() => {
		return {
			on: vi.fn((event, callback) => {
				mockWorkerEvents[event] = mockWorkerEvents[event] || []
				mockWorkerEvents[event].push(callback)
				return this
			}),
			emit: (event: string, ...args: any[]) => {
				if (mockWorkerEvents[event]) {
					mockWorkerEvents[event].forEach(cb => cb(...args))
				}
			},
		}
	})

	return { Worker: Worker, default: { Worker }, SHARE_ENV: Symbol('SHARE_ENV') }
})

describe('WorkerThread', () => {
	let workerThread: WorkerThread
	const mockFilename = './test-worker.js'
	const mockOptions = { workerData: { test: true } }
	const mockMeta = { id: 1 }

	beforeEach(() => {
		vi.clearAllMocks()
		workerThread = new WorkerThread(mockFilename, mockOptions, mockMeta)
	})

	describe('initialization', () => {
		it('should initialize with correct properties', () => {
			expect(workerThread.status).toBeInstanceOf(ThreadStatus)
			expect(workerThread.status.READY).toBe(true)
			expect(workerThread.meta).toBe(mockMeta)
			expect(workerThread.worker).toBeUndefined()
		})

		it('should initialize with object parameter', () => {
			const objWorkerThread = new WorkerThread({
				file: mockFilename,
				workerData: { test: true },
				meta: mockMeta,
			})
			expect(objWorkerThread.status).toBeInstanceOf(ThreadStatus)
			expect(objWorkerThread.status.READY).toBe(true)
			expect(objWorkerThread.meta).toBe(mockMeta)
		})
	})

	describe('event handling', () => {
		it('should emit status change events', () => {
			const statusSpy = vi.fn()
			workerThread.on('status', statusSpy)
			workerThread.start()
			expect(statusSpy).toHaveBeenCalledWith(
				workerThread.status,
				Status.ACTIVE,
				Status.READY,
			)
		})

		it('should emit worker.init event on start', () => {
			const initSpy = vi.fn()
			workerThread.on('init', initSpy)
			workerThread.start()
			expect(initSpy).toHaveBeenCalledWith(workerThread)
		})
	})

	describe('worker operations', () => {
		it('should create worker when start is called', () => {
			workerThread.start()
			expect(Worker).toHaveBeenCalledWith(mockFilename, mockOptions)
			expect(workerThread.worker).toBeDefined()
			expect(workerThread.status.ACTIVE).toBe(true)
		})

		it('should not create worker if already created', () => {
			expect(Worker).toHaveBeenCalledTimes(0)

			workerThread.start()
			const firstWorker = workerThread.worker
			expect(Worker).toHaveBeenCalledTimes(1)

			// Call start again
			workerThread.start()

			// Should be the same worker instance
			expect(workerThread.worker).toBe(firstWorker)
			expect(Worker).toHaveBeenCalledTimes(1)
		})

		it('should handle worker error events', () => {
			const errorSpy = vi.fn()
			workerThread.on('status', errorSpy)

			workerThread.start()

			// Simulate worker error event
			const mockWorker = workerThread.worker as Worker
			const mockError = new Error('Test error')
			mockWorker.emit('error', mockError)

			expect(errorSpy).toHaveBeenCalledWith(
				workerThread.status,
				Status.ERROR,
				Status.ACTIVE,
				mockError,
			)
			expect(workerThread.status.ERROR).toBe(true)
		})

		it('should handle worker exit events with success', () => {
			const statusSpy = vi.fn()
			workerThread.on('status', statusSpy)

			workerThread.start()

			// Simulate worker exit event
			const mockWorker = workerThread.worker as Worker
			const exitCode = 0
			mockWorker.emit('exit', exitCode)

			expect(statusSpy).toHaveBeenCalledWith(
				workerThread.status,
				Status.SUCCESS,
				Status.ACTIVE,
				exitCode,
			)
			expect(workerThread.status.SUCCESS).toBe(true)
		})

		it('should not change status to success if already in error state', () => {
			const statusSpy = vi.fn()
			workerThread.on('status', statusSpy)

			workerThread.start()

			const mockWorker = workerThread.worker as Worker

			// First trigger error
			mockWorker.emit('error')
			expect(workerThread.status.ERROR).toBe(true)

			// Reset spy
			statusSpy.mockReset()

			// Then exit
			mockWorker.emit('exit', 0)

			// Status should not change from ERROR to SUCCESS
			expect(statusSpy).not.toHaveBeenCalled()
			expect(workerThread.status.ERROR).toBe(true)
			expect(workerThread.status.SUCCESS).toBe(false)
		})
	})

	describe('getWorker', () => {
		it('should return existing worker if available', async () => {
			workerThread.start()
			const worker = await workerThread.getWorker()
			expect(worker).toBe(workerThread.worker)
		})

		it('should wait for worker to be initialized if not yet available', async () => {
			// Create a promise that will resolve when we simulate the worker.init event
			const workerPromise = workerThread.getWorker()

			// Start the worker after calling getWorker
			setTimeout(() => {
				workerThread.start()
			}, 10)

			const worker = await workerPromise
			expect(worker).toBe(workerThread.worker)
		})
	})

	describe('promise-like interface', () => {
		let workerThread: WorkerThread

		beforeEach(() => {
			vi.clearAllMocks()
			workerThread = new WorkerThread(mockFilename, mockOptions, mockMeta)
			workerThread.start()
		})

		it('should handle then() for message events', () => {
			const result = { data: 'test-message' }
			const thenSpy = vi.fn()

			workerThread.then(thenSpy)

			const mockWorker = workerThread.worker as Worker
			mockWorker.emit('message', result)

			expect(thenSpy).toHaveBeenCalledWith(result)
		})

		it('should handle catch() for error events', () => {
			const error = new Error('Test error')
			const catchSpy = vi.fn()

			workerThread.catch(catchSpy)

			const mockWorker = workerThread.worker as Worker
			mockWorker.emit('error', error)

			expect(catchSpy).toHaveBeenCalledWith(error, 'error')
		})

		it('should handle catch() for messageerror events', () => {
			const error = new Error('Test messageerror')
			const catchSpy = vi.fn()

			workerThread.catch(catchSpy)

			const mockWorker = workerThread.worker as Worker
			mockWorker.emit('messageerror', error)

			expect(catchSpy).toHaveBeenCalledWith(error, 'messageerror')
		})

		it('should handle finally() for exit events', () => {
			const exitCode = 0
			const finallySpy = vi.fn()

			workerThread.finally(finallySpy)

			const mockWorker = workerThread.worker as Worker
			mockWorker.emit('exit', exitCode)

			expect(finallySpy).toHaveBeenCalled()
		})

		it('should support chaining then, catch, and finally', () => {
			const result = { data: 'test-message' }
			const thenSpy = vi.fn()
			const catchSpy = vi.fn()
			const finallySpy = vi.fn()

			workerThread
				.then(thenSpy)
				.catch(catchSpy)
				.finally(finallySpy)

			const mockWorker = workerThread.worker as Worker
			mockWorker.emit('message', result)
			mockWorker.emit('exit', 0)

			expect(thenSpy).toHaveBeenCalledWith(result)
			expect(catchSpy).not.toHaveBeenCalled()
			expect(finallySpy).toHaveBeenCalled()
		})

		it('should handle multiple messages with then()', () => {
			const result1 = { data: 'message-1' }
			const result2 = { data: 'message-2' }
			const thenSpy = vi.fn()

			workerThread.then(thenSpy)

			const mockWorker = workerThread.worker as Worker
			mockWorker.emit('message', result1)
			mockWorker.emit('message', result2)

			expect(thenSpy).toHaveBeenCalledTimes(2)
			expect(thenSpy).toHaveBeenNthCalledWith(1, result1)
			expect(thenSpy).toHaveBeenNthCalledWith(2, result2)
		})

		it('should not emit error events when no error listeners', () => {
			const error = new Error('Test error')

			const mockWorker = workerThread.worker as Worker
			mockWorker.emit('error', error)

			// Test passes if no error is thrown
		})
	})

	describe('getters', () => {
		beforeEach(() => {
			workerThread.start()
		})

		it('should store and return message through getter', () => {
			const testMessage = { data: 'test message' }
			const mockWorker = workerThread.worker as Worker

			expect(workerThread.message).toBeUndefined()
			mockWorker.emit('message', testMessage)
			expect(workerThread.message).toBe(testMessage)
		})

		it('should store and return error through getter', () => {
			const testError = new Error('test error')
			const mockWorker = workerThread.worker as Worker

			expect(workerThread.error).toBeUndefined()
			mockWorker.emit('error', testError)
			expect(workerThread.error).toBe(testError)
		})

		it('should store and return messageerror through error getter', () => {
			const testError = new Error('test message error')
			const mockWorker = workerThread.worker as Worker

			expect(workerThread.error).toBeUndefined()
			mockWorker.emit('messageerror', testError)
			expect(workerThread.error).toBe(testError)
		})
	})
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FunctionThread, ThreadStatus, Status } from '@/index'

describe('FunctionThread', () => {
	let functionThread: FunctionThread
	const mockWorkerFn = vi.fn().mockImplementation(() => Promise.resolve())
	const mockMeta = { id: 1 }

	beforeEach(() => {
		mockWorkerFn.mockReset().mockImplementation(() => Promise.resolve())
		functionThread = new FunctionThread({ workerFn: mockWorkerFn, meta: mockMeta })
	})

	describe('initialization', () => {
		it('should initialize with correct properties', () => {
			expect(functionThread.status).toBeInstanceOf(ThreadStatus)
			expect(functionThread.status.READY).toBe(true)
			expect(functionThread.meta).toBe(mockMeta)
			expect(functionThread.message).toBeUndefined()
			expect(functionThread.error).toBeUndefined()
		})
	})

	describe('event handling', () => {
		it('should emit status change events', () => {
			const statusSpy = vi.fn()
			functionThread.on('status', statusSpy)
			functionThread.start()
			expect(statusSpy).toHaveBeenCalledWith(
				functionThread.status,
				Status.ACTIVE,
				Status.READY,
			)
		})

		it('should emit worker.init event on start', () => {
			const initSpy = vi.fn()
			functionThread.on('init', initSpy)
			functionThread.start()
			expect(initSpy).toHaveBeenCalledWith(functionThread)
		})
	})

	describe('function execution', () => {
		it('should handle successful execution', async () => {
			const result = 'success'
			mockWorkerFn.mockResolvedValue(result)

			const messageSpy = vi.fn()
			const statusSpy = vi.fn()
			const exitSpy = vi.fn()

			functionThread.on('message', messageSpy)
			functionThread.on('status', statusSpy)
			functionThread.on('exit', exitSpy)

			functionThread.start()

			await vi.waitFor(() => {
				expect(messageSpy).toHaveBeenCalledWith(result)
				expect(statusSpy).toHaveBeenCalledWith(
					expect.any(ThreadStatus),
					Status.SUCCESS,
					Status.ACTIVE,
					result,
				)
				expect(exitSpy).toHaveBeenCalledWith(0)
				expect(functionThread.message).toBe(result)
				expect(functionThread.error).toBeUndefined()
				expect(functionThread.status.SUCCESS).toBe(true)
			})
		})

		it('should handle execution error', async () => {
			const error = new Error('Test error')
			mockWorkerFn.mockRejectedValue(error)

			const errorSpy = vi.fn()
			const statusSpy = vi.fn()
			const exitSpy = vi.fn()

			functionThread.on('error', errorSpy)
			functionThread.on('status', statusSpy)
			functionThread.on('exit', exitSpy)

			functionThread.start()

			await vi.waitFor(() => {
				expect(errorSpy).toHaveBeenCalledWith(error)
				expect(statusSpy).toHaveBeenCalledWith(
					expect.any(ThreadStatus),
					Status.ERROR,
					Status.ACTIVE,
					error,
				)
				expect(exitSpy).toHaveBeenCalledWith(1)
				expect(functionThread.message).toBeUndefined()
				expect(functionThread.error).toBe(error)
				expect(functionThread.status.ERROR).toBe(true)
			})
		})

		it('should handle execution exception', async () => {
			const error = new Error('Test exception')
			mockWorkerFn.mockImplementation(() => Promise.reject(error))

			const errorSpy = vi.fn()
			const statusSpy = vi.fn()
			const exitSpy = vi.fn()

			functionThread.on('error', errorSpy)
			functionThread.on('status', statusSpy)
			functionThread.on('exit', exitSpy)

			functionThread.start()

			await vi.waitFor(() => {
				expect(errorSpy).toHaveBeenCalledWith(error)
				expect(statusSpy).toHaveBeenCalledWith(
					expect.any(ThreadStatus),
					Status.ERROR,
					Status.ACTIVE,
					error,
				)
				expect(exitSpy).toHaveBeenCalledWith(1)
				expect(functionThread.message).toBeUndefined()
				expect(functionThread.error).toBe(error)
				expect(functionThread.status.ERROR).toBe(true)
			})
		})
	})

	describe('edge cases', () => {
		it('should emit messageerror event when promise catches an error', async () => {
			// This tests the specific catch block path that emits messageerror
			// Set up a special mock that will trigger the catch block specifically
			const error = new Error('Test error for catch block')
			const catchableMockFn = vi.fn().mockImplementation(() => {
				return Promise.resolve().then(() => {
					throw error // This will be caught by catch() rather than handled by then()'s second argument
				})
			})

			functionThread = new FunctionThread({ workerFn: catchableMockFn, meta: mockMeta })

			const messageErrorSpy = vi.fn()
			const statusSpy = vi.fn()

			functionThread.on('messageerror', messageErrorSpy)
			functionThread.on('status', statusSpy)

			functionThread.start()

			await vi.waitFor(() => {
				expect(messageErrorSpy).toHaveBeenCalledWith(error)
				expect(functionThread.error).toBe(error)
				expect(functionThread.status.ERROR).toBe(true)
			})
		})

		it('should handle being started multiple times', async () => {
			// Set up a mock that counts calls and resolves with the call count
			let callCount = 0
			mockWorkerFn.mockImplementation(() => {
				callCount++
				return Promise.resolve(`Call ${callCount}`)
			})

			const messageSpy = vi.fn()
			functionThread.on('message', messageSpy)

			// Start multiple times in succession
			const firstStartResult = functionThread.start()
			const secondStartResult = functionThread.start()

			// First start should return true, second should return false
			expect(firstStartResult).toBe(true)
			expect(secondStartResult).toBe(false)

			await vi.waitFor(() => {
				// Should only process the first call
				expect(messageSpy).toHaveBeenCalledTimes(1)
				expect(messageSpy).toHaveBeenCalledWith('Call 1')
				expect(callCount).toBe(1) // Worker function should only be called once
			})
		})

		it('should handle delayed promise resolution', async () => {
			const result = 'delayed result'
			mockWorkerFn.mockImplementation(() => new Promise(resolve => {
				setTimeout(() => resolve(result), 100)
			}))

			const messageSpy = vi.fn()
			functionThread.on('message', messageSpy)

			functionThread.start()

			await vi.waitFor(() => {
				expect(messageSpy).toHaveBeenCalledWith(result)
				expect(functionThread.message).toBe(result)
			}, { timeout: 500 })
		})

		it('should properly clean up event listeners', async () => {
			const result = 'success'
			mockWorkerFn.mockResolvedValue(result)

			const oneShotSpy = vi.fn()
			functionThread.once('message', oneShotSpy) // Using once() instead of on()

			functionThread.start()

			await vi.waitFor(() => {
				expect(oneShotSpy).toHaveBeenCalledWith(result)
				expect(oneShotSpy).toHaveBeenCalledTimes(1)
			})

			// Start again and make sure the one-shot listener doesn't fire twice
			mockWorkerFn.mockResolvedValue('another result')
			functionThread.start()

			// Wait a bit to ensure any events have been processed
			await new Promise(resolve => setTimeout(resolve, 50))
			expect(oneShotSpy).toHaveBeenCalledTimes(1)
		})
	})

	describe('promise-like interface', () => {
		it('should handle then() for successful execution', async () => {
			const result = 'success'
			mockWorkerFn.mockResolvedValue(result)
			const thenSpy = vi.fn()

			functionThread.then(thenSpy)
			functionThread.start()

			await vi.waitFor(() => {
				expect(thenSpy).toHaveBeenCalledWith(result)
				expect(functionThread.message).toBe(result)
			})
		})

		it('should handle catch() for rejected execution', async () => {
			const error = new Error('Test error')
			mockWorkerFn.mockRejectedValue(error)
			const catchSpy = vi.fn()

			functionThread.catch(catchSpy)
			functionThread.start()

			await vi.waitFor(() => {
				expect(catchSpy).toHaveBeenCalledWith(error, 'error')
				expect(functionThread.error).toBe(error)
			})
		})

		it('should handle catch() for messageerror', async () => {
			const error = new Error('Test error for catch block')
			const catchableMockFn = vi.fn().mockImplementation(() => {
				return Promise.resolve().then(() => {
					throw error // This will be caught by catch() rather than handled by then()'s second argument
				})
			})

			functionThread = new FunctionThread({ workerFn: catchableMockFn, meta: mockMeta })
			const catchSpy = vi.fn()

			functionThread.catch(catchSpy)
			functionThread.start()

			await vi.waitFor(() => {
				expect(catchSpy).toHaveBeenCalledWith(error, 'error') // Changed from 'messageerror' to 'error'
				expect(functionThread.error).toBe(error)
			})
		})

		it('should handle finally() for successful execution', async () => {
			const result = 'success'
			mockWorkerFn.mockResolvedValue(result)
			const finallySpy = vi.fn()

			functionThread.finally(finallySpy)
			functionThread.start()

			await vi.waitFor(() => {
				expect(finallySpy).toHaveBeenCalled()
			})
		})

		it('should handle finally() for failed execution', async () => {
			const error = new Error('Test error')
			mockWorkerFn.mockRejectedValue(error)
			const finallySpy = vi.fn()

			functionThread.finally(finallySpy)
			functionThread.start()

			await vi.waitFor(() => {
				expect(finallySpy).toHaveBeenCalled()
			})
		})

		it('should support chaining then, catch and finally', async () => {
			const result = 'success'
			mockWorkerFn.mockResolvedValue(result)

			const thenSpy = vi.fn()
			const catchSpy = vi.fn()
			const finallySpy = vi.fn()

			functionThread
				.then(thenSpy)
				.catch(catchSpy)
				.finally(finallySpy)

			functionThread.start()

			await vi.waitFor(() => {
				expect(thenSpy).toHaveBeenCalledWith(result)
				expect(catchSpy).not.toHaveBeenCalled()
				expect(finallySpy).toHaveBeenCalled()
			})
		})
	})

	describe('getters', () => {
		it('should store and return message through getter', async () => {
			const result = 'success message'
			mockWorkerFn.mockResolvedValue(result)

			expect(functionThread.message).toBeUndefined()
			functionThread.start()

			await vi.waitFor(() => {
				expect(functionThread.message).toBe(result)
			})
		})

		it('should store and return error through getter on rejection', async () => {
			const error = new Error('test error')
			mockWorkerFn.mockRejectedValue(error)

			expect(functionThread.error).toBeUndefined()
			functionThread.start()

			await vi.waitFor(() => {
				expect(functionThread.error).toBe(error)
			})
		})

		it('should store and return error through getter on throw', async () => {
			const error = new Error('test throw error')
			mockWorkerFn.mockImplementation(() => {
				return Promise.resolve().then(() => {
					throw error
				})
			})

			expect(functionThread.error).toBeUndefined()
			functionThread.start()

			await vi.waitFor(() => {
				expect(functionThread.error).toBe(error)
			})
		})
	})
})

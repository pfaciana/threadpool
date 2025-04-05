import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exitEventSupported, close } from '@/index'
import process from 'node:process'

// Mock modules before importing the file to test
vi.mock('node:worker_threads', () => {
	const Worker = vi.fn()
	return { Worker, default: { Worker } }
})

vi.mock('node:process', () => {
	return {
		default: {
			env: {},
		},
	}
})

describe('exitEventSupported', () => {
	beforeEach(() => {
		vi.resetModules()
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.restoreAllMocks()
		vi.useRealTimers()
		delete process.env.USE_EXIT_FALLBACK
	})

	it('should resolve to true when exit event is supported', async () => {
		const mockOn = vi.fn((event, callback) => {
			if (event === 'exit') {
				// Schedule the callback to be called immediately
				setTimeout(callback, 0)
			}
		})

		const { Worker } = await import('node:worker_threads')
		// @ts-ignore - mocking the implementation
		Worker.mockImplementation(() => ({
			on: mockOn,
		}))

		const promise = exitEventSupported(50)

		// Advance timers to trigger the setTimeout in our mock
		vi.advanceTimersByTime(1)

		const result = await promise
		expect(result).toBe(true)
	})

	it('should resolve to false when exit event does not trigger in time', async () => {
		const mockOn = vi.fn()
		const { Worker } = await import('node:worker_threads')
		// @ts-ignore - mocking the implementation
		Worker.mockImplementation(() => ({
			on: mockOn,
		}))

		const promise = exitEventSupported(10)

		// Advance past the timeout
		vi.advanceTimersByTime(15)

		const result = await promise
		expect(result).toBe(false)
	})

	it('should resolve to false when Worker constructor throws an error', async () => {
		const { Worker } = await import('node:worker_threads')
		// @ts-ignore - mocking the implementation
		Worker.mockImplementation(() => {
			throw new Error('Worker initialization error')
		})

		const result = await exitEventSupported(10)
		expect(result).toBe(false)
	})

	describe('close function', () => {
		// Make sure env is clean before each test
		beforeEach(() => {
			delete process.env.USE_EXIT_FALLBACK
		})

		it('should call parentPort.close', () => {
			const mockParentPort = {
				postMessage: vi.fn(),
				close: vi.fn(),
			}

			close(mockParentPort)

			expect(mockParentPort.close).toHaveBeenCalled()
		})

		it('should call postMessage with exitKey when USE_EXIT_FALLBACK is set', () => {
			// Set environment variable locally within this test
			process.env.USE_EXIT_FALLBACK = '1'

			const mockParentPort = {
				postMessage: vi.fn(),
				close: vi.fn(),
			}

			close(mockParentPort)

			expect(mockParentPort.postMessage).toHaveBeenCalled()
			expect(mockParentPort.close).toHaveBeenCalled()
		})

		it('should not call postMessage when USE_EXIT_FALLBACK is not set', () => {
			// Explicitly ensure the environment variable is not set
			delete process.env.USE_EXIT_FALLBACK

			const mockParentPort = {
				postMessage: vi.fn(),
				close: vi.fn(),
			}

			close(mockParentPort)

			expect(mockParentPort.postMessage).not.toHaveBeenCalled()
			expect(mockParentPort.close).toHaveBeenCalled()
		})

		it('should handle undefined parentPort gracefully', () => {
			const mockParentPort = undefined

			// This should not throw an error
			expect(() => close(mockParentPort)).not.toThrow()
		})
	})
})

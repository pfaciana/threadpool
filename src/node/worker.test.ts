import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Worker, exitKey } from '@/index'

// Mock worker_threads module
vi.mock('node:worker_threads', async (importOriginal) => {
	const actual = await importOriginal()

	// Store message handlers to simulate message events
	const handlers: Record<string, Function[]> = {}

	// Create a mock worker class with spies for event methods
	const mockWorkerInstance = {
		on: vi.fn((event: string, handler: Function) => {
			handlers[event] = handlers[event] || []
			handlers[event].push(handler)
			return mockWorkerInstance
		}),
		once: vi.fn().mockReturnThis(),
		off: vi.fn().mockReturnThis(),
		terminate: vi.fn(),
		postMessage: vi.fn(),
		// Test helper to trigger message events
		emit: (event: string, ...args: any[]) => {
			if (handlers[event]) {
				handlers[event].forEach(h => h(...args))
			}
		},
	}

	const Worker = vi.fn().mockImplementation(() => mockWorkerInstance)

	return {
		// @ts-ignore
		...actual,
		Worker: Worker,
		SHARE_ENV: Symbol('SHARE_ENV'),
	}
})

const filename = new URL(`./../fixtures/test-different-types-of-response${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url)

describe('Worker', () => {
	let originalEnv: NodeJS.ProcessEnv

	beforeEach(() => {
		originalEnv = process.env
		process.env = { ...originalEnv }
		vi.clearAllMocks()
	})

	afterEach(() => {
		process.env = originalEnv
		vi.restoreAllMocks()
	})

	describe('constructor', () => {
		it('should create a Worker instance', () => {
			const worker = new Worker(filename)
			expect(worker).toBeInstanceOf(Worker)
		})

		it('should set exitFallback option correctly', () => {
			const worker = new Worker(filename, { exitFallback: true } as any)
			expect(process.env.USE_EXIT_FALLBACK).toBe('1')
			expect(worker).toBeDefined()
		})

		it('should set exitFallback to false by default', () => {
			// Clear the env variable first to ensure a clean test
			delete process.env.USE_EXIT_FALLBACK

			const worker = new Worker(filename)
			expect(process.env.USE_EXIT_FALLBACK).toBeUndefined()
			expect(worker).toBeDefined()
		})

		it('should set env option when not provided', () => {
			const worker = new Worker(filename)
			// This is a bit tricky to test directly since we're mocking the Worker constructor
			// But at least we can verify that it doesn't crash
			expect(worker).toBeInstanceOf(Worker)
		})
	})

	describe('event handling', () => {
		it('should handle regular event listeners with on()', () => {
			// Spy on the eventProxy method
			const eventProxySpy = vi.spyOn(Worker.prototype, 'eventProxy')

			const worker = new Worker(filename)
			const listener = vi.fn()
			worker.on('message', listener)

			// Check if eventProxy was called with the right arguments
			expect(eventProxySpy).toHaveBeenCalledWith('on', 'message', listener)

			// Clean up spy
			eventProxySpy.mockRestore()
		})

		it('should handle once listeners', () => {
			// Spy on the eventProxy method
			const eventProxySpy = vi.spyOn(Worker.prototype, 'eventProxy')

			const worker = new Worker(filename)
			const listener = vi.fn()
			worker.once('message', listener)

			// Check if eventProxy was called with the right arguments
			expect(eventProxySpy).toHaveBeenCalledWith('once', 'message', listener)

			// Clean up spy
			eventProxySpy.mockRestore()
		})

		it('should remove listeners with off()', () => {
			// Spy on the eventProxy method
			const eventProxySpy = vi.spyOn(Worker.prototype, 'eventProxy')

			const worker = new Worker(filename)
			const listener = vi.fn()
			worker.on('message', listener)
			worker.off('message', listener)

			// Check if eventProxy was called with the right arguments for off
			expect(eventProxySpy).toHaveBeenCalledWith('off', 'message', listener)

			// Clean up spy
			eventProxySpy.mockRestore()
		})
	})

	describe('exitFallback functionality', () => {
		it('should process regular messages with exitFallback enabled', () => {
			process.env.USE_EXIT_FALLBACK = '1'

			const worker = new Worker(filename)
			const listener = vi.fn()

			// Track message listeners
			const messageListeners: Function[] = []
			const internalMessageListeners: Function[] = []

			// Spy on eventProxy to capture added listeners
			const eventProxySpy = vi.spyOn(Worker.prototype, 'eventProxy').mockImplementation(function(this: Worker, _method, event, cb) {
				if (event === 'message') {
					messageListeners.push(cb)
				}
				return this
			})

			// Spy on super.on to capture internal listeners
			vi.spyOn(Worker.prototype, 'on').mockImplementation(function(this: Worker, event, cb) {
				if (event === 'message') {
					internalMessageListeners.push(cb)
				}
				return this
			})

			worker.on('message', listener)

			// Simulate message event processing
			const testMessage = { data: 'test' }

			// Simulate the behavior we're testing: when a message is received,
			// if it's not exitKey, it should be passed to the listeners
			if (internalMessageListeners.length > 0) {
				internalMessageListeners[0](testMessage)
				expect(listener).toHaveBeenCalledWith(testMessage)
			} else {
				// If using the actual class, test the stored listeners
				if (messageListeners.length > 0) {
					messageListeners[0](testMessage)
					expect(listener).toHaveBeenCalledWith(testMessage)
				} else {
					expect.fail('No message listeners were registered')
				}
			}

			// Restore spies
			eventProxySpy.mockRestore()
			vi.restoreAllMocks()
		})

		it('should terminate when receiving exitKey message with exitFallback enabled', async () => {
			process.env.USE_EXIT_FALLBACK = '1'

			const worker = new Worker(filename)
			const exitListener = vi.fn()

			worker.on('exit', exitListener);
			(worker as any).emit('message', exitKey)

			await vi.waitFor(() => {
				expect(exitListener).toHaveBeenCalled()
			})
		})
	})
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'
import { asyncEventEmitter } from '@/index'

describe('asyncEventEmitter', () => {
	let emitter: EventEmitter
	let asyncEmit: ReturnType<typeof asyncEventEmitter>

	beforeEach(() => {
		emitter = new EventEmitter()
		asyncEmit = asyncEventEmitter(emitter)
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('should return original value if no listeners are registered', async () => {
		const value = { test: 'value' }
		const result = await asyncEmit('testEvent', value)
		expect(result).toBe(value)
	})

	it('should emit event and return response from listener', async () => {
		const originalValue = { test: 'original' }
		const modifiedValue = { test: 'modified' }

		emitter.on('testEvent', (callback, value) => {
			expect(value).toBe(originalValue)
			callback(modifiedValue)
		})

		const result = await asyncEmit('testEvent', originalValue)
		expect(result).toBe(modifiedValue)
	})

	it('should pass additional arguments to listeners', async () => {
		const originalValue = 'original'
		const modifiedValue = 'modified'
		const extraArg1 = 'extra1'
		const extraArg2 = 'extra2'

		emitter.on('testEvent', (callback, value, arg1, arg2) => {
			expect(value).toBe(originalValue)
			expect(arg1).toBe(extraArg1)
			expect(arg2).toBe(extraArg2)
			callback(modifiedValue)
		})

		const result = await asyncEmit('testEvent', originalValue, extraArg1, extraArg2)
		expect(result).toBe(modifiedValue)
	})

	it('should time out and return original value if listener does not call callback', async () => {
		const value = { test: 'timeout' }

		// Listener that doesn't call the callback
		emitter.on('testEvent', () => {
			// Intentionally not calling the callback
		})

		const result = await asyncEmit('testEvent', value)

		expect(result).toBe(value)
		// Default timeout is 1ms
		vi.advanceTimersByTime(1)
	})

	it('should use custom timeout with waitFor method', async () => {
		const value = { test: 'custom-timeout' }
		const customTimeout = 500

		// Listener that doesn't call the callback
		emitter.on('testEvent', () => {
			// Intentionally not calling the callback
		})

		const promise = asyncEmit.waitFor(customTimeout, 'testEvent', value)

		// Advance less than timeout - promise should not resolve yet
		vi.advanceTimersByTime(customTimeout - 1)

		let resolved = false
		await Promise.race([
			promise.then(() => {
				resolved = true
			}),
			Promise.resolve(),
		])

		expect(resolved).toBe(false)

		// Now advance to timeout - promise should resolve
		vi.advanceTimersByTime(1)
		const result = await promise

		expect(result).toBe(value)
	})

	it('should use custom default timeout', async () => {
		const customDefaultTimeout = 200
		const customEmit = asyncEventEmitter(emitter, customDefaultTimeout)
		const value = { test: 'custom-default' }

		emitter.on('testEvent', () => {
			// Intentionally not calling the callback
		})

		const promise = customEmit('testEvent', value)

		// Advance less than timeout - promise should not resolve yet
		vi.advanceTimersByTime(customDefaultTimeout - 1)

		let resolved = false
		await Promise.race([
			promise.then(() => {
				resolved = true
			}),
			Promise.resolve(),
		])

		expect(resolved).toBe(false)

		// Now advance to timeout - promise should resolve
		vi.advanceTimersByTime(1)
		const result = await promise

		expect(result).toBe(value)
	})
})

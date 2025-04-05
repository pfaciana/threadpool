import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the node:worker_threads module
vi.mock('node:worker_threads', () => ({
	parentPort: {
		postMessage: vi.fn(),
		on: vi.fn(),
	},
	workerData: {
		filename: './test-module',
		property: 'testProperty',
		method: 'testMethod',
		args: ['arg1', 'arg2'],
	},
}))

// Mock dynamic import
vi.mock('./test-module', async () => {
	return {
		testProperty: 'propertyValue',
		testMethod: vi.fn().mockImplementation((...args) => `method called with ${args.join(', ')}`),
		throwErrorMethod: vi.fn().mockImplementation(() => {
			throw new Error('Test error')
		}),
		throwNonErrorMethod: vi.fn().mockImplementation(() => {
			throw 'String error'  // Non-Error object
		}),
	}
})

describe('Worker Thread', () => {
	beforeEach(() => {
		// Clear mocks before each test
		vi.clearAllMocks()
	})

	afterEach(() => {
		// Reset modules after each test
		vi.resetModules()
	})

	it('should load the module and set up message handlers', async () => {
		// Import the module to trigger its execution
		await import('./worker-thread.ts')

		// Verify that parentPort.on was called to set up the message handler
		const { parentPort } = await import('node:worker_threads')
		expect(parentPort?.on).toHaveBeenCalledWith('message', expect.any(Function))
	})

	it('should handle property access messages', async () => {
		// Reset modules to get a fresh instance
		vi.resetModules()

		// Override workerData for this test
		const { workerData } = await import('node:worker_threads')
		workerData.property = 'testProperty'
		delete workerData.method

		// Import to trigger execution
		await import('./worker-thread.ts')

		// Verify that postMessage was called with the property value
		const { parentPort } = await import('node:worker_threads')
		expect(parentPort?.postMessage).toHaveBeenCalledWith('propertyValue')
	})

	it('should handle method call messages', async () => {
		// Reset modules to get a fresh instance
		vi.resetModules()

		// Override workerData for this test
		const { workerData } = await import('node:worker_threads')
		delete workerData.property
		workerData.method = 'testMethod'
		workerData.args = ['arg1', 'arg2']

		// Import to trigger execution
		await import('./worker-thread.ts')

		// Verify that postMessage was called with the method result
		const { parentPort } = await import('node:worker_threads')
		expect(parentPort?.postMessage).toHaveBeenCalledWith('method called with arg1, arg2')
	})

	it('should handle error objects correctly', async () => {
		// Reset modules to get a fresh instance
		vi.resetModules()

		// Override workerData for this test
		const { workerData } = await import('node:worker_threads')
		delete workerData.property
		workerData.method = 'throwErrorMethod'

		// Import to trigger execution
		await import('./worker-thread.ts')

		// Verify that postMessage was called with the error message
		const { parentPort } = await import('node:worker_threads')
		expect(parentPort?.postMessage).toHaveBeenCalledWith({ error: 'Test error' })
	})

	it('should handle non-error thrown objects', async () => {
		// Reset modules to get a fresh instance
		vi.resetModules()

		// Override workerData for this test
		const { workerData } = await import('node:worker_threads')
		delete workerData.property
		workerData.method = 'throwNonErrorMethod'

		// Import to trigger execution
		await import('./worker-thread.ts')

		// Verify that postMessage was called with the stringified error
		const { parentPort } = await import('node:worker_threads')
		expect(parentPort?.postMessage).toHaveBeenCalledWith({ error: 'String error' })
	})
})

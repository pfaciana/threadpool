// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock global self object for Web Worker environment
const mockSelf = {
	addEventListener: vi.fn(),
	postMessage: vi.fn(),
	DedicatedWorkerGlobalScope: true,
	SharedWorkerGlobalScope: undefined,
}

const mockSharedWorkerSelf = {
	addEventListener: vi.fn(),
	postMessage: vi.fn(),
	DedicatedWorkerGlobalScope: undefined,
	SharedWorkerGlobalScope: true,
}

const mockPorts = [{
	addEventListener: vi.fn(),
	postMessage: vi.fn(),
	start: vi.fn(),
}]

// Mock for dynamic import
const mockModule = {
	testProperty: 'property-value',
	testMethod: vi.fn().mockImplementation((...args) => `method-result:${args.join(',')}`),
	throwError: vi.fn().mockImplementation(() => {
		throw new Error('Test error')
	}),
}

vi.mock('test-module-path', async () => {
	return mockModule
})

describe('Worker Thread', () => {
	// Backup original globals
	const originalSelf = global.self

	beforeEach(() => {
		vi.resetModules()
		vi.clearAllMocks()

		// Reset the mock module methods
		mockModule.testMethod.mockClear()
		mockModule.throwError.mockClear()

		// Clear mock event listeners
		mockSelf.addEventListener.mockClear()
		mockSharedWorkerSelf.addEventListener.mockClear()
		mockPorts[0].addEventListener.mockClear()
		mockPorts[0].start.mockClear()
	})

	afterEach(() => {
		// Restore original global object after tests
		if (originalSelf) {
			(global as any).self = originalSelf
		} else {
			(global as any).self = undefined
		}
	})

	describe('Dedicated Worker', () => {
		beforeEach(() => {
			// Set up global self as dedicated worker
			(global as any).self = mockSelf as any
		})

		it('should register a message event listener on initialization', async () => {
			// Import module to trigger its initialization
			await import('./worker-thread.ts')

			// Verify that addEventListener was called with 'message'
			expect(mockSelf.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
		})

		it('should handle property access messages', async () => {
			// Import module to get reference to the handler function
			await import('./worker-thread.ts')

			// Extract the registered message handler
			const messageHandler = mockSelf.addEventListener.mock.calls[0][1]

			// Create a mock event with property access
			const event = {
				data: {
					filename: 'test-module-path',
					property: 'testProperty',
				},
			}

			// Call the handler
			await messageHandler(event)

			// Verify postMessage was called with correct value
			expect(mockSelf.postMessage).toHaveBeenCalledWith('property-value')
		})

		it('should handle method call messages', async () => {
			// Import module to get reference to the handler function
			await import('./worker-thread.ts')

			// Extract the registered message handler
			const messageHandler = mockSelf.addEventListener.mock.calls[0][1]

			// Create a mock event with method call
			const event = {
				data: {
					filename: 'test-module-path',
					method: 'testMethod',
					args: ['arg1', 'arg2'],
				},
			}

			// Call the handler
			await messageHandler(event)

			// Verify the method was called with the correct arguments
			expect(mockModule.testMethod).toHaveBeenCalledWith('arg1', 'arg2')

			// Verify postMessage was called with the method result
			expect(mockSelf.postMessage).toHaveBeenCalledWith('method-result:arg1,arg2')
		})

		it('should handle errors during execution', async () => {
			// Import module to get reference to the handler function
			await import('./worker-thread.ts')

			// Extract the registered message handler
			const messageHandler = mockSelf.addEventListener.mock.calls[0][1]

			// Create a mock event with method that throws error
			const event = {
				data: {
					filename: 'test-module-path',
					method: 'throwError',
				},
			}

			// Call the handler
			await messageHandler(event)

			// Verify postMessage was called with error message
			expect(mockSelf.postMessage).toHaveBeenCalledWith({ error: 'Test error' })
		})
	})

	describe('Shared Worker', () => {
		beforeEach(() => {
			// Set up global self as shared worker
			(global as any).self = mockSharedWorkerSelf as any
		})

		it('should register a connect event listener on initialization', async () => {
			// Import module to trigger its initialization
			await import('./worker-thread.ts')

			// Verify addEventListener was called with 'connect'
			expect(mockSharedWorkerSelf.addEventListener).toHaveBeenCalledWith('connect', expect.any(Function))
		})

		it('should set up message handling for each port', async () => {
			// Import module to get reference to the handler function
			await import('./worker-thread.ts')

			// Extract the registered connect handler
			const connectHandler = mockSharedWorkerSelf.addEventListener.mock.calls[0][1]

			// Call the connect handler with mock event
			connectHandler({ ports: mockPorts } as any)

			// Verify that addEventListener was called on the first port
			expect(mockPorts[0].addEventListener).toHaveBeenCalledWith('message', expect.any(Function))

			// Verify port.start() was called
			expect(mockPorts[0].start).toHaveBeenCalled()
		})

		it('should handle property access messages on port', async () => {
			// Import module to get reference to the handlers
			await import('./worker-thread.ts')

			// Extract the registered connect handler
			const connectHandler = mockSharedWorkerSelf.addEventListener.mock.calls[0][1]

			// Call the connect handler with mock event
			connectHandler({ ports: mockPorts } as any)

			// Extract the registered message handler for the port
			const portMessageHandler = mockPorts[0].addEventListener.mock.calls[0][1]

			// Create a mock event with property access
			const event = {
				data: {
					filename: 'test-module-path',
					property: 'testProperty',
				},
			}

			// Call the handler
			await portMessageHandler(event)

			// Verify postMessage was called on the port with correct value
			expect(mockPorts[0].postMessage).toHaveBeenCalledWith('property-value')
		})

		it('should handle method call messages on port', async () => {
			// Import module to get reference to the handlers
			await import('./worker-thread.ts')

			// Extract the registered connect handler
			const connectHandler = mockSharedWorkerSelf.addEventListener.mock.calls[0][1]

			// Call the connect handler with mock event
			connectHandler({ ports: mockPorts } as any)

			// Extract the registered message handler for the port
			const portMessageHandler = mockPorts[0].addEventListener.mock.calls[0][1]

			// Create a mock event with method call
			const event = {
				data: {
					filename: 'test-module-path',
					method: 'testMethod',
					args: ['arg1', 'arg2'],
				},
			}

			// Call the handler
			await portMessageHandler(event)

			// Verify the method was called with the correct arguments
			expect(mockModule.testMethod).toHaveBeenCalledWith('arg1', 'arg2')

			// Verify postMessage was called on the port with the method result
			expect(mockPorts[0].postMessage).toHaveBeenCalledWith('method-result:arg1,arg2')
		})

		it('should handle errors during execution on port', async () => {
			// Import module to get reference to the handlers
			await import('./worker-thread.ts')

			// Extract the registered connect handler
			const connectHandler = mockSharedWorkerSelf.addEventListener.mock.calls[0][1]

			// Call the connect handler with mock event
			connectHandler({ ports: mockPorts } as any)

			// Extract the registered message handler for the port
			const portMessageHandler = mockPorts[0].addEventListener.mock.calls[0][1]

			// Create a mock event with method that throws error
			const event = {
				data: {
					filename: 'test-module-path',
					method: 'throwError',
				},
			}

			// Call the handler
			await portMessageHandler(event)

			// Verify postMessage was called on the port with error message
			expect(mockPorts[0].postMessage).toHaveBeenCalledWith({ error: 'Test error' })
		})
	})
})
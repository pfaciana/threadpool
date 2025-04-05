// @ts-nocheck
import { isMainThread, parentPort, workerData } from 'node:worker_threads'
import { close } from './../utils/exitEventSupported.ts'

/**
 * Creates a promise that resolves after the specified milliseconds
 *
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>} Promise that resolves after the delay
 */
const delay = (ms): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Test worker implementation that responds to various message types
 * with different behaviors to test the thread pool's handling capabilities.
 *
 * This worker can:
 * - Echo messages
 * - Return success messages
 * - Perform delayed responses
 * - Simulate long-running tasks
 * - Close connections (normal and safe)
 * - Exit with specified codes
 * - Throw errors
 *
 * Used for testing different worker communication patterns and error handling.
 */
if (!isMainThread) {
	// Send initial data back to parent
	parentPort!.postMessage(workerData)

	// Handler for delay messages that uses async/await
	parentPort!.on('message', async (message): Promise<int> => {
		switch (message.type) {
			case 'delay':
				await delay(message?.delay ?? 100)
				parentPort!.postMessage({ type: 'delay-task', data: 'Delay task completed' })
				break
		}
	})

	// Handler for other message types
	parentPort!.on('message', (message): void => {
		switch (message.type) {
			case 'echo':
				parentPort!.postMessage(message)
				break

			case 'success':
				parentPort!.postMessage({ type: 'success', data: 'Task completed' })
				break

			case 'long-task':
				setTimeout(() => {
					parentPort!.postMessage({ type: 'long-task', data: 'Long task completed' })
				}, message?.delay ?? 100)
				break

			case 'close':
				parentPort?.close()
				break

			case 'safe-close':
				close(parentPort)
				break

			case 'exit':
				process.exit(message.code || 0)
				break

			case 'error':
				throw new Error('Simulated worker error')
		}
	})
}

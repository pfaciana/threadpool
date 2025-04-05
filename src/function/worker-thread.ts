/**
 * Node.js Worker Thread implementation for @renderdev/threadpool
 *
 * This script runs inside the Node.js worker thread and handles communication
 * with the main thread. It imports modules requested by the main thread and
 * executes their methods or returns their properties, then sends the results
 * back to the main thread.
 *
 * @module worker-thread
 * @private
 */
import { parentPort, workerData } from 'node:worker_threads'

// Import the requested module based on the filename provided in workerData
const imported = await import(workerData.filename)

/**
 * Processes a message from the main thread, executes the requested operation,
 * and sends the response back.
 *
 * @param {Object} message - The message received from the main thread
 * @param {string} [message.property] - Name of the property to access
 * @param {string} [message.method] - Name of the method to call
 * @param {Array} [message.args] - Arguments to pass to the method
 * @returns {Promise<void>}
 * @private
 */
const sendMessage = async (message): Promise<void> => {
	const { property, method, args } = message

	try {
		// Handle property access request
		if (property) {
			parentPort?.postMessage(imported[property])
		}

		// Handle method call request
		if (method) {
			parentPort?.postMessage(await imported[method](...(args || [])))
		}
	} catch (error: unknown) {
		// Send back error information to the main thread
		if (error instanceof Error) {
			parentPort?.postMessage({ error: error.message })
		} else {
			parentPort?.postMessage({ error: String(error) })
		}
	}
}

// Process the initial message passed via workerData
// NOTE: if this is open thread, this call does not postMessage
// because there is no `property` or `method`, which is expected
// If this is a closed thread, then this is the only postMessage sent
sendMessage(workerData)

// Listen for additional messages from the main thread
parentPort?.on('message', sendMessage)

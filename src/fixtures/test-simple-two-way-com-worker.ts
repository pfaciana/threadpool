import { parentPort } from 'node:worker_threads'

/**
 * Simple test worker that demonstrates basic two-way communication.
 * 
 * This worker:
 * 1. Listens for messages from the parent thread
 * 2. Processes each message by adding a counter number
 * 3. Sends the processed message back to the parent
 * 
 * Maintains an internal counter of processed messages to demonstrate
 * stateful operation within a worker thread.
 * 
 * Used for testing basic message passing functionality between threads.
 */
let processedCount = 0

parentPort?.on('message', (message) => {
	parentPort?.postMessage(`Worker processed message #${++processedCount}: ${message}`)
})

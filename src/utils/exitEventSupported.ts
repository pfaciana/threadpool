import { Worker } from 'node:worker_threads'
import process from 'node:process'

/**
 * Special message key used as a signal for thread termination in environments
 * where worker 'exit' events aren't natively supported.
 * 
 * @constant {string}
 */
export const exitKey = '@@TerminateThread'

/**
 * Tests whether the current Node.js runtime properly supports worker 'exit' events.
 * 
 * This function creates a temporary worker and checks if its exit event fires properly.
 * Used to determine if the exit event fallback mechanism is needed for the current runtime
 * (e.g., Bun or certain Deno versions).
 * 
 * @param {number} [delay=250] - Maximum time in ms to wait for the exit event
 * @returns {Promise<boolean>} True if exit events are properly supported, false otherwise
 * 
 * @example
 * ```ts
 * // Check if exit events work correctly in this environment
 * const supportsExitEvents = await exitEventSupported();
 * 
 * if (supportsExitEvents) {
 *   console.log('Using native exit events');
 * } else {
 *   console.log('Using fallback message-based exit mechanism');
 * }
 * ```
 */
export const exitEventSupported = async (delay = 250): Promise<boolean> => {
	return new Promise<boolean>((resolve) => {
		try {
			const worker = new Worker(``, { eval: true })
			const timeoutID = setTimeout(() => resolve(false), delay)
			worker.on('exit', () => {
				clearTimeout(timeoutID)
				resolve(true)
			})
		} catch (error) {
			resolve(false)
		}
	})
}

/**
 * Safely closes a worker thread's parent port connection, handling different runtime environments.
 * 
 * In environments where exit events aren't properly supported, this function will:
 * 1. Send a special exit message to the parent thread
 * 2. Then close the port connection
 * 
 * The parent thread can listen for this message as a substitute for the exit event.
 * 
 * @param {any} parentPort - The parentPort from worker_threads
 * @returns {void}
 * 
 * @example
 * ```ts
 * import { parentPort } from 'node:worker_threads';
 * import { close } from './utils/exitEventSupported';
 * 
 * // Do worker tasks...
 * 
 * // When done, safely close the worker 
 * close(parentPort);
 * ```
 */
export const close = (parentPort: any): void => {
	if (process.env?.USE_EXIT_FALLBACK == '1') {
		parentPort?.postMessage(exitKey)
	}
	parentPort?.close()
}

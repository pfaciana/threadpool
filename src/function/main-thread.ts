import { URL } from 'node:url'
import { Worker, type WorkerOptions } from 'node:worker_threads'
import { type DeferredPromisifyModule, importWorkerProxy, type MessageOptions, type PromisifyModule, type Terminable } from '../utils/importWorkerProxy.ts'

/**
 * Internal worker script content as a data URL.
 * This is used as a fallback when no custom worker script path is provided.
 *
 * We must inline the worker script as a data URL because of Deno and JSR.
 * Deno's data integrity check pull for jsr.io and file import breaks because
 * it thinks its coming from a HTTP URL, which is not supported.
 * @private
 */
const dataURL = `data:application/javascript,
import { parentPort, workerData } from 'node:worker_threads';

const imported = await import(workerData.filename);

const sendMessage = async (message) => {
	const { property, method, args } = message;

	try {
		if (property) {
			parentPort.postMessage(imported[property]);
		}

		if (method) {
			parentPort.postMessage(await imported[method](...(args || [])));
		}
	} catch (error) {
		if (error instanceof Error) {
			parentPort.postMessage({ error });
		} else {
			parentPort.postMessage({ error });
		}
	}
};

sendMessage(workerData);

parentPort.on('message', sendMessage);
`

/**
 * Path to the worker script file.
 * @private
 */
let workerFile: URL | string

/**
 * Sets the path to the worker script file.
 *
 * This allows customizing the worker script location rather than using
 * the default worker-thread.ts script.
 *
 * @param {URL|string} filename - Path to the worker script file
 *
 * @example
 * ```ts
 * // Use a custom worker script
 * setWorkerFile(new URL('./my-custom-worker.js', import.meta.url));
 *
 * // Later worker imports will use this custom script
 * const worker = await importWorker('./math.js');
 * ```
 */
export const setWorkerFile = (filename: URL | string): void => {
	filename && (workerFile = filename)
}

/**
 * Gets the currently set worker script path or falls back to the default.
 *
 * @returns {URL|string} The current worker script path
 *
 * @example
 * ```ts
 * // Check which worker script is currently in use
 * const workerPath = getWorkerFile();
 * console.log('Using worker script at:', workerPath.toString());
 * ```
 */
export const getWorkerFile = (): URL | string => {
	if (workerFile) {
		return workerFile
	}

	// This bug fix is needed because Deno and JSR will try and import the file from http:// protocol and this will fail
	if (import.meta.url.startsWith('file://')) {
		return new URL(`worker-thread${import.meta.url.substring(import.meta.url.lastIndexOf('.'))}`, import.meta.url)
	}

	// So in the Deno/JSR case, fallback to a hardcoded data URL
	return dataURL
}

/**
 * Type alias for Worker constructor.
 * @private
 * @typedef {typeof Worker} WorkerType
 */
type WorkerType = typeof Worker;

/**
 * Creates a promise for communication with a worker.
 *
 * @private
 * @param {InstanceType<WorkerType>} worker - The worker thread instance
 * @param {any} [message] - Message to send to the worker
 * @param {MessageOptions} [messageOptions={}] - Options for handling the message and response
 * @returns {Promise<any>} Promise resolving to the worker's response
 */
const workerPromise = (worker: InstanceType<WorkerType>, message?: any, messageOptions: MessageOptions = {}): Promise<any> => {
	const { timeout } = { ...{ timeout: 30000 } as MessageOptions, ...messageOptions }

	return new Promise((resolve, reject) => {
		let timeoutID: NodeJS.Timeout | null = null
		const cleanupListeners = (cb, response, eventType: string | null = null) => {
			(timeoutID) && clearTimeout(timeoutID)
			worker.removeAllListeners('message')
			worker.removeAllListeners('messageerror')
			worker.removeAllListeners('error');
			(message === undefined || eventType !== 'message') && worker.terminate() // terminate on single request or on error!
			cb(response)
		}
		worker.on('message', result => cleanupListeners(resolve, result, 'message'))
		worker.on('messageerror', error => cleanupListeners(reject, error, 'messageerror'))
		worker.on('error', error => cleanupListeners(reject, error, 'error'));
		(message !== undefined) && worker.postMessage(message)
		timeout && (timeoutID = setTimeout(() => cleanupListeners(reject, new Error(`Worker timeout after ${timeout}ms`)), timeout))
	})
}

/**
 * Imports a module as a one-time task in a worker thread.
 *
 * The worker is terminated after a single property access or method call.
 * No further interaction with the module is possible after the request.
 * It is designed for the sole purpose of being a shorthand for the FunctionPool.addTask method.
 *
 * @template T - Type of the module being imported
 * @param {string|URL} filename - Path to the module to import in the worker
 * @param {WorkerOptions} [workerOptions={}] - Node.js worker_threads options
 * @param {MessageOptions} [messageOptions={}] - Options for message handling
 * @returns {Promise<DeferredPromisifyModule<T>>} Promise for the deferred module proxy
 *
 * @example
 * ```ts *
// Import a module with math functions
import type * as MathModule from './math.js';

// Create a Function Worker Pool
const pool = new FunctionPool()

// Calculate fibonacci in a worker and get result without persisting the worker
const { fib } = await importTaskWorker<typeof MathModule>('./math.js')

// Instead of passing a task function that calls await fib(42),
// importTaskWorker automatically wraps the method so it's run as a worker
pool.addTask(fib(42))

// vs.
const { fib: fib2 } = await importWorker<typeof MathModule>('./math.js')
pool.addTask(() => fib2(42))
// both lines of code do the same thing!
 * ```
 */
export const importTaskWorker = <T>(filename: string | URL, workerOptions: WorkerOptions = {}, messageOptions: MessageOptions = {}): Promise<DeferredPromisifyModule<T>> => {
	return importWorkerProxy<T>(filename, {
		isBrowser: false,
		isSharedWorker: false,
		isPersistent: false,
		executeImmediately: false,
		WorkerType: Worker as any,
		workerFile: getWorkerFile(),
		workerOptions,
		workerPromise,
		messageOptions: { ...messageOptions, terminate: true },
	})
}

/**
 * Imports a module in a worker thread and immediately executes all exported methods.
 *
 * The worker is automatically terminated after any method call.
 * This is useful for one-off computations where you want to immediately execute a function.
 *
 * @template T - Type of the module being imported
 * @param {string|URL} filename - Path to the module to import in the worker
 * @param {WorkerOptions} [workerOptions={}] - Node.js worker_threads options
 * @param {MessageOptions} [messageOptions={}] - Options for message handling
 * @returns {Promise<PromisifyModule<T>>} Promise for the immediate-execution module proxy
 *
 * @example
```ts
// Import a module with math functions
import type * as MathModule from './math.js';

// This will create a worker, execute fib(40), and terminate the worker
const { fib } = await importWorker<typeof MathModule>('./math.js');
console.log(await fib(42)); // 267914296

// Each call creates a new worker
const sum = await importWorker<typeof MathModule>('./math.js').add(5, 10);
```
 */
export const importWorker = <T>(filename: string | URL, workerOptions: WorkerOptions = {}, messageOptions: MessageOptions = {}): Promise<PromisifyModule<T>> => {
	return importWorkerProxy<T>(filename, {
		isBrowser: false,
		isSharedWorker: false,
		isPersistent: false,
		executeImmediately: true,
		WorkerType: Worker as any,
		workerFile: getWorkerFile(),
		workerOptions,
		workerPromise,
		messageOptions: { ...messageOptions, terminate: true },
	})
}

/**
 * Imports a module in a persistent worker thread.
 *
 * The worker remains active until manually terminated, allowing for multiple
 * method calls and stateful interactions with the module.
 *
 * @template T - Type of the module being imported
 * @param {string|URL} filename - Path to the module to import in the worker
 * @param {WorkerOptions} [workerOptions={}] - Node.js worker_threads options
 * @param {MessageOptions} [messageOptions={}] - Options for message handling
 * @returns {Promise<PromisifyModule<T & Terminable>>} Promise for the persistent module proxy with terminate method
 *
 * @example
 * ```ts
 * // Import a module with math functions
 * import type * as MathModule from './math.js';
 *
 * // Create a persistent worker that keeps state between calls
 * const math = await importPersistentWorker<typeof MathModule>('./math.js');
 *
 * // First calculation
 * const result1 = await math.add(1, 2);
 *
 * // Second calculation using the same worker
 * const result2 = await math.multiply(result1, 4);
 *
 * // Terminate when done
 * math.terminate();
 * ```
 */
export const importPersistentWorker = <T>(filename: string | URL, workerOptions: WorkerOptions = {}, messageOptions: MessageOptions = {}): Promise<PromisifyModule<T & Terminable>> => {
	return importWorkerProxy<T>(filename, {
		isBrowser: false,
		isSharedWorker: false,
		isPersistent: true,
		executeImmediately: true,
		terminateKey: messageOptions?.terminateKey,
		WorkerType: Worker as any,
		workerFile: getWorkerFile(),
		workerOptions,
		workerPromise,
		messageOptions: { ...messageOptions, terminate: false },
	})
}

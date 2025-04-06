import { type DeferredPromisifyModule, importWorkerProxy, type MessageOptions, type PromisifyModule, type Terminable } from './../utils/importWorkerProxy.ts'

/**
 * Internal worker script content as a data URL.
 * This is used as a fallback when no custom worker URL is provided.
 * We are hard coding the JS version of the worker file here, because we don't want
 * the end user to have to worry about saving the worker file to their deployment.
 * @private
 */
const dataURL = 'data:application/javascript,' + encodeURIComponent(`
const sendMessage = (port) => async (event) => {
	const { filename, property, method, args } = event.data
	const imported = await import(filename)

	try {
		if (property) {
			port.postMessage(imported[property])
		}
		if (method) {
			port.postMessage(await imported[method](...(args || [])))
		}
	} catch (error) {
		port.postMessage({ error: error.message })
	}
}

if (!!self.DedicatedWorkerGlobalScope) {
	self.addEventListener('message', sendMessage(self))
} else if (!!self.SharedWorkerGlobalScope) {
	self.addEventListener('connect', ({ ports }) => {
		ports[0].addEventListener('message', sendMessage(ports[0]))
		ports[0].start()
	})
}

export {}
`)

/**
 * Web Worker options interface from the DOM API.
 *
 * @typedef {Object} WorkerOptions
 * @property {('classic'|'module')} [type] - Module system used by the worker
 * @property {('include'|'omit'|'same-origin')} [credentials] - Credentials mode for fetching the worker script
 * @property {string} [name] - Name of the worker for debugging purposes
 */
export interface WorkerOptions {
	type?: 'classic' | 'module';
	credentials?: 'include' | 'omit' | 'same-origin';
	name?: string;
}

/**
 * URL for the worker script.
 * @private
 */
let workerFile: URL | string

/**
 * Sets the URL for the worker script.
 *
 * This allows customizing the worker script location rather than using
 * the default inline data URL.
 *
 * @param {URL|string} filename - URL or string path to the worker script
 *
 * @example
 * ```ts
 * // Use a custom worker script
 * setWorkerUrl(new URL('./my-worker.js', import.meta.url));
 *
 * // Later worker imports will use this custom script
 * const worker = await importWebWorker('./math.js');
 * ```
 */
export const setWorkerUrl = (filename: URL | string): void => {
	filename && (workerFile = filename)
}

/**
 * Gets the currently set worker URL or falls back to the default data URL.
 *
 * @returns {URL|string} The current worker URL or data URL if none is set
 *
 * @example
 * ```ts
 * // Check which worker script is currently in use
 * const workerUrl = getWorkerUrl();
 * console.log('Using worker script at:', workerUrl);
 * ```
 */
export const getWorkerUrl = (): URL | string => {
	return workerFile || dataURL
}

/**
 * Worker constructor type (either Worker or SharedWorker).
 * @private
 * @typedef {(typeof Worker|typeof SharedWorker)} WorkerType
 */
type WorkerType = typeof Worker | typeof SharedWorker;

/**
 * Extended MessageEvent interface with additional error property.
 * @private
 * @typedef {Object} WorkerMessageEvent
 * @extends MessageEvent
 * @property {any} [error] - Error object if an error occurred
 */
interface WorkerMessageEvent extends MessageEvent {
	error?: any;
}

/**
 * Creates a promise for communication with a worker.
 *
 * @private
 * @param {InstanceType<WorkerType>} worker - The Web Worker or SharedWorker instance
 * @param {any} [message] - Message to send to the worker
 * @param {MessageOptions} [messageOptions={}] - Options for handling the message and response
 * @returns {Promise<any>} Promise resolving to the worker's response
 */
const workerPromise = (worker: InstanceType<WorkerType>, message?: any, messageOptions: MessageOptions = {}): Promise<any> => {
	const { timeout = 30000, terminate = false, returnEvent = false } = messageOptions
	const isSharedWorker = worker instanceof self.SharedWorker
	const port: MessagePort | Worker = isSharedWorker ? (worker as SharedWorker).port : (worker as Worker)

	return new Promise((resolve, reject) => {
		const controller = new AbortController()
		const { signal } = controller
		const sendMessage = (cb, response: Event | WorkerMessageEvent, eventType: string | null = null): void => {
			controller.abort();
			(terminate || eventType !== 'message') && (isSharedWorker ? (port as MessagePort).close() : (worker as Worker).terminate()) // terminate on single request or on error!
			cb(returnEvent ? response : (response instanceof MessageEvent ? response.data : (response as WorkerMessageEvent).error ?? response))
		}
		port.addEventListener('message', result => sendMessage(resolve, result, 'message'), { signal })
		port.addEventListener('messageerror', error => sendMessage(reject, error, 'messageerror'), { signal })
		port.addEventListener('error', error => sendMessage(reject, error, 'error'), { signal });
		(isSharedWorker) && (port as MessagePort).start();
		(message !== undefined) && port.postMessage(message)
		if (timeout) {
			let timeoutID = setTimeout(() => sendMessage(reject, new ErrorEvent('timeout', { message: `Worker timeout after ${timeout}ms` }), 'error'), timeout)
			signal.addEventListener('abort', () => clearTimeout(timeoutID), { once: true })
		}
	})
}

/**
 * Imports a module as a one-time task in a Web Worker.
 *
 * The worker is terminated after a single property access or method call.
 * No further interaction with the module is possible after the request.
 *
 * @template T - Type of the module being imported
 * @param {string|URL} filename - Path to the module to import in the worker
 * @param {WorkerOptions} [workerOptions={}] - Options for the Worker constructor
 * @param {MessageOptions} [messageOptions={}] - Options for message handling
 * @returns {Promise<DeferredPromisifyModule<T>>} Promise for the deferred module proxy
 *
 * @example
 * ```ts
 * // Import a module with math functions
 * import type * as MathModule from './math.js';
 *
 * // Create a Function Worker Pool
 * const pool = new FunctionPool()
 *
 * // Calculate fibonacci in a worker and get result without persisting the worker
 * const { fib } = await importTaskWebWorker<typeof MathModule>('./math.js')
 *
 * // Instead of passing a task function that calls await fib(42),
 * // importTaskWorker automatically wraps the method so it's run as a worker
 * pool.addTask(fib(42))
 *
 * // vs.
 * const { fib: fib2 } = await importWebWorker<typeof MathModule>('./math.js')
 * pool.addTask(() => fib2(42))
 * // both lines of code do the same thing!
 * ```
 */
export const importTaskWebWorker = <T>(filename: string | URL, workerOptions: WorkerOptions = {}, messageOptions: MessageOptions = {}): Promise<DeferredPromisifyModule<T>> => {
	return importWorkerProxy<T>(filename, {
		isBrowser: true,
		isSharedWorker: messageOptions?.WorkerType === SharedWorker,
		isPersistent: false,
		executeImmediately: false,
		WorkerType: (messageOptions?.WorkerType ?? Worker) as any,
		workerFile: getWorkerUrl(),
		workerOptions: { type: 'module', ...workerOptions },
		workerPromise,
		messageOptions: { ...messageOptions, terminate: true },
	})
}

/**
 * Imports a module in a Web Worker and immediately executes all exported methods.
 *
 * The worker is terminated after any method call.
 * This is useful for one-off computations where you want to immediately execute a function.
 *
 * @template T - Type of the module being imported
 * @param {string|URL} filename - Path to the module to import in the worker
 * @param {WorkerOptions} [workerOptions={}] - Options for the Worker constructor
 * @param {MessageOptions} [messageOptions={}] - Options for message handling
 * @returns {Promise<PromisifyModule<T>>} Promise for the immediate-execution module proxy
 *
 * @example
 * ```ts
 * // Import a module with math functions
 * import type * as MathModule from './math.js';
 *
 * // This will create a worker, execute fib(40), and terminate the worker
 * const { fib } = await importWebWorker<typeof MathModule>('./math.js');
 * console.log(await fib(42)); // 267914296
 *
 * // Each call creates a new worker
 * const sum = await importWebWorker<typeof MathModule>('./math.js').add(5, 10);
 * ```
 */
export const importWebWorker = <T>(filename: string | URL, workerOptions: WorkerOptions = {}, messageOptions: MessageOptions = {}): Promise<PromisifyModule<T>> => {
	return importWorkerProxy<T>(filename, {
		isBrowser: true,
		isSharedWorker: messageOptions?.WorkerType === SharedWorker,
		isPersistent: false,
		executeImmediately: true,
		WorkerType: (messageOptions?.WorkerType ?? Worker) as any,
		workerFile: getWorkerUrl(),
		workerOptions: { type: 'module', ...workerOptions },
		workerPromise,
		messageOptions: { ...messageOptions, terminate: true },
	})
}

/**
 * Imports a module in a persistent Web Worker.
 *
 * The worker remains active until manually terminated, allowing for multiple
 * method calls and stateful interactions with the module.
 *
 * @template T - Type of the module being imported
 * @param {string|URL} filename - Path to the module to import in the worker
 * @param {WorkerOptions} [workerOptions={}] - Options for the Worker constructor
 * @param {MessageOptions} [messageOptions={}] - Options for message handling
 * @returns {Promise<PromisifyModule<T & Terminable>>} Promise for the persistent module proxy with terminate method
 *
 * @example
 * ```ts
 * // Import a module with math functions
 * import type * as MathModule from './math.js';
 *
 * // Create a persistent worker that keeps state between calls
 * const math = await importPersistentWebWorker<typeof MathModule>('./math.js');
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
 *
 * @example
 * ```ts
 * // Use with a SharedWorker
 * const sharedMath = await importPersistentWebWorker('./math.js', {}, {
 *   WorkerType: SharedWorker,
 *   name: 'shared-math-worker'
 * });
 *
 * // Multiple scripts can now access the same worker
 * const result = await sharedMath.add(10, 20);
 * ```
 */
export const importPersistentWebWorker = <T>(filename: string | URL, workerOptions: WorkerOptions = {}, messageOptions: MessageOptions = {}): Promise<PromisifyModule<T & Terminable>> => {
	return importWorkerProxy<T>(filename, {
		isBrowser: true,
		isSharedWorker: messageOptions?.WorkerType === SharedWorker,
		isPersistent: true,
		executeImmediately: true,
		terminateKey: messageOptions?.terminateKey,
		WorkerType: (messageOptions?.WorkerType ?? Worker) as any,
		workerFile: getWorkerUrl(),
		workerOptions: { type: 'module', ...workerOptions },
		workerPromise,
		messageOptions: { ...messageOptions, terminate: false },
	})
}

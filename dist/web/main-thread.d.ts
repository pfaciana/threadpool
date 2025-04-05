import { type DeferredPromisifyModule, type MessageOptions, type PromisifyModule, type Terminable } from './../utils/importWorkerProxy.js';
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
export declare const setWorkerUrl: (filename: URL | string) => void;
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
export declare const getWorkerUrl: () => URL | string;
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
export declare const importTaskWebWorker: <T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions) => Promise<DeferredPromisifyModule<T>>;
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
export declare const importWebWorker: <T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions) => Promise<PromisifyModule<T>>;
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
export declare const importPersistentWebWorker: <T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions) => Promise<PromisifyModule<T & Terminable>>;
//# sourceMappingURL=main-thread.d.ts.map
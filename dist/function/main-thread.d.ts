import { URL } from 'node:url';
import { type WorkerOptions } from 'node:worker_threads';
import { type DeferredPromisifyModule, type MessageOptions, type PromisifyModule, type Terminable } from '../utils/importWorkerProxy.js';
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
export declare const setWorkerFile: (filename: URL | string) => void;
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
export declare const getWorkerFile: () => URL | string;
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
export declare const importTaskWorker: <T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions) => Promise<DeferredPromisifyModule<T>>;
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
 * ```
 */
export declare const importWorker: <T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions) => Promise<PromisifyModule<T>>;
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
export declare const importPersistentWorker: <T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions) => Promise<PromisifyModule<T & Terminable>>;
//# sourceMappingURL=main-thread.d.ts.map
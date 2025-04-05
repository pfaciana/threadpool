import { WebFunctionThread } from './function-thread.js';
import { TaskPool } from './../pool-status.js';
/**
 * Options for configuring a WebFunctionPool instance.
 *
 * @property {number} [pingInterval] - Interval in ms between task scheduling attempts
 * @property {number} [poolSize] - Maximum number of concurrent threads (defaults to CPU core count)
 */
export type WebFunctionPoolOptions = {
    pingInterval?: number;
    poolSize?: number;
    [key: string]: any;
};
/**
 * Manages a pool of WebFunctionThread instances for parallel execution.
 *
 * WebFunctionPool provides a high-level API for managing multiple function-based
 * threads, automatically handling queuing, execution and event propagation.
 * It offers Promise-like APIs and combinators (then, catch, all, race, etc.)
 * for working with multiple concurrent tasks.
 *
 * @class
 * @extends {EventTarget}
 *
 * @example
 * ```ts
 * // Create a pool with default settings
 * const pool = new WebFunctionPool();
 *
 * // Add several computational tasks
 * pool.addTask(async () => {
 *   // Task 1: Calculate something complex
 *   return await complexCalculation(500000);
 * });
 *
 * pool.addTask(async () => {
 *   // Task 2: Process some data
 *   return await processData(largeDataset);
 * });
 *
 * // Wait for all tasks to complete
 * pool.allSettled(threads => {
 *   console.log(`All ${threads.length} tasks completed`);
 *   threads.forEach(thread => {
 *     console.log(`Thread result: ${thread.message}`);
 *   });
 * });
 *
 * // Or handle results as they complete
 * pool.then((data, thread) => {
 *   console.log(`Thread completed with result:`, data);
 * });
 * ```
 */
export declare class WebFunctionPool extends EventTarget {
    #private;
    /**
     * Creates a new WebFunctionPool.
     *
     * @param {Object} [options={}] - Pool configuration options
     * @param {number} [options.pingInterval] - Interval in ms between task scheduling attempts
     * @param {number} [options.poolSize] - Maximum number of concurrent threads (defaults to CPU core count)
     *
     * @example
     * ```ts
     * // Create a pool with custom settings
     * const pool = new WebFunctionPool({ poolSize: 2 });
     * pool.allSettled(() => {
     *   const completed = pool.status('completed', StatusType.RAW)
     *
     *   for (const thread of completed) {
     *   	console.log(thread.message, thread.status.SUCCESS ? 'Success' : 'Error', thread.meta)
     *   }
     *
     *   console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
     * })
     * ```
     */
    constructor(options?: WebFunctionPoolOptions);
    /**
     * Sets the interval in milliseconds between task scheduling attempts.
     *
     * @param {number} value - Ping interval in milliseconds (minimum: 1)
     */
    set pingInterval(value: number);
    /**
     * Sets the maximum number of threads that can run concurrently.
     *
     * @param {number} value - Pool size (minimum: 1)
     */
    set poolSize(value: number);
    /**
     * Gets the maximum number of threads that can run concurrently.
     *
     * @returns {number} Current maximum pool size
     */
    get poolSize(): number;
    /**
     * Gets status information about the thread pool.
     * See TaskPool.status() for detailed documentation on parameters and return types.
     *
     * @type {typeof TaskPool.prototype.status}
     */
    status: typeof TaskPool.prototype.status;
    /**
     * Checks if all threads in the pool have completed.
     *
     * @type {typeof TaskPool.prototype.isCompleted}
     * @returns {boolean} True if all tasks are completed
     */
    isCompleted: typeof TaskPool.prototype.isCompleted;
    /**
     * Checks if the pool has capacity for another active thread.
     *
     * @type {typeof TaskPool.prototype.hasAvailableSlot}
     * @returns {boolean} True if another thread can be started
     */
    hasAvailableThread: typeof TaskPool.prototype.hasAvailableSlot;
    /**
     * Adds a task (function) to the pool for execution.
     *
     * @param {Function} workerFn - Async function to execute
     * @param {any} [meta] - Optional metadata to associate with the thread
     * @returns {WebFunctionThread} The created thread instance
     *
     * @example
     * ```ts
     * // Add a task to fetch data
     * pool.addTask(async () => {
     *   const response = await fetch('https://api.example.com/data');
     *   return response.json();
     * }, { id: 'data-fetch-task' });
     * ```
     */
    addTask(workerFn: () => Promise<any>, meta?: any | undefined): WebFunctionThread;
    /**
     * Adds a callback for successful thread completions.
     * The callback will be called each time any thread completes successfully.
     *
     * @param {Function} onFulfilled - Callback for successful thread completion
     * @returns {this} This instance for chaining
     *
     * @example
     * ```ts
     * pool.then((data, thread) => {
     *   console.log(`Thread ${thread.meta.id} succeeded with:`, data);
     * });
     * ```
     */
    then(onFulfilled: (value: any, thread: WebFunctionThread) => void): this;
    /**
     * Adds a callback for thread errors.
     * The callback will be called each time any thread encounters an error.
     *
     * @param {Function} onRejected - Callback for thread errors
     * @returns {this} This instance for chaining
     *
     * @example
     * ```ts
     * pool.catch((error, type, thread) => {
     *   console.error(`Thread ${thread.meta.id} failed:`, error);
     *   console.error(`Error type: ${type}`);
     * });
     * ```
     */
    catch(onRejected: (error: any, type: 'error' | 'messageerror', thread: WebFunctionThread) => void): this;
    /**
     * Adds a callback for thread completions, regardless of success or failure.
     * The callback will be called each time any thread completes.
     *
     * @param {Function} onFinally - Callback for thread completion
     * @returns {this} This instance for chaining
     *
     * @example
     * ```ts
     * pool.finally((exitCode, thread) => {
     *   console.log(`Thread ${thread.meta.id} completed with exit code: ${exitCode}`);
     * });
     * ```
     */
    finally(onFinally: (exitCode: any, thread: WebFunctionThread) => void): this;
    /**
     * Registers a callback that will be invoked when all threads have completed,
     * regardless of success or failure.
     *
     * @param {Function} callback - Function called with array of all completed threads
     * @returns {this} This instance for chaining
     *
     * @example
     * ```ts
     * pool.allSettled(threads => {
     *   console.log(`All ${threads.length} tasks completed`);
     *
     *   // Count successful and failed threads
     *   const successful = threads.filter(t => t.status.SUCCESS).length;
     *   const failed = threads.filter(t => t.status.ERROR).length;
     *
     *   console.log(`${successful} succeeded, ${failed} failed`);
     * });
     * ```
     */
    allSettled(callback: (threads: WebFunctionThread[]) => void): this;
    /**
     * Registers a callback that will be invoked when either:
     * 1. All threads have completed successfully, or
     * 2. Any thread fails
     *
     * @param {Function} callback - Function called with array of threads or error
     * @returns {this} This instance for chaining
     *
     * @example
     * ```ts
     * pool.all(result => {
     *   if (result instanceof Error) {
     *     console.error('At least one task failed:', result);
     *   } else {
     *     console.log(`All ${result.length} tasks succeeded`);
     *     result.forEach(thread => {
     *       console.log(`Task result:`, thread.message);
     *     });
     *   }
     * });
     * ```
     */
    all(callback: (threads: WebFunctionThread[] | Error) => void): this;
    /**
     * Registers a callback that will be invoked when either:
     * 1. The first thread completes successfully, or
     * 2. All threads have failed
     *
     * @param {Function} callback - Function called with result or AggregateError
     * @returns {this} This instance for chaining
     *
     * @example
     * ```ts
     * pool.any((result, thread) => {
     *   if (result instanceof AggregateError) {
     *     console.error('All tasks failed:', result);
     *   } else {
     *     console.log(`Task succeeded with result:`, result);
     *     console.log(`Completed thread:`, thread);
     *   }
     * });
     * ```
     */
    any(callback: (data: any | AggregateError, thread: WebFunctionThread | undefined) => void): this;
    /**
     * Registers a callback that will be invoked when any thread completes or fails.
     * The callback receives the result or error from the first thread to settle.
     *
     * @param {Function} callback - Function called with result and thread
     * @returns {this} This instance for chaining
     *
     * @example
     * ```ts
     * pool.race((result, thread) => {
     *   console.log(`First thread to complete:`, thread);
     *   console.log(`Result:`, result);
     *
     *   // Check if it was successful
     *   if (thread.status.SUCCESS) {
     *     console.log('Thread succeeded');
     *   } else {
     *     console.log('Thread failed');
     *   }
     * });
     * ```
     */
    race(callback: (data: any, thread: WebFunctionThread) => void): this;
}
//# sourceMappingURL=function-pool.d.ts.map
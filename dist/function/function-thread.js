import { EventEmitter } from 'node:events';
import { ThreadStatus, Status } from '../thread-status.js';

/**
 * Manages a function-based thread in Node.js environments.
 *
 * FunctionThread wraps an asynchronous function with thread-like status
 * tracking and event capabilities, allowing it to be managed similar to
 * actual Node.js worker threads but without the overhead of creating
 * separate worker processes.
 *
 * @class
 * @extends {EventEmitter}
 *
 * @example
 * ```ts
 * // Create a thread to perform a calculation
 * const thread = new FunctionThread({
 *   workerFn: async () => {
 *     // This simulates some complex time consuming work
 *     await new Promise(resolve => setTimeout(resolve, 5000));
 *     return 42;
 *   },
 *   meta: { id: "calculation-1" }
 * });
 *
 * // Listen for events
 * thread.on('message', (data) => {
 *   console.log('Result:', data);
 * });
 *
 * // Start the thread
 * thread.start();
 *
 * // Or use Promise-like API
 * thread.then(result => {
 *   console.log('Got result:', result);
 * }).catch((error, type) => {
 *   console.error(`Error (${type}):`, error);
 * }).finally(() => {
 *   console.log('Thread completed');
 * });
 * ```
 */
class FunctionThread extends EventEmitter {
    #status = new ThreadStatus();
    #workerFn;
    /**
     * Optional metadata associated with this thread
     * @type {any|undefined}
     */
    meta;
    #message;
    #error;
    /**
     * Gets the current thread status.
     *
     * @type {ThreadStatus}
     */
    get status() {
        return this.#status;
    }
    /**
     * Gets the latest message received from the thread.
     *
     * @type {any}
     */
    get message() {
        return this.#message;
    }
    /**
     * Gets any error that occurred in the thread.
     *
     * @type {any}
     */
    get error() {
        return this.#error;
    }
    /**
     * Creates a new FunctionThread.
     *
     * @param {FunctionThreadOptions} options - Configuration options containing the worker
     *   function to execute and optional metadata
     */
    constructor({ workerFn, meta }) {
        super();
        this.#workerFn = workerFn;
        this.meta = meta;
        this.#setStatus(Status.READY, this.meta);
    }
    /**
     * Updates the thread status and emits a status event.
     *
     * @private
     * @param {number} newState - The new status to set
     * @param {...any} args - Additional arguments to include with the status event
     */
    #setStatus(newState, ...args) {
        const oldState = this.#status.value;
        this.#status.value = newState;
        this.emit('status', this.#status, newState, oldState, ...args);
    }
    /**
     * Starts execution of the thread function.
     *
     * Once started, the thread cannot be started again.
     * Events emitted during execution:
     * - 'init' - When the thread starts
     * - 'message' - When the thread completes successfully
     * - 'error' - When the thread throws an error directly
     * - 'messageerror' - When the thread's promise rejects
     * - 'exit' - When the thread completes (either success or error)
     * - 'status' - When the thread status changes
     *
     * @returns {boolean} True if the thread was started, false if it was already running
     *
     * @example
     * ```ts
     * const thread = new FunctionThread({
     *   workerFn: async () => {
     *     return await fetchData();
     *   }
     * });
     *
     * thread.on('message', (data) => {
     *   // Process the fetched data
     * });
     *
     * thread.start();
     * ```
     */
    start() {
        if (!this.status.READY) {
            return false;
        }
        this.#setStatus(Status.ACTIVE);
        this.emit('init', this);
        this.#workerFn()
            .then(message => {
            this.#message = message;
            this.#setStatus(Status.SUCCESS, message);
            this.emit('message', message);
        }, reason => {
            this.#error = reason;
            this.#setStatus(Status.ERROR, reason);
            this.emit('error', reason);
        })
            .catch(error => {
            this.#error = error;
            this.#setStatus(Status.ERROR, error);
            this.emit('messageerror', error);
        })
            .finally(() => {
            this.emit('exit', this.#status.SUCCESS ? 0 : 1);
        });
        return true;
    }
    /**
     * Adds a callback to handle successful completion of the thread.
     *
     * @param {Function} onFulfilled - Function called with the result when thread completes successfully
     * @returns {this} This instance for chaining
     *
     * @example
     * ```ts
     * const thread = new FunctionThread({
     *   workerFn: async () => {
     *     return 42;
     *   }
     * });
     *
     * thread.then(result => {
     *   console.log(`The answer is: ${result}`);
     * });
     *
     * thread.start();
     * ```
     */
    then(onFulfilled) {
        this.on('message', onFulfilled);
        return this;
    }
    /**
     * Adds a callback to handle errors from the thread.
     *
     * @param {Function} onRejected - Function called when the thread encounters an error
     * @returns {this} This instance for chaining
     *
     * @example
     * ```ts
     * const thread = new FunctionThread({
     *   workerFn: async () => {
     *     throw new Error("Something went wrong");
     *   }
     * });
     *
     * thread.catch((error, type) => {
     *   console.error(`Error type: ${type}`);
     *   console.error(error);
     * });
     *
     * thread.start();
     * ```
     */
    catch(onRejected) {
        this.on('error', (reason) => onRejected(reason, 'error'));
        this.on('messageerror', (error) => onRejected(error, 'messageerror'));
        return this;
    }
    /**
     * Adds a callback that will be called when the thread exits, regardless of success or failure.
     *
     * @param {Function} onFinally - Function called when the thread exits
     * @returns {this} This instance for chaining
     *
     * @example
     * ```ts
     * const thread = new FunctionThread({
     *   workerFn: async () => {
     *     // Some work
     *   }
     * });
     *
     * thread.finally(() => {
     *   console.log('Thread finished, clean up resources');
     * });
     *
     * thread.start();
     * ```
     */
    finally(onFinally) {
        this.on('exit', onFinally);
        return this;
    }
}

export { FunctionThread };

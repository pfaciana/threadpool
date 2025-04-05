import type { WorkerOptions } from 'node:worker_threads';
import Threads from 'node:worker_threads';
/**
 * Extended options for creating a Worker instance.
 *
 * @typedef {Object} ThreadWorkerOptions
 * @extends {WorkerOptions}
 * @property {string|URL} [file] - Path to the worker script file
 * @property {any} [meta] - Optional metadata to associate with the worker
 * @property {boolean} [exitFallback] - Whether to use message-based exit fallback for environments
 *   where 'exit' events aren't natively supported
 */
export type ThreadWorkerOptions = WorkerOptions & {
    file?: string | URL;
    meta?: any;
    exitFallback?: boolean;
};
/**
 * Function signature for event listeners.
 * @private
 * @callback EventListener
 * @param {...any} args - Event arguments
 * @returns {void}
 */
interface EventListener {
    (...args: any[]): void;
}
/**
 * Enhanced Worker implementation that extends Node.js worker_threads.Worker.
 *
 * This class adds:
 * - Environment variable sharing across different Node.js runtime environments
 * - Exit event fallback for environments where worker exit events aren't natively supported
 * - Better cross-runtime compatibility (Node.js, Deno, Bun)
 *
 * @class
 * @extends {Threads.Worker}
 *
 * @example
 * ```ts
 * // Create a worker with exit fallback for compatibility
 * const worker = new Worker('./worker-script.js', {
 *   exitFallback: true,
 *   workerData: { inputData: [1, 2, 3] }
 * });
 *
 * // Listen for messages
 * worker.on('message', (result) => {
 *   console.log('Worker result:', result);
 * });
 *
 * // Listen for exit (works consistently across environments)
 * worker.on('exit', (code) => {
 *   console.log(`Worker exited with code ${code}`);
 * });
 * ```
 */
export declare class Worker extends Threads.Worker {
    #private;
    /**
     * Creates a new Worker instance.
     *
     * @param {string|URL} filename - Path to the worker script file
     * @param {WorkerOptions} [options] - Worker options
     *
     * @example
     * ```ts
     * // With default options
     * const worker = new Worker('./worker.js');
     *
     * // With environment sharing and worker data
     * const worker = new Worker('./worker.js', {
     *   workerData: { config: { maxItems: 100 } },
     *   env: SHARE_ENV
     * });
     * ```
     */
    constructor(filename: string | URL, options?: WorkerOptions);
    /**
     * Internal event proxy for handling custom event behavior.
     *
     * @private
     * @param {string} method - Event registration method ('on', 'once', or 'off')
     * @param {string} event - Event name
     * @param {EventListener} listener - Event listener function
     * @returns {this} This instance for chaining
     */
    eventProxy(method: string, event: string, listener: EventListener): this;
    /**
     * Adds an event listener for the specified event.
     * The listener persists until removed.
     *
     * @param {string} event - Event name
     * @param {EventListener} listener - Event listener function
     * @returns {this} This instance for chaining
     */
    on(event: string, listener: EventListener): this;
    /**
     * Adds a one-time event listener for the specified event.
     * The listener is removed after being invoked once.
     *
     * @param {string} event - Event name
     * @param {EventListener} listener - Event listener function
     * @returns {this} This instance for chaining
     */
    once(event: string, listener: EventListener): this;
    /**
     * Removes an event listener for the specified event.
     *
     * @param {string} event - Event name
     * @param {EventListener} listener - Event listener function to remove
     * @returns {this} This instance for chaining
     */
    off(event: string, listener: EventListener): this;
}
export {};
//# sourceMappingURL=worker.d.ts.map
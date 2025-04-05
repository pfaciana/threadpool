import Threads, { SHARE_ENV } from 'node:worker_threads';
import { exitKey } from '../utils/exitEventSupported.js';

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
class Worker extends Threads.Worker {
    /**
     * Tracked exit event listeners when using fallback mode.
     * @private
     */
    #exitListeners = [];
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
    constructor(filename, options) {
        if (options) {
            if ('exitFallback' in options) {
                process.env.USE_EXIT_FALLBACK = options.exitFallback ? '1' : '0';
                delete options.exitFallback;
            }
            else {
                process.env.USE_EXIT_FALLBACK = '0';
            }
            if ('env' in options) {
                if (options.env === SHARE_ENV && (typeof Deno !== 'undefined' || typeof Bun !== 'undefined')) {
                    delete options.env;
                }
            }
            else {
                options.env = process.env;
            }
        }
        super(filename, options);
        if (process.env?.USE_EXIT_FALLBACK === '1') {
            super.on('message', (...args) => {
                if (args.length && args[0] === exitKey) {
                    super.terminate();
                    return;
                }
                if (this.#exitListeners.length) {
                    this.#exitListeners = this.#exitListeners.filter(item => {
                        item.listener(...args);
                        return item.method === 'on';
                    });
                }
            });
        }
    }
    /**
     * Internal event proxy for handling custom event behavior.
     *
     * @private
     * @param {string} method - Event registration method ('on', 'once', or 'off')
     * @param {string} event - Event name
     * @param {EventListener} listener - Event listener function
     * @returns {this} This instance for chaining
     */
    eventProxy(method, event, listener) {
        if (event === 'message' && process.env?.USE_EXIT_FALLBACK === '1') {
            if (['on', 'once'].includes(method)) {
                this.#exitListeners.push({ listener, method: method });
            }
            if (method === 'off') {
                this.#exitListeners = this.#exitListeners.filter(item => item.listener !== listener);
            }
        }
        else {
            super[method](event, listener);
        }
        return this;
    }
    /**
     * Adds an event listener for the specified event.
     * The listener persists until removed.
     *
     * @param {string} event - Event name
     * @param {EventListener} listener - Event listener function
     * @returns {this} This instance for chaining
     */
    on(event, listener) {
        return this.eventProxy('on', event, listener);
    }
    /**
     * Adds a one-time event listener for the specified event.
     * The listener is removed after being invoked once.
     *
     * @param {string} event - Event name
     * @param {EventListener} listener - Event listener function
     * @returns {this} This instance for chaining
     */
    once(event, listener) {
        return this.eventProxy('once', event, listener);
    }
    /**
     * Removes an event listener for the specified event.
     *
     * @param {string} event - Event name
     * @param {EventListener} listener - Event listener function to remove
     * @returns {this} This instance for chaining
     */
    off(event, listener) {
        return this.eventProxy('off', event, listener);
    }
}

export { Worker };

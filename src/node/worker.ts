import type { WorkerOptions } from 'node:worker_threads'
import Threads, { SHARE_ENV } from 'node:worker_threads'
import { exitKey } from './../utils/exitEventSupported.ts'

declare var Bun: any
declare var Deno: any

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
}

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
 * Method used to add event listeners.
 * @private
 * @typedef {('on'|'once')} AddListenerMethod
 */
type AddListenerMethod = 'on' | 'once';

/**
 * Entry for tracking exit event listeners.
 * @private
 * @typedef {Object} ExitListenerEntry
 * @property {EventListener} listener - The event listener function
 * @property {AddListenerMethod} method - Whether the listener was added via 'on' or 'once'
 */
interface ExitListenerEntry {
	listener: EventListener;
	method: AddListenerMethod;
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
export class Worker extends Threads.Worker {
	/**
	 * Tracked exit event listeners when using fallback mode.
	 * @private
	 */
	#exitListeners: ExitListenerEntry[] = []

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
	constructor(filename: string | URL, options?: WorkerOptions) {
		if (options) {
			if ('exitFallback' in options) {
				process.env.USE_EXIT_FALLBACK = options.exitFallback ? '1' : '0'
				delete options.exitFallback
			} else {
				process.env.USE_EXIT_FALLBACK = '0'
			}

			if ('env' in options) {
				if (options.env === SHARE_ENV && (typeof Deno !== 'undefined' || typeof Bun !== 'undefined')) {
					delete options.env
				}
			} else {
				options.env = process.env
			}
		}

		super(filename, options)

		if (process.env?.USE_EXIT_FALLBACK === '1') {
			super.on('message', (...args) => {
				if (args.length && args[0] === exitKey) {
					super.terminate()
					return
				}

				if (this.#exitListeners.length) {
					this.#exitListeners = this.#exitListeners.filter(item => {
						item.listener(...args)
						return item.method === 'on'
					})
				}
			})
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
	eventProxy(method: string, event: string, listener: EventListener): this {
		if (event === 'message' && process.env?.USE_EXIT_FALLBACK === '1') {
			if (['on', 'once'].includes(method)) {
				this.#exitListeners.push({ listener, method: method as AddListenerMethod })
			}
			if (method === 'off') {
				this.#exitListeners = this.#exitListeners.filter(item => item.listener !== listener)
			}
		} else {
			super[method](event, listener)
		}
		return this
	}

	/**
	 * Adds an event listener for the specified event.
	 * The listener persists until removed.
	 * 
	 * @param {string} event - Event name
	 * @param {EventListener} listener - Event listener function
	 * @returns {this} This instance for chaining
	 */
	override on(event: string, listener: EventListener): this {
		return this.eventProxy('on', event, listener)
	}

	/**
	 * Adds a one-time event listener for the specified event.
	 * The listener is removed after being invoked once.
	 * 
	 * @param {string} event - Event name
	 * @param {EventListener} listener - Event listener function
	 * @returns {this} This instance for chaining
	 */
	override once(event: string, listener: EventListener): this {
		return this.eventProxy('once', event, listener)
	}

	/**
	 * Removes an event listener for the specified event.
	 * 
	 * @param {string} event - Event name
	 * @param {EventListener} listener - Event listener function to remove
	 * @returns {this} This instance for chaining
	 */
	override off(event: string, listener: EventListener): this {
		return this.eventProxy('off', event, listener)
	}
}

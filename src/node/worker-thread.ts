import { EventEmitter } from 'node:events'
import { Worker, type ThreadWorkerOptions } from './worker.ts'
import { ThreadStatus, Status } from '../thread-status.ts'

/**
 * Supported constructor argument patterns for WorkerThread.
 *
 * Three different calling patterns are supported:
 * 1. `new WorkerThread(options)` - With file path in the options object
 * 2. `new WorkerThread(file, options)` - With separate file path and options
 * 3. `new WorkerThread(file, options, meta)` - With separate file, options and metadata
 *
 * @typedef {Array} WorkerThreadOptions
 */
export type WorkerThreadOptions =
	| [file: string | URL, options: ThreadWorkerOptions, meta: any] // 3 arguments
	| [file: string | URL, options: ThreadWorkerOptions] // 2 arguments
	| [options: ThreadWorkerOptions]; // 1 argument

/**
 * Manages a worker thread lifecycle with state tracking and event handling.
 *
 * WorkerThread provides a higher-level API on top of Node.js worker_threads,
 * handling thread lifecycle management, state tracking, and offering a Promise-like API
 * for working with worker results.
 *
 * @class
 * @extends {EventEmitter}
 *
 * @example
 * ```ts
 * // Create a worker thread
 * const thread = new WorkerThread('./my-worker.js', {
 *   workerData: { input: [1, 2, 3] }
 * });
 *
 * // Listen for messages from the worker
 * thread.on('message', (data) => {
 *   console.log('Worker sent:', data);
 * });
 *
 * // Start the worker
 * thread.start();
 *
 * // Or use Promise-like API
 * thread
 *   .then(result => console.log('Worker result:', result))
 *   .catch((error, type) => console.error(`Worker error (${type}):`, error))
 *   .finally(exitCode => console.log(`Worker exited with code ${exitCode}`));
 * ```
 */
export class WorkerThread extends EventEmitter {
	#filename: string | URL
	#options: ThreadWorkerOptions

	#worker: Worker | undefined
	#status: ThreadStatus = new ThreadStatus()
	#workerPromise: Promise<Worker> | undefined

	meta: any | undefined

	#message: any
	#error: any

	/**
	 * Gets the current thread status.
	 *
	 * @type {ThreadStatus}
	 */
	get status(): ThreadStatus {
		return this.#status
	}

	/**
	 * Gets the underlying Worker instance (if started).
	 *
	 * @type {Worker|undefined}
	 */
	get worker(): Worker | undefined {
		return this.#worker
	}

	/**
	 * Gets a promise that resolves to the Worker instance when it's initialized.
	 *
	 * @returns {Promise<Worker>} Promise that resolves to the Worker instance
	 *
	 * @example
	 * ```ts
	 * const thread = new WorkerThread('./worker.js');
	 * thread.start();
	 *
	 * // Get the worker instance when it's ready
	 * const worker = await thread.getWorker();
	 * // Now we can use the worker directly if needed
	 * ```
	 */
	async getWorker(): Promise<Worker> {
		if (this.#worker) {
			return this.#worker
		}
		if (!this.#workerPromise) {
			this.#workerPromise = new Promise<Worker>((resolve) => {
				this.once('init', () => resolve(this.#worker!))
			})
		}
		return this.#workerPromise!
	}

	/**
	 * Gets the latest message received from the worker.
	 *
	 * @type {any}
	 */
	get message(): any {
		return this.#message
	}

	/**
	 * Gets any error that occurred in the worker.
	 *
	 * @type {any}
	 */
	get error(): any {
		return this.#error
	}

	/**
	 * Creates a new WorkerThread instance.
	 *
	 * @param {...WorkerThreadOptions} workerArgs - Worker configuration arguments
	 *
	 * @example
	 * ```ts
	 * // Option 1: All options in a single object
	 * const thread1 = new WorkerThread({
	 *   file: './worker.js',
	 *   workerData: { input: [1, 2, 3] },
	 *   meta: { id: 'worker-1' }
	 * });
	 *
	 * // Option 2: Separate file and options
	 * const thread2 = new WorkerThread('./worker.js', {
	 *   workerData: { input: [4, 5, 6] }
	 * });
	 *
	 * // Option 3: Separate file, options, and metadata
	 * const thread3 = new WorkerThread('./worker.js',
	 *   { workerData: { input: [7, 8, 9] } },
	 *   { id: 'worker-3' }
	 * );
	 * ```
	 */
	constructor(...workerArgs: WorkerThreadOptions) {
		super()

		if (workerArgs.length == 1) {
			this.#filename = workerArgs[0].file as string | URL
			delete workerArgs[0].file
			this.#options = workerArgs[0]
			if (workerArgs[0].meta !== undefined) {
				this.meta = workerArgs[0].meta
				delete workerArgs[0].meta
			}
		} else {
			this.#filename = workerArgs[0]
			this.#options = workerArgs[1]
			if (workerArgs.length > 2) {
				this.meta = workerArgs[2]
			}
		}

		this.#setStatus(Status.READY, this.meta)
	}

	/**
	 * Updates the thread status and emits a status event.
	 *
	 * @private
	 * @param {number} newState - The new status to set
	 * @param {...any} args - Additional arguments to include with the status event
	 */
	#setStatus(newState: number, ...args) {
		const oldState = this.#status.value
		this.#status.value = newState
		this.emit('status', this.#status, newState, oldState, ...args)
	}

	/**
	 * Starts the worker thread.
	 *
	 * Once started, the worker thread cannot be started again.
	 * Events emitted during execution:
	 * - 'init' - When the thread is initialized
	 * - 'online' - When the worker thread comes online
	 * - 'message' - When a message is received from the worker
	 * - 'messageerror' - When there's an error deserializing a message
	 * - 'error' - When the worker thread throws an error
	 * - 'exit' - When the worker thread exits
	 * - 'status' - When the thread status changes
	 *
	 * @returns {void}
	 *
	 * @example
	 * ```ts
	 * const thread = new WorkerThread('./worker.js', {
	 *   workerData: { taskId: 123 }
	 * });
	 *
	 * thread.on('online', () => {
	 *   console.log('Worker is now executing');
	 * });
	 *
	 * thread.on('message', (result) => {
	 *   console.log('Worker sent result:', result);
	 * });
	 *
	 * thread.on('exit', (code) => {
	 *   console.log(`Worker exited with code ${code}`);
	 * });
	 *
	 * // Start the worker
	 * thread.start();
	 * ```
	 */
	start(): void {
		if (this.#worker) {
			return
		}

		this.#worker = new Worker(this.#filename, this.#options)

		this.#worker.on('online', () => {
			this.emit('online')
		})

		this.#worker.on('message', (message) => {
			this.#message = message
			this.emit('message', message)
		})

		this.#worker.on('messageerror', (error) => {
			this.#error = error
			if (this.listenerCount('messageerror')) {
				this.emit('messageerror', error)
			}
		})

		this.#worker.on('error', (error) => {
			this.#error = error
			this.#setStatus(Status.ERROR, error)
			if (this.listenerCount('error')) {
				this.emit('error', error)
			}
		})

		this.#worker.on('exit', (exitCode) => {
			if (!this.#status.ERROR) {
				this.#setStatus(Status.SUCCESS, exitCode)
			}
			this.emit('exit', exitCode)
		})

		this.#setStatus(Status.ACTIVE)
		this.emit('init', this)
	}

	/**
	 * Adds a callback to handle messages from the worker.
	 *
	 * @param {Function} onFulfilled - Function called with messages received from the worker
	 * @returns {this} This instance for chaining
	 *
	 * @example
	 * ```ts
	 * const thread = new WorkerThread('./worker.js');
	 *
	 * thread.then(result => {
	 *   console.log('Worker sent:', result);
	 * });
	 *
	 * thread.start();
	 * ```
	 */
	then(onFulfilled: (value: any) => any): this {
		this.on('message', onFulfilled)
		return this
	}

	/**
	 * Adds a callback to handle errors from the worker.
	 *
	 * @param {Function} onRejected - Function called when the worker encounters an error
	 * @returns {this} This instance for chaining
	 *
	 * @example
	 * ```ts
	 * const thread = new WorkerThread('./worker.js');
	 *
	 * thread.catch((error, type) => {
	 *   console.error(`Error type: ${type}`);
	 *   console.error(error);
	 * });
	 *
	 * thread.start();
	 * ```
	 */
	catch(onRejected: (error: any, type: 'error' | 'messageerror') => any): this {
		this.on('error', (reason) => onRejected(reason, 'error'))
		this.on('messageerror', (error) => onRejected(error, 'messageerror'))
		return this
	}

	/**
	 * Adds a callback that will be called when the worker exits.
	 *
	 * @param {Function} onFinally - Function called when the worker exits
	 * @returns {this} This instance for chaining
	 *
	 * @example
	 * ```ts
	 * const thread = new WorkerThread('./worker.js');
	 *
	 * thread.finally(exitCode => {
	 *   console.log(`Worker exited with code ${exitCode}`);
	 *   // Clean up resources, etc.
	 * });
	 *
	 * thread.start();
	 * ```
	 */
	finally(onFinally: (exitCode) => void): this {
		this.on('exit', onFinally)
		return this
	}
}

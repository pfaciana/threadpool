import { WebFunctionThread } from './function-thread.ts'
import { TaskPool, StatusType } from './../pool-status.ts'

/**
 * Options for configuring a WebFunctionPool instance.
 *
 * @property {number} [pingInterval] - Interval in ms between task scheduling attempts
 * @property {number} [poolSize] - Maximum number of concurrent threads (defaults to CPU core count)
 */
export type WebFunctionPoolOptions = {
	/*
	 * Interval in ms between task scheduling attempts
	 */
	pingInterval?: number;
	/*
	 * Maximum number of concurrent threads (defaults to CPU core count)
	 */
	poolSize?: number;
	[key: string]: any; // Allow for arbitrary additional options
}

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
export class WebFunctionPool extends EventTarget {
	#pool: TaskPool<WebFunctionThread> = new TaskPool({
		pingInterval: 100,
		poolSize: navigator.hardwareConcurrency,
		emitter: (event: string): void => {
			if (event === 'ping') {
				this.#runWorker()
			} else {
				this.dispatchEvent(new Event(event))
			}
		},
	})

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
	constructor(options: WebFunctionPoolOptions = {}) {
		super()

		for (const [key, value] of Object.entries(options)) {
			this[key] = value
		}
	}

	/**
	 * Sets the interval in milliseconds between task scheduling attempts.
	 *
	 * @param {number} value - Ping interval in milliseconds (minimum: 1)
	 */
	set pingInterval(value: number) {
		this.#pool.pingInterval = Math.max(value, 1)
	}

	/**
	 * Sets the maximum number of threads that can run concurrently.
	 *
	 * @param {number} value - Pool size (minimum: 1)
	 */
	set poolSize(value: number) {
		this.#pool.poolSize = Math.max(value, 1)
	}

	/**
	 * Gets the maximum number of threads that can run concurrently.
	 *
	 * @returns {number} Current maximum pool size
	 */
	get poolSize(): number {
		return this.#pool.poolSize
	}

	/**
	 * Gets status information about the thread pool.
	 * See TaskPool.status() for detailed documentation on parameters and return types.
	 *
	 * @type {typeof TaskPool.prototype.status}
	 */
	status: typeof TaskPool.prototype.status = this.#pool.status.bind(this.#pool)

	/**
	 * Checks if all threads in the pool have completed.
	 *
	 * @type {typeof TaskPool.prototype.isCompleted}
	 * @returns {boolean} True if all tasks are completed
	 */
	isCompleted: typeof TaskPool.prototype.isCompleted = this.#pool.isCompleted.bind(this.#pool)

	/**
	 * Checks if the pool has capacity for another active thread.
	 *
	 * @type {typeof TaskPool.prototype.hasAvailableSlot}
	 * @returns {boolean} True if another thread can be started
	 */
	hasAvailableThread: typeof TaskPool.prototype.hasAvailableSlot = this.#pool.hasAvailableSlot.bind(this.#pool)

	/**
	 * Attempts to start the next thread from the queue if the pool is ready.
	 *
	 * @private
	 */
	#runWorker(): void {
		const thread = this.#pool.next()

		if (!thread) {
			return
		}

		if (!thread.status.READY) {
			this.#pool.enqueue(thread, true)
		} else {
			thread.addEventListener('init', (_event: Event) => {
				this.dispatchEvent(new CustomEvent('worker.init', { detail: [thread] }))
			})

			thread.start()

			thread.addEventListener('status', (event: Event) => {
				const [status, newState, oldState, ...args] = (event as CustomEvent).detail
				this.dispatchEvent(new CustomEvent('worker.status', { detail: [status, newState, oldState, thread, ...args] }))
			})

			thread.addEventListener('message', (event: Event) => {
				const data = (event as CustomEvent).detail
				this.dispatchEvent(new CustomEvent('worker.message', { detail: [data, thread] }))
			})

			thread.addEventListener('messageerror', (event: Event) => {
				const error = (event as CustomEvent).detail
				this.dispatchEvent(new CustomEvent('worker.messageerror', { detail: [error, thread] }))
			})

			thread.addEventListener('error', (event: Event) => {
				const error = (event as CustomEvent).detail
				this.dispatchEvent(new CustomEvent('worker.error', { detail: [error, thread] }))
			})

			thread.addEventListener('exit', (event: Event) => {
				const exitCode = (event as CustomEvent).detail
				this.#pool.complete(thread)
				this.dispatchEvent(new CustomEvent('worker.exit', { detail: [exitCode, thread] }))
				this.#runWorker()
			})
		}

		this.#runWorker()
	}

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
	addTask(workerFn: () => Promise<any>, meta: any | undefined = undefined): WebFunctionThread {
		const thread = new WebFunctionThread({ workerFn, meta })
		this.#pool.enqueue(thread)
		this.#runWorker()
		return thread
	}

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
	then(onFulfilled: (value: any, thread: WebFunctionThread) => void): this {
		this.addEventListener('worker.message', (event: Event) => {
			const [data, thread] = (event as CustomEvent).detail
			onFulfilled(data, thread)
		})
		return this
	}

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
	catch(onRejected: (error: any, type: 'error' | 'messageerror', thread: WebFunctionThread) => void): this {
		this.addEventListener('worker.error', (event: Event) => {
			const [error, thread] = (event as CustomEvent).detail
			onRejected(error, 'error', thread)
		})
		this.addEventListener('worker.messageerror', (event: Event) => {
			const [error, thread] = (event as CustomEvent).detail
			onRejected(error, 'messageerror', thread)
		})
		return this
	}

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
	finally(onFinally: (exitCode: any, thread: WebFunctionThread) => void): this {
		this.addEventListener('worker.exit', (event: Event) => {
			const [exitCode, thread] = (event as CustomEvent).detail
			onFinally(exitCode, thread)
		})
		return this
	}

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
	allSettled(callback: (threads: WebFunctionThread[]) => void): this {
		this.addEventListener('complete', () => callback(this.#pool.status('completed', StatusType.RAW)))
		return this
	}

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
	all(callback: (threads: WebFunctionThread[] | Error) => void): this {
		const wrappedCallback = (event: Event): void => {
			this.removeEventListener('worker.messageerror', wrappedCallback)
			this.removeEventListener('worker.error', wrappedCallback)
			this.removeEventListener('complete', wrappedCallback)
			let threads
			if (event.type === 'complete') {
				threads = this.#pool.status('completed', StatusType.RAW)
			} else {
				threads = (event as CustomEvent).detail[0] // error is now the first item in detail array
			}
			callback(threads)
		}
		this.addEventListener('worker.messageerror', wrappedCallback, { once: true })
		this.addEventListener('worker.error', wrappedCallback, { once: true })
		this.addEventListener('complete', wrappedCallback, { once: true })
		return this
	}

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
	any(callback: (data: any | AggregateError, thread: WebFunctionThread | undefined) => void): this {
		const wrappedCallback = (event: Event): void => {
			this.removeEventListener('worker.message', wrappedCallback)
			this.removeEventListener('complete', wrappedCallback)
			let thread, data
			if (event.type === 'complete') {
				data = new AggregateError(this.#pool.status('completed', StatusType.RAW), 'No threads completed successfully')
				thread = undefined
			} else {
				[data, thread] = (event as CustomEvent).detail
			}
			callback(data, thread)
		}
		this.addEventListener('worker.message', wrappedCallback, { once: true })
		this.addEventListener('complete', wrappedCallback, { once: true })
		return this
	}

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
	race(callback: (data: any, thread: WebFunctionThread) => void): this {
		const wrappedCallback = (event: Event): void => {
			this.removeEventListener('worker.message', wrappedCallback)
			this.removeEventListener('worker.messageerror', wrappedCallback)
			this.removeEventListener('worker.error', wrappedCallback)
			const [data, thread] = (event as CustomEvent).detail
			callback(data, thread)
		}
		this.addEventListener('worker.message', wrappedCallback, { once: true })
		this.addEventListener('worker.messageerror', wrappedCallback, { once: true })
		this.addEventListener('worker.error', wrappedCallback, { once: true })
		return this
	}
}

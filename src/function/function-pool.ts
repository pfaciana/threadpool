import { EventEmitter } from 'node:events'
import { getLogicalCoreCount, getPhysicalCoreCount, getTotalMemory, startProfilingCpu, isAnyThreadBelow } from 'system-resource-monitor'
import { FunctionThread } from './function-thread.ts'
import { StatusType, TaskPool } from './../pool-status.ts'

await startProfilingCpu()

/**
 * Information about the system's hardware resources.
 *
 * @typedef {Object} SystemInfo
 * @property {number} cores - Number of physical CPU cores
 * @property {number} threads - Number of logical CPU threads
 * @property {number} memory - Total system memory in bytes
 */
type SystemInfo = {
	cores: number;
	threads: number;
	memory: number;
}

/**
 * Options for configuring a FunctionPool instance.
 *
 * @property {number} [pingInterval] - Interval in ms between task scheduling attempts
 * @property {number} [poolSize] - Maximum number of concurrent threads
 * @property {number} [maxThreadThreshold] - Maximum CPU usage threshold for scheduling threads
 */
export type FunctionPoolOptions = {
	/*
	 * Interval in ms between task scheduling attempts.
	 */
	pingInterval?: number;
	/*
	 * Maximum number of concurrent threads.
	 */
	poolSize?: number;
	/*
	 * Maximum CPU usage threshold for scheduling threads.
	 */
	maxThreadThreshold?: number;
	[key: string]: any; // Allow for arbitrary additional options
}

/**
 * Manages a pool of FunctionThread instances for parallel execution.
 *
 * FunctionPool provides a high-level API for managing multiple function-based
 * threads in Node.js, automatically handling queuing, execution, and resource monitoring.
 * It offers Promise-like APIs and combinators (then, catch, all, race, etc.)
 * for working with multiple concurrent tasks.
 *
 * @class
 * @extends {EventEmitter}
 *
 * @example
 * ```ts
 * // Create a pool with default settings
 * const pool = new FunctionPool();
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
export class FunctionPool extends EventEmitter {
	/**
	 * Information about the system's hardware resources.
	 * @private
	 */
	#system: SystemInfo = {
		cores: getPhysicalCoreCount(),
		threads: getLogicalCoreCount(),
		memory: getTotalMemory(),
	}

	/**
	 * Maximum CPU usage threshold (percentage) for scheduling threads.
	 * When CPU usage is above this threshold, no new threads will be scheduled.
	 *
	 * @type {number}
	 */
	maxThreadThreshold: number = 98

	/**
	 * Internal task pool managing the function threads.
	 * @private
	 */
	#pool: TaskPool<FunctionThread> = new TaskPool({
		pingInterval: 100,
		poolSize: Math.max(this.#system.cores - 1, 1),
		emitter: (event: string): void => {
			if (event === 'ping') {
				this.#runWorker()
			} else {
				this.emit(event)
			}
		},
	})

	/**
	 * Creates a new FunctionPool.
	 *
	 * @param {Object} [options={}] - Pool configuration options
	 * @param {number} [options.pingInterval] - Interval in ms between task scheduling attempts
	 * @param {number} [options.poolSize] - Maximum number of concurrent threads
	 * @param {number} [options.maxThreadThreshold] - Maximum CPU usage threshold for scheduling threads
	 *
	 * @example
	 * ```ts
	 * // Create a pool with custom settings
	 * const pool = new FunctionPool({
	 *   poolSize: 4,              // Run at most 4 tasks concurrently
	 *   pingInterval: 200,        // Check for available tasks every 200ms
	 *   maxThreadThreshold: 85    // Don't start new tasks if CPU usage is above 85%
	 * });
	 * ```
	 */
	constructor(options: FunctionPoolOptions = {}) {
		super()

		for (const [key, value] of Object.entries(options)) {
			this[key] = value
		}
	}

	/**
	 * Gets information about the system's hardware resources.
	 *
	 * @type {SystemInfo}
	 *
	 * @example
	 * ```ts
	 * const pool = new FunctionPool();
	 * console.log(`Running on a system with ${pool.system.cores} physical cores`);
	 * console.log(`${pool.system.threads} logical threads available`);
	 * console.log(`${Math.round(pool.system.memory / 1024 / 1024)} MB RAM`);
	 * ```
	 */
	get system(): SystemInfo {
		return this.#system
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
	 * Checks if the pool has capacity for another active thread,
	 * taking into account both pool size and system CPU usage.
	 *
	 * @returns {boolean} True if another thread can be started
	 */
	hasAvailableThread(): boolean {
		return this.#pool.hasAvailableSlot() && isAnyThreadBelow(this.maxThreadThreshold)
	}

	/**
	 * Attempts to start the next thread from the queue if the pool is ready
	 * and system resources are available.
	 *
	 * @private
	 */
	#runWorker(): void {
		if (!isAnyThreadBelow(this.maxThreadThreshold)) {
			return
		}

		const thread = this.#pool.next()

		if (!thread) {
			return
		}

		if (!thread.status.READY) {
			this.#pool.enqueue(thread, true)
		} else {
			// This needs to be before the thread.start() call because that's where the worker.init event is emitted
			thread.on('init', () => {
				this.emit('worker.init', thread)
			})

			thread.start()

			thread.on('status', (status, newState, oldState) => {
				this.emit('worker.status', status, newState, oldState, thread)
			})

			thread.on('message', (data) => {
				this.emit('worker.message', data, thread)
			})

			thread.on('messageerror', (error) => {
				this.emit('worker.messageerror', error, thread)
			})

			thread.on('error', (error) => {
				this.emit('worker.error', error, thread)
			})

			thread.on('exit', (exitCode) => {
				this.#pool.complete(thread)
				this.emit('worker.exit', exitCode, thread)
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
	 * @returns {FunctionThread} The created thread instance
	 *
	 * @example
	 * ```ts
	 * // Add a task to process data
	 * const thread = pool.addTask(async () => {
	 *   const data = await readFile('large-data.json');
	 *   return processData(JSON.parse(data));
	 * }, { id: 'data-processing-task' });
	 *
	 * // You can also work with the thread directly
	 * thread.on('message', result => {
	 *   console.log('Task completed with result:', result);
	 * });
	 * ```
	 */
	addTask(workerFn: () => Promise<any>, meta: any | undefined = undefined): FunctionThread {
		const thread = new FunctionThread({ workerFn, meta })
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
	then(onFulfilled: (value: any, thread: FunctionThread) => void): this {
		this.on('worker.message', onFulfilled)
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
	catch(onRejected: (error: any, type: 'error' | 'messageerror', thread: FunctionThread) => void): this {
		this.on('worker.error', (reason, thread) => onRejected(reason, 'error', thread))
		this.on('worker.messageerror', (error, thread) => onRejected(error, 'messageerror', thread))
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
	finally(onFinally: (exitCode: any, thread: FunctionThread) => void): this {
		this.on('worker.exit', onFinally)
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
	allSettled(callback: (threads: FunctionThread[]) => void): this {
		this.on('complete', () => callback(this.#pool.status('completed', StatusType.RAW)))
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
	all(callback: (threads: FunctionThread[] | Error) => void): this {
		const wrappedCallback = (error: Error | undefined, thread: FunctionThread | undefined): void => {
			this.off('worker.messageerror', wrappedCallback)
			this.off('worker.error', wrappedCallback)
			this.off('complete', wrappedCallback)
			let threads
			if (thread === undefined) { // All threads completed successfully
				threads = this.#pool.status('completed', StatusType.RAW)
			} else {
				threads = error
			}
			callback(threads)
		}
		this.once('worker.messageerror', wrappedCallback)
		this.once('worker.error', wrappedCallback)
		this.once('complete', wrappedCallback)
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
	any(callback: (data: any | AggregateError, thread: FunctionThread | undefined) => void): this {
		const wrappedCallback = (data: any | undefined, thread: FunctionThread | undefined): void => {
			this.off('worker.message', wrappedCallback)
			this.off('complete', wrappedCallback)
			if (thread === undefined) { // No threads completed successfully
				data = new AggregateError(this.#pool.status('completed', StatusType.RAW), 'No threads completed successfully')
			}
			callback(data, thread)
		}
		this.once('worker.message', wrappedCallback)
		this.once('complete', wrappedCallback)
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
	race(callback: (data: any, thread: FunctionThread) => void): this {
		const wrappedCallback = (data: any, thread: FunctionThread): void => {
			this.off('worker.message', wrappedCallback)
			this.off('worker.messageerror', wrappedCallback)
			this.off('worker.error', wrappedCallback)
			callback(data, thread)
		}
		this.once('worker.message', wrappedCallback)
		this.once('worker.messageerror', wrappedCallback)
		this.once('worker.error', wrappedCallback)
		return this
	}
}

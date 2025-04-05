import { EventEmitter } from 'node:events'
import { getLogicalCoreCount, getPhysicalCoreCount, getTotalMemory, startProfilingCpu, isAnyThreadBelow } from 'system-resource-monitor'
import { type ThreadWorkerOptions } from './worker.ts'
import { WorkerThread, type WorkerThreadOptions } from './worker-thread.ts'
import { TaskPool, StatusType } from './../pool-status.ts'
import { exitEventSupported } from './../utils/exitEventSupported.ts'

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
 * Supported constructor argument patterns for WorkerPool.
 *
 * Four different calling patterns are supported:
 * 1. `new WorkerPool()` - Empty pool with no defaults
 * 2. `new WorkerPool(fileOrOptions)` - With file path or options object
 * 3. `new WorkerPool(file, options)` - With separate file path and options
 * 4. `new WorkerPool(file, options, customOptions)` - With file, worker options, and pool options
 *
 * @typedef {Array} WorkerPoolOptions
 * @private
 */
type WorkerPoolOptions =
	| [file: string | URL, options: ThreadWorkerOptions, customOptions: Record<any, any>] // 3 arguments
	| [file: string | URL, options: ThreadWorkerOptions] // 2 arguments
	| [fileOrOptions: string | URL | ThreadWorkerOptions] // 1 argument
	| []; // 0 arguments

/**
 * Manages a pool of worker threads for parallel execution.
 *
 * WorkerPool provides a high-level API for managing multiple worker threads in Node.js,
 * automatically handling queuing, execution, and resource monitoring.
 * It offers Promise-like APIs and combinators (then, catch, all, race, etc.)
 * for working with multiple concurrent worker tasks.
 *
 * @class
 * @extends {EventEmitter}
 *
 * @example
 * ```ts
 * // Create a pool with default settings
 * const pool = new WorkerPool('./worker.js', {
 *   workerData: { taskId: 0, data: [1, 2, 3] }
 * });
 *
 * // Add several workers with different task data
 * pool.addTask({ taskId: 1, data: [4, 5, 6] });
 * pool.addTask({ taskId: 2, data: [7, 8, 9] });
 * pool.addTask({ taskId: 3, data: [10, 11, 12] });
 *
 * // Wait for all workers to complete
 * pool.allSettled(threads => {
 *   console.log(`All ${threads.length} workers completed`);
 *   threads.forEach(thread => {
 *     console.log(`Worker result: ${thread.message}`);
 *   });
 * });
 * ```
 */
export class WorkerPool extends EventEmitter {
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
	 * Maximum CPU usage threshold (percentage) for scheduling worker threads.
	 * When CPU usage is above this threshold, no new workers will be scheduled.
	 *
	 * @type {number}
	 */
	maxThreadThreshold: number = 98

	/**
	 * Internal task pool managing the worker threads.
	 * @private
	 */
	#pool: TaskPool<WorkerThread> = new TaskPool({
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
	 * Default options to apply to all workers created by this pool.
	 * @private
	 */
	#workerDefaultOptions: ThreadWorkerOptions = {}

	/**
	 * Creates a new WorkerPool.
	 *
	 * @param {...WorkerPoolOptions} options - Worker pool configuration
	 *
	 * @example
	 * ```ts
	 * // Empty pool (each worker must specify file path)
	 * const pool1 = new WorkerPool();
	 *
	 * // Pool with default file path
	 * const pool2 = new WorkerPool('./worker.js');
	 *
	 * // Pool with default file path and worker options
	 * const pool3 = new WorkerPool('./worker.js', {
	 *   workerData: { sharedConfig: 'value' }
	 * });
	 *
	 * // Pool with default file, worker options, and pool settings
	 * const pool4 = new WorkerPool('./worker.js',
	 *   { workerData: { sharedConfig: 'value' } },
	 *   {
	 *     poolSize: 4,
	 *     pingInterval: 200,
	 *     maxThreadThreshold: 85
	 *   }
	 * );
	 * ```
	 */
	constructor(...options: WorkerPoolOptions) {
		super()

		this.#workerDefaultOptions = this.#parseWorkerArgs(...options)

		if (options.length > 2) {
			for (const [key, value] of Object.entries(options[2] as Record<any, any>)) {
				this[key] = value
			}
		}
	}

	/**
	 * Gets information about the system's hardware resources.
	 *
	 * @type {SystemInfo}
	 *
	 * @example
	 * ```ts
	 * const pool = new WorkerPool('./worker.js');
	 * console.log(`Running on a system with ${pool.system.cores} physical cores`);
	 * console.log(`${pool.system.threads} logical threads available`);
	 * console.log(`${Math.round(pool.system.memory / 1024 / 1024)} MB RAM`);
	 * ```
	 */
	get system(): SystemInfo {
		return this.#system
	}

	/**
	 * Sets the interval in milliseconds between worker scheduling attempts.
	 *
	 * @param {number} value - Ping interval in milliseconds (minimum: 1)
	 */
	set pingInterval(value: number) {
		this.#pool.pingInterval = Math.max(value, 1)
	}

	/**
	 * Sets the maximum number of worker threads that can run concurrently.
	 *
	 * @param {number} value - Pool size (minimum: 1)
	 */
	set poolSize(value: number) {
		this.#pool.poolSize = Math.max(value, 1)
	}

	/**
	 * Gets the maximum number of worker threads that can run concurrently.
	 *
	 * @returns {number} Current maximum pool size
	 */
	get poolSize(): number {
		return this.#pool.poolSize
	}

	/**
	 * Gets status information about the worker pool.
	 * See TaskPool.status() for detailed documentation on parameters and return types.
	 *
	 * @type {typeof TaskPool.prototype.status}
	 */
	status: typeof TaskPool.prototype.status = this.#pool.status.bind(this.#pool)

	/**
	 * Checks if all worker threads in the pool have completed.
	 *
	 * @type {typeof TaskPool.prototype.isCompleted}
	 * @returns {boolean} True if all worker threads are completed
	 */
	isCompleted: typeof TaskPool.prototype.isCompleted = this.#pool.isCompleted.bind(this.#pool)

	/**
	 * Checks if the pool has capacity for another active worker thread,
	 * taking into account both pool size and system CPU usage.
	 *
	 * @returns {boolean} True if another worker thread can be started
	 */
	hasAvailableThread(): boolean {
		return this.#pool.hasAvailableSlot() && isAnyThreadBelow(this.maxThreadThreshold)
	}

	/**
	 * Parses constructor arguments into a consistent options object.
	 *
	 * @private
	 * @param {...any} threadArgs - Worker thread arguments
	 * @returns {ThreadWorkerOptions} Worker options object
	 */
	#parseWorkerArgs(...threadArgs): ThreadWorkerOptions {
		if (!threadArgs.length) {
			return {}
		}
		if (threadArgs.length > 1) {
			return { ...threadArgs[1], file: threadArgs[0] }
		}
		return (typeof threadArgs[0] === 'string' || threadArgs[0] instanceof URL) ? { file: threadArgs[0] } : threadArgs[0]
	}

	/**
	 * Enables or disables the worker exit event fallback mechanism.
	 *
	 * Some environments like Bun or Deno might not fully support worker 'exit' events.
	 * This method enables a fallback that uses message passing for exit events.
	 * When called without arguments, it automatically detects if the fallback is needed.
	 *
	 * @param {boolean} [force] - Force enable/disable fallback, or auto-detect if undefined
	 * @returns {Promise<void>}
	 *
	 * @example
	 * ```ts
	 * const pool = new WorkerPool('./worker.js');
	 *
	 * // Auto-detect if exit event fallback is needed
	 * await pool.enableExitEventFallback();
	 *
	 * // Or force enable it
	 * await pool.enableExitEventFallback(true);
	 * ```
	 */
	async enableExitEventFallback(force: boolean | undefined = undefined): Promise<void> {
		if (typeof force === 'undefined') {
			this.#workerDefaultOptions.exitFallback = !await exitEventSupported()
		} else {
			this.#workerDefaultOptions.exitFallback = force
		}
	}

	/**
	 * Attempts to start the next worker thread from the queue if the pool is ready
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
			thread.on('init', () => {
				this.emit('worker.init', thread)
			})

			thread.start()

			thread.on('status', (status, newState, oldState) => {
				this.emit('worker.status', status, newState, oldState, thread)
			})

			thread.on('online', () => {
				this.emit('worker.online', thread)
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
	 * Creates a new worker thread and adds it to the pool queue.
	 *
	 * @private
	 * @param {...WorkerThreadOptions} threadArgs - Worker configuration arguments
	 * @returns {WorkerThread} The created worker thread instance
	 */
	#queuedWorker(...threadArgs: WorkerThreadOptions): WorkerThread {
		const thread = new WorkerThread(...threadArgs)
		this.#pool.enqueue(thread)
		this.#runWorker()
		return thread
	}

	/**
	 * Adds a worker to the pool with specified options.
	 *
	 * Worker options are merged with the default options for the pool.
	 *
	 * @param {...WorkerThreadOptions} threadArgs - Worker configuration arguments
	 * @returns {WorkerThread} The created worker thread instance
	 *
	 * @example
	 * ```ts
	 * const pool = new WorkerPool('./default-worker.js');
	 *
	 * // Use default worker script with custom worker data
	 * const worker1 = pool.addWorker({ workerData: { taskId: 1 } });
	 *
	 * // Use a different worker script
	 * const worker2 = pool.addWorker('./special-worker.js', {
	 *   workerData: { taskId: 2 }
	 * });
	 *
	 * // Add worker with metadata
	 * const worker3 = pool.addWorker('./worker.js',
	 *   { workerData: { taskId: 3 } },
	 *   { id: 'critical-task' }
	 * );
	 * ```
	 */
	addWorker(...threadArgs: WorkerThreadOptions): WorkerThread {
		return this.#queuedWorker({ ...this.#workerDefaultOptions, ...this.#parseWorkerArgs(...threadArgs) })
	}

	/**
	 * Adds a worker to the pool using the default worker script with specified data.
	 *
	 * This is a simplified interface for adding workers when you only need to vary the worker data.
	 *
	 * @param {any} [workerData] - Data to pass to the worker thread
	 * @param {any} [meta] - Optional metadata to associate with the worker
	 * @returns {WorkerThread} The created worker thread instance
	 *
	 * @example
	 * ```ts
	 * const pool = new WorkerPool('./worker.js');
	 *
	 * // Add workers with different task data
	 * const worker1 = pool.addTask({ taskId: 1, data: [1, 2, 3] });
	 * const worker2 = pool.addTask({ taskId: 2, data: [4, 5, 6] });
	 *
	 * // Add worker with data and metadata
	 * const worker3 = pool.addTask(
	 *   { taskId: 3, data: [7, 8, 9] },
	 *   { priority: 'high', retryCount: 3 }
	 * );
	 * ```
	 */
	addTask(workerData: any = undefined, meta: any | undefined = undefined): WorkerThread {
		return this.addWorker({ workerData, meta })
	}

	/**
	 * Adds a callback for successful worker completions.
	 * The callback will be called each time any worker completes successfully.
	 *
	 * @param {Function} onFulfilled - Callback for successful worker completion
	 * @returns {this} This instance for chaining
	 *
	 * @example
	 * ```ts
	 * pool.then((data, thread) => {
	 *   console.log(`Worker ${thread.meta?.id} succeeded with:`, data);
	 * });
	 * ```
	 */
	then(onFulfilled: (value: any, thread: WorkerThread) => void): this {
		this.on('worker.message', onFulfilled)
		return this
	}

	/**
	 * Adds a callback for worker errors.
	 * The callback will be called each time any worker encounters an error.
	 *
	 * @param {Function} onRejected - Callback for worker errors
	 * @returns {this} This instance for chaining
	 *
	 * @example
	 * ```ts
	 * pool.catch((error, type, thread) => {
	 *   console.error(`Worker ${thread.meta?.id} failed:`, error);
	 *   console.error(`Error type: ${type}`);
	 * });
	 * ```
	 */
	catch(onRejected: (error: any, type: 'error' | 'messageerror', thread: WorkerThread) => void): this {
		this.on('worker.error', (reason, thread) => onRejected(reason, 'error', thread))
		this.on('worker.messageerror', (error, thread) => onRejected(error, 'messageerror', thread))
		return this
	}

	/**
	 * Adds a callback for worker completions, regardless of success or failure.
	 * The callback will be called each time any worker completes.
	 *
	 * @param {Function} onFinally - Callback for worker completion
	 * @returns {this} This instance for chaining
	 *
	 * @example
	 * ```ts
	 * pool.finally((exitCode, thread) => {
	 *   console.log(`Worker ${thread.meta?.id} completed with exit code: ${exitCode}`);
	 * });
	 * ```
	 */
	finally(onFinally: (exitCode: any, thread: WorkerThread) => void): this {
		this.on('worker.exit', onFinally)
		return this
	}

	/**
	 * Registers a callback that will be invoked when all workers have completed,
	 * regardless of success or failure.
	 *
	 * @param {Function} callback - Function called with array of all completed worker threads
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
	allSettled(callback: (threads: WorkerThread[]) => void): this {
		this.on('complete', () => callback(this.#pool.status('completed', StatusType.RAW)))
		return this
	}

	/**
	 * Registers a callback that will be invoked when either:
	 * 1. All workers have completed successfully, or
	 * 2. Any worker fails
	 *
	 * @param {Function} callback - Function called with array of workers or error
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
	all(callback: (threads: WorkerThread[] | Error) => void): this {
		const wrappedCallback = (error: Error | undefined, thread: WorkerThread | undefined): void => {
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
	 * 1. The first worker completes successfully, or
	 * 2. All workers have failed
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
	any(callback: (data: any | AggregateError, thread: WorkerThread | undefined) => void): this {
		const wrappedCallback = (data: any | undefined, thread: WorkerThread | undefined): void => {
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
	 * Registers a callback that will be invoked when any worker completes or fails.
	 * The callback receives the result or error from the first worker to settle.
	 *
	 * @param {Function} callback - Function called with result and worker
	 * @returns {this} This instance for chaining
	 *
	 * @example
	 * ```ts
	 * pool.race((result, thread) => {
	 *   console.log(`First worker to complete:`, thread);
	 *   console.log(`Result:`, result);
	 *
	 *   // Check if it was successful
	 *   if (thread.status.SUCCESS) {
	 *     console.log('Worker succeeded');
	 *   } else {
	 *     console.log('Worker failed');
	 *   }
	 * });
	 * ```
	 */
	race(callback: (data: any, thread: WorkerThread) => void): this {
		const wrappedCallback = (data: any, thread: WorkerThread): void => {
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

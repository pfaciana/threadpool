/**
 * Rounds a number to the specified precision.
 *
 * @param {number} num - The number to round
 * @param {number} [precision=0] - Number of decimal places
 * @returns {number} The rounded number
 *
 * @example
 * ```ts
 * round(1.234, 2) // 1.23
 * round(1.235, 2) // 1.24
 * ```
 */
export const round = (num: number, precision: number = 0): number => {
	const factor = Math.pow(10, precision)
	return Math.round(num * factor) / factor
}

/**
 * Special value used to request all status fields.
 * @type {string}
 */
export const StatusAllField = '*' as const

/**
 * Type defining valid status field names that can be queried.
 * @typedef {('queued'|'active'|'completed'|'remaining'|'started'|'total'|typeof StatusAllField)} StatusField
 */
export type StatusField = 'queued' | 'active' | 'completed' | 'remaining' | 'started' | 'total' | typeof StatusAllField;

/**
 * Constants defining the format of status response data.
 *
 * @type {Object}
 * @property {string} RAW - Returns raw arrays of task items
 * @property {string} COUNT - Returns count of task items
 * @property {number} PERCENT - Returns percentages with specified precision (default: 3 decimal places)
 *
 * @example
 * ```ts
 * // Get raw task objects
 * const tasks = pool.status('active', StatusType.RAW);
 *
 * // Get count of tasks
 * const count = pool.status('queued', StatusType.COUNT);
 *
 * // Get percentage with 2 decimal places
 * const percentComplete = pool.status('completed', 2);
 * ```
 */
export const StatusType = Object.freeze({
	RAW: 'raw',
	COUNT: 'count',
	PERCENT: 3,
} as const) as {
	readonly RAW: 'raw';
	readonly COUNT: 'count';
	readonly PERCENT: number;
}

/**
 * Type alias for the raw status type constant.
 * @typedef {typeof StatusType.RAW} StatusRawType
 */
export type StatusRawType = typeof StatusType.RAW;

/**
 * Type alias for the count status type constant.
 * @typedef {typeof StatusType.COUNT} StatusCountType
 */
export type StatusCountType = typeof StatusType.COUNT;

/**
 * Type for count-based status responses.
 * @typedef {Object.<StatusField, number>} CountStatusResponse
 */
export type CountStatusResponse = { [K in StatusField]?: number };

/**
 * Type for percentage-based status responses.
 * @typedef {Object.<StatusField, number>} PercentStatusResponse
 */
export type PercentStatusResponse = { [K in StatusField]?: number };

/**
 * Type for raw array status responses.
 * @typedef {Object.<StatusField, Array>} RawStatus
 */
export type RawStatus = { [K in StatusField]?: any[] };

/**
 * Union type for all possible status response formats.
 * @typedef {RawStatus|CountStatusResponse|PercentStatusResponse|Array<T>|number} StatusResponse
 * @template T - Type of items in the task pool
 */
export type StatusResponse<T = any> = RawStatus | CountStatusResponse | PercentStatusResponse | T[] | number

/**
 * Configuration options for TaskPool.
 *
 * @typedef {Object} TaskPoolOptions
 * @property {number} [pingInterval] - Interval in milliseconds to check for available tasks
 * @property {number} [poolSize] - Maximum number of tasks that can be active simultaneously
 * @property {function} [emitter] - Function called when pool events occur
 */
export type TaskPoolOptions = {
	pingInterval?: number;
	poolSize?: number;
	emitter?: (event: string) => void;
}

/**
 * Manages a pool of tasks with queuing and status tracking.
 *
 * TaskPool provides a system for managing concurrent tasks, limiting the number of
 * simultaneously active tasks, and tracking task states as they move through the queue.
 *
 * @class
 * @template T - The type of task items managed by the pool
 *
 * @example
 * ```ts
 * // Create a pool that will execute 2 tasks at a time
 * const pool = new TaskPool<string>({
 *   pingInterval: 100, // Check for available tasks every 100ms
 *   poolSize: 2,       // Run at most 2 tasks at once
 *   emitter: (event) => {
 *     if (event === 'ping') {
 *       // Try to start a new task
 *     } else if (event === 'complete') {
 *       console.log('All tasks completed');
 *     }
 *   }
 * });
 *
 * // Add tasks to the pool
 * pool.enqueue('task1');
 * pool.enqueue('task2');
 *
 * // Get the next task when ready
 * const task1 = pool.next();
 * const task2 = pool.next();
 * if (task1) {
 *   // Execute the task...
 *   // When done:
 *   pool.complete(task1);
 * }
 * console.log(task2) // task2
 * if (task2) {
 * 	 pool.complete(task2);
 * }
 * console.log(pool.isCompleted()); // true
 * ```
 */
export class TaskPool<T> {
	#intervalId: NodeJS.Timeout | number | null = null
	#hasCompleted: boolean = false

	/**
	 * Interval in milliseconds between task availability checks
	 * @type {number}
	 */
	pingInterval: number = 100

	/**
	 * Maximum number of tasks that can be active simultaneously
	 * @type {number}
	 */
	poolSize: number = 1

	#queued: T[] = []
	#active: Set<T> = new Set()
	#completed: T[] = []

	/**
	 * Function called when pool events occur ('ping', 'complete')
	 * @type {((event: string) => void)|undefined}
	 */
	emitter: ((event: string) => void) | undefined

	/**
	 * Creates a new TaskPool with the specified options.
	 *
	 * @param {TaskPoolOptions} options - Configuration options for the pool
	 */
	constructor(options: TaskPoolOptions) {
		for (const [key, value] of Object.entries(options)) {
			this[key] = value
		}
	}

	/**
	 * Gets status information about the task pool.
	 *
	 * Provides flexible access to task status information in various formats.
	 * Can return raw task arrays, counts, or percentages for any status field.
	 *
	 * @param {typeof StatusAllField} fields - Status field(s) to retrieve
	 * @param {StatusCountType} type - Requested return format as count
	 * @returns {CountStatusResponse} Status information with counts for each field
	 *
	 * @overload
	 * @param {typeof StatusAllField} fields - Status field(s) to retrieve
	 * @param {StatusRawType} type - Requested return format as raw arrays
	 * @returns {RawStatus} Status information with raw arrays for each field
	 *
	 * @overload
	 * @param {typeof StatusAllField} fields - Status field(s) to retrieve
	 * @param {number} type - Requested return format as percentages with precision
	 * @returns {PercentStatusResponse} Status information with percentages for each field
	 *
	 * @overload
	 * @param {typeof StatusAllField} fields - Status field(s) to retrieve
	 * @returns {CountStatusResponse} Status information with counts for each field
	 *
	 * @overload
	 * @param {StatusField} fields - Single status field to retrieve
	 * @param {StatusRawType} type - Requested return format as raw arrays
	 * @returns {Array<T>} Raw array of tasks for the requested field
	 *
	 * @overload
	 * @param {StatusField} fields - Single status field to retrieve
	 * @param {StatusCountType} type - Requested return format as count
	 * @returns {number} Count of tasks for the requested field
	 *
	 * @overload
	 * @param {StatusField} fields - Single status field to retrieve
	 * @param {number} type - Requested return format as percentage with precision
	 * @returns {number} Percentage value for the requested field
	 *
	 * @overload
	 * @param {StatusField} fields - Single status field to retrieve
	 * @returns {number} Count of tasks for the requested field
	 *
	 * @overload
	 * @param {Array<StatusField>} fields - Multiple status fields to retrieve
	 * @param {StatusRawType} type - Requested return format as raw arrays
	 * @returns {RawStatus} Status information with raw arrays for each field
	 *
	 * @overload
	 * @param {Array<StatusField>} fields - Multiple status fields to retrieve
	 * @param {StatusCountType} type - Requested return format as count
	 * @returns {CountStatusResponse} Status information with counts for each field
	 *
	 * @overload
	 * @param {Array<StatusField>} fields - Multiple status fields to retrieve
	 * @param {number} type - Requested return format as percentages with precision
	 * @returns {PercentStatusResponse} Status information with percentages for each field
	 *
	 * @overload
	 * @param {Array<StatusField>} fields - Multiple status fields to retrieve
	 * @returns {CountStatusResponse} Status information with counts for each field
	 *
	 * @overload
	 * @returns {CountStatusResponse} Status information with counts for all fields
	 *
	 * @example
	 * ```ts
	 * // Get raw count of tasks in each state
	 * const counts = pool.status();
	 * console.log(`${counts.active} tasks running, ${counts.queued} waiting`);
	 *
	 * // Get percentage of completed tasks
	 * const percent = pool.status('completed', StatusType.PERCENT);
	 * console.log(`${percent}% of tasks completed`);
	 *
	 * // Get raw task objects in 'active' state
	 * const activeTasks = pool.status('active', StatusType.RAW);
	 * ```
	 */
	status(fields: typeof StatusAllField, type: StatusCountType): CountStatusResponse;
	status(fields: typeof StatusAllField, type: StatusRawType): RawStatus;
	status(fields: typeof StatusAllField, type: number): PercentStatusResponse;
	status(fields: typeof StatusAllField): CountStatusResponse;
	status(fields: StatusField, type: StatusRawType): T[];
	status(fields: StatusField, type: StatusCountType): number;
	status(fields: StatusField, type: number): number;
	status(fields: StatusField): number;
	status(fields: StatusField[], type: StatusRawType): RawStatus;
	status(fields: StatusField[], type: StatusCountType): CountStatusResponse;
	status(fields: StatusField[], type: number): PercentStatusResponse;
	status(fields: StatusField[]): CountStatusResponse;
	status(): CountStatusResponse;
	status(fields: typeof StatusAllField | StatusField | StatusField[] = StatusAllField, type: string | number = StatusType.COUNT): StatusResponse<T> {
		const response = {}

		const active = Array.from(this.#active)
		let status: RawStatus = {
			queued: this.#queued,
			active: active,
			completed: this.#completed,
			remaining: [...this.#queued, ...active],
			started: [...active, ...this.#completed],
			total: [...this.#queued, ...active, ...this.#completed],
		}

		if (fields === StatusAllField && type === StatusType.RAW) {
			return status
		}

		const keys = Array.isArray(fields) ? fields : (fields === '*' ? Object.keys(status) : [fields])
		for (const key of keys) {
			if (!(key in status)) {
				throw new Error(`Invalid status field: "${key}", when getting TaskPool status`)
			}
			let value: StatusResponse<T>
			if (type === StatusType.COUNT) {
				value = status[key].length
			} else if (Number.isInteger(type)) {
				value = round(status[key].length / status.total!.length * 100, type as number)
			} else {
				value = status[key]
			}
			response[key] = value
		}

		return (Array.isArray(fields) || fields === '*') ? response : response[fields]
	}

	/**
	 * Starts the interval timer for task scheduling.
	 *
	 * @private
	 */
	#startPinging(): void {
		if (this.#intervalId === null) {
			this.emitter && this.emitter('startPinging')
			this.#intervalId = setInterval(() => {
				this.emitter && this.emitter('ping')
			}, this.pingInterval)
		}
	}

	/**
	 * Stops the interval timer for task scheduling.
	 *
	 * @private
	 */
	#stopPinging(): void {
		this.#intervalId !== null && this.emitter && this.emitter('stopPinging')
		this.#intervalId !== null && clearInterval(this.#intervalId)
		this.#intervalId = null
	}

	/**
	 * Checks if the pool has room for another active task.
	 *
	 * @returns {boolean} True if another task can be started
	 */
	hasAvailableSlot(): boolean {
		return (this.#active.size < this.poolSize)
	}

	/**
	 * Checks if the pool is ready to process more tasks.
	 *
	 * A pool is ready when there are queued tasks and an available slot.
	 * This method also starts the ping interval if not already running.
	 *
	 * @returns {boolean} True if there are queued tasks and an available slot
	 */
	isReady(): boolean {
		this.#startPinging()

		if (this.isCompleted()) {
			return false
		}

		return (this.#queued.length > 0) && this.hasAvailableSlot()
	}

	/**
	 * Checks if all tasks in the pool have been completed.
	 *
	 * @param {boolean} [emit=false] - If true, emits the 'complete' event when all tasks are done
	 * @returns {boolean} True if all tasks have been completed
	 */
	isCompleted(emit: boolean = false): boolean {
		const complete = !this.#queued.length && !this.#active.size

		if (emit && complete) {
			this.#stopPinging()
			if (!this.#hasCompleted) {
				this.emitter && this.emitter('complete')
				this.#hasCompleted = true
			}
		}

		return complete
	}

	/**
	 * Adds a task to the queue.
	 *
	 * @param {T} item - The task to enqueue
	 * @param {boolean} [check=false] - If true, checks if the item is currently active and removes it
	 */
	enqueue(item: T, check: boolean = false): void {
		if (check && this.#active.has(item)) {
			this.#active.delete(item)
		}
		this.#queued.push(item)
		this.#hasCompleted = false
	}

	/**
	 * Gets the next task from the queue if the pool is ready.
	 *
	 * @returns {T|false} The next task or false if no task is available
	 */
	next(): T | false {
		if (!this.isReady() || !this.#queued.length) {
			return false
		}

		const item = this.#queued.shift()!
		this.#active.add(item)
		this.#hasCompleted = false
		return item
	}

	/**
	 * Marks a task as complete and moves it from active to completed.
	 *
	 * @param {T} item - The task to complete
	 * @param {boolean} [check=true] - If true, verifies the item is currently active
	 * @returns {boolean} True if the item was successfully completed
	 */
	complete(item: T, check: boolean = true): boolean {
		if (check && !this.#active.has(item)) {
			return false
		}

		this.#active.delete(item)
		this.#completed.push(item)

		queueMicrotask(() => this.isCompleted(true))

		return true
	}
}

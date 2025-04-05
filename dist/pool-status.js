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
const round = (num, precision = 0) => {
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
};
/**
 * Special value used to request all status fields.
 * @type {string}
 */
const StatusAllField = '*';
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
const StatusType = Object.freeze({
    RAW: 'raw',
    COUNT: 'count',
    PERCENT: 3,
});
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
class TaskPool {
    #intervalId = null;
    #hasCompleted = false;
    /**
     * Interval in milliseconds between task availability checks
     * @type {number}
     */
    pingInterval = 100;
    /**
     * Maximum number of tasks that can be active simultaneously
     * @type {number}
     */
    poolSize = 1;
    #queued = [];
    #active = new Set();
    #completed = [];
    /**
     * Function called when pool events occur ('ping', 'complete')
     * @type {((event: string) => void)|undefined}
     */
    emitter;
    /**
     * Creates a new TaskPool with the specified options.
     *
     * @param {TaskPoolOptions} options - Configuration options for the pool
     */
    constructor(options) {
        for (const [key, value] of Object.entries(options)) {
            this[key] = value;
        }
    }
    status(fields = StatusAllField, type = StatusType.COUNT) {
        const response = {};
        const active = Array.from(this.#active);
        let status = {
            queued: this.#queued,
            active: active,
            completed: this.#completed,
            remaining: [...this.#queued, ...active],
            started: [...active, ...this.#completed],
            total: [...this.#queued, ...active, ...this.#completed],
        };
        if (fields === StatusAllField && type === StatusType.RAW) {
            return status;
        }
        const keys = Array.isArray(fields) ? fields : (fields === '*' ? Object.keys(status) : [fields]);
        for (const key of keys) {
            if (!(key in status)) {
                throw new Error(`Invalid status field: "${key}", when getting TaskPool status`);
            }
            let value;
            if (type === StatusType.COUNT) {
                value = status[key].length;
            }
            else if (Number.isInteger(type)) {
                value = round(status[key].length / status.total.length * 100, type);
            }
            else {
                value = status[key];
            }
            response[key] = value;
        }
        return (Array.isArray(fields) || fields === '*') ? response : response[fields];
    }
    /**
     * Starts the interval timer for task scheduling.
     *
     * @private
     */
    #startPinging() {
        if (this.#intervalId === null) {
            this.emitter && this.emitter('startPinging');
            this.#intervalId = setInterval(() => {
                this.emitter && this.emitter('ping');
            }, this.pingInterval);
        }
    }
    /**
     * Stops the interval timer for task scheduling.
     *
     * @private
     */
    #stopPinging() {
        this.#intervalId !== null && this.emitter && this.emitter('stopPinging');
        this.#intervalId !== null && clearInterval(this.#intervalId);
        this.#intervalId = null;
    }
    /**
     * Checks if the pool has room for another active task.
     *
     * @returns {boolean} True if another task can be started
     */
    hasAvailableSlot() {
        return (this.#active.size < this.poolSize);
    }
    /**
     * Checks if the pool is ready to process more tasks.
     *
     * A pool is ready when there are queued tasks and an available slot.
     * This method also starts the ping interval if not already running.
     *
     * @returns {boolean} True if there are queued tasks and an available slot
     */
    isReady() {
        this.#startPinging();
        if (this.isCompleted()) {
            return false;
        }
        return (this.#queued.length > 0) && this.hasAvailableSlot();
    }
    /**
     * Checks if all tasks in the pool have been completed.
     *
     * @param {boolean} [emit=false] - If true, emits the 'complete' event when all tasks are done
     * @returns {boolean} True if all tasks have been completed
     */
    isCompleted(emit = false) {
        const complete = !this.#queued.length && !this.#active.size;
        if (emit && complete) {
            this.#stopPinging();
            if (!this.#hasCompleted) {
                this.emitter && this.emitter('complete');
                this.#hasCompleted = true;
            }
        }
        return complete;
    }
    /**
     * Adds a task to the queue.
     *
     * @param {T} item - The task to enqueue
     * @param {boolean} [check=false] - If true, checks if the item is currently active and removes it
     */
    enqueue(item, check = false) {
        if (check && this.#active.has(item)) {
            this.#active.delete(item);
        }
        this.#queued.push(item);
        this.#hasCompleted = false;
    }
    /**
     * Gets the next task from the queue if the pool is ready.
     *
     * @returns {T|false} The next task or false if no task is available
     */
    next() {
        if (!this.isReady() || !this.#queued.length) {
            return false;
        }
        const item = this.#queued.shift();
        this.#active.add(item);
        this.#hasCompleted = false;
        return item;
    }
    /**
     * Marks a task as complete and moves it from active to completed.
     *
     * @param {T} item - The task to complete
     * @param {boolean} [check=true] - If true, verifies the item is currently active
     * @returns {boolean} True if the item was successfully completed
     */
    complete(item, check = true) {
        if (check && !this.#active.has(item)) {
            return false;
        }
        this.#active.delete(item);
        this.#completed.push(item);
        queueMicrotask(() => this.isCompleted(true));
        return true;
    }
}

export { StatusAllField, StatusType, TaskPool, round };

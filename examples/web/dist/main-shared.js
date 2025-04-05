/**
 * Constants representing different thread states.
 *
 * These values use bitwise flags to allow efficient checking of multiple states with a single operation.
 * Each state is represented by a unique power of 2 to ensure clear bitwise operations.
 *
 * @type {Object.<string, number>}
 * @property {number} INIT - Initial state (1) when thread is first created
 * @property {number} READY - Ready state (2) when thread is prepared to run
 * @property {number} ACTIVE - Active state (4) when thread is currently executing
 * @property {number} SUCCESS - Success state (8) when thread has completed successfully
 * @property {number} ERROR - Error state (16) when thread has encountered an error
 * @property {number} COMPLETED - Combined state (24) for threads that have completed (either SUCCESS or ERROR)
 * @property {number} STARTED - Combined state (28) for threads that have started execution (either ACTIVE or COMPLETED)
 *
 * @example
 * ```ts
 * // Check if thread is either in SUCCESS or ERROR state
 * const threadStatus = new ThreadStatus()
 * threadStatus.value = Status.SUCCESS
 * if (threadStatus.value & Status.COMPLETED) {
 *   console.log('Thread completed execution');
 * }
 * ```
 */ const Status = Object.freeze({
    INIT: 1,
    READY: 2,
    ACTIVE: 4,
    SUCCESS: 8,
    ERROR: 16,
    get COMPLETED () {
        return this.SUCCESS | this.ERROR;
    },
    get STARTED () {
        return this.ACTIVE | this.COMPLETED;
    }
});
/**
 * Tracks the state of a thread throughout its lifecycle.
 *
 * Uses bitwise flags to efficiently represent and check multiple states.
 * Provides convenient boolean accessors for checking specific states.
 *
 * @class
 * @example
 * ```ts
 * const status = new ThreadStatus();
 * status.value = Status.READY;
 *
 * // Check if thread is ready
 * if (status.READY) {
 *   console.log('Thread is ready to start');
 * }
 *
 * // Check if thread completed with an error
 * if (status.ERROR) {
 *   console.log('Thread encountered an error');
 * }
 * ```
 */ class ThreadStatus {
    #value = Status.INIT;
    /**
	 * Gets the current status value.
	 *
	 * @type {number}
	 */ get value() {
        return this.#value;
    }
    /**
	 * Sets the current status value.
	 *
	 * @param {number} state - The new state value (typically from Status constants)
	 */ set value(state) {
        this.#value = state;
    }
    /**
	 * Whether the thread is in INIT state.
	 *
	 * @type {boolean}
	 */ get INIT() {
        return !!(this.#value & Status.INIT);
    }
    /**
	 * Whether the thread is in READY state.
	 *
	 * @type {boolean}
	 */ get READY() {
        return !!(this.#value & Status.READY);
    }
    /**
	 * Whether the thread is in ACTIVE state.
	 *
	 * @type {boolean}
	 */ get ACTIVE() {
        return !!(this.#value & Status.ACTIVE);
    }
    /**
	 * Whether the thread has completed successfully.
	 *
	 * @type {boolean}
	 */ get SUCCESS() {
        return !!(this.#value & Status.SUCCESS);
    }
    /**
	 * Whether the thread has completed with an error.
	 *
	 * @type {boolean}
	 */ get ERROR() {
        return !!(this.#value & Status.ERROR);
    }
    /**
	 * Whether the thread has started (is either ACTIVE or COMPLETED).
	 *
	 * @type {boolean}
	 */ get STARTED() {
        return !!(this.#value & Status.STARTED);
    }
    /**
	 * Whether the thread has completed (either SUCCESS or ERROR).
	 *
	 * @type {boolean}
	 */ get COMPLETED() {
        return !!(this.#value & Status.COMPLETED);
    }
}

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
 */ const round = function(num) {
    let precision = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
};
/**
 * Special value used to request all status fields.
 * @type {string}
 */ const StatusAllField = '*';
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
 */ const StatusType = Object.freeze({
    RAW: 'raw',
    COUNT: 'count',
    PERCENT: 3
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
 */ class TaskPool {
    #intervalId = null;
    #hasCompleted = false;
    /**
	 * Interval in milliseconds between task availability checks
	 * @type {number}
	 */ pingInterval = 100;
    /**
	 * Maximum number of tasks that can be active simultaneously
	 * @type {number}
	 */ poolSize = 1;
    #queued = [];
    #active = new Set();
    #completed = [];
    /**
	 * Function called when pool events occur ('ping', 'complete')
	 * @type {((event: string) => void)|undefined}
	 */ emitter;
    /**
	 * Creates a new TaskPool with the specified options.
	 *
	 * @param {TaskPoolOptions} options - Configuration options for the pool
	 */ constructor(options){
        for (const [key, value] of Object.entries(options)){
            this[key] = value;
        }
    }
    status() {
        let fields = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : StatusAllField, type = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : StatusType.COUNT;
        const response = {};
        const active = Array.from(this.#active);
        let status = {
            queued: this.#queued,
            active: active,
            completed: this.#completed,
            remaining: [
                ...this.#queued,
                ...active
            ],
            started: [
                ...active,
                ...this.#completed
            ],
            total: [
                ...this.#queued,
                ...active,
                ...this.#completed
            ]
        };
        if (fields === StatusAllField && type === StatusType.RAW) {
            return status;
        }
        const keys = Array.isArray(fields) ? fields : fields === '*' ? Object.keys(status) : [
            fields
        ];
        for (const key of keys){
            if (!(key in status)) {
                throw new Error(`Invalid status field: "${key}", when getting TaskPool status`);
            }
            let value;
            if (type === StatusType.COUNT) {
                value = status[key].length;
            } else if (Number.isInteger(type)) {
                value = round(status[key].length / status.total.length * 100, type);
            } else {
                value = status[key];
            }
            response[key] = value;
        }
        return Array.isArray(fields) || fields === '*' ? response : response[fields];
    }
    /**
	 * Starts the interval timer for task scheduling.
	 *
	 * @private
	 */ #startPinging() {
        if (this.#intervalId === null) {
            this.emitter && this.emitter('startPinging');
            this.#intervalId = setInterval(()=>{
                this.emitter && this.emitter('ping');
            }, this.pingInterval);
        }
    }
    /**
	 * Stops the interval timer for task scheduling.
	 *
	 * @private
	 */ #stopPinging() {
        this.#intervalId !== null && this.emitter && this.emitter('stopPinging');
        this.#intervalId !== null && clearInterval(this.#intervalId);
        this.#intervalId = null;
    }
    /**
	 * Checks if the pool has room for another active task.
	 *
	 * @returns {boolean} True if another task can be started
	 */ hasAvailableSlot() {
        return this.#active.size < this.poolSize;
    }
    /**
	 * Checks if the pool is ready to process more tasks.
	 *
	 * A pool is ready when there are queued tasks and an available slot.
	 * This method also starts the ping interval if not already running.
	 *
	 * @returns {boolean} True if there are queued tasks and an available slot
	 */ isReady() {
        this.#startPinging();
        if (this.isCompleted()) {
            return false;
        }
        return this.#queued.length > 0 && this.hasAvailableSlot();
    }
    /**
	 * Checks if all tasks in the pool have been completed.
	 *
	 * @param {boolean} [emit=false] - If true, emits the 'complete' event when all tasks are done
	 * @returns {boolean} True if all tasks have been completed
	 */ isCompleted() {
        let emit = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
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
	 */ enqueue(item) {
        let check = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
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
	 */ next() {
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
	 */ complete(item) {
        let check = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
        if (check && !this.#active.has(item)) {
            return false;
        }
        this.#active.delete(item);
        this.#completed.push(item);
        queueMicrotask(()=>this.isCompleted(true));
        return true;
    }
}

/**
 * Manages a function-based thread in web environments.
 *
 * WebFunctionThread wraps an asynchronous function with thread-like status
 * tracking and eventing capabilities, allowing it to be managed similar to
 * actual web workers but without the overhead of creating separate worker threads.
 *
 * @class
 * @extends {EventTarget}
 *
 * @example
 * ```ts
 * // Create a thread to perform a calculation
 * const thread = new WebFunctionThread({
 *   workerFn: async () => {
 *     // Simulate complex work
 *     await new Promise(resolve => setTimeout(resolve, 500));
 *     return 42;
 *   },
 *   meta: { id: "calculation-1" }
 * });
 *
 * // Listen for events
 * thread.addEventListener('message', (event) => {
 *   console.log('Result:', event.detail);
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
 */ class WebFunctionThread extends EventTarget {
    #status = new ThreadStatus();
    #workerFn;
    /**
	 * Optional metadata associated with this thread
	 * @type {any|undefined}
	 */ meta;
    #message;
    #error;
    /**
	 * Gets the current thread status.
	 *
	 * @type {ThreadStatus}
	 */ get status() {
        return this.#status;
    }
    /**
	 * Gets the latest message received from the thread.
	 *
	 * @type {any}
	 */ get message() {
        return this.#message;
    }
    /**
	 * Gets any error that occurred in the thread.
	 *
	 * @type {any}
	 */ get error() {
        return this.#error;
    }
    /**
	 * Creates a new WebFunctionThread.
	 *
	 * @param {WebFunctionThreadOptions} options - Configuration options containing the worker
	 *   function to execute and optional metadata
	 */ constructor({ workerFn, meta }){
        super();
        this.#workerFn = workerFn;
        this.meta = meta;
        this.#setStatus(Status.READY, meta);
    }
    /**
	 * Updates the thread status and dispatches a status event.
	 *
	 * @private
	 * @param {number} newState - The new status to set
	 * @param {...any} args - Additional arguments to include with the status event
	 */ #setStatus(newState) {
        for(var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
            args[_key - 1] = arguments[_key];
        }
        const oldState = this.#status.value;
        this.#status.value = newState;
        this.dispatchEvent(new CustomEvent('status', {
            detail: [
                this.#status,
                newState,
                oldState,
                ...args
            ]
        }));
    }
    /**
	 * Starts execution of the thread function.
	 *
	 * Once started, the thread cannot be started again.
	 * Events dispatched during execution:
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
	 * const thread = new WebFunctionThread({
	 *   workerFn: async () => {
	 *     return await fetchData();
	 *   }
	 * });
	 *
	 * thread.addEventListener('message', (event) => {
	 *   const data = event.detail;
	 *   // Process the fetched data
	 * });
	 *
	 * thread.start();
	 * ```
	 */ start() {
        if (!this.status.READY) {
            return false;
        }
        this.#setStatus(Status.ACTIVE);
        this.dispatchEvent(new CustomEvent('init', {
            detail: this
        }));
        this.#workerFn().then((message)=>{
            this.#message = message;
            this.#setStatus(Status.SUCCESS, message);
            this.dispatchEvent(new CustomEvent('message', {
                detail: message
            }));
        }, (reason)=>{
            this.#error = reason;
            this.#setStatus(Status.ERROR, reason);
            this.dispatchEvent(new CustomEvent('error', {
                detail: reason
            }));
        }).catch((error)=>{
            this.#error = error;
            this.#setStatus(Status.ERROR, error);
            this.dispatchEvent(new CustomEvent('messageerror', {
                detail: error
            }));
        }).finally(()=>{
            this.dispatchEvent(new CustomEvent('exit', {
                detail: this.#status.SUCCESS ? 0 : 1
            }));
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
	 * const thread = new WebFunctionThread({
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
	 */ then(onFulfilled) {
        this.addEventListener('message', (event)=>{
            onFulfilled(event.detail);
        });
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
	 * const thread = new WebFunctionThread({
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
	 */ catch(onRejected) {
        this.addEventListener('error', (event)=>{
            onRejected(event.detail, 'error');
        });
        this.addEventListener('messageerror', (event)=>{
            onRejected(event.detail, 'messageerror');
        });
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
	 * const thread = new WebFunctionThread({
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
	 */ finally(onFinally) {
        this.addEventListener('exit', ()=>onFinally());
        return this;
    }
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
 */ class WebFunctionPool extends EventTarget {
    #pool = new TaskPool({
        pingInterval: 100,
        poolSize: navigator.hardwareConcurrency,
        emitter: (event)=>{
            if (event === 'ping') {
                this.#runWorker();
            } else {
                this.dispatchEvent(new Event(event));
            }
        }
    });
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
	 */ constructor(options = {}){
        super();
        for (const [key, value] of Object.entries(options)){
            this[key] = value;
        }
    }
    /**
	 * Sets the interval in milliseconds between task scheduling attempts.
	 *
	 * @param {number} value - Ping interval in milliseconds (minimum: 1)
	 */ set pingInterval(value) {
        this.#pool.pingInterval = Math.max(value, 1);
    }
    /**
	 * Sets the maximum number of threads that can run concurrently.
	 *
	 * @param {number} value - Pool size (minimum: 1)
	 */ set poolSize(value) {
        this.#pool.poolSize = Math.max(value, 1);
    }
    /**
	 * Gets the maximum number of threads that can run concurrently.
	 *
	 * @returns {number} Current maximum pool size
	 */ get poolSize() {
        return this.#pool.poolSize;
    }
    /**
	 * Gets status information about the thread pool.
	 * See TaskPool.status() for detailed documentation on parameters and return types.
	 *
	 * @type {typeof TaskPool.prototype.status}
	 */ status = this.#pool.status.bind(this.#pool);
    /**
	 * Checks if all threads in the pool have completed.
	 *
	 * @type {typeof TaskPool.prototype.isCompleted}
	 * @returns {boolean} True if all tasks are completed
	 */ isCompleted = this.#pool.isCompleted.bind(this.#pool);
    /**
	 * Checks if the pool has capacity for another active thread.
	 *
	 * @type {typeof TaskPool.prototype.hasAvailableSlot}
	 * @returns {boolean} True if another thread can be started
	 */ hasAvailableThread = this.#pool.hasAvailableSlot.bind(this.#pool);
    /**
	 * Attempts to start the next thread from the queue if the pool is ready.
	 *
	 * @private
	 */ #runWorker() {
        const thread = this.#pool.next();
        if (!thread) {
            return;
        }
        if (!thread.status.READY) {
            this.#pool.enqueue(thread, true);
        } else {
            thread.addEventListener('init', (_event)=>{
                this.dispatchEvent(new CustomEvent('worker.init', {
                    detail: [
                        thread
                    ]
                }));
            });
            thread.start();
            thread.addEventListener('status', (event)=>{
                const [status, newState, oldState, ...args] = event.detail;
                this.dispatchEvent(new CustomEvent('worker.status', {
                    detail: [
                        status,
                        newState,
                        oldState,
                        thread,
                        ...args
                    ]
                }));
            });
            thread.addEventListener('message', (event)=>{
                const data = event.detail;
                this.dispatchEvent(new CustomEvent('worker.message', {
                    detail: [
                        data,
                        thread
                    ]
                }));
            });
            thread.addEventListener('messageerror', (event)=>{
                const error = event.detail;
                this.dispatchEvent(new CustomEvent('worker.messageerror', {
                    detail: [
                        error,
                        thread
                    ]
                }));
            });
            thread.addEventListener('error', (event)=>{
                const error = event.detail;
                this.dispatchEvent(new CustomEvent('worker.error', {
                    detail: [
                        error,
                        thread
                    ]
                }));
            });
            thread.addEventListener('exit', (event)=>{
                const exitCode = event.detail;
                this.#pool.complete(thread);
                this.dispatchEvent(new CustomEvent('worker.exit', {
                    detail: [
                        exitCode,
                        thread
                    ]
                }));
                this.#runWorker();
            });
        }
        this.#runWorker();
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
	 */ addTask(workerFn) {
        let meta = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : undefined;
        const thread = new WebFunctionThread({
            workerFn,
            meta
        });
        this.#pool.enqueue(thread);
        this.#runWorker();
        return thread;
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
	 */ then(onFulfilled) {
        this.addEventListener('worker.message', (event)=>{
            const [data, thread] = event.detail;
            onFulfilled(data, thread);
        });
        return this;
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
	 */ catch(onRejected) {
        this.addEventListener('worker.error', (event)=>{
            const [error, thread] = event.detail;
            onRejected(error, 'error', thread);
        });
        this.addEventListener('worker.messageerror', (event)=>{
            const [error, thread] = event.detail;
            onRejected(error, 'messageerror', thread);
        });
        return this;
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
	 */ finally(onFinally) {
        this.addEventListener('worker.exit', (event)=>{
            const [exitCode, thread] = event.detail;
            onFinally(exitCode, thread);
        });
        return this;
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
	 */ allSettled(callback) {
        this.addEventListener('complete', ()=>callback(this.#pool.status('completed', StatusType.RAW)));
        return this;
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
	 */ all(callback) {
        const wrappedCallback = (event)=>{
            this.removeEventListener('worker.messageerror', wrappedCallback);
            this.removeEventListener('worker.error', wrappedCallback);
            this.removeEventListener('complete', wrappedCallback);
            let threads;
            if (event.type === 'complete') {
                threads = this.#pool.status('completed', StatusType.RAW);
            } else {
                threads = event.detail[0] // error is now the first item in detail array
                ;
            }
            callback(threads);
        };
        this.addEventListener('worker.messageerror', wrappedCallback, {
            once: true
        });
        this.addEventListener('worker.error', wrappedCallback, {
            once: true
        });
        this.addEventListener('complete', wrappedCallback, {
            once: true
        });
        return this;
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
	 */ any(callback) {
        const wrappedCallback = (event)=>{
            this.removeEventListener('worker.message', wrappedCallback);
            this.removeEventListener('complete', wrappedCallback);
            let thread, data;
            if (event.type === 'complete') {
                data = new AggregateError(this.#pool.status('completed', StatusType.RAW), 'No threads completed successfully');
                thread = undefined;
            } else {
                [data, thread] = event.detail;
            }
            callback(data, thread);
        };
        this.addEventListener('worker.message', wrappedCallback, {
            once: true
        });
        this.addEventListener('complete', wrappedCallback, {
            once: true
        });
        return this;
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
	 */ race(callback) {
        const wrappedCallback = (event)=>{
            this.removeEventListener('worker.message', wrappedCallback);
            this.removeEventListener('worker.messageerror', wrappedCallback);
            this.removeEventListener('worker.error', wrappedCallback);
            const [data, thread] = event.detail;
            callback(data, thread);
        };
        this.addEventListener('worker.message', wrappedCallback, {
            once: true
        });
        this.addEventListener('worker.messageerror', wrappedCallback, {
            once: true
        });
        this.addEventListener('worker.error', wrappedCallback, {
            once: true
        });
        return this;
    }
}

/**
 * Type transformation that converts a function to one that returns a thunk.
 * The thunk when called returns a Promise of the original return value.
 *
 * @template T - The original function or value type
 */ /**
 * Normalizes a filename into a string representation.
 *
 * @param {string|URL} f - The filename to normalize
 * @returns {string} The normalized filename
 */ const normalizeFilename = (f)=>f instanceof URL ? f.href : f;
async function importWorkerProxy(filename, options) {
    const { isBrowser = false, isPersistent = false, isSharedWorker = false, executeImmediately = false, terminateKey = 'terminate', WorkerType = Worker, workerFile, workerOptions = {}, workerPromise, messageOptions = {
        terminate: !isPersistent
    } } = options;
    filename = normalizeFilename(filename);
    const module = await import(filename);
    const worker = isPersistent ? new WorkerType(workerFile, isBrowser ? workerOptions : {
        ...workerOptions,
        workerData: {
            filename
        }
    }) : null;
    return new Proxy(module, {
        get (target, prop) {
            if (isPersistent && prop === terminateKey) {
                return isSharedWorker ? ()=>worker.port.close() : ()=>worker.terminate();
            }
            const value = target[prop];
            if (value === undefined) {
                return undefined;
            }
            const runWorker = function() {
                for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                    args[_key] = arguments[_key];
                }
                const message = typeof value === 'function' ? {
                    filename,
                    method: prop === 'default' ? prop : value.name,
                    args
                } : {
                    filename,
                    property: prop
                };
                const currentWorker = worker || new WorkerType(workerFile, isBrowser ? workerOptions : {
                    ...workerOptions,
                    workerData: message
                });
                return workerPromise(currentWorker, isBrowser || isPersistent ? message : undefined, messageOptions);
            };
            return executeImmediately ? runWorker : function() {
                for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                    args[_key] = arguments[_key];
                }
                return ()=>runWorker(...args);
            };
        }
    });
}

// We are hard coding the JS version of the worker file here, because we don't want
// the end user to have to worry about saving the worker file to their deployment
const dataURL = 'data:application/javascript,' + encodeURIComponent(`
const sendMessage = (port) => async (event) => {
	const { filename, property, method, args } = event.data
	const imported = await import(filename)

	try {
		if (property) {
			port.postMessage(imported[property])
		}
		if (method) {
			port.postMessage(await imported[method](...(args || [])))
		}
	} catch (error) {
		port.postMessage({ error: error.message })
	}
}

if (!!self.DedicatedWorkerGlobalScope) {
	self.addEventListener('message', sendMessage(self))
} else if (!!self.SharedWorkerGlobalScope) {
	self.addEventListener('connect', ({ ports }) => {
		ports[0].addEventListener('message', sendMessage(ports[0]))
		ports[0].start()
	})
}

export {}
`);
/**
 * Gets the currently set worker URL or falls back to the default data URL.
 *
 * @returns {URL|string} The current worker URL or data URL if none is set
 *
 * @example
 * ```ts
 * // Check which worker script is currently in use
 * const workerUrl = getWorkerUrl();
 * console.log('Using worker script at:', workerUrl);
 * ```
 */ const getWorkerUrl = ()=>{
    return dataURL;
};
/**
 * Creates a promise for communication with a worker.
 *
 * @private
 * @param {InstanceType<WorkerType>} worker - The Web Worker or SharedWorker instance
 * @param {any} [message] - Message to send to the worker
 * @param {MessageOptions} [messageOptions={}] - Options for handling the message and response
 * @returns {Promise<any>} Promise resolving to the worker's response
 */ const workerPromise = function(worker, message) {
    let messageOptions = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    const { timeout = 30000, terminate = false, returnEvent = false } = messageOptions;
    const isSharedWorker = worker instanceof self.SharedWorker;
    const port = isSharedWorker ? worker.port : worker;
    return new Promise((resolve, reject)=>{
        const controller = new AbortController();
        const { signal } = controller;
        const sendMessage = function(cb, response) {
            let eventType = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
            controller.abort();
            (terminate || eventType !== 'message') && (isSharedWorker ? port.close() : worker.terminate() // terminate on single request or on error!
            );
            cb(returnEvent ? response : response instanceof MessageEvent ? response.data : response.error ?? response);
        };
        port.addEventListener('message', (result)=>sendMessage(resolve, result, 'message'), {
            signal
        });
        port.addEventListener('messageerror', (error)=>sendMessage(reject, error, 'messageerror'), {
            signal
        });
        port.addEventListener('error', (error)=>sendMessage(reject, error, 'error'), {
            signal
        });
        isSharedWorker && port.start();
        message !== undefined && port.postMessage(message);
        if (timeout) {
            let timeoutID = setTimeout(()=>sendMessage(reject, new ErrorEvent('timeout', {
                    message: `Worker timeout after ${timeout}ms`
                }), 'error'), timeout);
            signal.addEventListener('abort', ()=>clearTimeout(timeoutID), {
                once: true
            });
        }
    });
};
/**
 * Imports a module in a Web Worker and immediately executes all exported methods.
 *
 * The worker is terminated after any method call.
 * This is useful for one-off computations where you want to immediately execute a function.
 *
 * @template T - Type of the module being imported
 * @param {string|URL} filename - Path to the module to import in the worker
 * @param {WorkerOptions} [workerOptions={}] - Options for the Worker constructor
 * @param {MessageOptions} [messageOptions={}] - Options for message handling
 * @returns {Promise<PromisifyModule<T>>} Promise for the immediate-execution module proxy
 *
 * @example
 * ```ts
 * // Import a module with math functions
 * import type * as MathModule from './math.js';
 *
 * // This will create a worker, execute fib(40), and terminate the worker
 * const { fib } = await importWebWorker<typeof MathModule>('./math.js');
 * console.log(await fib(42)); // 267914296
 *
 * // Each call creates a new worker
 * const sum = await importWebWorker<typeof MathModule>('./math.js').add(5, 10);
 * ```
 */ const importWebWorker = function(filename) {
    let workerOptions = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, messageOptions = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    return importWorkerProxy(filename, {
        isBrowser: true,
        isSharedWorker: messageOptions?.WorkerType === SharedWorker,
        isPersistent: false,
        executeImmediately: true,
        WorkerType: messageOptions?.WorkerType ?? Worker,
        workerFile: getWorkerUrl(),
        workerOptions: {
            type: 'module',
            ...workerOptions
        },
        workerPromise,
        messageOptions: {
            ...messageOptions,
            terminate: true
        }
    });
};

const start = performance.now();
console.log('Starting...');
const filename = new URL('./../../common/math.js', import.meta.url);
const WorkerOptions = {
    type: 'module',
    credentials: 'same-origin'
};
const pool = new WebFunctionPool();
pool.allSettled(()=>{
    const completed = pool.status('completed', StatusType.RAW);
    for (const thread of completed){
        console.log(thread.message, thread.status.SUCCESS ? 'Success' : 'Error', thread.meta);
    }
    console.log('\nDONE!', pool.status('completed', StatusType.COUNT));
    console.log('\n\nScript runtime: ' + Math.round(performance.now() - start) / 1000 + ' sec\n\n');
}).then((data, thread)=>{
    console.log(data, thread);
});
const { add, fib, getState, state } = await importWebWorker(filename, WorkerOptions, {
    WorkerType: SharedWorker
});
let threads = Array.from({
    length: 10
});
for(const i in threads){
    pool.addTask(()=>fib(42), +i + 1);
}
pool.addTask(()=>getState(), 11);
pool.addTask(()=>add(1, 2), 12);
pool.addTask(()=>getState(), 13);
pool.addTask(()=>add(34, 56), 14);
pool.addTask(()=>getState(), 15);
pool.addTask(()=>state(), 16) /**
 * The output should be:
 *
<output>
267914296 'Success' 3
267914296 'Success' 5
267914296 'Success' 4
267914296 'Success' 1
267914296 'Success' 6
267914296 'Success' 7
267914296 'Success' 2
0 'Success' 15
0 'Success' 11
3 'Success' 12
1 'Success' 13
90 'Success' 14
2 'Success' 16
267914296 'Success' 8
267914296 'Success' 10
267914296 'Success' 9

DONE! 16

Script runtime: 3.768 sec
</output>
 */ ;

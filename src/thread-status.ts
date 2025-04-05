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
 */
export const Status = Object.freeze({
	INIT: 1,
	READY: 2,
	ACTIVE: 4,
	SUCCESS: 8,
	ERROR: 16,

	get COMPLETED() {
		return this.SUCCESS | this.ERROR
	},

	get STARTED() {
		return this.ACTIVE | this.COMPLETED
	},
} as const) as {
	readonly INIT: 1;
	readonly READY: 2;
	readonly ACTIVE: 4;
	readonly SUCCESS: 8;
	readonly ERROR: 16;
	readonly COMPLETED: 24;
	readonly STARTED: 28;
}

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
 */
export class ThreadStatus {
	#value: number = Status.INIT

	/**
	 * Gets the current status value.
	 *
	 * @type {number}
	 */
	get value(): number {
		return this.#value
	}

	/**
	 * Sets the current status value.
	 *
	 * @param {number} state - The new state value (typically from Status constants)
	 */
	set value(state: number) {
		this.#value = state
	}

	/**
	 * Whether the thread is in INIT state.
	 *
	 * @type {boolean}
	 */
	get INIT(): boolean {
		return !!(this.#value & Status.INIT)
	}

	/**
	 * Whether the thread is in READY state.
	 *
	 * @type {boolean}
	 */
	get READY(): boolean {
		return !!(this.#value & Status.READY)
	}

	/**
	 * Whether the thread is in ACTIVE state.
	 *
	 * @type {boolean}
	 */
	get ACTIVE(): boolean {
		return !!(this.#value & Status.ACTIVE)
	}

	/**
	 * Whether the thread has completed successfully.
	 *
	 * @type {boolean}
	 */
	get SUCCESS(): boolean {
		return !!(this.#value & Status.SUCCESS)
	}

	/**
	 * Whether the thread has completed with an error.
	 *
	 * @type {boolean}
	 */
	get ERROR(): boolean {
		return !!(this.#value & Status.ERROR)
	}

	/**
	 * Whether the thread has started (is either ACTIVE or COMPLETED).
	 *
	 * @type {boolean}
	 */
	get STARTED(): boolean {
		return !!(this.#value & Status.STARTED)
	}

	/**
	 * Whether the thread has completed (either SUCCESS or ERROR).
	 *
	 * @type {boolean}
	 */
	get COMPLETED(): boolean {
		return !!(this.#value & Status.COMPLETED)
	}
}

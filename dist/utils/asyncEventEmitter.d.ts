import { EventEmitter } from 'node:events';
/**
 * Type definition for an asynchronous event emitter function.
 *
 * This function emits an event and returns a Promise that resolves with the
 * event handler response or the original value if no handlers respond.
 *
 * @template T - Type of the value being passed through the event
 * @callback AsyncEventEmitter
 * @param {string} eventName - Name of the event to emit
 * @param {T} value - Value to pass to event handlers
 * @param {...any} args - Additional arguments to pass to event handlers
 * @returns {Promise<T>} Promise resolving to the handler response or original value
 *
 * @property {function} waitFor - Version of the emitter with custom timeout
 */
export type AsyncEventEmitter = {
    <T>(eventName: string, value: T, ...args: any[]): Promise<T>;
    waitFor: <T>(timeout: number, eventName: string, value: T, ...args: any[]) => Promise<T>;
};
/**
 * Creates an asynchronous event emitter function from a standard EventEmitter.
 *
 * This function transforms a standard EventEmitter into an async function that:
 * 1. Emits an event with a value and optional arguments
 * 2. Returns a Promise that resolves with the value returned by event handlers
 * 3. Supports timeouts for waiting on event handler responses
 *
 * @param {EventEmitter} instance - The EventEmitter instance to wrap
 * @param {number} [defaultTimeout=1] - Default timeout in milliseconds
 * @returns {AsyncEventEmitter} An async function for event emission
 *
 * @example
 * ```ts
 * // Create an async emitter from a standard EventEmitter
 * const emitter = new EventEmitter();
 * const asyncEmit = asyncEventEmitter(emitter, 100);
 *
 * // Set up an event handler that modifies the value
 * emitter.on('transform', (callback, value) => {
 *   // Modify the value and call the callback
 *   callback(value * 2);
 * });
 *
 * // Later, emit the event and get the transformed result
 * const result = await asyncEmit('transform', 5);
 * console.log(result); // 10
 *
 * // With custom timeout
 * const resultWithTimeout = await asyncEmit.waitFor(500, 'transform', 7);
 * console.log(resultWithTimeout); // 14
 * ```
 */
export declare const asyncEventEmitter: (instance: EventEmitter, defaultTimeout?: number) => AsyncEventEmitter;
//# sourceMappingURL=asyncEventEmitter.d.ts.map
import 'node:events';
import { setTimeout, clearTimeout } from 'node:timers';

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
const asyncEventEmitter = (instance, defaultTimeout = 1) => {
    const emitAsync = async (timeout, eventName, value, ...args) => {
        if (!instance.listenerCount(eventName)) {
            return value;
        }
        return new Promise((resolve) => {
            const timer = setTimeout(() => resolve(value), timeout);
            instance.emit(eventName, (response) => {
                clearTimeout(timer);
                resolve(response);
            }, value, ...args);
        });
    };
    const method = async (eventName, value, ...args) => {
        return await emitAsync(defaultTimeout, eventName, value, ...args);
    };
    method.waitFor = async (timeout, eventName, value, ...args) => {
        return await emitAsync(timeout, eventName, value, ...args);
    };
    return method;
};

export { asyncEventEmitter };

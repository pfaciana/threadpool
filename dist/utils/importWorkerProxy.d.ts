/**
 * Type transformation that converts a function to one that returns a thunk.
 * The thunk when called returns a Promise of the original return value.
 *
 * @template T - The original function or value type
 */
export type DeferredPromisifyFunction<T> = T extends (...args: infer P) => infer R ? (...args: P) => () => Promise<R> : () => () => Promise<T>;
/**
 * Type transformation that converts all functions and values in a module to deferred Promise versions.
 * Functions return thunks that when executed return Promises of the original return values.
 *
 * @template T - The original module type
 */
export type DeferredPromisifyModule<T> = {
    [K in keyof T]: T[K] extends Function ? DeferredPromisifyFunction<T[K]> : () => () => Promise<T[K]>;
};
/**
 * Type transformation that converts a function to one that returns a Promise of the original result.
 *
 * @template T - The original function or value type
 */
export type PromisifyFunction<T> = T extends (...args: infer P) => infer R ? (...args: P) => Promise<R> : () => Promise<T>;
/**
 * Type transformation that converts all functions and values in a module to Promise versions.
 *
 * @template T - The original module type
 */
export type PromisifyModule<T> = {
    [K in keyof T]: T[K] extends Function ? PromisifyFunction<T[K]> : () => Promise<T[K]>;
};
/**
 * Interface defining the constructor signature for Worker types.
 */
export interface WorkerType {
    new (url: string | URL, options?: string | {}): any;
}
/**
 * Options for configuring worker message handling.
 *
 * @interface MessageOptions
 * @property {number} [timeout] - Timeout in milliseconds for message processing
 * @property {boolean} [terminate] - Whether to terminate the worker after processing
 * @property {string} [terminateKey] - The property name used for termination method
 * @property {WorkerType} [WorkerType] - The worker constructor to use
 * @property {boolean} [returnEvent] - Whether to return the event object instead of just the data
 */
export interface MessageOptions {
    timeout?: number;
    terminate?: boolean;
    terminateKey?: string;
    WorkerType?: WorkerType;
    returnEvent?: boolean;
}
/**
 * Worker instantiation options.
 */
type WorkerOptions = object;
/**
 * Configuration options for the importWorkerProxy.
 *
 * @interface ImportOptions
 * @property {boolean} [isBrowser] - Whether running in browser environment
 * @property {boolean} [isSharedWorker] - Whether to use SharedWorker instead of Worker
 * @property {boolean} [isPersistent] - Whether to keep worker alive across calls
 * @property {boolean} [executeImmediately] - Whether to run the function immediately or return a thunk
 * @property {string} [terminateKey] - Name of the method to terminate the worker
 * @property {WorkerType} [WorkerType] - The worker constructor to use
 * @property {URL|string} workerFile - The worker file to load
 * @property {WorkerOptions} [workerOptions] - Options for worker instantiation
 * @property {Function} workerPromise - Function that returns a promise for worker communication
 * @property {MessageOptions} [messageOptions] - Options for message handling
 */
interface ImportOptions {
    isBrowser?: boolean;
    isSharedWorker?: boolean;
    isPersistent?: boolean;
    executeImmediately?: boolean;
    terminateKey?: string;
    WorkerType?: WorkerType;
    workerFile: URL | string;
    workerOptions?: WorkerOptions;
    workerPromise: (worker: InstanceType<WorkerType>, message?: any, messageOptions?: MessageOptions) => Promise<any>;
    messageOptions?: MessageOptions;
}
/**
 * Message format for communicating with workers.
 *
 * @interface WorkerMessage
 * @property {string|URL} filename - The module file to import in the worker
 * @property {string} [method] - The method name to call in the module
 * @property {PropertyKey} [property] - The property to access in the module
 * @property {any[]} [args] - Arguments to pass to the method
 */
export interface WorkerMessage {
    filename: string | URL;
    method?: string;
    property?: PropertyKey;
    args?: any[];
}
/**
 * Interface for objects that can be terminated.
 *
 * @interface Terminable
 */
export interface Terminable {
    terminate(): void;
}
/**
 * Normalizes a filename into a string representation.
 *
 * @param {string|URL} f - The filename to normalize
 * @returns {string} The normalized filename
 */
export declare const normalizeFilename: (f: string | URL) => string;
/**
 * Creates a proxy to import and execute a module in a worker thread.
 *
 * This utility enables transparently executing code in a worker thread
 * with a similar API as if it were running in the main thread. It automatically
 * handles worker creation, message passing, and termination.
 *
 * @template T - The module type
 * @param {string|URL} filename - The module to import in the worker
 * @param {ImportOptions} options - Configuration options
 * @returns {Promise<DeferredPromisifyModule<T>>} A proxy of the module with all methods returning deferred promises
 *
 * @example
 * ```ts
 * // Create a lazy proxy to a math module running in a worker
 * const mathProxy = await importWorkerProxy<typeof MathModule>('./math.js', {
 *   executeImmediately: false,
 *   workerFile: './worker.js',
 *   workerPromise: myWorkerCommunication
 * });
 *
 * // Create a function that will run in the worker when called
 * const addInWorker = mathProxy.add(5, 10);
 *
 * // Execute the function in the worker
 * const result = await addInWorker();
 * console.log(result); // 15
 * ```
 */
export declare function importWorkerProxy<T>(filename: string | URL, options: {
    executeImmediately: false;
    isPersistent?: false;
} & ImportOptions): Promise<DeferredPromisifyModule<T>>;
/**
 * Creates a proxy to import and execute a module in a worker thread, with immediate execution.
 *
 * @template T - The module type
 * @param {string|URL} filename - The module to import in the worker
 * @param {ImportOptions} options - Configuration options with immediate execution
 * @returns {Promise<PromisifyModule<T>>} A proxy of the module with all methods returning promises
 *
 * @example
 * ```ts
 * // Create an immediate-execution proxy to a math module running in a worker
 * const mathProxy = await importWorkerProxy<typeof MathModule>('./math.js', {
 *   executeImmediately: true,
 *   workerFile: './worker.js',
 *   workerPromise: myWorkerCommunication
 * });
 *
 * // Execute the function directly in the worker
 * const result = await mathProxy.add(5, 10);
 * console.log(result); // 15
 * ```
 */
export declare function importWorkerProxy<T>(filename: string | URL, options: {
    executeImmediately: true;
    isPersistent?: false;
} & ImportOptions): Promise<PromisifyModule<T>>;
/**
 * Creates a proxy to import and execute a module in a persistent worker thread.
 *
 * @template T - The module type
 * @param {string|URL} filename - The module to import in the worker
 * @param {ImportOptions} options - Configuration options with immediate execution and persistence
 * @returns {Promise<PromisifyModule<T & Terminable>>} A proxy of the module with all methods returning promises and a terminate method
 *
 * @example
 * ```ts
 * // Create a persistent worker proxy to a math module
 * const mathProxy = await importWorkerProxy<typeof MathModule>('./math.js', {
 *   executeImmediately: true,
 *   isPersistent: true,
 *   workerFile: './worker.js',
 *   workerPromise: myWorkerCommunication
 * });
 *
 * // Execute multiple calls using the same worker
 * const result1 = await mathProxy.add(5, 10);
 * const result2 = await mathProxy.multiply(result1, 2);
 *
 * // Terminate the worker when done
 * mathProxy.terminate();
 * ```
 */
export declare function importWorkerProxy<T>(filename: string | URL, options: {
    executeImmediately: true;
    isPersistent: true;
} & ImportOptions): Promise<PromisifyModule<T & Terminable>>;
export {};
//# sourceMappingURL=importWorkerProxy.d.ts.map
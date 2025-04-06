/**
 * Function-based thread management for ThreadPool.
 *
 * This module provides a lightweight thread abstraction that works with simple JavaScript functions.
 * It wraps Node.js worker threads in a easy-to-use API that maintains consistent behavior with the
 * rest of the threadpool library while handling worker creation and communication automatically.
 *
 * Key features:
 * - Run functions in separate threads without manually creating workers
 * - Consistent API with status tracking for all function thread operations
 * - Simplified worker importing via proxy-based helper functions
 * - Promise-compatible interface for easy integration with async code
 *
 * @example
 * ```ts
 * import { FunctionPool, importWorker } from "@renderdev/threadpool/function";
 * import type * as mathModule from "./math.js";
 *
 * // Create a pool for running functions
 * const pool = new FunctionPool({ maxThreads: 4 });
 *
 * // Import a module to use in worker threads
 * const { fibonacci } = await importWorker<typeof mathModule>("./math.js");
 *
 * // Add computation tasks to the pool
 * for (let n = 35; n <= 45; n++) {
 *   pool.addTask(async () => {
 *     const result = await fibonacci(n);
 *     return { n, result };
 *   });
 * }
 *
 * // Get results as they complete
 * pool.on("message", (data) => {
 *   console.log(`Fibonacci(${data.n}) = ${data.result}`);
 * });
 * ```
 *
 * @module threadpool/function
 */
/**
 * Core status tracking types and classes
 *
 * These utilities provide foundational status tracking for thread and pool operations.
 */
export { Status, ThreadStatus } from './../thread-status.js';
export { TaskPool, StatusType, StatusAllField, round, type CountStatusResponse, type PercentStatusResponse, type RawStatus, type StatusCountType, type StatusField, type StatusRawType, type StatusResponse, } from './../pool-status.js';
/**
 * Function-based thread management (Node.js)
 *
 * These utilities enable working with functions in a thread-like manner in Node.js.
 */
export { FunctionThread } from './function-thread.js';
export { FunctionPool, type FunctionPoolOptions } from './function-pool.js';
export { importTaskWorker, importWorker, importPersistentWorker, setWorkerFile, getWorkerFile, } from './main-thread.js';
export {} from './worker-thread.js';
/**
 * Utility functions and types
 *
 * These provide support for worker proxying, event handling, and environment detection.
 */
export { importWorkerProxy, normalizeFilename, type DeferredPromisifyFunction, type DeferredPromisifyModule, type PromisifyFunction, type PromisifyModule, type WorkerType, type MessageOptions, type WorkerMessage, type Terminable, } from './../utils/importWorkerProxy.js';
export { exitEventSupported, exitKey, close } from './../utils/exitEventSupported.js';
export { asyncEventEmitter, type AsyncEventEmitter } from './../utils/asyncEventEmitter.js';
export { startProfilingCpu, stopProfilingCpu } from 'system-resource-monitor';
//# sourceMappingURL=index.d.ts.map
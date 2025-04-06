/**
 * ThreadPool - A unified API for managing tasks across Node.js workers and Web Workers.
 *
 * This library provides an abstraction layer over thread management in various JavaScript
 * environments, allowing consistent patterns for managing concurrent workloads.
 *
 * Key features:
 * - Common status tracking for all thread types
 * - Task pooling for efficient resource utilization
 * - Support for both Node.js worker_threads and Web Workers
 * - Function-based thread management for simpler APIs
 * - Promise-compatible API with full TypeScript support
 *
 * @example
 * ```ts
 * // Node.js example
 * import { FunctionPool, importPersistentWorker } from "@renderdev/threadpool";
 * import type * as mathType from "./math.ts";
 *
 * const pool = new FunctionPool();
 *
 * pool.addTask(async () => {
 *   const math = await importPersistentWorker<typeof mathType>("./math.ts");
 *   const result = await math.fib(42);
 *   math.terminate();
 *   return result;
 * }, "fibonacci-calculation");
 *
 * pool.then((data, thread) => {
 *   console.log(`Result: ${data}`);
 * });
 * ```
 *
 * @module threadpool
 */

/**
 * Core status tracking types and classes
 *
 * These utilities provide foundational status tracking for thread and pool operations.
 */
export { Status, ThreadStatus } from './thread-status.ts'
export {
	TaskPool,
	StatusType,
	StatusAllField,
	round,
	type CountStatusResponse,
	type PercentStatusResponse,
	type RawStatus,
	type StatusCountType,
	type StatusField,
	type StatusRawType,
	type StatusResponse,
} from './pool-status.ts'

/**
 * Node.js thread management
 *
 * These classes provide worker thread management for Node.js environments.
 */
export { WorkerThread } from './node/worker-thread.ts'
export { WorkerPool } from './node/worker-pool.ts'
export { Worker, type ThreadWorkerOptions } from './node/worker.ts'

/**
 * Function-based thread management (Node.js)
 *
 * These utilities enable working with functions in a thread-like manner in Node.js.
 */
export { FunctionThread } from './function/function-thread.ts'
export { FunctionPool, type FunctionPoolOptions } from './function/function-pool.ts'
export {
	importTaskWorker,
	importWorker,
	importPersistentWorker,
	setWorkerFile,
	getWorkerFile,
} from './function/main-thread.ts'

/**
 * Web-based thread management
 *
 * These utilities provide thread management for web browser environments.
 */
export { WebFunctionThread } from './web/function-thread.ts'
export { WebFunctionPool, type WebFunctionPoolOptions } from './web/function-pool.ts'
export {
	importTaskWebWorker,
	importWebWorker,
	importPersistentWebWorker,
	setWorkerUrl,
	getWorkerUrl,
	type WorkerOptions,
} from './web/main-thread.ts'

/**
 * Utility functions and types
 *
 * These provide support for worker proxying, event handling, and environment detection.
 */
export {
	importWorkerProxy,
	normalizeFilename,
	type DeferredPromisifyFunction,
	type DeferredPromisifyModule,
	type PromisifyFunction,
	type PromisifyModule,
	type WorkerType,
	type MessageOptions,
	type WorkerMessage,
	type Terminable,
} from './utils/importWorkerProxy.ts'
export { exitEventSupported, exitKey, close } from './utils/exitEventSupported.ts'
export { asyncEventEmitter, type AsyncEventEmitter } from './utils/asyncEventEmitter.ts'
export { startProfilingCpu, stopProfilingCpu } from 'system-resource-monitor'
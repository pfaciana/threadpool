/**
 * Core status tracking types and classes
 *
 * These utilities provide foundational status tracking for thread and pool operations.
 */
export { Status, ThreadStatus } from './../thread-status.ts'
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
} from './../pool-status.ts'

/**
 * Web-based thread management
 *
 * These utilities provide thread management for web browser environments.
 */
export { WebFunctionThread } from './function-thread.ts'
export { WebFunctionPool, type WebFunctionPoolOptions } from './function-pool.ts'
export {
	importTaskWebWorker,
	importWebWorker,
	importPersistentWebWorker,
	setWorkerUrl,
	getWorkerUrl,
	type WorkerOptions,
} from './main-thread.ts'

// Force JSR to build the JS version of this file
export {} from './worker-thread.ts'

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
} from './../utils/importWorkerProxy.ts'
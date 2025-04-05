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
 * Function-based thread management (Node.js)
 *
 * These utilities enable working with functions in a thread-like manner in Node.js.
 */
export { FunctionThread } from './function-thread.ts'
export { FunctionPool, type FunctionPoolOptions } from './function-pool.ts'
export {
	importTaskWorker,
	importWorker,
	importPersistentWorker,
	setWorkerFile,
	getWorkerFile,
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
export { exitEventSupported, exitKey, close } from './../utils/exitEventSupported.ts'
export { asyncEventEmitter, type AsyncEventEmitter } from './../utils/asyncEventEmitter.ts'
export { startProfilingCpu, stopProfilingCpu } from 'system-resource-monitor'
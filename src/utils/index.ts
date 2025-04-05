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
} from './importWorkerProxy.ts'
export { exitEventSupported, exitKey, close } from './exitEventSupported.ts'
export { asyncEventEmitter, type AsyncEventEmitter } from './asyncEventEmitter.ts'
export { startProfilingCpu, stopProfilingCpu } from 'system-resource-monitor'
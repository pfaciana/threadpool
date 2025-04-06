/**
 * Web Worker thread management for ThreadPool.
 *
 * This module provides thread management classes and utilities specifically designed
 * for browser environments using the Web Worker API. It enables running tasks in separate
 * threads within web browsers while maintaining a consistent API with the rest of the
 * threadpool library.
 *
 * Key features:
 * - Browser-compatible thread management with Web Workers
 * - Support for both regular and shared workers
 * - Consistent status tracking and event handling
 * - Function-based thread abstraction for simpler code
 * - Module importing in workers with proxy-based communication
 *
 * @example
 * ```ts
 * import { WebFunctionPool, importWebWorker } from "@renderdev/threadpool/web";
 * import type * as imageModule from "./image-processing.js";
 *
 * // Create a pool with 4 web workers
 * const pool = new WebFunctionPool({ maxThreads: 4 });
 *
 * // Import image processing module to use in workers
 * const { processImage } = await importWebWorker<typeof imageModule>("./image-processing.js");
 *
 * // Process multiple images in parallel
 * for (const imageData of imagesToProcess) {
 *   pool.addTask(async () => {
 *     return await processImage(imageData);
 *   });
 * }
 *
 * // Handle processed images
 * pool.on("message", (processedImage) => {
 *   displayImage(processedImage);
 * });
 * ```
 *
 * @module threadpool/web
 */

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
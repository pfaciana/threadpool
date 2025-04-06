/**
 * Utility functions for ThreadPool thread management.
 *
 * This module provides core utilities used across all thread management implementations
 * in ThreadPool. It includes worker proxying, event handling, environment detection, and
 * performance monitoring tools that form the foundation for both Node.js and browser
 * worker implementations.
 *
 * Key features:
 * - Worker module proxying for transparent cross-thread communication
 * - Async event handling with promise integration
 * - Environment detection for runtime compatibility
 * - Performance monitoring and profiling utilities
 * - Type definitions for cross-environment thread management
 *
 * @example
 * ```ts
 * import { importWorkerProxy, normalizeFilename } from "@renderdev/threadpool/utils";
 *
 * // Create a custom worker proxy
 * const mathProxy = await importWorkerProxy("./math.js", {
 *   executeImmediately: true,
 *   isPersistent: true,
 *   workerFile: "./my-custom-worker.js",
 *   workerPromise: myCustomCommunicationFunction
 * });
 *
 * // Use the proxied module
 * const result = await mathProxy.calculate(42);
 * ```
 *
 * @module threadpool/utils
 */
/**
 * Utility functions and types
 *
 * These provide support for worker proxying, event handling, and environment detection.
 */
export { importWorkerProxy, normalizeFilename, type DeferredPromisifyFunction, type DeferredPromisifyModule, type PromisifyFunction, type PromisifyModule, type WorkerType, type MessageOptions, type WorkerMessage, type Terminable, } from './importWorkerProxy.js';
export { exitEventSupported, exitKey, close } from './exitEventSupported.js';
export { asyncEventEmitter, type AsyncEventEmitter } from './asyncEventEmitter.js';
export { startProfilingCpu, stopProfilingCpu } from 'system-resource-monitor';
//# sourceMappingURL=index.d.ts.map
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
export { importWorkerProxy, normalizeFilename, } from './importWorkerProxy.ts';
export { exitEventSupported, exitKey, close } from './exitEventSupported.ts';
export { asyncEventEmitter } from './asyncEventEmitter.ts';
export { startProfilingCpu, stopProfilingCpu } from 'system-resource-monitor';

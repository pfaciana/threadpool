/**
 * Node.js worker thread management for ThreadPool.
 *
 * This module provides worker thread classes, pooling, and status tracking specifically
 * designed for Node.js environments. It includes both regular worker threads and function-based
 * worker abstractions.
 *
 * Key features:
 * - WorkerThread and WorkerPool implementations for Node.js
 * - Customizable thread options and error handling
 * - Status tracking via common status interfaces
 * - Type-safe proxying of worker module exports
 *
 * @example
 * ```ts
 * import { WorkerPool, Worker } from "@renderdev/threadpool/node";
 *
 * // Create a pool with 4 workers
 * const pool = new WorkerPool({ size: 4 });
 *
 * // Add a task that runs in a worker
 * pool.addWorker(new Worker("./task.js", {
 *   workerData: { input: "process this data" }
 * }));
 *
 * // Handle results
 * pool.on("message", (data, worker) => {
 *   console.log("Worker completed with:", data);
 * });
 * ```
 *
 * @module threadpool/node
 */
/**
 * Core status tracking types and classes
 *
 * These utilities provide foundational status tracking for thread and pool operations.
 */
export { Status, ThreadStatus } from './../thread-status.ts';
export { TaskPool, StatusType, StatusAllField, round, } from './../pool-status.ts';
/**
 * Node.js thread management
 *
 * These classes provide worker thread management for Node.js environments.
 */
export { WorkerThread } from './worker-thread.ts';
export { WorkerPool } from './worker-pool.ts';
export { Worker } from './worker.ts';
/**
 * Utility functions and types
 *
 * These provide support for worker proxying, event handling, and environment detection.
 */
export { importWorkerProxy, normalizeFilename, } from './../utils/importWorkerProxy.ts';
export { exitEventSupported, exitKey, close } from './../utils/exitEventSupported.ts';
export { asyncEventEmitter } from './../utils/asyncEventEmitter.ts';
export { startProfilingCpu, stopProfilingCpu } from 'system-resource-monitor';

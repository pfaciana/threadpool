/**
 * Utility functions and types
 *
 * These provide support for worker proxying, event handling, and environment detection.
 */
export { importWorkerProxy, normalizeFilename, } from './importWorkerProxy.ts';
export { exitEventSupported, exitKey, close } from './exitEventSupported.ts';
export { asyncEventEmitter } from './asyncEventEmitter.ts';
export { startProfilingCpu, stopProfilingCpu } from 'system-resource-monitor';

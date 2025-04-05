// @ts-nocheck
import { parentPort, workerData } from 'node:worker_threads'
import { close } from './../utils/exitEventSupported.ts'
import * as math from './math.ts'

/**
 * Simple test worker that runs math functions in a worker thread.
 * 
 * This worker expects workerData to contain:
 * - fn: The name of the math function to call
 * - args: An array of arguments to pass to the function
 * 
 * It executes the specified function from the math module with the provided arguments,
 * sends the result back via postMessage, and then safely closes the worker.
 * 
 * Used for testing basic worker functionality and cross-thread math operations.
 */
const { fn, args } = workerData
parentPort!.postMessage(math[fn](...args))
close(parentPort)

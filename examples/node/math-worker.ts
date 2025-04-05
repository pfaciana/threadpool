import { parentPort, workerData } from 'node:worker_threads'
import { close } from './../../src/index.ts'
import * as math from './../common/math.ts'

const { fn, args } = workerData
parentPort!.postMessage(math[fn](...args))
close(parentPort)

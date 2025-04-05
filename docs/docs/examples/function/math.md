---
sidebar_position: 1
title: Basic Worker
---

# Basic Example

This example demonstrates how to use the `FunctionPool` to execute CPU-intensive math operations concurrently, improving performance on multi-core systems.

## Code

```typescript
import { FunctionPool, importTaskWorker, StatusType } from '@renderdev/threadpool/function'
import type * as mathType from './math.ts'

const startTime = performance.now()

const pool = (new FunctionPool())
  .race((data, thread) => {
    console.log(`Finished First: ${thread.meta} = ${data}\n`)
  })
  .then((data, thread) => {
    console.log(thread.meta, Array.isArray(data) ? data.length : data)
  })
  .allSettled(() => {
    console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
    const endTime = performance.now()
    const elapsedTime = endTime - startTime
    console.log('\n\nScript runtime: ' + (Math.round(elapsedTime) / 1000) + ' sec')
  })

const filename = new URL('./math.ts', import.meta.url)
const { fib, findPrimesUpTo, estimatePi, tribonacci } = await importTaskWorker<typeof mathType>(filename)

pool.addTask(fib(42), 'fib(42)')
pool.addTask(tribonacci(32), 'tribonacci(32)')
pool.addTask(findPrimesUpTo(17000000), 'findPrimesUpTo(17000000)')
pool.addTask(estimatePi(25), 'estimatePi(25)')
```

## Output

```
Finished First: estimatePi(25) = 3.141592653589793

fib(42) 267914296
tribonacci(32) 45152016
findPrimesUpTo(17000000) 1091314
estimatePi(25) 3.141592653589793

DONE! 4


Script runtime: 5.421 sec
```

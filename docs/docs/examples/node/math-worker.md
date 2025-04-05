---
title: Basic Worker
---

# Basic Worker

This example demonstrates how to use the `WorkerPool` in a Node.js environment to execute CPU-intensive math operations concurrently.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="worker-pool-js" label="Main File" default>

```javascript
import { WorkerPool, StatusType } from '@renderdev/threadpool/node'

const startTime = performance.now()

const pool = (new WorkerPool(new URL('./worker-file.js', import.meta.url)))
  .race((data, thread) => {
    console.log(`Finished First: ${thread.meta} = ${data}\n`)
  })
  .then((data, thread) => {
    console.log(`*`, thread.meta, Array.isArray(data) ? data.length : data)
  })
  .allSettled(() => {
    console.log(`\nDONE! Completed: ${pool.status('completed', StatusType.COUNT)} Tasks.`)
    const endTime = performance.now()
    const elapsedTime = endTime - startTime
    console.log(`\n\nScript runtime: ${(Math.round(elapsedTime) / 1000)} sec\n`)
  })

// Enable exit event fallback for runtimes that have not fully implemented the Node's `worker_threads`
await pool.enableExitEventFallback()

pool.addTask({ fn: 'fib', args: [42] }, 'fib(42)')
pool.addTask({ fn: 'findPrimesUpTo', args: [17000000] }, 'findPrimesUpTo(17000000)')
pool.addTask({ fn: 'tribonacci', args: [32] }, 'tribonacci(32)')
pool.addTask({ fn: 'estimatePi', args: [25] }, 'estimatePi(25)')
```

:::info
We import from `@renderdev/threadpool/node` but the global `@renderdev/threadpool` will also work.
Throughout the documentation, you may see both the entry point specific import and the global import.
:::

  </TabItem>
  <TabItem value="worker-file-js" label="Worker File">

```typescript
import { parentPort, workerData } from 'node:worker_threads'
import { close } from '@renderdev/threadpool/node'
import * as math from './math.js' // See `Base Module` page for more info

const { fn, args } = workerData
parentPort.postMessage(math[fn](...args))
close(parentPort)
```

  </TabItem>
  <TabItem value="output" label="Output">

```
Finished First: estimatePi(25) = 3.141592653589793

* estimatePi(25) 3.141592653589793
* tribonacci(32) 45152016
* findPrimesUpTo(17000000) 1091314
* fib(42) 267914296

DONE! Completed: 4 Tasks.


Script runtime: 5.534 sec
```

:::note
Because these are threads, the order of completion may vary each time you run the script.
:::


  </TabItem>
</Tabs>

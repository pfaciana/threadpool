---
sidebar_position: 2
title: Multiple Workers
---

1# Multiple Workers

This example demonstrates how to use the `FunctionPool` to manage concurrent tasks with both `importTaskWorker` and `importWorker` approaches, showing the different ways to execute functions in worker threads.

## Code

```typescript
import { setTimeout } from 'node:timers'
import { URL } from 'node:url'
import { FunctionPool, importTaskWorker, importWorker, StatusType } from '@renderdev/threadpool/function'
import type * as mathType from './math.ts'

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const start = performance.now()

const pool = (new FunctionPool({ poolSize: 15 }))
  .allSettled(() => {
    const completed = pool.status('completed', StatusType.RAW)

    for (const thread of completed) {
      console.log(thread.message, thread.status.SUCCESS ? 'Success' : 'Error', thread.meta)
    }

    console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
    console.log('\n\nScript runtime: ' + (Math.round(performance.now() - start) / 1000) + ' sec\n\n')
  })

const filename = new URL('./math.ts', import.meta.url)
// Using importTaskWorker for pre-bound functions
const { add, fib, getState, state } = await importTaskWorker<typeof mathType>(filename)

pool.addTask(fib('42'), { meta: 1 }) // Intentional TS error to show IDEs can stil do type checking
pool.addTask(fib(42), { meta: 2 })
pool.addTask(fib(42), { meta: 3 })
pool.addTask(fib(42), { meta: 4 })
pool.addTask(fib(42), { meta: 5 })

// Using importWorker for function references
const { fib: fib2 } = await importWorker<typeof mathType>(filename)

pool.addTask(() => fib2('42'), { meta: 11 }) // Intentional TS error to show IDEs can stil do type checking
pool.addTask(() => fib2(42), { meta: 21 })
pool.addTask(() => fib2(42), { meta: 31 })
await delay(2000)
pool.addTask(() => fib2(42), { meta: 41 })
pool.addTask(() => fib2(42), { meta: 51 })
```

## Output

```
267914296 Success { meta: 1 }
267914296 Success { meta: 2 }
267914296 Success { meta: 3 }
267914296 Success { meta: 4 }
267914296 Success { meta: 5 }
267914296 Success { meta: 11 }
267914296 Success { meta: 21 }
267914296 Success { meta: 31 }

DONE! 8


Script runtime: 2.179 sec


267914296 Success { meta: 1 }
267914296 Success { meta: 2 }
267914296 Success { meta: 3 }
267914296 Success { meta: 4 }
267914296 Success { meta: 5 }
267914296 Success { meta: 11 }
267914296 Success { meta: 21 }
267914296 Success { meta: 31 }
267914296 Success { meta: 41 }
267914296 Success { meta: 51 }

DONE! 10


Script runtime: 4.222 sec
```

:::warning
The `await delay(2000)` used in this example, means the `FunctionPool` will run the `allSettled` callback (triggered from the emitted `complete` event) twice. This is because all tasks have completed and the pool is not aware future tasks will be added. Then when future tasks are added, and completed again, it will trigger the `allSettled` callback again.

This is by design because it allows for full customization. The example output looks this way because  `allSettled` was defined as soon as the `FuntionPool` was created. You can change the position `allSettled` is set OR use the `meta` property to customize this exactly how you want.
:::

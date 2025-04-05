---
sidebar_position: 3
title: Persistent Workers
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Basic Independent Workers

<Tabs>
  <TabItem value="typescript" label="TypeScript" default>

```typescript
import { FunctionPool, importPersistentWorker, StatusType } from '@renderdev/threadpool/function'
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

pool.addTask(async () => {
  const mathA = await importPersistentWorker<typeof mathType>(new URL('./math.ts', import.meta.url))
  const result = await mathA.fib(42)
  mathA.terminate()
  return result
}, 'fib(42)')

pool.addTask(async () => {
  const mathB = await importPersistentWorker<typeof mathType>(new URL('./math.ts', import.meta.url))
  const result = await mathB.findPrimesUpTo(17000000)
  mathB.terminate()
  return result
}, 'findPrimesUpTo(17000000)')

pool.addTask(async () => {
  const mathC = await importPersistentWorker<typeof mathType>(new URL('./math.ts', import.meta.url))
  const result = await mathC.tribonacci(32)
  mathC.terminate()
  return result
}, 'tribonacci(32)')

pool.addTask(async () => {
  const mathD = await importPersistentWorker<typeof mathType>(new URL('./math.ts', import.meta.url))
  const result = await mathD.estimatePi(25)
  mathD.terminate()
  return result
}, 'estimatePi(25)')
```

  </TabItem>
  <TabItem value="output" label="Output">

```
Finished First: estimatePi(25) = 3.141592653589793

fib(42) 267914296
tribonacci(32) 45152016
findPrimesUpTo(17000000) 1091314
estimatePi(25) 3.141592653589793

DONE! 4


Script runtime: 5.537 sec
```

  </TabItem>
</Tabs>

## Shared Worker Instances

<Tabs>
  <TabItem value="typescript" label="TypeScript" default>

```typescript
import { FunctionPool, importPersistentWorker, StatusType } from '@renderdev/threadpool/functions'
import type * as mathType from './math.ts'

const startTime = performance.now()

const mathB = await importPersistentWorker<typeof mathType>(new URL('./math.ts', import.meta.url))

const pool = (new FunctionPool())
  .race((data, thread) => {
    console.log(`Finished First: ${thread.meta} = ${Array.isArray(data) ? data.length : data}\n`)
  })
  .then((data, thread) => {
    console.log(thread.meta, Array.isArray(data) ? data.length : data)
    if (thread.meta === 'findPrimesUpTo(17000000)') {
      mathB.terminate()
    }
  })
  .allSettled(() => {
    console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
    const endTime = performance.now()
    const elapsedTime = endTime - startTime
    console.log('\n\nScript runtime: ' + (Math.round(elapsedTime) / 1000) + ' sec')
  })

pool.addTask(async () => {
  const mathA = await importPersistentWorker<typeof mathType>(new URL('./math.ts', import.meta.url))
  const result = await mathA.fib(42)
  // Do more stuff here
  mathA.terminate() // terminate to close the port when done
  return result
}, 'fib(42)')

pool.addTask(async () => {
  const result = await mathB.findPrimesUpTo(17000000)
  // Do more stuff here
  // We are leaving the port open for now, and closing it in the allSettled callback
  return result
}, 'findPrimesUpTo(17000000)')

pool.addTask(async () => {
  const mathC = await importPersistentWorker<typeof mathType>(new URL('./math.ts', import.meta.url))
  const result = await mathC.tribonacci(32)
  // Do more stuff here
  mathC.terminate() // terminate to close the port when done
  return result
}, 'tribonacci(32)')

const mathD = await importPersistentWorker<typeof mathType>(new URL('./math.ts', import.meta.url))
pool.addTask(async () => {
  const result1 = await mathD.estimatePi(25)
  const result2 = await mathD.estimatePi(25)
  // Do more stuff here
  return result1 + result2
}, 'estimatePi(25)').then((data) => {
  pool.addTask(async () => {
    const result3 = await mathD.estimatePi(25)
    mathD.terminate() // terminate to close the port when done
    return result3 + data
  }, 'estimatePi(25) #2')
})
```
  </TabItem>
  <TabItem value="output" label="Output">

```
Finished First: findPrimesUpTo(17000000) = 1091314

findPrimesUpTo(17000000) 1091314
tribonacci(32) 45152016
fib(42) 267914296
estimatePi(25) 6.283185307179574
estimatePi(25) #2 9.424777960769362

DONE! 5


Script runtime: 2.993 sec
```

  </TabItem>
</Tabs>

## Stateful Worker Chaining

<Tabs>
  <TabItem value="typescript" label="TypeScript" default>

```typescript
import { setTimeout } from 'node:timers'
import { importPersistentWorker, FunctionPool, StatusType } from '@renderdev/threadpool/function'
import type * as mathType from './math.ts'

const start = performance.now()

const pool = (new FunctionPool({ poolSize: 3 }))
  .allSettled(() => {
    const completed = pool.status('completed', StatusType.RAW)

    for (const thread of completed) {
      console.log(thread.message, thread.status.SUCCESS ? 'Success' : 'Error', thread.meta)
    }

    console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
    console.log('\n\nScript runtime: ' + (Math.round(performance.now() - start) / 1000) + ' sec\n\n')
  })

console.log('Available Thread: ', pool.hasAvailableThread() ? 'Yes' : 'No')

pool.addTask(async () => {
  const math = await importPersistentWorker<typeof mathType>(new URL('./math.ts', import.meta.url))
  console.log('A: getState(): ', await math.state())
  console.log('A: add(1, 2): ', await math.add(1, 2))
  console.log('A: getState(1, 2): ', await math.state())
  console.log('A: add(3, 4): ', await math.add(3, 4))
  console.log('A: getState(3, 4): ', await math.state())
  console.log('A: fib(): ', await math.fib(42))
  math.terminate()
  console.log(pool.status('completed', StatusType.PERCENT), `%`)
  return 'Done A!'
}, { meta: 1 })

const mathB = await importPersistentWorker<typeof mathType>(new URL('./math.ts', import.meta.url))
pool.addTask(async () => {
  console.log('B: getState(): ', await mathB.state())
  console.log('B: add(5, 6): ', await mathB.add(5, 6))
  console.log('B: getState(5, 6): ', await mathB.state())
  console.log('B: add(7, 8): ', await mathB.add(7, 8))
  console.log('B: getState(7, 8): ', await mathB.state())
  console.log('B: fib(): ', await mathB.fib(41))
  console.log(pool.status('completed', StatusType.PERCENT), `%`)
  return 'Done B!'
}).on('exit', () => {
  pool.addTask(async () => {
    console.log('B2: getState(): ', await mathB.state())
    console.log('B2: add(15, 16): ', await mathB.add(15, 16))
    console.log('B2: getState(15, 16): ', await mathB.state())
    console.log('B2: add(17, 18): ', await mathB.add(17, 18))
    console.log('B2: getState(17, 18): ', await mathB.state())
    console.log('B2: fib(): ', await mathB.fib(39))
    mathB.terminate()
    console.log(pool.status('completed', StatusType.PERCENT), `%`)
    return 'Done B2!'
  })
})

pool.addTask(async () => {
  const math = await importPersistentWorker<typeof mathType>(new URL('./math.ts', import.meta.url))
  console.log('C: getState(): ', await math.state())
  console.log('C: add(9, 10): ', await math.add(9, 10))
  console.log('C: getState(9, 10): ', await math.state())
  console.log('C: add(11, 12): ', await math.add(11, 12))
  console.log('C: getState(11, 12): ', await math.state())
  console.log('C: fib(): ', await math.fib(40))
  math.terminate()
  console.log(pool.status('completed', StatusType.PERCENT), `%`)
  return 'Done C!'
})

console.log('Available Thread: ', pool.hasAvailableThread() ? 'Yes' : 'No')

setTimeout(() => {
  pool.addTask(async () => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const math = await importPersistentWorker<typeof mathType>(new URL('./math.ts', import.meta.url))
        console.log('C2: getState(): ', await math.state())
        console.log('C2: add(19, 110): ', await math.add(19, 110))
        console.log('C2: getState(19, 110): ', await math.state())
        console.log('C2: add(111, 112): ', await math.add(111, 112))
        console.log('C2: getState(111, 112): ', await math.state())
        console.log('C2: fib(): ', await math.fib(40))
        math.terminate()
        console.log(pool.status('completed', StatusType.PERCENT), `%`)
        resolve('Done C2!')
      }, 2000)
    })
  })
}, 2000)
```

  </TabItem>
  <TabItem value="output" label="Output">

```
Available Thread:  Yes
Available Thread:  No
B: getState():  0
B: add(5, 6):  11
B: getState(5, 6):  1
B: add(7, 8):  15
B: getState(7, 8):  2
A: getState():  0
A: add(1, 2):  3
A: getState(1, 2):  1
A: add(3, 4):  7
A: getState(3, 4):  2
C: getState():  0
C: add(9, 10):  19
C: getState(9, 10):  1
C: add(11, 12):  23
C: getState(11, 12):  2
C: fib():  102334155
0 %
B: fib():  165580141
33.333 %
B2: getState():  2
B2: add(15, 16):  31
B2: getState(15, 16):  3
B2: add(17, 18):  35
B2: getState(17, 18):  4
B2: fib():  63245986
50 %
A: fib():  267914296
75 %
Done C! Success undefined
Done B! Success undefined
Done B2! Success undefined
Done A! Success { meta: 1 }

DONE! 4


Script runtime: 1.842 sec


C2: getState():  0
C2: add(19, 110):  129
C2: getState(19, 110):  1
C2: add(111, 112):  223
C2: getState(111, 112):  2
C2: fib():  102334155
80 %
Done C! Success undefined
Done B! Success undefined
Done B2! Success undefined
Done A! Success { meta: 1 }
Done C2! Success undefined

DONE! 5


Script runtime: 4.76 sec
```

  </TabItem>
</Tabs>

---
sidebar_position: 3
sidebar_label: "Web Workers"
---

# Web Worker Examples

This section demonstrates how to use `@renderdev/threadpool` in web browser environments. These examples showcase how to leverage ThreadPool's API for both dedicated and shared Web Workers.

## Reference Files

The following code examples will build upon these files.

<Tabs groupId="common-files">
  <TabItem value="html" label="HTML Setup">

```html
<!doctype html>
<html>
<head>
  <title>Web Workers</title>
  <script src="thread-pool.js" type="module" defer></script>
</head>
<body>
  <h1>Browser Web Workers Example</h1>
</body>
</html>
```

  </TabItem>
  <TabItem value="base" label="Import Module">

A series of CPU intensive math functions and a state counter for persistent workers.

:::info
Code for this module can be found in the [Base Module](../math-module.md) documentation page.

It is the same Base Module we use throughout all the examples.
:::

  </TabItem>
</Tabs>

## Dedicated Web Workers

Dedicated Web Workers are the most common type of web worker, providing an isolated thread for executing JavaScript that's tied to a single context.

### Basic Dedicated Workers

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="ts" label="TypeScript" default>

```typescript
import { StatusType, WebFunctionPool, importWebWorker, importTaskWebWorker } from '@renderdev/threadpool/web'
import type * as mathType from './math.ts'

const start = performance.now()

console.log(`Number of Treads: ${navigator.hardwareConcurrency}`)
console.log(`Starting...\n`)

const pool = (new WebFunctionPool())
  .allSettled(() => {
    const completed = pool.status('completed', StatusType.RAW)

    for (const thread of completed) {
      console.log(thread.message, thread.status.SUCCESS ? 'Success' : 'Error', thread.meta)
    }

    console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
    console.log('\n\nScript runtime: ' + (Math.round(performance.now() - start) / 1000) + ' sec\n\n')
  })

const filename = new URL('./math.js', import.meta.url)
const { add, getState } = await importWebWorker<typeof mathType>(filename)
const { fib, state } = await importTaskWebWorker<typeof mathType>(filename)

let threads = Array.from({ length: 10 })
for (const i in threads) {
  pool.addTask(fib(42), +i + 1)
}
pool.addTask(() => getState(), 11)
pool.addTask(() => add(1, 2), 12)
pool.addTask(() => getState(), 13)
pool.addTask(() => add(34, 56), 14)
pool.addTask(() => getState(), 15)
pool.addTask(state(), 16)
```

</TabItem>
<TabItem value="output" label="Output">

```
Number of Treads: 16
Starting...

267914296 'Success' 1
267914296 'Success' 5
267914296 'Success' 3
267914296 'Success' 6
267914296 'Success' 2
267914296 'Success' 7
267914296 'Success' 4
0 'Success' 11
3 'Success' 12
0 'Success' 13
90 'Success' 14
0 'Success' 16
0 'Success' 15
267914296 'Success' 9
267914296 'Success' 10
267914296 'Success' 8

DONE! 16

Script runtime: 1.919 sec
```

</TabItem>
</Tabs>

:::tip
This code highlights the difference between `importWebWorker` and `importTaskWebWorker`.
They do the same thing, except `importTaskWebWorker` will "promisify" the callback.
This allows us to directly pass the response as a task for a `WebFunctionPool`.
In other words, its syntactic sugar to make the code easier to write and read when dealing with tasks.

Type checking will still work in both instances.
:::

### Persistent Dedicated Workers

You can create multiple persistent dedicated workers and use them in parallel:

<Tabs>
<TabItem value="ts" label="TypeScript" default>

```typescript
import { StatusType, WebFunctionPool, importPersistentWebWorker } from '@renderdev/threadpool/web'
import type * as mathType from './math.ts'

const start = performance.now()

console.log(`Number of Treads: ${navigator.hardwareConcurrency}`)
console.log(`Starting...\n`)

const filename = new URL('./math.js', import.meta.url)

const mathB = await importPersistentWebWorker<typeof mathType>(filename)

const pool = new WebFunctionPool()
pool.allSettled(() => {
  const completed = pool.status('completed', StatusType.RAW)
  for (const thread of completed) {
    console.log(thread.message, thread.status.SUCCESS ? 'Success' : 'Error', thread.meta)
    if (thread.meta === 'B2') {
      mathB.terminate()
    }
  }

  console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
  console.log('\n\nScript runtime: ' + (Math.round(performance.now() - start) / 1000) + ' sec\n\n')
})

pool.addTask(async () => {
  const math = await importPersistentWebWorker<typeof mathType>(filename)
  console.log('A: getState(): ', await math.state())
  console.log('A: add(1, 2): ', await math.add(1, 2))
  console.log('A: getState(1, 2): ', await math.state())
  console.log('A: add(3, 4): ', await math.add(3, 4))
  console.log('A: getState(3, 4): ', await math.state())
  console.log('A: fib(): ', await math.fib(42))
  math.terminate()
  return 'Done A!'
}, 'A')

pool.addTask(async () => {
  console.log('B: getState(): ', await mathB.state())
  console.log('B: add(5, 6): ', await mathB.add(5, 6))
  console.log('B: getState(5, 6): ', await mathB.state())
  console.log('B: add(7, 8): ', await mathB.add(7, 8))
  console.log('B: getState(7, 8): ', await mathB.state())
  console.log('B: fib(): ', await mathB.fib(41))
  return 'Done B!'
}, 'B')

pool.addTask(async () => {
  const math = await importPersistentWebWorker<typeof mathType>(filename)
  console.log('C: getState(): ', await math.state())
  console.log('C: add(9, 10): ', await math.add(9, 10))
  console.log('C: getState(9, 10): ', await math.state())
  console.log('C: add(11, 12): ', await math.add(11, 12))
  console.log('C: getState(11, 12): ', await math.state())
  console.log('C: fib(): ', await math.fib(40))
  math.terminate()
  return 'Done C!'
}, 'C')

setTimeout(() => {
  pool.addTask(async () => {
    console.log('B2: getState(): ', await mathB.state())
    console.log('B2: add(5, 6): ', await mathB.add(5, 6))
    console.log('B2: getState(5, 6): ', await mathB.state())
    console.log('B2: add(7, 8): ', await mathB.add(7, 8))
    console.log('B2: getState(7, 8): ', await mathB.state())
    console.log('B2: fib(): ', await mathB.fib(41))
    return 'Done B2!'
  }, 'B2')
}, 2000)
```

</TabItem>
<TabItem value="output" label="Output">

```
Number of Treads: 16
Starting...

B: getState():  0
A: getState():  0
B: add(5, 6):  11
A: add(1, 2):  3
B: getState(5, 6):  1
A: getState(1, 2):  1
B: add(7, 8):  15
A: add(3, 4):  7
B: getState(7, 8):  2
A: getState(3, 4):  2
C: getState():  0
C: add(9, 10):  19
C: getState(9, 10):  1
C: add(11, 12):  23
C: getState(11, 12):  2
C: fib():  102334155
B: fib():  165580141
A: fib():  267914296
Done C! Success C
Done B! Success B
Done A! Success A

DONE! 3

Script runtime: 1.997 sec

B2: getState():  2
B2: add(5, 6):  11
B2: getState(5, 6):  3
B2: add(7, 8):  15
B2: getState(7, 8):  4
B2: fib():  165580141
Done C! Success C
Done B! Success B
Done A! Success A
Done B2! Success B2

DONE! 4

Script runtime: 3.166 sec
```

</TabItem>
</Tabs>

## Using Shared Web Workers

Shared Web Workers can be accessed from multiple browser contexts like windows, tabs, or iframes, allowing for communication between different parts of your application.

### Basic Shared Workers Example

<Tabs>
<TabItem value="ts" label="TypeScript" default>

```typescript
import { StatusType, WebFunctionPool, importWebWorker, importTaskWebWorker } from '@renderdev/threadpool/web'
import type * as mathType from './math.ts'

const start = performance.now()

console.log(`Number of Treads: ${navigator.hardwareConcurrency}`)
console.log(`Starting...\n`)

const filename = new URL('./math.js', import.meta.url)
const WorkerOptions = { type: 'module', credentials: 'same-origin' }

const pool = new WebFunctionPool()
pool.allSettled(() => {
  const completed = pool.status('completed', StatusType.RAW)

  for (const thread of completed) {
    console.log(thread.message, thread.status.SUCCESS ? 'Success' : 'Error', thread.meta)
  }

  console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
  console.log('\n\nScript runtime: ' + (Math.round(performance.now() - start) / 1000) + ' sec\n\n')
})

const { add, getState } = await importWebWorker<typeof mathType>(filename)
const { fib, state } = await importTaskWebWorker<typeof mathType>(filename)

let threads = Array.from({ length: 10 })
for (const i in threads) {
  pool.addTask(fib(42), +i + 1)
}
pool.addTask(() => getState(), 11)
pool.addTask(() => add(1, 2), 12)
pool.addTask(() => getState(), 13)
pool.addTask(() => add(34, 56), 14)
pool.addTask(() => getState(), 15)
pool.addTask(state(), 16)
```

:::tip
This code highlights the difference between `importWebWorker` and `importTaskWebWorker`.
They do the same thing, except `importTaskWebWorker` will "promisify" the callback.
This allows us to directly pass the response as a task for a `WebFunctionPool`.
In other words, its syntactic sugar to make the code easier to write and read when dealing with tasks.

Type checking will still work in both instances.
:::

</TabItem>
<TabItem value="output-1" label="Output Tab #1">

```
Number of Treads: 16
Starting...

267914296 'Success' 3
267914296 'Success' 5
267914296 'Success' 4
267914296 'Success' 1
267914296 'Success' 6
267914296 'Success' 7
267914296 'Success' 2
0 'Success' 15
0 'Success' 11
3 'Success' 12
1 'Success' 13
90 'Success' 14
2 'Success' 16
267914296 'Success' 8
267914296 'Success' 10
267914296 'Success' 9

DONE! 16

Script runtime: 3.768 sec
```

</TabItem>
<TabItem value="output-2" label="Output Tab #2">

```
Number of Treads: 16
Starting...

267914296 'Success' 5
267914296 'Success' 3
267914296 'Success' 10
267914296 'Success' 8
267914296 'Success' 2
267914296 'Success' 4
267914296 'Success' 9
0 'Success' 11
0 'Success' 15
3 'Success' 12
267914296 'Success' 6
3 'Success' 13
267914296 'Success' 7
90 'Success' 14
4 'Success' 16
267914296 'Success' 1

DONE! 16

Script runtime: 3.768 sec
```

</TabItem>
</Tabs>

:::warning
Shared Web Workers are not supported in all browsers. Make sure to check compatibility or provide a fallback to dedicated workers.
:::

### Persistent Shared Web Workers

For scenarios where you want to maintain shared state across multiple browser contexts:

<Tabs>
<TabItem value="ts" label="TypeScript" default>

```typescript
import { StatusType, WebFunctionPool, importPersistentWebWorker } from '@renderdev/threadpool/web'
import type * as mathType from './math.ts'

const start = performance.now()

console.log(`Number of Treads: ${navigator.hardwareConcurrency}`)
console.log(`Starting...\n`)

const filename = new URL('./math.js', import.meta.url)
const WorkerOptions = { type: 'module', credentials: 'same-origin' }

const mathB = await importPersistentWebWorker<typeof mathType>(filename, WorkerOptions, { WorkerType: SharedWorker })

const pool = new WebFunctionPool()
pool.allSettled(() => {
  const completed = pool.status('completed', StatusType.RAW)
  for (const thread of completed) {
    console.log(thread.message, thread.status.SUCCESS ? 'Success' : 'Error', thread.meta)
    if (thread.meta === 'B2') {
      mathB.terminate()
    }
  }

  console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
  console.log('\n\nScript runtime: ' + (Math.round(performance.now() - start) / 1000) + ' sec\n\n')
})

pool.addTask(async () => {
  const math = await importPersistentWebWorker<typeof mathType>(filename, WorkerOptions, { WorkerType: SharedWorker })
  console.log('A: getState(): ', await math.state())
  console.log('A: add(1, 2): ', await math.add(1, 2))
  console.log('A: getState(1, 2): ', await math.state())
  console.log('A: add(3, 4): ', await math.add(3, 4))
  console.log('A: getState(3, 4): ', await math.state())
  console.log('A: fib(): ', await math.fib(42))
  math.terminate()
  return 'Done A!'
}, 'A')

pool.addTask(async () => {
  console.log('B: getState(): ', await mathB.state())
  console.log('B: add(5, 6): ', await mathB.add(5, 6))
  console.log('B: getState(5, 6): ', await mathB.state())
  console.log('B: add(7, 8): ', await mathB.add(7, 8))
  console.log('B: getState(7, 8): ', await mathB.state())
  console.log('B: fib(): ', await mathB.fib(41))
  return 'Done B!'
}, 'B')

pool.addTask(async () => {
  const math = await importPersistentWebWorker<typeof mathType>(filename, WorkerOptions, { WorkerType: SharedWorker })
  console.log('C: getState(): ', await math.state())
  console.log('C: add(9, 10): ', await math.add(9, 10))
  console.log('C: getState(9, 10): ', await math.state())
  console.log('C: add(11, 12): ', await math.add(11, 12))
  console.log('C: getState(11, 12): ', await math.state())
  console.log('C: fib(): ', await math.fib(40))
  math.terminate()
  return 'Done C!'
}, 'C')

setTimeout(() => {
  pool.addTask(async () => {
    console.log('B2: getState(): ', await mathB.state())
    console.log('B2: add(5, 6): ', await mathB.add(5, 6))
    console.log('B2: getState(5, 6): ', await mathB.state())
    console.log('B2: add(7, 8): ', await mathB.add(7, 8))
    console.log('B2: getState(7, 8): ', await mathB.state())
    console.log('B2: fib(): ', await mathB.fib(41))
    return 'Done B2!'
  }, 'B2')
}, 4000)
```

</TabItem>
<TabItem value="output-1" label="Output Tab #1">

```
Number of Treads: 16
Starting...

C: getState():  0
B: getState():  0
A: getState():  0
C: add(9, 10):  19
B: add(5, 6):  11
A: add(1, 2):  3
C: getState(9, 10):  3
B: getState(5, 6):  3
A: getState(1, 2):  3
C: add(11, 12):  23
B: add(7, 8):  15
A: add(3, 4):  7
C: getState(11, 12):  6
B: getState(7, 8):  6
A: getState(3, 4):  6
C: fib():  102334155
B: fib():  165580141
A: fib():  267914296
Done C! Success C
Done B! Success B
Done A! Success A

DONE! 3

Script runtime: 3.526 sec

B2: getState():  6
B2: add(5, 6):  11
B2: getState(5, 6):  7
B2: add(7, 8):  15
B2: getState(7, 8):  8
B2: fib():  165580141
Done C! Success C
Done B! Success B
Done A! Success A
Done B2! Success B2

DONE! 4

Script runtime: 5.112 sec
```

</TabItem>
<TabItem value="output-2" label="Output Tab #2">

```
Number of Treads: 16
Starting...

C: getState():  8
B: getState():  8
A: getState():  8
C: add(9, 10):  19
C: getState(9, 10):  9
B: add(5, 6):  11
B: getState(5, 6):  10
A: getState(1, 2):  10
A: add(1, 2):  3
C: add(11, 12):  23
B: add(7, 8):  15
A: add(3, 4):  7
C: getState(11, 12):  14
B: getState(7, 8):  14
A: getState(3, 4):  14
C: fib():  102334155
B: fib():  165580141
A: fib():  267914296
Done A! Success A
Done C! Success C
Done B! Success B

DONE! 3

Script runtime: 3.578 sec

B2: getState():  14
B2: add(5, 6):  11
B2: getState(5, 6):  15
B2: add(7, 8):  15
B2: getState(7, 8):  16
B2: fib():  165580141
Done B! Success B
Done A! Success A
Done C! Success C
Done B2! Success B2

DONE! 4

Script runtime: 5.124 sec
```

</TabItem>
</Tabs>

:::info
With Shared Web Workers, the state is shared across all connections. When one task updates the state, all other connections will see the updated value.
:::

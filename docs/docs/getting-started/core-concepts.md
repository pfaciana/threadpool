---
sidebar_position: 3
sidebar_label: Core Concepts
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Core Concepts

The sole purpose of this library is to make working with Node and Web Workers simpler and remove boilerplate code for common tasks.
Because Workers are, by nature, multi-threaded, we want a way to manage the code so it's non-blocking.
A thread (or task) "pool" allows us to add worker threads without blocking the main thread.
Then emitting events at different stages of the worker lifecycle is how we can take action in a non-blocking manner.
That is the core concept of this library.

## Terms

At a high level, we'll use the terms `worker`, `thread` and `task` to mean roughly the same thing, albeit in slightly different contexts.
A quick summary on the basic difference:

* A `worker` will tend to refer to a node (or web) worker instance
* A `thread` will be our custom abstraction of a worker, with some added extras
* A `task` is a `thread` (or a series of related `thread`s) within a `pool`
  * Most of the time, a `task` will only have one `thread`, and because of that, we'll have some syntactic sugar to reduce user code

And finally for completeness, a `pool` is just a collection of `task`s

## Concepts

You can get both the status of a `pool` or a `thread`.

* A `thread` status is just its state (i.e. `ACTIVE`, `ERROR`, `COMPLETED`, etc.)
* A `pool` status is determined by the `tasks` within it, grouped by properties like `queued`, `active`, `remaining`, etc.
  * Remember a `task` can have multiple `thread`s, so a `task` can be `active` if at least one `thread` within it has started, but all `threads` within it are not finished, etc.

So, this is basically how you'll interact with the library.

* Create a `pool`
* Import a `worker` script OR a TypeScript/Javascript module as a `worker` (more on this later)
  * NOTE: This library automatically converts the `worker` into a `thread` for you
* Create a series of `task`s using those `thread`s
* Add those `task`s to the `pool`
* Add event listeners to the `pool` to handle the `thread` lifecycle

## Traditional Worker vs Worker Functions

Originally this library was designed to create a pool for traditional node workers. However, after working with Go, I really like go routines and wanted to implement something similar to that in TypeScript/JavaScript. Obviously, JavaScript does not allow that type of implementation, but my goal was to have regular functions run on their own thread will very little effort. This will get explained later, but the purpose here is to introduce the two styles of "workers" this library supports.

* A "traditional" worker looks and acts like a Node worker (because it is under the hood)
* A worker "function" is a go-like go routine that turns a function into a worker

These go routine like "functions" are available both on the server (Node/Bun/Deno) and in the browser.
If you see the terms "web" or "browser" that is talking about worker functions in the browser.
If you see the term "function" outside the context of "web" or "browser" that is talking about worker functions on the server. Otherwise, if you just see "worker" outside the context of a worker "function", we are talking about "traditional" workers.

### Traditional Worker

In its simplest form, here is how you would create a traditional worker:

```typescript
import { WorkerPool } from '@renderdev/threadpool/node'

// Create a pool and import the worker script
const filename = new URL('./some-node-worker.ts', import.meta.url)
const pool = new WorkerPool(filename)

// Listen for when all the tasks are completed
pool.allSettled(threads => console.log(`All ${threads.length} tasks completed`))

// Create tasks by passing `workerData` to the worker 
pool.addTask({ action: 'fibonacci', number: 42 })
// ...some more tasks
pool.addTask({ action: 'tribonacci', number: 32 })
```

:::note
There are a lot more configurations and customizations you can do. This is just to get you started.
:::

### Server Worker Function

```typescript
import { FunctionPool, importTaskWorker } from '@renderdev/threadpool/function'

// Import the types. Optional, but this gives us type checking
import type * as mathType from './math.ts'
// Convert any module into a worker function (with type checking)
const filename = new URL('./math.ts', import.meta.url)
const { fibonacci, tribonacci } = await importTaskWorker<typeof mathType>(filename)

// Create a pool
const pool = new FunctionPool()

// Listen for when all the tasks are completed
pool.allSettled(threads => console.log(`All ${threads.length} tasks completed`))

// Create tasks by converting the imported functions into threads that act as tasks
pool.addTask(fibonacci('42')) // Uh-oh! TS: fibonacci expects a number
// ...some more tasks
pool.addTask(tribonacci(32))
```

:::note
Your IDE will catch `pool.addTask(fibonacci('42'))` as a TS error because 42 should be a number, not a string
:::

### Web Worker Function

```typescript
import { WebFunctionPool, importTaskWebWorker } from '@renderdev/threadpool/web'

// Import the types. Optional, but this gives us type checking
import type * as mathType from './math.ts'
// Convert any module into a worker function (with type checking)
const filename = new URL('./math.ts', import.meta.url)
const { fibonacci, tribonacci } = await importTaskWebWorker<typeof mathType>(filename)

// Create a pool
const pool = new WebFunctionPool()

// Listen for when all the tasks are completed
pool.allSettled(threads => console.log(`All ${threads.length} tasks completed`))

// Create tasks by converting the imported functions into threads that act as tasks
pool.addTask(fibonacci('42')) // Uh-oh! TS: fibonacci expects a number
// ...some more tasks
pool.addTask(tribonacci(32))
```

:::tip
The Pool API, whether for "traditional" workers on the server, "function" workers on the server or "function" workers in the browser, is designed to be consistent.
:::

### Common APIs

You've probably noticed the code for all three worker pools are very similar. Here are some common API methods they all share.

:::note
We'll use the `WorkerPool` for this example, but these methods are the same for `FunctionPool` and `WebFunctionPool`
:::

#### Adding Tasks

```typescript
const pool = new WorkerPool()
pool.addTask({ action: 'fibonacci', number: 42 }) // For traditional workers
pool.addTask(async () => await someThreadOrThreadsToRun()) // For worker functions (no syntactic sugar)
pool.addTask(someThreadOrThreadsToRun()) // For worker functions (with syntactic sugar)
````

#### Events

You can certainly listen for events, but most of the time you'll use the handy callback listeners because they are a little more powerful.
I'm adding this section first because the callback listeners are derived from these events.

```typescript
const pool = new WorkerPool()
pool.on('worker.init', (thread) => {
  // When any worker thread is initialized and starts execution.
})
pool.on('worker.status', (status, newState, oldState, thread) => {
  // When any worker thread's status changes.
})
pool.on('worker.message', (data, thread) => {
  // When any worker thread completes successfully with a result.
})
pool.on('worker.messageerror', (error, thread) => {
  // When any worker thread's promise rejects with an error.
})
pool.on('worker.error', (error, thread) => {
  // When any worker thread throws an error directly during execution.
})
pool.on('worker.exit', (exitCode, thread) => {
  // When any worker thread completes execution (either success or error).
})
pool.on('complete', (exitCode, thread) => {
  // When all tasks in the pool have completed.
})
```

#### Callback Listeners

This is how you will listen for events most of the time.

```typescript
const pool = new WorkerPool()

// Listen for when something happens at a task level
pool.then((value: any, thread: WorkerThread) => {
  // on 'worker.message'
})
pool.catch((error: any, type: 'error' | 'messageerror', thread: WorkerThread) => {
  // on 'worker.error' OR 'worker.messageerror'
})
pool.finally((exitCode: any, thread: WorkerThread) => {
  // on 'worker.exit'
})

// Listen for when something happens at a pool level
pool.allSettled((threads: WorkerThread[]) => {
  // on 'complete'
})
pool.all((threads: WorkerThread[]) => {
  // on 'complete' OR first 'worker.error' OR first 'worker.messageerror'
})
pool.any((threads: WorkerThread[]) => {
  // on first 'worker.message' OR 'complete' when all threads failed
})
pool.race((threads: WorkerThread[]) => {
  // on first 'worker.message' OR first 'worker.error' OR first 'worker.messageerror'
})
```

:::info
If you've ever worked with JavaScript Promises, then these methods will look very familiar to you.

This is how these method names were chosen.
:::

#### State Methods

For getting the current state of a pool at any time

```typescript
const pool = new WorkerPool()
pool.isCompleted() as boolean
pool.hasAvailableThread() as boolean
pool.status(infoToGet, returnType) as returnType // Read docs for more info
```

## Ways to make Traditional Workers

Making a traditional worker is very straightforward.
You probably guessed by looking at the example code that the signature is the same for a standard node worker, and you'd be right!
However, there is one concept that may have been missed just by looking at the examples above.
It is actually just the *default* configuration for subsequent workers. You can override this to allow for different worker threads all in the same pool. You can even set an empty string as the default worker, if you don't want it defined.

```typescript
import { WorkerPool } from '@renderdev/threadpool/node'

// shorthand
const pool = new WorkerPool('./some-worker-file.ts', { env: process.env })
const fib = pool.addTask({ action: 'fibonacci', number: 42 })
fib.then(value => console.log(value)).catch(error => console.error(error))

// override the default worker
const poolNoDefault = new WorkerPool(``, {})
const trib = poolNoDefault.addWorker('./some-other-worker-file.js', {
  workerData: { action: 'tribonacci', number: 32 },
})
trib.then(value => console.log(value)).catch(error => console.error(error))
```

:::warning
The `addTask` method automatically inherits the default worker, and you pass the `workerData` as the only argument.

If you do decide to set an empty string as the default worker, then you can never use the `addTask` method.
That's because, in that case, there is no worker to inherit.
:::

#### enableExitEventFallback

A quick note on the `enableExitEventFallback` method. At the time of this writing `Bun` and `Deno` are still implementing full support for Node Worker Threads. This library is designed to work on all major JavaScript runtimes that support Node Worker Threads, including `Bun` and `Deno`. However they may implement features a little differently. So `enableExitEventFallback` is an option to help keep those runtimes working consistently. This is an optional configuration, and I find currently `Deno` is the most likely to need this. If you notice your connections are not closing properly, try setting this flag to `true`.

```typescript
import { WorkerPool } from '@renderdev/threadpool/node'

const pool = new WorkerPool('./some-worker-file.ts')
await pool.enableExitEventFallback() // automatically detects if this is needed
await pool.enableExitEventFallback(true) // force the fallback on
await pool.enableExitEventFallback(false) // force the fallback off (this is the default)
```

:::warning
While allowing `enableExitEventFallback` to automatically detect if the fallback is needed may sound good, there is a performance hit. So I would not recommend automatic detection, unless you are having issues otherwise.

If you want to be safe, force it on with `await pool.enableExitEventFallback(true)`. There is no performance hit this way.

If you know you're only working in Node, then you may want to ignore calling `enableExitEventFallback`.
:::

## Ways to make Worker Functions

The way we can convert a function into a worker automatically is by telling the pool how to import it. Then we can pass those instructions on to the worker file side of things. So the only real requirement is that the function we want to convert must be exported from a module. This means, in theory, we can take any JavaScript library and convert it into a worker function with no boilerplate setup.

The way we achieve this is through three similar, but different functions.

* `importTaskWorker` or `importTaskWebWorker`
* `importWorker` or `importWebWorker`
* `importPersistentWorker` or `importPersistentWebWorker`

The simplest of the bunch is the `importTaskWorker` (or `importTaskWebWorker` for the browser).
It is nothing more than syntactic sugar for `importWorker` (or `importWebWorker` for the browser).
Use `importTaskWorker` when:

* You know you don't need a persistent connection to the worker left open
* You know you're only calling the function directly and that is the entire purpose of the worker

If we know that, then we can wrap the worker function in a promise and return it. It's just shorthand for the most common use case.

Now that you know this, we can go over the other two functions: `importWorker` and `importPersistentWorker`.
The major difference, as probably guessed, is that one keeps the worker connection open and the other automatically closes it.
So if you use `importPersistentWorker`, you are responsible for terminating the worker connection when you are done with it.

* Use `importPersistentWorker` when you need the worker file to preserve state while you are working with it
  * This does, however, require the worker file to implement state management
  * For this reason, an `importPersistentWorker` is typically going to be used the least.

Let's jump to the code:

### Comparison between `importWorker` types

This is a basic example that demonstrates using all three with the same use case.

```typescript
import {
  FunctionPool,
  importTaskWorker,
  importWorker,
  importPersistentWorker,
} from '@renderdev/threadpool/function'
// Used for type checking
import type * as mathType from './math.ts'

const filename = new URL('./math.ts', import.meta.url)

const pool = new FunctionPool()

// Option 1
pool.addTask(async () => {
  const persistentWorker = await importPersistentWorker<typeof mathType>(filename)
  const result = await persistentWorker.fib(42)
  // persistentWorker is still open, we can keep working with it
  persistentWorker.terminate() // We are responsible for closing the connection
  return result
}, 'NOTE: Persistent')

// Option 2
pool.addTask(async () => {
  const simpleWorker = await importWorker<typeof mathType>(filename)
  // simpleWorker is closed as soon as the function returns
  return await simpleWorker.fib(42)
}, 'NOTE: Simple')

// Option 3
const taskWorker = await importTaskWorker<typeof mathType>(filename)
pool.addTask(taskWorker.fib(42), 'NOTE: Task')
```

You can see that in this simple example:

* `importTaskWorker` is just shorthand for `importWorker`
* and `importWorker` is just shorthand for `importPersistentWorker`

Each function's strength is introduced when the use case becomes more complex.

* `importPersistentWorker` is the most flexible, but also the most complex and verbose
* `importTaskWorker` is the most simple, but also the least flexible
* `importWorker` is in the middle
  * It is the best option when you don't need to persist the worker connection, but you need to do more than just call the function

:::warning
Even though any function can be converted into a worker function, there's always a small chance it could cause potential side effects. Because we are importing that module on another thread, it will not have any context from the main thread. Keep this in mind if this could cause an issue with your code.
:::

## 🧙‍ Magic Sorcery

Anything that can be dynamically imported (which exports a property or function that returns a cloneable structured data) can be converted into a worker function.
This means we can convert any TS/JS file, third party libraries (like from NPM or JSR) or data urls, etc.

Here is an additional example showing the use of popular third party libraries and custom inline data urls.

All these tasks automatically run in parallel on their own thread!

<Tabs>
<TabItem value="ts" label="TypeScript" default>

```typescript
import { FunctionPool, importTaskWorker, importPersistentWorker, StatusType } from '@renderdev/threadpool'

// Set up the pool
const pool = new FunctionPool()
pool.race((data, thread) => console.log(`Finished First: ${thread.meta} = ${data}\n`))
pool.then((data, thread) => console.log(thread.meta, data))
pool.allSettled(() => console.log('\nDONE!', pool.status('completed', StatusType.COUNT)))

// Import the default export from the `@sindresorhus/slugify` package
type S = typeof import('@sindresorhus/slugify');
const { default: slugify } = await importTaskWorker<S>('@sindresorhus/slugify')

// The `clamp` package returns a CommonJS module.exports
const { default: clamp } = await importTaskWorker('clamp')

// Import a custom data url, where you inline the code with a data url
type W = {
  helloWorld: () => string;
  default: number;
}
const { default: fortyTwo, helloWorld } = await importTaskWorker<W>(`data:text/javascript,
  export const helloWorld = () => "Hello, World!";	
  export default 42;
`)

pool.addTask(slugify(' 🐶 goes WOOF! ', { customReplacements: [['🐶', 'dog']] }), 'slugify(" 🐶 goes WOOF! ")')
pool.addTask(clamp(1, 2, 3), 'clamp(1, 2, 3)')
pool.addTask(helloWorld(), 'helloWorld()')
pool.addTask(fortyTwo(), 'fortyTwo()')
pool.addTask(async () => {
  // Import a custom data url, where you persist state
  type C = {
    counter: number;
    count: () => number;
    maybeCount: () => boolean;
  }
  const getRandomNumber = (): boolean => !!Math.round(Math.random())
  const { counter, count, maybeCount, terminate } = await importPersistentWorker<C>(`data:text/javascript,
    export let counter = 0;	
    export const count = () => counter+=1;
    export const maybeCount = ${getRandomNumber.toString()};
  `)
  await count()
  await count()
  if (await maybeCount()) {
    await count()
  }
  const result = await counter()
  terminate()
  return result
}, 'Counted')
```

</TabItem>
<TabItem value="output" label="Output">

```
Finished First: clamp(1, 2, 3) = 2

clamp(1, 2, 3) 2
slugify(" 🐶 goes WOOF! ") dog-goes-woof
fortyTwo() 42
helloWorld() Hello, World!
Counted 3 // or 2 because of `maybeCount`

DONE! 5
```

</TabItem>
</Tabs>
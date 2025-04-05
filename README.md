# ThreadPool

A multi-threading Worker Pool API for JavaScript. Seamlessly run CPU-intensive tasks in parallel across all JavaScript environments with a unified, type-safe API.

## Overview

ThreadPool provides a powerful abstraction over JavaScript's multithreading capabilities, enabling developers to build applications that efficiently utilize multiple CPU cores while maintaining a clean, consistent, type-safe API regardless of the execution environment.

## Key Features

- **Turn Any Module Into a Worker** - Automatically transform any TypeScript/JavaScript module into a worker thread.
- **Powerful Type Inference** - Full TypeScript type inference for worker threads, enabling safer and more maintainable code out of the box.
- **Event-based Tracking** - Provides a familiar, event-based, Promise-like API for handling threads.
- **Runtime Resource Monitoring** - Automatically manages thread creation based on system resource usage.
- **Universal Compatibility** - Works consistently across all major JavaScript environments, including Deno and Bun.

## Installation

This package is available on both NPM (JS) and JSR (TS) registries. You can install it using your preferred package manager.

NPM

```bash
npm install @renderdev/threadpool
```

JSR

```bash
pnpm dlx jsr add @renderdev/threadpool
```

See all options in the [installation guide](https://pfaciana.github.io/threadpool/docs/getting-started/installation).

## Basic Usage

ThreadPool has a very powerful API, but these are some of the simplest examples to get you started.

There are only three simple steps you need to know:

1. Convert any regular old ECMAScript module into a worker
2. Create a pool and listen for the events it emits
3. Send that worker to the pool

### Convert any module into a worker in Node/Deno/Bun

```typescript
import { FunctionPool, importTaskWorker } from '@renderdev/threadpool/function'

// Step 1
// Import the types. Optional, but this gives us type checking
type M = typeof import('./math.ts');
// Convert any module into a worker function (with type checking)
const filename = new URL('./math.ts', import.meta.url)
const { fibonacci, tribonacci } = await importTaskWorker<typeof M>(filename)

// Step 2
// Create a pool
const pool = new FunctionPool()
// Listen for when all the tasks are completed
pool.allSettled(threads => console.log(`All ${threads.length} tasks completed`))

// Step 3
// Create tasks by converting the imported functions into threads that act as tasks
pool.addTask(fibonacci(42))
// ...some more tasks
pool.addTask(tribonacci('32')) // Uh-oh! TS: tribonacci expects a number
```

### Convert any module into a worker in the Browser

```typescript
import { WebFunctionPool, importTaskWebWorker } from '@renderdev/threadpool/web'

// Step 1
// Import the types. Optional, but this gives us type checking
import type * as mathType from './math.ts'
// Convert any module into a worker function (with type checking)
const filename = new URL('./math.ts', import.meta.url)
const { fibonacci, tribonacci } = await importTaskWebWorker<typeof mathType>(filename)

// Step 2
// Create a pool
const pool = new WebFunctionPool()
// Listen for when all the tasks are completed
pool.allSettled(threads => console.log(`All ${threads.length} tasks completed`))

// Step 3
// Create tasks by converting the imported functions into threads that act as tasks
pool.addTask(fibonacci(42))
// ...some more tasks
pool.addTask(tribonacci('32')) // Uh-oh! TS: tribonacci expects a number
````

### Traditional Worker

A traditional worker means we are using workers created the old fashioned way.
So we are not automatically converting them to a function.
This provides for more power and flexibility, but requires you to create the worker manually.

```typescript
import { WorkerPool } from '@renderdev/threadpool/node'

// Step 1
// We are doing this the old fashioned way!
// In this example, we are creating the './some-node-worker.ts' worker file (not shown here)

// Step 2
// Create a pool and import the worker script
const filename = new URL('./some-node-worker.ts', import.meta.url)
const pool = new WorkerPool(filename)
// Listen for when all the tasks are completed
pool.allSettled(threads => console.log(`All ${threads.length} tasks done!`))

// Step 3
// Create tasks by passing `workerData` to the worker 
pool.addTask({ action: 'fibonacci', number: 42 })
// ...some more tasks
pool.addTask({ action: 'tribonacci', number: 32 })
```

### And just for fun, a little more feature rich example

This is designed to show you a few of the options you have.
If this doesn't make sense, that's okay we have [full documentation](https://pfaciana.github.io/threadpool/) to help you get started.
Just know there is a lot going on under the hood to make creating workers as fast and easy as possible.

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

This will output:

```
Finished First: clamp(1, 2, 3) = 2

clamp(1, 2, 3) 2
slugify(" 🐶 goes WOOF! ") dog-goes-woof
fortyTwo() 42
helloWorld() Hello, World!
Counted 3 // or 2 because of `maybeCount`

DONE! 5
```

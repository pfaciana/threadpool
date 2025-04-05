---
sidebar_position: 3
---

# Worker Import Functions

Functions for importing modules to run in worker threads. These functions provide different approaches for executing code in separate threads, with varying levels of persistence and interaction patterns.

## Functions

### setWorkerFile

Sets the path to the worker script file. This allows customizing the worker script location rather than using the default worker-thread.ts script.

```ts
function setWorkerFile(filename: URL | string): void
```

#### Parameters

- `filename`: Path to the worker script file

#### Example

```ts
// Use a custom worker script
setWorkerFile(new URL('./my-custom-worker.js', import.meta.url))

// Later worker imports will use this custom script
const worker = await importWorker('./math.js')
```

### getWorkerFile

Gets the currently set worker script path or falls back to the default.

```ts
function getWorkerFile(): URL | string
```

#### Returns

- The current worker script path

#### Example

```ts
// Check which worker script is currently in use
const workerPath = getWorkerFile()
console.log('Using worker script at:', workerPath.toString())
```

### importTaskWorker

Imports a module as a one-time task in a worker thread. The worker is terminated after a single property access or method call. No further interaction with the module is possible after the request. It is designed for the sole purpose of being a shorthand for the FunctionPool.addTask method.

<!-- @formatter:off -->
```ts
function importTaskWorker<T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions): Promise<DeferredPromisifyModule<T>>
```
<!-- @formatter:on -->

#### Type Parameters

- `T`: Type of the module being imported

#### Parameters

- `filename`: Path to the module to import in the worker
- `workerOptions`: (Optional) Node.js worker_threads options
- `messageOptions`: (Optional) Options for message handling

#### Returns

- Promise for the deferred module proxy

#### Example

```ts
// Import a module with math functions
import type * as MathModule from './math.js'

// Create a Function Worker Pool
const pool = new FunctionPool()

// Calculate fibonacci in a worker and get result without persisting the worker
const { fib } = await importTaskWorker<typeof MathModule>('./math.js')

// Instead of passing a task function that calls await fib(42),
// importTaskWorker automatically wraps the method so it's run as a worker
pool.addTask(fib(42))

// vs.
const { fib: fib2 } = await importWorker<typeof MathModule>('./math.js')
pool.addTask(() => fib2(42))
// both lines of code do the same thing!
```

### importWorker

Imports a module in a worker thread and immediately executes all exported methods. The worker is automatically terminated after any method call. This is useful for one-off computations where you want to immediately execute a function.

<!-- @formatter:off -->
```ts
function importWorker<T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions): Promise<PromisifyModule<T>>
```
<!-- @formatter:on -->

#### Type Parameters

- `T`: Type of the module being imported

#### Parameters

- `filename`: Path to the module to import in the worker
- `workerOptions`: (Optional) Node.js worker_threads options
- `messageOptions`: (Optional) Options for message handling

#### Returns

- Promise for the immediate-execution module proxy

#### Example

```ts
// Import a module with math functions
import type * as MathModule from './math.js'

// This will create a worker, execute fib(40), and terminate the worker
const { fib } = await importWorker<typeof MathModule>('./math.js')
console.log(await fib(42)) // 267914296

// Each call creates a new worker
const sum = await importWorker<typeof MathModule>('./math.js').add(5, 10)
```

### importPersistentWorker

Imports a module in a persistent worker thread. The worker remains active until manually terminated, allowing for multiple method calls and stateful interactions with the module.

<!-- @formatter:off -->
```ts
function importPersistentWorker<T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions): Promise<PromisifyModule<T & Terminable>>
```
<!-- @formatter:on -->

#### Type Parameters

- `T`: Type of the module being imported

#### Parameters

- `filename`: Path to the module to import in the worker
- `workerOptions`: (Optional) Node.js worker_threads options
- `messageOptions`: (Optional) Options for message handling

#### Returns

- Promise for the persistent module proxy with terminate method

#### Example

```ts
// Import a module with math functions
import type * as MathModule from './math.js'

// Create a persistent worker that keeps state between calls
const math = await importPersistentWorker<typeof MathModule>('./math.js')

// First calculation
const result1 = await math.add(1, 2)

// Second calculation using the same worker
const result2 = await math.multiply(result1, 4)

// Terminate when done
math.terminate()
```

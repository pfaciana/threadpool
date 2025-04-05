---
sidebar_position: 3
---

# Web Worker Import Functions

Functions for importing modules to run in web workers. These functions provide different approaches for executing code in separate web worker threads, with varying levels of persistence and interaction patterns.

## Types

### WorkerOptions

Web Worker options interface from the DOM API.

```ts
interface WorkerOptions {
  type?: 'classic' | 'module';
  credentials?: 'include' | 'omit' | 'same-origin';
  name?: string;
}
```

## Functions

### setWorkerUrl

Sets the URL for the worker script. This allows customizing the worker script location rather than using the default inline data URL.

```ts
function setWorkerUrl(filename: URL | string): void
```

#### Parameters

- `filename`: URL or string path to the worker script

#### Example

```ts
// Use a custom worker script
setWorkerUrl(new URL('./my-worker.js', import.meta.url))

// Later worker imports will use this custom script
const worker = await importWebWorker('./math.js')
```

### getWorkerUrl

Gets the currently set worker URL or falls back to the default data URL.

```ts
function getWorkerUrl(): URL | string
```

#### Returns

- The current worker URL or data URL if none is set

#### Example

```ts
// Check which worker script is currently in use
const workerUrl = getWorkerUrl()
console.log('Using worker script at:', workerUrl)
```

### importTaskWebWorker

Imports a module as a one-time task in a Web Worker. The worker is terminated after a single property access or method call. No further interaction with the module is possible after the request.

<!-- @formatter:off -->
```ts
function importTaskWebWorker<T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions): Promise<DeferredPromisifyModule<T>>
```
<!-- @formatter:on -->

#### Type Parameters

- `T`: Type of the module being imported

#### Parameters

- `filename`: Path to the module to import in the worker
- `workerOptions`: (Optional) Options for the Worker constructor
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
const { fib } = await importTaskWebWorker<typeof MathModule>('./math.js')

// Instead of passing a task function that calls await fib(42),
// importTaskWorker automatically wraps the method so it's run as a worker
pool.addTask(fib(42))

// vs.
const { fib: fib2 } = await importWebWorker<typeof MathModule>('./math.js')
pool.addTask(() => fib2(42))
// both lines of code do the same thing!
```

### importWebWorker

Imports a module in a Web Worker and immediately executes all exported methods. The worker is terminated after any method call. This is useful for one-off computations where you want to immediately execute a function.

<!-- @formatter:off -->
```ts
function importWebWorker<T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions): Promise<PromisifyModule<T>>
```
<!-- @formatter:on -->

#### Type Parameters

- `T`: Type of the module being imported

#### Parameters

- `filename`: Path to the module to import in the worker
- `workerOptions`: (Optional) Options for the Worker constructor
- `messageOptions`: (Optional) Options for message handling

#### Returns

- Promise for the immediate-execution module proxy

#### Example

```ts
// Import a module with math functions
import type * as MathModule from './math.js'

// This will create a worker, execute fib(40), and terminate the worker
const { fib } = await importWebWorker<typeof MathModule>('./math.js')
console.log(await fib(42)) // 267914296

// Each call creates a new worker
const sum = await importWebWorker<typeof MathModule>('./math.js').add(5, 10)
```

### importPersistentWebWorker

Imports a module in a persistent Web Worker. The worker remains active until manually terminated, allowing for multiple method calls and stateful interactions with the module.

<!-- @formatter:off -->
```ts
function importPersistentWebWorker<T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions): Promise<PromisifyModule<T & Terminable>>
```
<!-- @formatter:on -->

#### Type Parameters

- `T`: Type of the module being imported

#### Parameters

- `filename`: Path to the module to import in the worker
- `workerOptions`: (Optional) Options for the Worker constructor
- `messageOptions`: (Optional) Options for message handling

#### Returns

- Promise for the persistent module proxy with terminate method

#### Example

```ts
// Import a module with math functions
import type * as MathModule from './math.js'

// Create a persistent worker that keeps state between calls
const math = await importPersistentWebWorker<typeof MathModule>('./math.js')

// First calculation
const result1 = await math.add(1, 2

// Second calculation using the same worker
const result2 = await math.multiply(result1)

// Terminate when done
math.terminat()
```

#### Example with SharedWorker

```ts
// Use with a SharedWorker
const sharedMath = await importPersistentWebWorker('./math.js', {}, {
  WorkerType: SharedWorker,
  name: 'shared-math-worker',
})

// Multiple scripts can now access the same worker
const result = await sharedMath.add(10, 20)
```

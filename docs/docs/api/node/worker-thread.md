---
sidebar_position: 1
---

# WorkerThread

Manages a worker thread lifecycle with state tracking and event handling. WorkerThread provides a higher-level API on top of Node.js worker_threads, handling thread lifecycle management, state tracking, and offering a Promise-like API for working with worker results.

```ts
// Create a worker thread
const thread = new WorkerThread('./my-worker.js', {
  workerData: { input: [1, 2, 3] },
})

// Listen for messages from the worker
thread.on('message', (data) => {
  console.log('Worker sent:', data)
})

// Start the worker
thread.start()

// Or use Promise-like API
thread
  .then(result => console.log('Worker result:', result))
  .catch((error, type) => console.error(`Worker error (${type}):`, error))
  .finally(exitCode => console.log(`Worker exited with code ${exitCode}`))
```

## Types

### WorkerThreadOptions

Supported constructor argument patterns for WorkerThread.

```ts
type WorkerThreadOptions =
  | [file: string | URL, options: ThreadWorkerOptions, meta: any] // 3 arguments
  | [file: string | URL, options: ThreadWorkerOptions] // 2 arguments
  | [options: ThreadWorkerOptions]; // 1 argument
```

Three different calling patterns are supported:

1. `new WorkerThread(options)` - With file path in the options object
2. `new WorkerThread(file, options)` - With separate file path and options
3. `new WorkerThread(file, options, meta)` - With separate file, options and metadata

## Properties

### status

Gets the current thread status.

<!-- @formatter:off -->
```ts
get status(): ThreadStatus
```
<!-- @formatter:on -->

### worker

Gets the underlying Worker instance (if started).

<!-- @formatter:off -->
```ts
get worker(): Worker | undefined
```
<!-- @formatter:on -->

### message

Gets the latest message received from the worker.

<!-- @formatter:off -->
```ts
get message(): any
```
<!-- @formatter:on -->

### error

Gets any error that occurred in the worker.

<!-- @formatter:off -->
```ts
get error(): any
```
<!-- @formatter:on -->

### meta

Optional metadata associated with the worker thread.

<!-- @formatter:off -->
```ts
meta: any | undefined
```
<!-- @formatter:on -->

## Methods

### constructor

Creates a new WorkerThread instance.

<!-- @formatter:off -->
```ts
constructor(...workerArgs: WorkerThreadOptions)
```
<!-- @formatter:on -->

#### Parameters

- `workerArgs`: Worker configuration arguments

#### Examples

```ts
// Option 1: All options in a single object
const thread1 = new WorkerThread({
  file: './worker.js',
  workerData: { input: [1, 2, 3] },
  meta: { id: 'worker-1' },
})

// Option 2: Separate file and options
const thread2 = new WorkerThread('./worker.js', {
  workerData: { input: [4, 5, 6] },
})

// Option 3: Separate file, options, and metadata
const thread3 = new WorkerThread('./worker.js',
  { workerData: { input: [7, 8, 9] } },
  { id: 'worker-3' },
)
```

### getWorker

Gets a promise that resolves to the Worker instance when it's initialized.

<!-- @formatter:off -->
```ts
async getWorker(): Promise<Worker>
```
<!-- @formatter:on -->

#### Returns

Promise that resolves to the Worker instance

#### Example

```ts
const thread = new WorkerThread('./worker.js')
thread.start()

// Get the worker instance when it's ready
const worker = await thread.getWorker()
// Now we can use the worker directly if needed
```

### start

Starts the worker thread. Once started, the worker thread cannot be started again.

<!-- @formatter:off -->
```ts
start(): void
```
<!-- @formatter:on -->

### then

Adds a callback to handle messages from the worker.

<!-- @formatter:off -->
```ts
then(onFulfilled: (value: any) => any): this
```
<!-- @formatter:on -->

#### Parameters

- `onFulfilled`: Function called with messages received from the worker

#### Returns

This instance for chaining

#### Example

```ts
const thread = new WorkerThread('./worker.js')

thread.then(result => {
  console.log('Worker sent:', result)
})

thread.start()
```

### catch

Adds a callback to handle errors from the worker.

<!-- @formatter:off -->
```ts
catch(onRejected: (error: any, type: 'error' | 'messageerror') => any): this
```
<!-- @formatter:on -->

#### Parameters

- `onRejected`: Function called when the worker encounters an error

#### Returns

This instance for chaining

#### Example

```ts
const thread = new WorkerThread('./worker.js')

thread.catch((error, type) => {
  console.error(`Error type: ${type}`)
  console.error(error)
})

thread.start()
```

### finally

Adds a callback that will be called when the worker exits.

<!-- @formatter:off -->
```ts
finally(onFinally: (exitCode) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `onFinally`: Function called when the worker exits

#### Returns

This instance for chaining

#### Example

```ts
const thread = new WorkerThread('./worker.js')

thread.finally(exitCode => {
  console.log(`Worker exited with code ${exitCode}`)
  // Clean up resources, etc.
})

thread.start()
```

## Events
```ts

const thread = new WorkerThread('./worker.js', {
  workerData: { taskId: 123 },
})

thread.on('online', () => {
  console.log('Worker is now executing')
})

thread.on('message', (result) => {
  console.log('Worker sent result:', result)
})

thread.on('exit', (code) => {
  console.log(`Worker exited with code ${code}`)
})

// Start the worker
thread.start()
```

### init
When the thread is initialized

### online
When the worker thread comes online

### message
When a message is received from the worker

### messageerror
When there's an error deserializing a message

### error
When the worker thread throws an error

### exit
When the worker thread exits

### status
When the thread status changes

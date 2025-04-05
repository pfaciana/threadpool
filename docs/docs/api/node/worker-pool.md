---
sidebar_position: 2
---

# WorkerPool

Manages a pool of worker threads for parallel execution. WorkerPool provides a high-level API for managing multiple worker threads in Node.js, automatically handling queuing, execution, and resource monitoring. It offers Promise-like APIs and combinators for working with multiple concurrent worker tasks.

```ts
// Create a pool with default settings
const pool = new WorkerPool('./worker.js', {
  workerData: { taskId: 0, data: [1, 2, 3] },
})

// Add several workers with different task data
pool.addTask({ taskId: 1, data: [4, 5, 6] })
pool.addTask({ taskId: 2, data: [7, 8, 9] })
pool.addTask({ taskId: 3, data: [10, 11, 12] })

// Wait for all workers to complete
pool.allSettled(threads => {
  console.log(`All ${threads.length} workers completed`)
  threads.forEach(thread => {
    console.log(`Worker result: ${thread.message}`)
  })
})
```

## Types

### SystemInfo

Information about the system's hardware resources.

```ts
type SystemInfo = {
  cores: number;   // Number of physical CPU cores
  threads: number; // Number of logical CPU threads
  memory: number;  // Total system memory in bytes
};
```

### WorkerPoolOptions

Supported constructor argument patterns for WorkerPool.

```ts
type WorkerPoolOptions =
  | [file: string | URL, options: ThreadWorkerOptions, customOptions: Record<any, any>] // 3 arguments
  | [file: string | URL, options: ThreadWorkerOptions] // 2 arguments
  | [fileOrOptions: string | URL | ThreadWorkerOptions] // 1 argument
  | []; // 0 arguments
```

Four different calling patterns are supported:

1. `new WorkerPool()` - Empty pool with no defaults
2. `new WorkerPool(fileOrOptions)` - With file path or options object
3. `new WorkerPool(file, options)` - With separate file path and options
4. `new WorkerPool(file, options, customOptions)` - With file, worker options, and pool options

## Properties

### system

Gets information about the system's hardware resources.

<!-- @formatter:off -->
```ts
get system(): SystemInfo
```
<!-- @formatter:on -->

#### Example

```ts
const pool = new WorkerPool('./worker.js');
console.log(`Running on a system with ${pool.system.cores} physical cores`);
console.log(`${pool.system.threads} logical threads available`);
console.log(`${Math.round(pool.system.memory / 1024 / 1024)} MB RAM`);
```

### maxThreadThreshold

Maximum CPU usage threshold (percentage) for scheduling worker threads. When CPU usage is above this threshold, no new workers will be scheduled.

<!-- @formatter:off -->
```ts
maxThreadThreshold: number = 98
```
<!-- @formatter:on -->

### poolSize

Gets or sets the maximum number of worker threads that can run concurrently. Defaults to the number of physical CPU cores minus one.

<!-- @formatter:off -->
```ts
get poolSize(): number
set poolSize(value: number)
```
<!-- @formatter:on -->

#### Set

Sets the maximum number of worker threads that can run concurrently.

Parameters:

- `value`: Pool size (minimum: 1)

#### Get

Gets the maximum number of worker threads that can run concurrently.

Returns:

- Current maximum pool size

### pingInterval

Sets the interval in milliseconds between worker scheduling attempts.

<!-- @formatter:off -->
```ts
set pingInterval(value: number)
```
<!-- @formatter:on -->

Parameters:

- `value`: Ping interval in milliseconds (minimum: 1)

## Methods

### constructor

Creates a new WorkerPool.

<!-- @formatter:off -->
```ts
constructor(...options: WorkerPoolOptions)
```
<!-- @formatter:on -->

#### Parameters

- `options`: Worker pool configuration

#### Examples

```ts
// Empty pool (each worker must specify file path)
const pool1 = new WorkerPool();

// Pool with default file path
const pool2 = new WorkerPool('./worker.js');

// Pool with default file path and worker options
const pool3 = new WorkerPool('./worker.js', {
  workerData: { sharedConfig: 'value' }
});

// Pool with default file, worker options, and pool settings
const pool4 = new WorkerPool('./worker.js',
  { workerData: { sharedConfig: 'value' } },
  {
    poolSize: 4,
    pingInterval: 200,
    maxThreadThreshold: 85
  }
);
```

### status

Gets status information about the worker pool.

<!-- @formatter:off -->
```ts
status(...args): StatusResponse<WorkerThread>
```
<!-- @formatter:on -->

See TaskPool.status() for detailed documentation on parameters and return types.

### isCompleted

Checks if all worker threads in the pool have completed.

<!-- @formatter:off -->
```ts
isCompleted(emit?: boolean): boolean
```
<!-- @formatter:on -->

#### Parameters

- `emit`: (Optional) If true, emits the 'complete' event when all tasks are done

#### Returns

- `boolean`: True if all worker threads are completed

### hasAvailableThread

Checks if the pool has capacity for another active worker thread, taking into account both pool size and system CPU usage.

<!-- @formatter:off -->
```ts
hasAvailableThread(): boolean
```
<!-- @formatter:on -->

#### Returns

- `boolean`: True if another worker thread can be started

### enableExitEventFallback

Enables or disables the worker exit event fallback mechanism. Some environments like Bun or Deno might not fully support worker 'exit' events. This method enables a fallback that uses message passing for exit events.

<!-- @formatter:off -->
```ts
async enableExitEventFallback(force?: boolean): Promise<void>
```
<!-- @formatter:on -->

#### Parameters

- `force`: (Optional) Force enable/disable fallback, or auto-detect if undefined

#### Example

```ts
const pool = new WorkerPool('./worker.js')

// Auto-detect if exit event fallback is needed
await pool.enableExitEventFallback()

// Or force enable it
await pool.enableExitEventFallback(true)
```

### addWorker

Adds a worker to the pool with specified options. Worker options are merged with the default options for the pool.

<!-- @formatter:off -->
```ts
addWorker(...threadArgs: WorkerThreadOptions): WorkerThread
```
<!-- @formatter:on -->

#### Parameters

- `threadArgs`: Worker configuration arguments

#### Returns

- The created worker thread instance

#### Example

```ts
const pool = new WorkerPool('./default-worker.js')

// Use default worker script with custom worker data
const worker1 = pool.addWorker({ workerData: { taskId: 1 } })

// Use a different worker script
const worker2 = pool.addWorker('./special-worker.js', {
  workerData: { taskId: 2 },
})

// Add worker with metadata
const worker3 = pool.addWorker('./worker.js',
  { workerData: { taskId: 3 } },
  { id: 'critical-task' },
)
```

### addTask

Adds a worker to the pool using the default worker script with specified data. This is a simplified interface for adding workers when you only need to vary the worker data.

<!-- @formatter:off -->
```ts
addTask(workerData?: any, meta?: any): WorkerThread
```
<!-- @formatter:on -->

#### Parameters

- `workerData`: (Optional) Data to pass to the worker thread
- `meta`: (Optional) Optional metadata to associate with the worker

#### Returns

- The created worker thread instance

#### Example

```ts
const pool = new WorkerPool('./worker.js')

// Add workers with different task data
const worker1 = pool.addTask({ taskId: 1, data: [1, 2, 3] })
const worker2 = pool.addTask({ taskId: 2, data: [4, 5, 6] })

// Add worker with data and metadata
const worker3 = pool.addTask(
  { taskId: 3, data: [7, 8, 9] },
  { priority: 'high', retryCount: 3 },
)
```

### then

Adds a callback for successful worker completions. The callback will be called each time any worker completes successfully.

<!-- @formatter:off -->
```ts
then(onFulfilled: (value: any, thread: WorkerThread) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `onFulfilled`: Callback for successful worker completion

#### Returns

- This instance for chaining

#### Example

```ts
pool.then((data, thread) => {
  console.log(`Worker ${thread.meta?.id} succeeded with:`, data)
})
```

### catch

Adds a callback for worker errors. The callback will be called each time any worker encounters an error.

<!-- @formatter:off -->
```ts
catch(onRejected: (error: any, type: 'error' | 'messageerror', thread: WorkerThread) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `onRejected`: Callback for worker errors

#### Returns

- This instance for chaining

#### Example

```ts
pool.catch((error, type, thread) => {
  console.error(`Worker ${thread.meta?.id} failed:`, error)
  console.error(`Error type: ${type}`)
})
```

### finally

Adds a callback for worker completions, regardless of success or failure. The callback will be called each time any worker completes.

<!-- @formatter:off -->
```ts
finally(onFinally: (exitCode: any, thread: WorkerThread) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `onFinally`: Callback for worker completion

#### Returns

- This instance for chaining

#### Example

```ts
pool.finally((exitCode, thread) => {
  console.log(`Worker ${thread.meta?.id} completed with exit code: ${exitCode}`)
})
```

### allSettled

Registers a callback that will be invoked when all workers have completed, regardless of success or failure.

<!-- @formatter:off -->
```ts
allSettled(callback: (threads: WorkerThread[]) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `callback`: Function called with array of all completed worker threads

#### Returns

- This instance for chaining

#### Example

```ts
pool.allSettled(threads => {
  console.log(`All ${threads.length} tasks completed`)

  // Count successful and failed threads
  const successful = threads.filter(t => t.status.SUCCESS).length
  const failed = threads.filter(t => t.status.ERROR).length

  console.log(`${successful} succeeded, ${failed} failed`)
})
```

### all

Registers a callback that will be invoked when either all workers have completed successfully or any worker fails.

<!-- @formatter:off -->
```ts
all(callback: (threads: WorkerThread[] | Error) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `callback`: Function called with array of workers or error

#### Returns

- This instance for chaining

#### Example

```ts
pool.all(result => {
  if (result instanceof Error) {
    console.error('At least one task failed:', result)
  } else {
    console.log(`All ${result.length} tasks succeeded`)
    result.forEach(thread => {
      console.log(`Task result:`, thread.message)
    })
  }
})
```

### any

Registers a callback that will be invoked when either the first worker completes successfully, or all workers have failed.

<!-- @formatter:off -->
```ts
any(callback: (data: any | AggregateError, thread: WorkerThread | undefined) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `callback`: Function called with result or AggregateError

#### Returns

- This instance for chaining

#### Example

```ts
pool.any((result, thread) => {
  if (result instanceof AggregateError) {
    console.error('All tasks failed:', result)
  } else {
    console.log(`Task succeeded with result:`, result)
    console.log(`Completed thread:`, thread)
  }
})
```

### race

Registers a callback that will be invoked when any worker completes or fails. The callback receives the result or error from the first worker to settle.

<!-- @formatter:off -->
```ts
race(callback: (data: any, thread: WorkerThread) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `callback`: Function called with result and worker

#### Returns

- This instance for chaining

#### Example

```ts
pool.race((result, thread) => {
  console.log(`First worker to complete:`, thread)
  console.log(`Result:`, result)

  // Check if it was successful
  if (thread.status.SUCCESS) {
    console.log('Worker succeeded')
  } else {
    console.log('Worker failed')
  }
})
```

## Events

The FunctionPool class emits the following events:

### worker.init

When a worker thread is initialized and starts execution.

### worker.online

When a worker thread is online.

### worker.message

When a worker thread completes successfully with a result.

### worker.error

When a worker thread throws an error directly during execution.

### worker.messageerror

When a worker thread's promise rejects with an error.

### worker.exit

When a worker thread completes execution (either success or error).

### worker.status

When a worker thread's status changes.

### complete

When all tasks in the pool have completed.

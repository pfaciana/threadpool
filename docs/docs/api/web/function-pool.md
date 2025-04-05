---
sidebar_position: 2
---

# WebFunctionPool

Manages a pool of WebFunctionThread instances for parallel execution. WebFunctionPool provides a high-level API for managing multiple function-based threads, automatically handling queuing, execution and event propagation. It offers Promise-like APIs and combinators for working with multiple concurrent tasks.

## Properties

### poolSize

Gets or sets the maximum number of threads that can run concurrently. Defaults to the number of browsers threads minus one.

<!-- @formatter:off -->
```ts
get poolSize(): number
set poolSize(value: number)
```
<!-- @formatter:on -->

#### Set

Sets the maximum number of threads that can run concurrently.

Parameters:

- `value`: Pool size (minimum: 1)

#### Get

Gets the maximum number of threads that can run concurrently.

Returns:

- Current maximum pool size

### pingInterval

Sets the interval in milliseconds between task scheduling attempts.

<!-- @formatter:off -->
```ts
set pingInterval(value: number)
```
<!-- @formatter:on -->

Parameters:

- `value`: Ping interval in milliseconds (minimum: 1)

## Methods

### constructor

Creates a new WebFunctionPool.

<!-- @formatter:off -->
```ts
constructor(options: Record<string, any> = {})
```
<!-- @formatter:on -->

#### Parameters

- `options`: Pool configuration options
  - `pingInterval`: (Optional) Interval in ms between task scheduling attempts
  - `poolSize`: (Optional) Maximum number of concurrent threads (defaults to CPU core count)

#### Example

```ts
// Create a pool with custom settings
const pool = new WebFunctionPool({ poolSize: 2 });
pool.allSettled(() => {
  const completed = pool.status('completed', StatusType.RAW)

  for (const thread of completed) {
    console.log(thread.message, thread.status.SUCCESS ? 'Success' : 'Error', thread.meta)
  }

  console.log('\nDONE!', pool.status('completed', StatusType.COUNT))
})
```

### status

Gets status information about the thread pool.

<!-- @formatter:off -->
```ts
status(...args): StatusResponse<WebFunctionThread>
```
<!-- @formatter:on -->

See TaskPool.status() for detailed documentation on parameters and return types.

### isCompleted

Checks if all threads in the pool have completed.

<!-- @formatter:off -->
```ts
isCompleted(emit?: boolean): boolean
```
<!-- @formatter:on -->

#### Parameters

- `emit`: (Optional) If true, emits the 'complete' event when all tasks are done

#### Returns

- `boolean`: True if all tasks are completed

### hasAvailableThread

Checks if the pool has capacity for another active thread.

<!-- @formatter:off -->
```ts
hasAvailableThread(): boolean
```
<!-- @formatter:on -->

#### Returns

- `boolean`: True if another thread can be started

### addTask

Adds a task (function) to the pool for execution.

<!-- @formatter:off -->
```ts
addTask(workerFn: () => Promise<any>, meta?: any): WebFunctionThread
```
<!-- @formatter:on -->

#### Parameters

- `workerFn`: Async function to execute
- `meta`: (Optional) Optional metadata to associate with the thread

#### Returns

- The created thread instance

#### Example

```ts
// Add a task to fetch data
pool.addTask(async () => {
  const response = await fetch('https://api.example.com/data');
  return response.json();
}, { id: 'data-fetch-task' });
```

### then

Adds a callback for successful thread completions. The callback will be called each time any thread completes successfully.

<!-- @formatter:off -->
```ts
then(onFulfilled: (value: any, thread: WebFunctionThread) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `onFulfilled`: Callback for successful thread completion

#### Returns

- This instance for chaining

#### Example

```ts
pool.then((data, thread) => {
  console.log(`Thread ${thread.meta.id} succeeded with:`, data);
});
```

### catch

Adds a callback for thread errors. The callback will be called each time any thread encounters an error.

<!-- @formatter:off -->
```ts
catch(onRejected: (error: any, type: 'error' | 'messageerror', thread: WebFunctionThread) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `onRejected`: Callback for thread errors

#### Returns

- This instance for chaining

#### Example

```ts
pool.catch((error, type, thread) => {
  console.error(`Thread ${thread.meta.id} failed:`, error);
  console.error(`Error type: ${type}`);
});
```

### finally

Adds a callback for thread completions, regardless of success or failure. The callback will be called each time any thread completes.

<!-- @formatter:off -->
```ts
finally(onFinally: (exitCode: any, thread: WebFunctionThread) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `onFinally`: Callback for thread completion

#### Returns

- This instance for chaining

#### Example

```ts
pool.finally((exitCode, thread) => {
  console.log(`Thread ${thread.meta.id} completed with exit code: ${exitCode}`);
});
```

### allSettled

Registers a callback that will be invoked when all threads have completed, regardless of success or failure.

<!-- @formatter:off -->
```ts
allSettled(callback: (threads: WebFunctionThread[]) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `callback`: Function called with array of all completed threads

#### Returns

- This instance for chaining

#### Example

```ts
pool.allSettled(threads => {
  console.log(`All ${threads.length} tasks completed`);

  // Count successful and failed threads
  const successful = threads.filter(t => t.status.SUCCESS).length;
  const failed = threads.filter(t => t.status.ERROR).length;

  console.log(`${successful} succeeded, ${failed} failed`);
});
```

### all

Registers a callback that will be invoked when either all threads have completed successfully or any thread fails.

<!-- @formatter:off -->
```ts
all(callback: (threads: WebFunctionThread[] | Error) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `callback`: Function called with array of threads or error

#### Returns

- This instance for chaining

#### Example

```ts
pool.all(result => {
  if (result instanceof Error) {
    console.error('At least one task failed:', result);
  } else {
    console.log(`All ${result.length} tasks succeeded`);
    result.forEach(thread => {
      console.log(`Task result:`, thread.message);
    });
  }
});
```

### any

Registers a callback that will be invoked when either the first thread completes successfully, or all threads have failed.

<!-- @formatter:off -->
```ts
any(callback: (data: any | AggregateError, thread: WebFunctionThread | undefined) => void): this
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
    console.error('All tasks failed:', result);
  } else {
    console.log(`Task succeeded with result:`, result);
    console.log(`Completed thread:`, thread);
  }
});
```

### race

Registers a callback that will be invoked when any thread completes or fails. The callback receives the result or error from the first thread to settle.

<!-- @formatter:off -->
```ts
race(callback: (data: any, thread: WebFunctionThread) => void): this
```
<!-- @formatter:on -->

#### Parameters

- `callback`: Function called with result and thread

#### Returns

- This instance for chaining

#### Example

```ts
pool.race((result, thread) => {
  console.log(`First thread to complete:`, thread);
  console.log(`Result:`, result);

  // Check if it was successful
  if (thread.status.SUCCESS) {
    console.log('Thread succeeded');
  } else {
    console.log('Thread failed');
  }
});
```

## Events

The FunctionPool class emits the following events:

### worker.init

When a worker thread is initialized and starts execution.

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

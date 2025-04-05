---
sidebar_position: 2
---

# FunctionPool

Manages a pool of FunctionThread instances for parallel execution.

FunctionPool provides a high-level API for managing multiple function-based threads, automatically handling queuing, execution, and resource monitoring. It offers Promise-like APIs and combinators (then, catch, all, race, etc.) for working with multiple concurrent tasks.

```ts
// Create a pool with default settings
const pool = new FunctionPool();

// Add several computational tasks
pool.addTask(async () => {
  // Task 1: Calculate something complex
  return await complexCalculation(500000);
});

pool.addTask(async () => {
  // Task 2: Process some data
  return await processData(largeDataset);
});

// Wait for all tasks to complete
pool.allSettled(threads => {
  console.log(`All ${threads.length} tasks completed`);
  threads.forEach(thread => {
    console.log(`Thread result: ${thread.message}`);
  });
});

// Or handle results as they complete
pool.then((data, thread) => {
  console.log(`Thread completed with result:`, data);
});
```

## Types

### SystemInfo

Information about the system's hardware resources.

```ts
type SystemInfo = {
  cores: number;   // Number of physical CPU cores
  threads: number; // Number of logical CPU threads
  memory: number;  // Total system memory in bytes
}
```

## Properties

### maxThreadThreshold

Maximum CPU usage threshold (percentage) for scheduling threads. When CPU usage is above this threshold, no new threads will be scheduled.

<!-- @formatter:off -->
```ts
maxThreadThreshold: number = 98
```
<!-- @formatter:on -->

### system

Gets information about the system's hardware resources.

<!-- @formatter:off -->
```ts
get system(): SystemInfo
```
<!-- @formatter:on -->

#### Example

```ts
const pool = new FunctionPool();
console.log(`Running on a system with ${pool.system.cores} physical cores`);
console.log(`${pool.system.threads} logical threads available`);
console.log(`${Math.round(pool.system.memory / 1024 / 1024)} MB RAM`);
```

### poolSize

Gets or sets the maximum number of threads that can run concurrently. Defaults to the number of physical CPU cores minus one.

<!-- @formatter:off -->
```ts
get poolSize(): number
set poolSize(value: number)
```
<!-- @formatter:on -->

## Methods

### constructor

Creates a new FunctionPool.

<!-- @formatter:off -->
```ts
constructor(options: Record<string, any> = {})
```
<!-- @formatter:on -->

#### Parameters

- `options`: Pool configuration options
  - `pingInterval`: Interval in ms between task scheduling attempts
  - `poolSize`: Maximum number of concurrent threads
  - `maxThreadThreshold`: Maximum CPU usage threshold for scheduling threads

#### Example

```ts
// Create a pool with custom settings
const pool = new FunctionPool({
  poolSize: 4,              // Run at most 4 tasks concurrently
  pingInterval: 200,        // Check for available tasks every 200ms
  maxThreadThreshold: 85    // Don't start new tasks if CPU usage is above 85%
});
```

### addTask

Adds a task (function) to the pool for execution.

<!-- @formatter:off -->
```ts
addTask(workerFn: () => Promise<any>, meta?: any): FunctionThread
```
<!-- @formatter:on -->

#### Parameters

- `workerFn`: Async function to execute
- `meta`: Optional metadata to associate with the thread

#### Returns

- The created FunctionThread instance

#### Example

```ts
// Add a task to process data
const thread = pool.addTask(async () => {
  const data = await readFile('large-data.json');
  return processData(JSON.parse(data));
}, { id: 'data-processing-task' });

// You can also work with the thread directly
thread.on('message', result => {
  console.log('Task completed with result:', result);
});
```

### hasAvailableThread

Checks if the pool has capacity for another active thread, taking into account both pool size and system CPU usage.

<!-- @formatter:off -->
```ts
hasAvailableThread(): boolean
```
<!-- @formatter:on -->

#### Returns

- `boolean`: True if another thread can be started

### status

Gets status information about the thread pool.

<!-- @formatter:off -->
```ts
status(statusKey?: string, returnType: number = 0): any
```
<!-- @formatter:on -->

See TaskPool.status() for detailed documentation on parameters and return types.

### isCompleted

Checks if all threads in the pool have completed.

<!-- @formatter:off -->
```ts
isCompleted(): boolean
```
<!-- @formatter:on -->

#### Returns

- `boolean`: True if all tasks are completed

### then

Adds a callback for successful thread completions. The callback will be called each time any thread completes successfully.

<!-- @formatter:off -->
```ts
then(onFulfilled: (value: any, thread: FunctionThread) => void): this
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
catch(onRejected: (error: any, type: 'error' | 'messageerror', thread: FunctionThread) => void): this
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
finally(onFinally: (exitCode: any, thread: FunctionThread) => void): this
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
allSettled(callback: (threads: FunctionThread[]) => void): this
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

Registers a callback that will be invoked when either all threads have completed successfully, or any thread fails.

<!-- @formatter:off -->
```ts
all(callback: (threads: FunctionThread[] | Error) => void): this
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
any(callback: (data: any | AggregateError, thread: FunctionThread | undefined) => void): this
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
race(callback: (data: any, thread: FunctionThread) => void): this
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

#### Example

```ts
const pool = new FunctionPool();

pool.on('worker.init', (thread) => {
  console.log('Worker started:', thread.meta);
});

pool.on('worker.message', (data, thread) => {
  console.log(`Worker ${thread.meta.id} completed with result:`, data);
});

pool.on('worker.error', (error, thread) => {
  console.error(`Worker ${thread.meta.id} failed with error:`, error);
});

pool.on('complete', () => {
  console.log('All workers have completed');
});

// Add tasks to the pool
pool.addTask(() => complexCalculation(), { id: 'task-1' });
pool.addTask(() => processData(), { id: 'task-2' });
```

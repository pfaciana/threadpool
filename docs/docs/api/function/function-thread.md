---
sidebar_position: 1
---

# FunctionThread

Manages a function-based thread with state tracking and event handling.

FunctionThread wraps an asynchronous function with thread-like status tracking and event capabilities, allowing it to be managed similar to actual worker threads but without the overhead of creating separate worker processes.

```ts
// Create a thread to perform a calculation
const thread = new FunctionThread({
  workerFn: async () => {
    // This simulates some complex time consuming work
    await new Promise(resolve => setTimeout(resolve, 5000));
    return 42;
  },
  meta: { id: "calculation-1" }
});

// Listen for events
thread.on('message', (data) => {
  console.log('Result:', data);
});

// Start the thread
thread.start();

// Or use Promise-like API
thread.then(result => {
  console.log('Got result:', result);
}).catch((error, type) => {
  console.error(`Error (${type}):`, error);
}).finally(() => {
  console.log('Thread completed');
});
```

## Types

### FunctionThreadOptions

Options for creating a FunctionThread instance.

```ts
type FunctionThreadOptions = {
  workerFn: () => Promise<any>;
  meta?: any;
}
```

## Properties

### status

Gets the current thread status.

<!-- @formatter:off -->
```ts
get status(): ThreadStatus
```
<!-- @formatter:on -->

### message

Gets the latest message received from the thread (the function return value).

<!-- @formatter:off -->
```ts
get message(): any
```
<!-- @formatter:on -->

### error

Gets any error that occurred in the thread.

<!-- @formatter:off -->
```ts
get error(): any
```
<!-- @formatter:on -->

### meta

Optional metadata associated with this thread.

<!-- @formatter:off -->
```ts
meta: any | undefined
```
<!-- @formatter:on -->

## Methods

### constructor

Creates a new FunctionThread.

<!-- @formatter:off -->
```ts
constructor(options: FunctionThreadOptions)
```
<!-- @formatter:on -->

#### Parameters

- `options`: Configuration options containing the worker function to execute and optional metadata

#### Example

```ts
const thread = new FunctionThread({
  workerFn: async () => {
    const result = await complexCalculation();
    return result;
  },
  meta: { id: "task-123", priority: "high" }
});
```

### start

Starts execution of the thread function. Once started, the thread cannot be started again.

<!-- @formatter:off -->
```ts
start(): boolean
```
<!-- @formatter:on -->

Events emitted during execution:
- 'init' - When the thread starts
- 'message' - When the thread completes successfully
- 'error' - When the thread throws an error directly
- 'messageerror' - When the thread's promise rejects
- 'exit' - When the thread completes (either success or error)
- 'status' - When the thread status changes

#### Returns

- `boolean`: True if the thread was started, false if it was already running

#### Example

```ts
const thread = new FunctionThread({
  workerFn: async () => {
    return await fetchData();
  }
});

thread.on('message', (data) => {
  // Process the fetched data
});

thread.start();
```

### then

Adds a callback to handle successful completion of the thread.

<!-- @formatter:off -->
```ts
then(onFulfilled: (value: any) => any): this
```
<!-- @formatter:on -->

#### Parameters

- `onFulfilled`: Function called with the result when thread completes successfully

#### Returns

- This instance for chaining

#### Example

```ts
const thread = new FunctionThread({
  workerFn: async () => {
    return 42;
  }
});

thread.then(result => {
  console.log(`The answer is: ${result}`);
});

thread.start();
```

### catch

Adds a callback to handle errors from the thread.

<!-- @formatter:off -->
```ts
catch(onRejected: (error: any, type: 'error' | 'messageerror') => any): this
```
<!-- @formatter:on -->

#### Parameters

- `onRejected`: Function called when the thread encounters an error

#### Returns

- This instance for chaining

#### Example

```ts
const thread = new FunctionThread({
  workerFn: async () => {
    throw new Error("Something went wrong");
  }
});

thread.catch((error, type) => {
  console.error(`Error type: ${type}`);
  console.error(error);
});

thread.start();
```

### finally

Adds a callback that will be called when the thread exits, regardless of success or failure.

<!-- @formatter:off -->
```ts
finally(onFinally: () => void): this
```
<!-- @formatter:on -->

#### Parameters

- `onFinally`: Function called when the thread exits

#### Returns

- This instance for chaining

#### Example

```ts
const thread = new FunctionThread({
  workerFn: async () => {
    // Some work
  }
});

thread.finally(() => {
  console.log('Thread finished, clean up resources');
});

thread.start();
```

## Events

The FunctionThread class emits the following events:

### init
When the thread is initialized and starts execution.

### message
When the thread completes successfully with a result.

### error
When the thread throws an error directly during execution.

### messageerror
When the thread's promise rejects with an error.

### exit
When the thread completes execution (either success or error).

### status
When the thread status changes.

#### Example

```ts
const thread = new FunctionThread({
  workerFn: async () => {
    return await processData();
  }
});

thread.on('init', () => {
  console.log('Thread started processing');
});

thread.on('message', (result) => {
  console.log('Processing complete:', result);
});

thread.on('error', (error) => {
  console.error('Processing error:', error);
});

thread.on('exit', (exitCode) => {
  console.log(`Thread exited with code: ${exitCode}`);
});

thread.on('status', (status, newState, oldState) => {
  console.log(`Status changed from ${oldState} to ${newState}`);
});

thread.start();
```

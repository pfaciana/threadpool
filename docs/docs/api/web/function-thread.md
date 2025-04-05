---
sidebar_position: 1
---

# WebFunctionThread

Manages a function-based thread in web environments. WebFunctionThread wraps an asynchronous function with thread-like status tracking and eventing capabilities, allowing it to be managed similar to actual web workers but without the overhead of creating separate worker threads.

```ts
// Create a thread to perform a calculation
const thread = new WebFunctionThread({
  workerFn: async () => {
    // Simulate complex work
    await new Promise(resolve => setTimeout(resolve, 500));
    return 42;
  },
  meta: { id: "calculation-1" }
});

// Listen for events
thread.addEventListener('message', (event) => {
  console.log('Result:', event.detail);
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

### WebFunctionThreadOptions

Options for creating a WebFunctionThread instance.

```ts
type WebFunctionThreadOptions = {
  workerFn: () => Promise<any>;  // The async function to execute in the thread
  meta?: any;                    // Optional metadata to associate with the thread
};
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

Gets the latest message received from the thread.

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

```ts
meta: any | undefined
```

## Methods

### constructor

Creates a new WebFunctionThread.

<!-- @formatter:off -->
```ts
constructor({ workerFn, meta }: WebFunctionThreadOptions)
```
<!-- @formatter:on -->

#### Parameters

- `options`: Configuration options containing the worker function to execute and optional metadata

#### Example

```ts
// Create a thread to perform a calculation
const thread = new WebFunctionThread({
  workerFn: async () => {
    // Simulate complex work
    await new Promise(resolve => setTimeout(resolve, 500))
    return 42
  },
  meta: { id: 'calculation-1' },
})
```

### start

Starts execution of the thread function. Once started, the thread cannot be started again.

<!-- @formatter:off -->
```ts
start(): boolean
```
<!-- @formatter:on -->

#### Returns

- `boolean`: True if the thread was started, false if it was already running

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
const thread = new WebFunctionThread({
  workerFn: async () => {
    return 42
  },
})

thread.then(result => {
  console.log(`The answer is: ${result}`)
})

thread.start()
```

### catch

Adds a callback to handle errors from the thread.

<!-- @formatter:off -->
```ts
catch(onRejected: (reason: any, type: 'error' | 'messageerror') => any): this
```
<!-- @formatter:on -->

#### Parameters

- `onRejected`: Function called when the thread encounters an error

#### Returns

- This instance for chaining

#### Example

```ts
const thread = new WebFunctionThread({
  workerFn: async () => {
    throw new Error('Something went wrong')
  },
})

thread.catch((error, type) => {
  console.error(`Error type: ${type}`)
  console.error(error)
})

thread.start()
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
const thread = new WebFunctionThread({
  workerFn: async () => {
    // Some work
  },
})

thread.finally(() => {
  console.log('Thread finished, clean up resources')
})

thread.start()
```

## Events

Events dispatched during execution:

### init

When the thread starts

### message

When the thread completes successfully

### error

When the thread throws an error directly

### messageerror

When the thread's promise rejects

### exit

When the thread completes (either success or error)

### status

When the thread status changes


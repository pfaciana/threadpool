---
sidebar_position: 3
---

# Worker

Enhanced Worker implementation that extends Node.js worker_threads.Worker. This class adds environment variable sharing across different Node.js runtime environments, exit event fallback for environments where worker exit events aren't natively supported, and better cross-runtime compatibility (Node.js, Deno, Bun).

```ts
// Create a worker with exit fallback for compatibility
const worker = new Worker('./worker-script.js', {
  exitFallback: true,
  workerData: { inputData: [1, 2, 3] }
});

// Listen for messages
worker.on('message', (result) => {
  console.log('Worker result:', result);
});

// Listen for exit (works consistently across environments)
worker.on('exit', (code) => {
  console.log(`Worker exited with code ${code}`);
});
```

## Types

### ThreadWorkerOptions

Extended options for creating a Worker instance.

```ts
type ThreadWorkerOptions = WorkerOptions & {
  file?: string | URL;     // Path to the worker script file
  meta?: any;              // Optional metadata to associate with the worker
  exitFallback?: boolean;  // Whether to use message-based exit fallback
};
```

## Methods

### constructor

Creates a new Worker instance.

<!-- @formatter:off -->
```ts
constructor(filename: string | URL, options?: WorkerOptions)
```
<!-- @formatter:on -->

#### Parameters

- `filename`: Path to the worker script file
- `options`: (Optional) Worker options

#### Examples

```ts
// With default options
const worker = new Worker('./worker.js')

// With environment sharing and worker data
const worker = new Worker('./worker.js', {
  workerData: { config: { maxItems: 100 } },
  env: SHARE_ENV,
})

// With exit fallback for cross-runtime compatibility
const worker = new Worker('./worker.js', {
  exitFallback: true,
  workerData: { inputData: [1, 2, 3] },
})
```

### on

Adds an event listener for the specified event. The listener persists until removed.

<!-- @formatter:off -->
```ts
on(event: string, listener: EventListener): this
```
<!-- @formatter:on -->

#### Parameters

- `event`: Event name
- `listener`: Event listener function

#### Returns

- This instance for chaining

### once

Adds a one-time event listener for the specified event. The listener is removed after being invoked once.

<!-- @formatter:off -->
```ts
once(event: string, listener: EventListener): this
```
<!-- @formatter:on -->

#### Parameters

- `event`: Event name
- `listener`: Event listener function

#### Returns

- This instance for chaining

### off

Removes an event listener for the specified event.

<!-- @formatter:off -->
```ts
off(event: string, listener: EventListener): this
```
<!-- @formatter:on -->

#### Parameters

- `event`: Event name
- `listener`: Event listener function to remove

#### Returns

- This instance for chaining

## Events

The Worker class emits several events that you can listen for:

### message

Emitted when the worker sends a message to the parent thread

### messageerror

Emitted when message deserialization fails

### error

Emitted when the worker throws an uncaught exception

### exit

Emitted when the worker exits (with exitCode)

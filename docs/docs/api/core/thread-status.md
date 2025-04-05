---
sidebar_position: 1
---

# ThreadStatus

Tracks the state of a thread throughout its lifecycle using bitwise flags to efficiently represent and check multiple states. Provides convenient boolean accessors for checking specific states.

```ts
const status = new ThreadStatus()
status.value = Status.READY

// Check if thread is ready
if (status.READY) {
  console.log('Thread is ready to start')
}

// Check if thread completed with an error
if (status.ERROR) {
  console.log('Thread encountered an error')
}
```

## Constants

### Status

Constants representing different thread states using bitwise flags. These values use bitwise flags to allow efficient checking of multiple states with a single operation. Each state is represented by a unique power of 2 to ensure clear bitwise operations.

```ts
const Status = {
  INIT: 1,         // Initial state when thread is first created
  READY: 2,        // Ready state when thread is prepared to run
  ACTIVE: 4,       // Active state when thread is currently executing
  SUCCESS: 8,      // Success state when thread has completed successfully
  ERROR: 16,       // Error state when thread has encountered an error
  COMPLETED: 24,   // Combined state for threads that have completed (SUCCESS | ERROR)
  STARTED: 28,      // Combined state for threads that have started (ACTIVE | COMPLETED)
}
```

## Properties

### value

Gets or sets the current status value.

<!-- @formatter:off -->
```ts
get value(): number
set value(state: number)
```
<!-- @formatter:on -->

#### Get
Returns the current status value.

#### Set
Sets the current status value.

Parameters:
- `state`: The new state value (typically from Status constants)

### INIT

Whether the thread is in INIT state.

<!-- @formatter:off -->
```ts
get INIT(): boolean
```
<!-- @formatter:on -->

### READY

Whether the thread is in READY state.

<!-- @formatter:off -->
```ts
get READY(): boolean
```
<!-- @formatter:on -->

### ACTIVE

Whether the thread is in ACTIVE state.

<!-- @formatter:off -->
```ts
get ACTIVE(): boolean
```
<!-- @formatter:on -->

### SUCCESS

Whether the thread has completed successfully.

<!-- @formatter:off -->
```ts
get SUCCESS(): boolean
```
<!-- @formatter:on -->

### ERROR

Whether the thread has completed with an error.

<!-- @formatter:off -->
```ts
get ERROR(): boolean
```
<!-- @formatter:on -->

### STARTED

Whether the thread has started (is either ACTIVE or COMPLETED).

<!-- @formatter:off -->
```ts
get STARTED(): boolean
```
<!-- @formatter:on -->

### COMPLETED

Whether the thread has completed (either SUCCESS or ERROR).

<!-- @formatter:off -->
```ts
get COMPLETED(): boolean
```
<!-- @formatter:on -->

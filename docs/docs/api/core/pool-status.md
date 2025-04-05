---
sidebar_position: 2
---

# TaskPool

Manages a pool of tasks with queuing and status tracking. Provides a system for managing concurrent tasks, limiting the number of simultaneously active tasks, and tracking task states as they move through the queue.

```ts
// Create a pool that will execute 2 tasks at a time
const pool = new TaskPool<string>({
  pingInterval: 100, // Check for available tasks every 100ms
  poolSize: 2,       // Run at most 2 tasks at once
  emitter: (event) => {
    if (event === 'ping') {
      // Try to start a new task
    } else if (event === 'complete') {
      console.log('All tasks completed')
    }
  },
})

// Add tasks to the pool
pool.enqueue('task1')
pool.enqueue('task2')

// Get the next task when ready
const task1 = pool.next()
const task2 = pool.next()
if (task1) {
  // Execute the task...
  // When done:
  pool.complete(task1)
}
console.log(task2) // task2
if (task2) {
  pool.complete(task2)
}
console.log(pool.isCompleted()) // true
```

## Types

### TaskPoolOptions

Configuration options for TaskPool.

```ts
type TaskPoolOptions = {
  pingInterval?: number;  // Interval in milliseconds to check for available tasks
  poolSize?: number;      // Maximum number of tasks that can be active simultaneously
  emitter?: (event: string) => void;  // Function called when pool events occur
};
```

### StatusField

Type defining valid status field names that can be queried.

```ts
type StatusField = 'queued' | 'active' | 'completed' | 'remaining' | 'started' | 'total' | typeof StatusAllField;
```

### StatusRawType

Type alias for the raw status type constant.

```ts
type StatusRawType = typeof StatusType.RAW;
```

### StatusCountType

Type alias for the count status type constant.

```ts
type StatusCountType = typeof StatusType.COUNT;
```

### CountStatusResponse

Type for count-based status responses.

```ts
type CountStatusResponse = { [K in StatusField]?: number };
```

### PercentStatusResponse

Type for percentage-based status responses.

```ts
type PercentStatusResponse = { [K in StatusField]?: number };
```

### RawStatus

Type for raw array status responses.

```ts
type RawStatus = { [K in StatusField]?: any[] };
```

### StatusResponse

Union type for all possible status response formats.

```ts
type StatusResponse<T = any> = RawStatus | CountStatusResponse | PercentStatusResponse | T[] | number;
```

## Constants

### StatusType

Constants defining the format of status response data.

```ts
const StatusType = {
  RAW: 'raw',      // Returns raw arrays of task items
  COUNT: 'count',  // Returns count of task items
  PERCENT: 3,       // Returns percentages with specified precision
}
```

### StatusAllField

Special value used to request all status fields.

```ts
const StatusAllField = '*';
```

## Properties

### pingInterval

Interval in milliseconds between task availability checks.

<!-- @formatter:off -->
```ts
pingInterval: number = 100
```
<!-- @formatter:on -->

### poolSize

Maximum number of tasks that can be active simultaneously.

<!-- @formatter:off -->
```ts
poolSize: number = 1
```
<!-- @formatter:on -->

### emitter

Function called when pool events occur ('ping', 'complete', 'startPinging', 'stopPinging').

<!-- @formatter:off -->
```ts
emitter: ((event: string) => void) | undefined
```
<!-- @formatter:on -->

## Methods

### constructor

Creates a new TaskPool with the specified options.

<!-- @formatter:off -->
```ts
constructor(options: TaskPoolOptions)
```
<!-- @formatter:on -->

#### Parameters

- `options`: Configuration options for the pool

### status

Gets status information about the task pool. Provides flexible access to task status information in various formats. Can return raw task arrays, counts, or percentages for any status field.

<!-- @formatter:off -->
```ts
status(fields: typeof StatusAllField, type: StatusCountType): CountStatusResponse
status(fields: typeof StatusAllField, type: StatusRawType): RawStatus
status(fields: typeof StatusAllField, type: number): PercentStatusResponse
status(fields: typeof StatusAllField): CountStatusResponse
status(fields: StatusField, type: StatusRawType): T[]
status(fields: StatusField, type: StatusCountType): number
status(fields: StatusField, type: number): number
status(fields: StatusField): number
status(fields: StatusField[], type: StatusRawType): RawStatus
status(fields: StatusField[], type: StatusCountType): CountStatusResponse
status(fields: StatusField[], type: number): PercentStatusResponse
status(fields: StatusField[]): CountStatusResponse
status(): CountStatusResponse
```
<!-- @formatter:on -->

#### Parameters

- `fields`: Status field(s) to retrieve
- `type`: Requested return format (raw arrays, counts, or percentages with specified precision)

#### Returns

Status information in the requested format

#### Examples

```ts
// Get raw count of tasks in each state
const counts = pool.status()
console.log(`${counts.active} tasks running, ${counts.queued} waiting`)

// Get percentage of completed tasks
const percent = pool.status('completed', StatusType.PERCENT)
console.log(`${percent}% of tasks completed`)

// Get raw task objects in 'active' state
const activeTasks = pool.status('active', StatusType.RAW)
```

### hasAvailableSlot

Checks if the pool has room for another active task.

<!-- @formatter:off -->
```ts
hasAvailableSlot(): boolean
```
<!-- @formatter:on -->

#### Returns

- `boolean`: True if another task can be started

### isReady

Checks if the pool is ready to process more tasks. A pool is ready when there are queued tasks and an available slot. This method also starts the ping interval if not already running.

<!-- @formatter:off -->
```ts
isReady(): boolean
```
<!-- @formatter:on -->

#### Returns

- `boolean`: True if there are queued tasks and an available slot

### isCompleted

Checks if all tasks in the pool have been completed.

<!-- @formatter:off -->
```ts
isCompleted(emit: boolean = false): boolean
```
<!-- @formatter:on -->

#### Parameters

- `emit`: (Optional) If true, emits the 'complete' event when all tasks are done. Defaults to false.

#### Returns

- `boolean`: True if all tasks have been completed

### enqueue

Adds a task to the queue.

<!-- @formatter:off -->
```ts
enqueue(item: T, check: boolean = false): void
```
<!-- @formatter:on -->

#### Parameters

- `item`: The task to enqueue
- `check`: (Optional) If true, checks if the item is currently active and removes it. Defaults to false.

### next

Gets the next task from the queue if the pool is ready.

<!-- @formatter:off -->
```ts
next(): T | false
```
<!-- @formatter:on -->

#### Returns

- `T | false`: The next task or false if no task is available

### complete

Marks a task as complete and moves it from active to completed.

<!-- @formatter:off -->
```ts
complete(item: T, check: boolean = true): boolean
```
<!-- @formatter:on -->

#### Parameters

- `item`: The task to complete
- `check`: (Optional) If true, verifies the item is currently active. Defaults to true.

#### Returns

- `boolean`: True if the item was successfully completed

## Functions

### round

Rounds a number to the specified precision.

<!-- @formatter:off -->
```ts
function round(num: number, precision: number = 0): number
```
<!-- @formatter:on -->

#### Parameters

- `num`: The number to round
- `precision`: (Optional) Number of decimal places, defaults to 0

#### Returns

The rounded number

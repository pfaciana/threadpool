import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Async Event Emitter

The `asyncEventEmitter` utility transforms a standard EventEmitter into an async function that supports timeouts and promise-based event handling. It's particularly useful for worker communication where you need to wait for responses with timeout capabilities.

## API Reference

### Function Signature

```typescript
function asyncEventEmitter(
  instance: EventEmitter,
  defaultTimeout: number = 1,
): AsyncEventEmitter
```

#### Parameters

- `instance`: An instance of Node's EventEmitter class
- `defaultTimeout`: (Optional) Default timeout in milliseconds. Defaults to 1ms

#### Returns

Returns an `AsyncEventEmitter` function with a `waitFor` method.

### AsyncEventEmitter Type

```typescript
type AsyncEventEmitter = {
  <T>(eventName: string, value: T, ...args): Promise<T>;
  waitFor: <T>(timeout: number, eventName: string, value: T, ...args) => Promise<T>;
}
```

The returned function has two ways to emit events:

1. **Direct Call**: `asyncEmit(eventName, value, ...args)`

- Uses default timeout
- Returns a Promise resolving to handler response

2. **waitFor Method**: `asyncEmit.waitFor(timeout, eventName, value, ...args)`

- Allows custom timeout
- Returns a Promise resolving to handler response

## Usage Examples

### Basic Usage

```javascript
// Create an async emitter from a standard EventEmitter
const emitter = new EventEmitter()
const asyncEmit = asyncEventEmitter(emitter, 100)

// Set up an event handler that modifies the value
emitter.on('transform', (callback, value) => {
  // Modify the value and call the callback
  callback(value * 2)
})

// Later, emit the event and get the transformed result
const result = await asyncEmit('transform', 5)
console.log(result) // 10

// With custom timeout (if the default is too short)
const resultWithTimeout = await asyncEmit.waitFor(500, 'transform', 7)
console.log(resultWithTimeout) // 14
```

### Custom Timeouts

```javascript
import { asyncEventEmitter } from '@renderdev/threadpool'
import { EventEmitter } from 'node:events'

// Create emitter with 100ms default timeout
const emitter = new EventEmitter()
const asyncEmit = asyncEventEmitter(emitter, 100)

// Using default timeout
const result1 = await asyncEmit('operation', data)

// Using custom timeout
const result2 = await asyncEmit.waitFor(500, 'operation', data)

// Handler that takes too long
emitter.on('operation', (callback, value) => {
  setTimeout(() => {
    callback(value) // Won't be called if timeout occurs first
  }, 1000)
})
```

### Multiple Arguments

```javascript
import { asyncEventEmitter } from '@renderdev/threadpool'
import { EventEmitter } from 'node:events'

const emitter = new EventEmitter()
const asyncEmit = asyncEventEmitter(emitter)

// Handler with multiple arguments
emitter.on('calculate', (callback, value, operation, multiplier) => {
  let result
  switch (operation) {
    case 'multiply':
      result = value * multiplier
      break
    case 'divide':
      result = value / multiplier
      break
    default:
      result = value
  }
  callback(result)
})

// Emit with extra arguments
const result = await asyncEmit('calculate', 10, 'multiply', 2)
console.log(result) // Outputs: 20
```

## Behavior Notes

### Timeout Handling

- If no listeners respond within the timeout, the original value is returned
- Timeout starts when the event is emitted
- Setting timeout to 0 effectively makes it synchronous

### No Listeners

- Checks if no listeners are registered, then returns the original value immediately
- No timeout is applied when there are no listeners

### Multiple Listeners

- Only the first listener to call the callback determines the result
- Other listeners still execute but their results are ignored

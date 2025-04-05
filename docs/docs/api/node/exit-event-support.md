---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Exit Event Support

The exit event support utilities provide tools for handling worker thread termination across different JavaScript runtimes (Node.js, Deno, and Bun). These utilities help ensure consistent worker cleanup behavior regardless of the runtime environment.

## API Reference

### exitEventSupported

Tests whether the current runtime properly supports worker 'exit' events.

```typescript
async function exitEventSupported(delay: number = 250): Promise<boolean>
```

#### Parameters

- `delay`: (Optional) Maximum time in milliseconds to wait for the exit event. Defaults to 250ms.

#### Returns

- `Promise<boolean>`: Resolves to `true` if exit events are properly supported, `false` otherwise.

### exitKey

A special message key used as a signal for thread termination in environments where worker 'exit' events aren't natively supported.

```typescript
const exitKey: string = '@@TerminateThread'
```

### close

Safely closes a worker thread's parent port connection.

```typescript
function close(parentPort: any): void
```

#### Parameters

- `parentPort`: The parentPort from worker_threads module

## Usage Examples

### Runtime Detection

```javascript
import { exitEventSupported } from '@renderdev/threadpool'

async function setupWorker() {
  const hasExitSupport = await exitEventSupported()

  if (hasExitSupport) {
    console.log('Using native exit events')
  } else {
    console.log('Using fallback message-based exit mechanism')
    process.env.USE_EXIT_FALLBACK = '1'
  }
}
```

### Worker Script Cleanup

```javascript
import { parentPort } from 'node:worker_threads'
import { close } from '@renderdev/threadpool'

// Your worker code here...

// When work is complete, safely close the worker
try {
  // Clean up resources...
  close(parentPort)
} catch (error) {
  console.error('Error during worker cleanup:', error)
  process.exit(1)
}
```

### Manual Exit Event Handling

```javascript
import { exitKey } from '@renderdev/threadpool'
import { Worker } from 'node:worker_threads'

const worker = new Worker('./worker.js')

// Listen for both standard exit and fallback exit
worker.on('exit', (code) => {
  console.log(`Worker exited with code ${code}`)
})

worker.on('message', (message) => {
  if (message === exitKey) {
    console.log('Received exit signal from worker')
    // Perform cleanup...
  }
})
```

## Runtime Behavior

### Node.js

- Native exit events are fully supported
- Fallback mechanism is not needed
- `close()` simply calls `parentPort.close()`

### Deno

- Exit event support varies by version
- Fallback mechanism used when needed
- Both exit events and message-based exit may be active

### Bun

- Exit event support may be incomplete
- Fallback mechanism is recommended
- Message-based exit ensures reliable cleanup

## Customizing Detection

You can customize the detection timeout based on your environment:

```typescript
// Increase detection timeout for slower environments
const hasSupport = await exitEventSupported(1000) // 1 second timeout

// Quick check for development
const hasSupport = await exitEventSupported(50) // 50ms timeout
```

## Internal Usage

These utilities are used internally by ThreadPool for:

- Runtime environment detection
- Worker pool cleanup coordination
- Cross-runtime compatibility
- Graceful worker termination

## Best Practices

1. **Always use close()**
   ```typescript
   import { close } from '@renderdev/threadpool'
   
   // Instead of parentPort.close()
   close(parentPort)
   ```

2. **Check Support on Startup**
   ```typescript
   import { exitEventSupported } from '@renderdev/threadpool'
   
   async function initialize() {
     const hasSupport = await exitEventSupported()
     // Configure your application accordingly
   }
   ```

3. **Handle Both Exit Types**
   ```typescript
   import { exitKey } from '@renderdev/threadpool'
   
   worker.on('exit', handleExit)
   worker.on('message', (msg) => {
     if (msg === exitKey) handleExit()
   })
   ```

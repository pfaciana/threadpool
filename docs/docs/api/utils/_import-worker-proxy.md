---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Import Worker Proxy

The Import Worker Proxy system is a sophisticated module import and proxying system that enables seamless communication with worker threads. It provides type-safe worker module imports with configurable execution patterns.

## API Reference

### importWorkerProxy

The core function for importing and proxying worker modules.

```typescript
function importWorkerProxy<T extends object>(
  filename: string | URL,
  options?: ImportOptions,
): Promise<T & Terminable>
```

#### Parameters

- `filename`: Path to the worker module (string or URL)
- `options`: Configuration options for the worker import

#### Returns

A Promise resolving to the proxied module with termination capability.

### ImportOptions Interface

```typescript
interface ImportOptions {
  isBrowser?: boolean;              // Whether running in browser environment
  isSharedWorker?: boolean;         // Whether to use SharedWorker
  isPersistent?: boolean;           // Keep worker alive across calls
  executeImmediately?: boolean;     // Run function immediately or return thunk
  terminateKey?: string;            // Name of termination method
  WorkerType?: typeof Worker;       // Worker constructor to use
  workerFile?: URL | string;        // Worker script location
  workerOptions?: WorkerOptions;    // Options for worker instantiation
}
```

### MessageOptions Interface

```typescript
interface MessageOptions {
  timeout?: number;        // Message timeout in milliseconds
  signal?: AbortSignal;   // AbortSignal for cancellation
  returnEvent?: boolean;   // Return full event object
}
```

### Terminable Interface

```typescript
interface Terminable {
  terminate(): void;  // Method to terminate the worker
}
```

## Usage Examples

### Basic Module Import

<Tabs>
<TabItem value="ts" label="TypeScript" default>

```typescript
import { importWorkerProxy } from '@renderdev/threadpool'
import type * as MathModule from './math'

interface MathWorker {
  add(a: number, b: number): Promise<number>;
  multiply(a: number, b: number): Promise<number>;
}

async function main() {
  // Import the module with type safety
  const math = await importWorkerProxy<MathWorker>('./math.ts', {
    isPersistent: true,
  })

  // Use the proxied methods
  const sum = await math.add(5, 3)
  const product = await math.multiply(4, 2)

  // Terminate when done
  math.terminate()
}
```

</TabItem>
<TabItem value="js" label="JavaScript">

```javascript
import { importWorkerProxy } from '@renderdev/threadpool'

async function main() {
  // Import the module
  const math = await importWorkerProxy('./math.js', {
    isPersistent: true,
  })

  // Use the proxied methods
  const sum = await math.add(5, 3)
  const product = await math.multiply(4, 2)

  // Terminate when done
  math.terminate()
}
```

</TabItem>
</Tabs>

### Different Execution Patterns

<Tabs>
<TabItem value="ts" label="TypeScript" default>

```typescript
import { importWorkerProxy } from '@renderdev/threadpool'
import type * as MathModule from './math'

// Immediate execution (default)
const immediate = await importWorkerProxy<typeof MathModule>('./math.ts', {
  executeImmediately: true,
})
const result1 = await immediate.calculate(42)

// Deferred execution (thunk)
const deferred = await importWorkerProxy<typeof MathModule>('./math.ts', {
  executeImmediately: false,
})
const thunk = deferred.calculate(42)
const result2 = await thunk()
```

</TabItem>
<TabItem value="js" label="JavaScript">

```javascript
import { importWorkerProxy } from '@renderdev/threadpool'

// Immediate execution (default)
const immediate = await importWorkerProxy('./math.js', {
  executeImmediately: true,
})
const result1 = await immediate.calculate(42)

// Deferred execution (thunk)
const deferred = await importWorkerProxy('./math.js', {
  executeImmediately: false,
})
const thunk = deferred.calculate(42)
const result2 = await thunk()
```

</TabItem>
</Tabs>

### Worker Lifecycle Management

<Tabs>
<TabItem value="ts" label="TypeScript" default>

```typescript
import { importWorkerProxy } from '@renderdev/threadpool'
import type * as MathModule from './math'

// Persistent worker (reused across calls)
const persistent = await importWorkerProxy<typeof MathModule>('./math.ts', {
  isPersistent: true,
  terminateKey: 'shutdown', // Custom termination method name
})

// Use multiple times
await persistent.calculate(1)
await persistent.calculate(2)

// Terminate with custom method
persistent.shutdown()

// One-time worker (auto-terminates after use)
const oneTime = await importWorkerProxy<typeof MathModule>('./math.ts', {
  isPersistent: false,
})
await oneTime.calculate(42) // Worker terminates after this
```

</TabItem>
<TabItem value="js" label="JavaScript">

```javascript
import { importWorkerProxy } from '@renderdev/threadpool'

// Persistent worker (reused across calls)
const persistent = await importWorkerProxy('./math.js', {
  isPersistent: true,
  terminateKey: 'shutdown', // Custom termination method name
})

// Use multiple times
await persistent.calculate(1)
await persistent.calculate(2)

// Terminate with custom method
persistent.shutdown()

// One-time worker (auto-terminates after use)
const oneTime = await importWorkerProxy('./math.js', {
  isPersistent: false,
})
await oneTime.calculate(42) // Worker terminates after this
```

</TabItem>
</Tabs>

### Advanced Configuration

<Tabs>
<TabItem value="ts" label="TypeScript" default>

```typescript
import { importWorkerProxy } from '@renderdev/threadpool'
import type * as MathModule from './math'

const math = await importWorkerProxy<typeof MathModule>('./math.js', {
  // Worker configuration
  workerOptions: {
    name: 'MathWorker',
    type: 'module',
  },

  // Communication options
  messageOptions: {
    timeout: 5000,        // 5 second timeout
    returnEvent: true,     // Get full event object
  },

  // Environment settings
  isBrowser: true,        // Force browser mode
  isSharedWorker: true,    // Use SharedWorker
})

try {
  const result = await math.heavyCalculation()
} catch (error) {
  console.error('Worker error:', error)
} finally {
  math.terminate()
}
```

</TabItem>
<TabItem value="js" label="JavaScript">

```javascript
import { importWorkerProxy } from '@renderdev/threadpool'

const math = await importWorkerProxy('./math.js', {
  // Worker configuration
  workerOptions: {
    name: 'MathWorker',
    type: 'module',
  },

  // Communication options
  messageOptions: {
    timeout: 5000,        // 5 second timeout
    returnEvent: true,     // Get full event object
  },

  // Environment settings
  isBrowser: true,        // Force browser mode
  isSharedWorker: true,    // Use SharedWorker
})

try {
  const result = await math.heavyCalculation()
} catch (error) {
  console.error('Worker error:', error)
} finally {
  math.terminate()
}
```

</TabItem>
</Tabs>

## Environment Behavior

### Node.js/Deno/Bun

- Uses `worker_threads` module
- Full support for ESM and CommonJS
- Environment variables shared automatically

### Browser

- Uses Web Workers API
- Module workers supported
- SharedWorker option available

## Best Practices

1. **Always Handle Termination**
   ```typescript
   const worker = await importWorkerProxy('./module.js')
   try {
     await worker.process()
   } finally {
     worker.terminate()
   }
   ```

2. **Use Type Safety**
   ```typescript
   interface WorkerAPI {
     process(data: Input): Promise<Output>;
   }
   const worker = await importWorkerProxy<WorkerAPI>('./module.js')
   ```

3. **Configure Timeouts**
   ```typescript
   const worker = await importWorkerProxy('./module.js', {
     messageOptions: { timeout: 30000 }, // 30 second timeout
   })
   ```

## Internal Usage

The Import Worker Proxy is used by:

- `importWorker` function
- `importTaskWorker` function
- `importPersistentWorker` function
- `importWebWorker` function
- Thread pools for worker instantiation

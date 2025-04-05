import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TaskPool, StatusAllField, StatusType } from '@/index'

describe('TaskPool', () => {
	let pool: TaskPool<string>
	let emitterMock: ReturnType<typeof vi.fn>

	beforeEach(() => {
		emitterMock = vi.fn()
		pool = new TaskPool<string>({
			emitter: emitterMock,
			poolSize: 2,
		})
	})

	describe('status method', () => {
		it('should return raw status when asked for all fields with RAW type', () => {
			// Add some items to the pool
			pool.enqueue('task1')
			pool.enqueue('task2')

			// Get one item active
			pool.next()

			// Get status with RAW type
			const status = pool.status(StatusAllField, StatusType.RAW)

			// Verify result has all the expected properties
			expect(status).toHaveProperty('queued')
			expect(status).toHaveProperty('active')
			expect(status).toHaveProperty('completed')
			expect(status).toHaveProperty('remaining')
			expect(status).toHaveProperty('started')
			expect(status).toHaveProperty('total')

			// Verify the content
			expect(status.queued).toContain('task2')
			expect(status.active).toContain('task1')
			expect(status.completed).toEqual([])
			expect(status.remaining).toContain('task2')
			expect(status.started).toContain('task1')
			expect(status.total).toEqual(expect.arrayContaining(['task1', 'task2']))
		})

		it('should handle different status type parameters', () => {
			// Add some items to the pool
			pool.enqueue('task1')
			pool.enqueue('task2')
			pool.next() // task1 -> active

			// Get count status
			const countStatus = pool.status()
			expect(countStatus.queued).toBe(1)
			expect(countStatus.active).toBe(1)
			expect(countStatus.total).toBe(2)

			// Get percent status
			const percentStatus = pool.status(StatusAllField, 2)
			expect(percentStatus.queued).toBe(50)
			expect(percentStatus.active).toBe(50)
			expect(percentStatus.total).toBe(100)
		})

		it('should handle invalid status field', () => {
			expect(() => {
				// @ts-ignore - Testing runtime behavior with invalid input
				pool.status('invalid')
			}).toThrow('Invalid status field: "invalid"')
		})
	})

	describe('task management', () => {
		it('should correctly track task state through the lifecycle', () => {
			// Queue tasks
			pool.enqueue('task1')
			pool.enqueue('task2')

			// Check initial status
			expect(pool.status('queued')).toBe(2)
			expect(pool.status('active')).toBe(0)
			expect(pool.status('completed')).toBe(0)

			// Start a task
			const task1 = pool.next()
			expect(task1).toBe('task1')

			// Check status after starting
			expect(pool.status('queued')).toBe(1)
			expect(pool.status('active')).toBe(1)

			// Complete the task
			pool.complete('task1')

			// Check status after completion
			expect(pool.status('queued')).toBe(1)
			expect(pool.status('active')).toBe(0)
			expect(pool.status('completed')).toBe(1)
		})

		it('should not allow next() when the pool is already full', () => {
			// Queue tasks
			pool.enqueue('task1')
			pool.enqueue('task2')
			pool.enqueue('task3')

			// Start tasks to fill the pool
			const task1 = pool.next()
			expect(task1).toBe('task1')
			const task2 = pool.next()
			expect(task2).toBe('task2')

			// Try to start another task when the pool is full
			const task3 = pool.next()

			// Check that the third task was not started
			expect(task3).toBe(false)
			expect(pool.status('queued')).toBe(1)
			expect(pool.status('active')).toBe(2)
		})

		it('should handle completing a task that is not active', () => {
			const result = pool.complete('non-existent')
			expect(result).toBe(false)
		})

		it('should skip check when enqueuing with check=true', () => {
			// Add a task and make it active
			pool.enqueue('task1')
			pool.next()

			// Re-enqueue the same task with check=true
			pool.enqueue('task1', true)

			// The task should now be in the queue and not in active
			expect(pool.status('queued')).toBe(1)
			expect(pool.status('active')).toBe(0)
		})
	})

	describe('TaskPool additional tests', () => {
		let pool: TaskPool<string>
		let emitterMock: ReturnType<typeof vi.fn>

		beforeEach(() => {
			emitterMock = vi.fn()
			pool = new TaskPool<string>({
				emitter: emitterMock,
				poolSize: 2,
			})
		})

		it('should return false when next() is called on an empty queue', () => {
			const task = pool.next()
			expect(task).toBe(false)
		})

		it('should handle duplicate tasks correctly', () => {
			pool.enqueue('task1')
			pool.enqueue('task1')

			expect(pool.status('queued')).toBe(2)
			pool.next()
			expect(pool.status('active')).toBe(1)
			expect(pool.status('queued')).toBe(1)
		})

		it('should handle complete() called multiple times on the same task', () => {
			pool.enqueue('task1')
			const task = pool.next()
			pool.complete(task as string)
			const result = pool.complete(task as string)
			expect(result).toBe(false)
			expect(pool.status('completed')).toBe(1)
		})
	})

	describe('completion handling', () => {
		it('should emit complete event when all tasks are done', () => {
			// Force microtask to execute synchronously for testing
			vi.spyOn(global, 'queueMicrotask').mockImplementation(fn => fn())

			// Add tasks and process them
			pool.enqueue('task1')
			const task = pool.next()

			// Reset the mock to check only the complete event
			emitterMock.mockClear()

			// Complete the task, which should trigger the completion check
			pool.complete(task as string)

			// Verify the emitter was called with 'complete'
			expect(emitterMock).toHaveBeenCalledWith('complete')
		})

		it('should not emit complete event multiple times', () => {
			// Force microtask to execute synchronously for testing
			vi.spyOn(global, 'queueMicrotask').mockImplementation(fn => fn())

			// Add and complete a task
			pool.enqueue('task1')
			const task = pool.next()
			pool.complete(task as string)

			// Reset the mock to check if it gets called again
			emitterMock.mockClear()

			// Check completion again - should not emit 'complete' again
			pool.isCompleted(true)

			// Verify the emitter was not called again with 'complete'
			expect(emitterMock).not.toHaveBeenCalled()
		})

		it('should start and stop pinging correctly', () => {
			vi.useFakeTimers()

			// Create a new pool to ensure interval state is clean
			pool = new TaskPool<string>({
				emitter: emitterMock,
				poolSize: 2,
				pingInterval: 100,
			})

			// Add a task to make isReady() start pinging
			pool.enqueue('task1')
			pool.isReady()

			// Verify the emitter was called with 'ping' after interval
			vi.advanceTimersByTime(101)
			expect(emitterMock).toHaveBeenCalledWith('ping')

			// Mock queueMicrotask to execute synchronously
			vi.spyOn(global, 'queueMicrotask').mockImplementation(fn => fn())

			// Complete the task and confirm it's done
			const task = pool.next()
			pool.complete(task as string)

			// Reset the mock before checking that pinging has stopped
			emitterMock.mockClear()

			// Clear any pending intervals
			vi.runOnlyPendingTimers()

			// Advance time to check if more pings are emitted
			vi.advanceTimersByTime(101)

			// Since we've completed all tasks, no more pings should be emitted
			expect(emitterMock).not.toHaveBeenCalled()

			vi.useRealTimers()
		})
	})

	describe('edge cases', () => {
		it('should handle mixed states correctly when checking isReady', () => {
			expect(pool.isReady()).toBe(false)

			pool.enqueue('task1')
			pool.enqueue('task2')
			pool.enqueue('task3')
			pool.enqueue('task4')
			expect(pool.isReady()).toBe(true)

			const task = pool.next()
			expect(pool.isReady()).toBe(true)
			pool.next()
			expect(pool.isReady()).toBe(false)
			pool.complete(task as string)
			expect(pool.isReady()).toBe(true)

			expect(pool.isReady()).toBe(true)
			expect(pool.status('queued')).toBe(2)
			expect(pool.status('active')).toBe(1)
			expect(pool.status('completed')).toBe(1)
		})

		it('should maintain correct state when tasks are re-enqueued after completion', () => {
			pool.enqueue('task1')
			const task = pool.next()
			pool.complete(task as string)
			expect(pool.status('completed')).toBe(1)
			expect(pool.status('queued')).toBe(0)

			pool.enqueue('task1')
			expect(pool.status('completed')).toBe(1)
			expect(pool.status('queued')).toBe(1)
		})

		it('should handle zero poolSize correctly', () => {
			pool = new TaskPool<string>({
				emitter: emitterMock,
				poolSize: 0,
			})
			pool.enqueue('task1')

			expect(pool.next()).toBe(false)
			expect(pool.hasAvailableSlot()).toBe(false)
		})

		it('should reset hasCompleted flag when new tasks are enqueued', () => {
			pool.enqueue('task1')
			const task = pool.next()
			pool.complete(task as string)

			// Force completion check
			pool.isCompleted(true)
			expect(emitterMock).toHaveBeenCalledWith('complete')

			// Reset mock and add new task
			emitterMock.mockClear()
			pool.enqueue('task2')

			// Complete the new task
			const task2 = pool.next()
			pool.complete(task2 as string)
			pool.isCompleted(true)

			// Should emit complete again
			expect(emitterMock).toHaveBeenCalledWith('complete')
		})
	})

	describe('security edge cases', () => {
		it('should safely handle prototype pollution attempts', () => {
			// Attempt to pollute using special property names
			pool.enqueue('__proto__')
			pool.enqueue('constructor')
			// @ts-ignore - Testing runtime behavior
			pool.enqueue({ '__proto__': { malicious: true } })

			// Verify tasks were added normally
			expect(pool.status('queued')).toBe(3)

			// Verify no prototype pollution occurred
			// @ts-ignore
			expect({}.malicious).toBeUndefined()
			expect(Object.prototype).not.toHaveProperty('malicious')
		})

		it('should handle attempts to exhaust memory', () => {
			const hugeArray = new Array(1000000).fill('task')
			hugeArray.forEach(task => pool.enqueue(task))

			expect(pool.status('total')).toBe(1000000)
			expect(pool.isReady()).toBe(true)
		})

		it('should handle malicious task values', () => {
			const maliciousTasks = [
				'',
				undefined,
				null,
				{},
				[],
				new Function('return this')(),
				Symbol('task'),
				// Circular reference
				(() => {
					const obj: any = {}
					obj.self = obj
					return obj
				})(),
			]

			maliciousTasks.forEach(task => {
				pool.enqueue(task)
			})

			const task = pool.next()
			pool.complete(task as string)
		})
	})

	describe('type variations', () => {
		it('should handle number type tasks', () => {
			const numPool = new TaskPool<number>({ poolSize: 2 })
			numPool.enqueue(42)
			numPool.enqueue(123)

			const task = numPool.next() as number
			expect(task).toBe(42)
			numPool.complete(task)
			expect(numPool.status('completed')).toBe(1)
		})

		it('should handle object type tasks', () => {
			interface Task {
				id: number;
				data: string
			}

			const objPool = new TaskPool<Task>({ poolSize: 2 })

			const task1 = { id: 1, data: 'foo' }
			const task2 = { id: 2, data: 'bar' }

			objPool.enqueue(task1)
			objPool.enqueue(task2)

			const active = objPool.next() as Task
			expect(active.id).toBe(1)
			expect(active.data).toBe('foo')
		})

		it('should handle array type tasks', () => {
			const arrayPool = new TaskPool<number[]>({ poolSize: 2 })
			arrayPool.enqueue([1, 2, 3])
			arrayPool.enqueue([4, 5, 6])

			const task = arrayPool.next() as number[]
			expect(task).toEqual([1, 2, 3])
		})

		it('should handle union type tasks', () => {
			const unionPool = new TaskPool<string | number>({ poolSize: 2 })
			unionPool.enqueue('test')
			unionPool.enqueue(42)

			const task1 = unionPool.next()
			const task2 = unionPool.next()
			expect(typeof task1).toBe('string')
			expect(typeof task2).toBe('number')
		})

		it('should handle complex nested type tasks', () => {
			type ComplexTask = {
				id: number;
				data: {
					values: (string | number)[];
					metadata?: Record<string, unknown>;
				};
			}

			const complexPool = new TaskPool<ComplexTask>({ poolSize: 1 })
			const task = {
				id: 1,
				data: {
					values: ['test', 42],
					metadata: { timestamp: Date.now() },
				},
			}

			complexPool.enqueue(task)
			const active = complexPool.next() as ComplexTask
			expect(active.id).toBe(1)
			expect(active.data.values).toHaveLength(2)
		})
	})

	describe('mixed unknown types', () => {
		it('should handle a pool of unknown mixed types', () => {
			const mixedPool = new TaskPool<unknown>({ poolSize: 3 })

			// Add various types of tasks
			const tasks = [
				42,                                      // number
				'string',                               // string
				{ id: 1 },                             // object
				[1, 2, 3],                             // array
				new Date(),                            // Date object
				new Map([['key', 'value']]),           // Map
				new Set([1, 2, 3]),                    // Set
				/regex/,                               // RegExp
				new Error('test error'),               // Error
				new Promise(resolve => resolve(true)),   // Promise
			]

			// Enqueue all tasks
			tasks.forEach(task => mixedPool.enqueue(task))
			expect(mixedPool.status('queued')).toBe(tasks.length)

			// Process tasks
			const results: unknown[] = []
			let task: unknown
			while ((task = mixedPool.next()) !== false) {
				results.push(task)
				mixedPool.complete(task)
			}

			// Verify results
			expect(results).toHaveLength(tasks.length)
			expect(results[0]).toBe(42)
			expect(results[1]).toBe('string')
			expect(results[2]).toEqual({ id: 1 })
			expect(Array.isArray(results[3])).toBe(true)
			expect(results[4]).toBeInstanceOf(Date)
			expect(results[5]).toBeInstanceOf(Map)
			expect(results[6]).toBeInstanceOf(Set)
			expect(results[7]).toBeInstanceOf(RegExp)
			expect(results[8]).toBeInstanceOf(Error)
			expect(results[9]).toBeInstanceOf(Promise)
		})

		it('should handle nested mixed types', () => {
			type MixedContainer = {
				number: number;
				string: string;
				array: unknown[];
				nested: {
					date: Date;
					map: Map<string, unknown>;
				};
			}

			const mixedPool = new TaskPool<MixedContainer>({ poolSize: 2 })
			const mixedTask: MixedContainer = {
				number: 42,
				string: 'test',
				array: [1, 'two', { three: 3 }],
				nested: {
					date: new Date(),
					map: new Map([['key', { value: true }]]),
				},
			}

			mixedPool.enqueue(mixedTask)
			const result = mixedPool.next() as MixedContainer

			expect(result.number).toBe(42)
			expect(result.string).toBe('test')
			expect(result.array).toHaveLength(3)
			expect(result.nested.date).toBeInstanceOf(Date)
			expect(result.nested.map.get('key')).toEqual({ value: true })
		})

		it('should handle explicitly any typed pool', () => {
			const anyPool = new TaskPool<any>({ poolSize: 2 })
			anyPool.enqueue('task1')
			anyPool.enqueue(42)

			const task1 = anyPool.next() as string
			expect(task1).toBe('task1')

			const task = anyPool.next()
			expect(task * 2).toBe(84)

			// Can call non-existent methods without compile error
			task.nonExistentMethod?.()
		})

		it('should handle untyped pool', () => {
			const untypedPool = new TaskPool({ poolSize: 2 })
			untypedPool.enqueue('task1')
			untypedPool.enqueue(42)

			const task1 = untypedPool.next() as string
			expect(task1).toBe('task1')

			const task2 = untypedPool.next() as number
			expect(task2 * 2).toBe(84)
		})
	})
})

import { describe, it, expect, beforeEach } from 'vitest'
import { Status, ThreadStatus } from '@/index'

describe('ThreadStatus', () => {
	let threadStatus: ThreadStatus

	beforeEach(() => {
		threadStatus = new ThreadStatus()
	})

	describe('STATUS static object', () => {
		it('should have correct status values', () => {
			expect(Status.INIT).toBe(1)
			expect(Status.READY).toBe(2)
			expect(Status.ACTIVE).toBe(4)
			expect(Status.SUCCESS).toBe(8)
			expect(Status.ERROR).toBe(16)
		})

		it('should calculate COMPLETED status correctly', () => {
			expect(Status.COMPLETED).toBe(
				Status.SUCCESS | Status.ERROR,
			)
		})

		it('should calculate STARTED status correctly', () => {
			expect(Status.STARTED).toBe(
				Status.ACTIVE | Status.COMPLETED,
			)
		})

		it('should be frozen/immutable', () => {
			expect(Object.isFrozen(Status)).toBe(true)
		})
	})

	describe('state management', () => {
		it('should initialize with INIT state', () => {
			expect(threadStatus.value).toBe(Status.INIT)
		})

		it('should allow state changes', () => {
			threadStatus.value = Status.READY
			expect(threadStatus.value).toBe(Status.READY)
		})
	})

	describe('status getters', () => {
		it('should correctly identify INIT state', () => {
			expect(threadStatus.INIT).toBe(true)
			threadStatus.value = Status.READY
			expect(threadStatus.INIT).toBe(false)
		})

		it('should correctly identify READY state', () => {
			expect(threadStatus.READY).toBe(false)
			threadStatus.value = Status.READY
			expect(threadStatus.READY).toBe(true)
		})

		it('should correctly identify ACTIVE state', () => {
			expect(threadStatus.ACTIVE).toBe(false)
			threadStatus.value = Status.ACTIVE
			expect(threadStatus.ACTIVE).toBe(true)
		})

		it('should correctly identify SUCCESS state', () => {
			expect(threadStatus.SUCCESS).toBe(false)
			threadStatus.value = Status.SUCCESS
			expect(threadStatus.SUCCESS).toBe(true)
		})

		it('should correctly identify ERROR state', () => {
			expect(threadStatus.ERROR).toBe(false)
			threadStatus.value = Status.ERROR
			expect(threadStatus.ERROR).toBe(true)
		})

		it('should correctly identify STARTED state', () => {
			expect(threadStatus.STARTED).toBe(false)
			threadStatus.value = Status.ACTIVE
			expect(threadStatus.STARTED).toBe(true)
			threadStatus.value = Status.SUCCESS
			expect(threadStatus.STARTED).toBe(true)
		})

		it('should correctly identify COMPLETED state', () => {
			expect(threadStatus.COMPLETED).toBe(false)
			threadStatus.value = Status.SUCCESS
			expect(threadStatus.COMPLETED).toBe(true)
			threadStatus.value = Status.ERROR
			expect(threadStatus.COMPLETED).toBe(true)
		})
	})

	describe('complex state combinations', () => {
		it('should handle multiple states using bitwise operations', () => {
			threadStatus.value = Status.ACTIVE | Status.ERROR
			expect(threadStatus.ACTIVE).toBe(true)
			expect(threadStatus.ERROR).toBe(true)
			expect(threadStatus.SUCCESS).toBe(false)
			expect(threadStatus.COMPLETED).toBe(true)
			expect(threadStatus.STARTED).toBe(true)
		})
	})
})

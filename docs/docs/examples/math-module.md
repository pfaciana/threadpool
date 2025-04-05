---
sidebar_position: 1
title: Base Module
---

# Base Module

Throughout the examples in this documentation, we will be using this math module to demonstrate various concepts.
It will be referred to as `./math.ts` and `./math.js` for TypeScript and JavaScript, respectively.

This module includes a few concepts to understand.

* **CPU-Intensive Code**: A collection of resource-intensive functions to demonstrate long-running tasks
* **State**: State is tracked locally and can be read globally
  * `state` is mutated when calling the `add` function, in this example
  * This is important to understand when working with `Persistent` workers
* **Types**: The functions are well documented with JSDoc and TypeScript types
  * Since we are technically running a worker on a separate thread, "normally" IDEs will lack context of the types
  * This demonstrates that, with this package, IDEs will still be able to do type checking and provide IntelliSense in the "main" thread

:::tip
For this library, the contents of the module being imported is arbitrary. You can import any JavaScript or TypeScript module you'd like!
No special modifications are needed, any old module will do!
:::

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="programming-language">
  <TabItem value="typescript" label="TypeScript" default>

```typescript
/** State counter used by some functions */
export let state = 0

/**
 * Returns the current state counter value
 * @returns {number} The current state value
 */
export function getState(): number {
  return state
}

/**
 * Adds two numbers and increments the state
 * @param {number} a First number to add
 * @param {number} b Second number to add
 * @returns {number} Sum of the numbers
 * @example add(2, 3) // returns 5
 */
export function add(a: number, b: number): number {
  state++
  return a + b
}

/**
 * Calculates the nth Fibonacci number using recursion
 * @param {number} n Position in Fibonacci sequence
 * @returns {number} The nth Fibonacci number
 * @example fib(6) // returns 8
 * @warning Not recommended for large values of n due to recursive implementation
 */
export function fib(n: number): number {
  return n <= 2 ? 1 : fib(n - 1) + fib(n - 2)
}

/**
 * Calculates the nth Tribonacci number using recursion
 * @param {number} n Input number
 * @returns {number} Sum of three previous recursions
 * @warning Extremely inefficient for n > 20
 * @note Intentionally complex for testing purposes
 * @example tribonacci(30) // returns 280571172992510140
 */
export function tribonacci(n: number): number {
  return n <= 1 ? n : tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3)
}

/**
 * Calculates the factorial of a non-negative integer
 * @param {number} n Non-negative integer
 * @returns {number} Factorial of n
 * @example factorial(155) // returns 4.789142901463391e+273
 * @warning Not recommended for large values due to potential overflow
 */
export function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1)
}

/**
 * Determines if a number is prime
 * @param {number} n Number to check
 * @returns {boolean} true if the number is prime, false otherwise
 * @example isPrime(17) // returns true
 */
export function isPrime(n: number): boolean {
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false
  return n > 1
}

/**
 * Generates an array of random prime numbers
 * @param {number} quota Number of prime numbers to generate
 * @param {number} [maximum=1000000] Upper limit for generated numbers
 * @returns {number[]} Array of random prime numbers
 * @example generatePrimes(5, 100) // returns array of 5 random prime numbers <= 100
 */
export function generatePrimes(quota: number, maximum: number = 1000000): number[] {
  const primes: number[] = []
  while (primes.length < quota) {
    const n = Math.floor(Math.random() * maximum)
    if (isPrime(n)) primes.push(n)
  }
  return primes
}

/**
 * Selects a random element from an array
 * @param {Array} arr Input array of any type
 * @returns {*} Random element from the array
 * @example getRandomFromArray([1,2,3,4,5]) // returns random number from array
 */
export function getRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Finds all prime numbers up to a given number using Sieve of Eratosthenes algorithm
 * @param {number} n Upper limit to find primes up to
 * @returns {number[]} Array of all prime numbers up to n
 * @example findPrimesUpTo(10) // returns [2,3,5,7]
 */
export function findPrimesUpTo(n: number): number[] {
  const sieve = Array(n + 1).fill(true)
  for (let i = 2; i * i <= n; i++)
    if (sieve[i]) for (let j = i * i; j <= n; j += i) sieve[j] = false
  return Array.from({ length: n - 1 }, (_, i) => i + 2).filter(i => sieve[i])
}

/**
 * Estimates the value of π using the Leibniz formula
 * @param {number} decimals Number of iterations to use in calculation (higher means more accurate)
 * @returns {number} Estimated value of π
 * @example estimatePi(25) // returns 3.1415926535897
 */
export function estimatePi(decimals: number): number {
  const tolerance = Math.pow(10, -(decimals + 1))
  let pi = 3, sign = 1, n = 2, term = 4 / (n * (n + 1) * (n + 2))

  while (Math.abs(term) > tolerance) {
    pi += sign * term
    sign *= -1
    n += 2
    term = 4 / (n * (n + 1) * (n + 2))
  }

  return Number(pi.toFixed(decimals))
}
```

  </TabItem>
  <TabItem value="javascript" label="JavaScript">

```javascript
/** State counter used by some functions */
export let state = 0

/**
 * Returns the current state counter value
 * @returns {number} The current state value
 */
export function getState() {
  return state
}

/**
 * Adds two numbers and increments the state
 * @param {number} a First number to add
 * @param {number} b Second number to add
 * @returns {number} Sum of the numbers
 * @example add(2, 3) // returns 5
 */
export function add(a, b) {
  state++
  return a + b
}

/**
 * Calculates the nth Fibonacci number using recursion
 * @param {number} n Position in Fibonacci sequence
 * @returns {number} The nth Fibonacci number
 * @example fib(6) // returns 8
 * @warning Not recommended for large values of n due to recursive implementation
 */
export function fib(n) {
  return n <= 2 ? 1 : fib(n - 1) + fib(n - 2)
}

/**
 * Calculates the nth Tribonacci number using recursion
 * @param {number} n Input number
 * @returns {number} Sum of three previous recursions
 * @warning Extremely inefficient for n > 20
 * @note Intentionally complex for testing purposes
 * @example tribonacci(30) // returns 280571172992510140
 */
export function tribonacci(n) {
  return n <= 1 ? n : tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3)
}

/**
 * Calculates the factorial of a non-negative integer
 * @param {number} n Non-negative integer
 * @returns {number} Factorial of n
 * @example factorial(5) // returns 120
 * @warning Not recommended for large values due to potential overflow
 */
export function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1)
}

/**
 * Determines if a number is prime
 * @param {number} n Number to check
 * @returns {boolean} true if the number is prime, false otherwise
 * @example isPrime(17) // returns true
 */
export function isPrime(n) {
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false
  return n > 1
}

/**
 * Generates an array of random prime numbers
 * @param {number} quota Number of prime numbers to generate
 * @param {number} [maximum=1000000] Upper limit for generated numbers
 * @returns {number[]} Array of random prime numbers
 * @example generatePrimes(5, 100) // returns array of 5 random prime numbers <= 100
 */
export function generatePrimes(quota, maximum = 1000000) {
  const primes = []
  while (primes.length < quota) {
    const n = Math.floor(Math.random() * maximum)
    if (isPrime(n)) primes.push(n)
  }
  return primes
}

/**
 * Selects a random element from an array
 * @param {Array} arr Input array of any type
 * @returns {*} Random element from the array
 * @example getRandomFromArray([1,2,3,4,5]) // returns random number from array
 */
export function getRandomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Finds all prime numbers up to a given number using Sieve of Eratosthenes algorithm
 * @param {number} n Upper limit to find primes up to
 * @returns {number[]} Array of all prime numbers up to n
 * @example findPrimesUpTo(10) // returns [2,3,5,7]
 */
export function findPrimesUpTo(n) {
  const sieve = Array(n + 1).fill(true)
  for (let i = 2; i * i <= n; i++)
    if (sieve[i]) for (let j = i * i; j <= n; j += i) sieve[j] = false
  return Array.from({ length: n - 1 }, (_, i) => i + 2).filter(i => sieve[i])
}

/**
 * Estimates the value of π
 * @param {number} decimals Number of iterations to use in calculation (higher means more accurate)
 * @returns {number} Estimated value of π
 * @example estimatePi(25) // returns 3.1415926535897
 */
export function estimatePi(decimals) {
  const tolerance = Math.pow(10, -(decimals + 1))
  let pi = 3, sign = 1, n = 2, term = 4 / (n * (n + 1) * (n + 2))

  while (Math.abs(term) > tolerance) {
    pi += sign * term
    sign *= -1
    n += 2
    term = 4 / (n * (n + 1) * (n + 2))
  }

  return Number(pi.toFixed(decimals))
}
```

  </TabItem>
</Tabs>

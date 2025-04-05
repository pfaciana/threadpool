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
 * @returns {number} Sum of the numbers plus incremented state
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
 * @param {number} n Number of iterations to use in calculation (higher means more accurate)
 * @returns {number} Estimated value of π
 * @example estimatePi(1000000) // returns 3.1415926535897
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
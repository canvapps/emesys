/**
 * Mock math file for Trinity validator tests
 * @description Math utilities for testing Trinity validation
 */

import { utils } from './index';

export class MathUtils {
  /**
   * Calculate factorial
   * @param n Input number
   * @returns Factorial of n
   */
  factorial(n: number): number {
    if (!utils.validate(n) || n < 0) {
      throw new Error('Invalid input');
    }
    return n === 0 ? 1 : n * this.factorial(n - 1);
  }

  /**
   * Check if number is prime
   * @param n Input number
   * @returns True if prime, false otherwise
   */
  isPrime(n: number): boolean {
    if (!utils.validate(n) || n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }
}
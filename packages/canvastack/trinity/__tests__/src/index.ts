/**
 * Mock index file for Trinity validator tests
 * @description Test utilities for Trinity validation testing
 */

export class Calculator {
  /**
   * Add two numbers
   * @param a First number
   * @param b Second number
   * @returns Sum of a and b
   */
  add(a: number, b: number): number {
    return a + b;
  }

  /**
   * Multiply two numbers
   * @param a First number
   * @param b Second number
   * @returns Product of a and b
   */
  multiply(a: number, b: number): number {
    return a * b;
  }
}

export const utils = {
  format: (value: number): string => value.toString(),
  validate: (value: any): boolean => typeof value === 'number'
};
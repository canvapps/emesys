/**
 * Test Mock Index for validator.test.ts
 * Dummy file to satisfy import dependency
 */

export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }
}

export const utils = {
  format: (value: number): string => value.toString(),
  validate: (value: any): boolean => typeof value === 'number'
};
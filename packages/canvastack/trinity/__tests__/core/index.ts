/**
 * Test Core Index
 * Export utilities for core tests
 */

export const utils = {
  format: (value: number): string => value.toString(),
  validate: (value: any): boolean => typeof value === 'number'
};
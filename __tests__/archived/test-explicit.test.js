import { test, expect, describe } from 'vitest';

describe('Explicit Import Test', () => {
  test('should work with explicit imports', () => {
    expect(1 + 1).toBe(2);
  });

  test('should test string operations', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });
});
import { describe, it, expect } from 'vitest';

describe('Basic Test Suite', () => {
  it('should perform basic arithmetic', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
  });

  it('should test string operations', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });
});
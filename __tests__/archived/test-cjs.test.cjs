const { test, expect, describe } = require('vitest');

describe('CommonJS Test', () => {
  test('should work with CommonJS', () => {
    expect(1 + 1).toBe(2);
  });

  test('should test basic operations', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });
});
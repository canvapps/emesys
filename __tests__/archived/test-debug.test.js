console.log("Loading test file...");
console.log("test function:", typeof test);
console.log("expect function:", typeof expect);

import { test, expect } from 'vitest';

console.log("After import - test:", typeof test);
console.log("After import - expect:", typeof expect);

test('debug test', () => {
  console.log("Inside test function");
  expect(1).toBe(1);
});
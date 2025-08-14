/**
 * Trinity Validator Core Tests
 * Tests untuk TrinityValidator class
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TrinityValidator } from '../../src/core/validator';
import { TrinityValidationOptions } from '../../src/types/trinity-types';
import { TrinityValidationResult, LayerValidationResult } from '../../src/types/validation-result';

describe('TrinityValidator', () => {
  let testProjectDir: string;
  let validationOptions: TrinityValidationOptions;
  let validator: TrinityValidator;

  beforeAll(() => {
    // Create temporary test project directory
    testProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trinity-validator-test-'));
    
    // Create test project structure
    createTestProjectStructure();
    
    // Initialize validation options
    validationOptions = {
      projectPath: testProjectDir,
      mode: 'all',
      language: 'typescript',
      minTrinityScore: 90,
      excludePatterns: ['node_modules/**']
    };
    validator = new TrinityValidator(validationOptions);
  });

  afterAll(() => {
    // Clean up test directory
    if (testProjectDir) {
      fs.rmSync(testProjectDir, { recursive: true, force: true });
    }
  });

  function createTestProjectStructure() {
    // Create directories
    fs.mkdirSync(path.join(testProjectDir, 'src'));
    fs.mkdirSync(path.join(testProjectDir, '__tests__'));
    fs.mkdirSync(path.join(testProjectDir, 'docs'));
    fs.mkdirSync(path.join(testProjectDir, 'node_modules'), { recursive: true });

    // Create package.json
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      description: 'Test project for Trinity validation',
      main: 'src/index.ts',
      scripts: {
        test: 'jest',
        build: 'tsc'
      },
      dependencies: {
        'lodash': '^4.17.21'
      },
      devDependencies: {
        'jest': '^29.0.0',
        'typescript': '^5.0.0',
        '@types/jest': '^29.0.0'
      }
    };
    fs.writeFileSync(path.join(testProjectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Create tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '__tests__']
    };
    fs.writeFileSync(path.join(testProjectDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

    // Create implementation files
    fs.writeFileSync(
      path.join(testProjectDir, 'src', 'index.ts'),
      `/**
 * Main entry point
 * @description Main application entry point
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
`
    );

    fs.writeFileSync(
      path.join(testProjectDir, 'src', 'math.ts'),
      `/**
 * Math utilities
 * @description Mathematical utility functions
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
`
    );

    // Create test files
    fs.writeFileSync(
      path.join(testProjectDir, '__tests__', 'index.test.ts'),
      `/**
 * Calculator Tests
 * @description Tests for Calculator class
 */
import { Calculator, utils } from '../src/index';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('add method', () => {
    it('should add two positive numbers', () => {
      expect(calculator.add(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      expect(calculator.add(-2, -3)).toBe(-5);
    });

    it('should add zero', () => {
      expect(calculator.add(5, 0)).toBe(5);
    });
  });

  describe('multiply method', () => {
    it('should multiply two positive numbers', () => {
      expect(calculator.multiply(3, 4)).toBe(12);
    });

    it('should multiply by zero', () => {
      expect(calculator.multiply(5, 0)).toBe(0);
    });

    it('should multiply negative numbers', () => {
      expect(calculator.multiply(-2, 3)).toBe(-6);
    });
  });
});

describe('utils', () => {
  describe('format method', () => {
    it('should format number as string', () => {
      expect(utils.format(123)).toBe('123');
    });

    it('should format decimal number', () => {
      expect(utils.format(3.14)).toBe('3.14');
    });
  });

  describe('validate method', () => {
    it('should validate number', () => {
      expect(utils.validate(123)).toBe(true);
    });

    it('should reject string', () => {
      expect(utils.validate('123')).toBe(false);
    });

    it('should reject null', () => {
      expect(utils.validate(null)).toBe(false);
    });
  });
});
`
    );

    fs.writeFileSync(
      path.join(testProjectDir, '__tests__', 'math.test.ts'),
      `/**
 * Math Utils Tests
 * @description Tests for MathUtils class
 */
import { MathUtils } from '../src/math';

describe('MathUtils', () => {
  let mathUtils: MathUtils;

  beforeEach(() => {
    mathUtils = new MathUtils();
  });

  describe('factorial method', () => {
    it('should calculate factorial of 0', () => {
      expect(mathUtils.factorial(0)).toBe(1);
    });

    it('should calculate factorial of positive number', () => {
      expect(mathUtils.factorial(5)).toBe(120);
    });

    it('should throw error for negative number', () => {
      expect(() => mathUtils.factorial(-1)).toThrow('Invalid input');
    });

    it('should throw error for non-number input', () => {
      expect(() => mathUtils.factorial('5' as any)).toThrow('Invalid input');
    });
  });

  describe('isPrime method', () => {
    it('should return true for prime numbers', () => {
      expect(mathUtils.isPrime(2)).toBe(true);
      expect(mathUtils.isPrime(3)).toBe(true);
      expect(mathUtils.isPrime(7)).toBe(true);
      expect(mathUtils.isPrime(13)).toBe(true);
    });

    it('should return false for composite numbers', () => {
      expect(mathUtils.isPrime(4)).toBe(false);
      expect(mathUtils.isPrime(6)).toBe(false);
      expect(mathUtils.isPrime(9)).toBe(false);
      expect(mathUtils.isPrime(15)).toBe(false);
    });

    it('should return false for numbers less than 2', () => {
      expect(mathUtils.isPrime(0)).toBe(false);
      expect(mathUtils.isPrime(1)).toBe(false);
      expect(mathUtils.isPrime(-5)).toBe(false);
    });
  });
});
`
    );

    // Create documentation files
    fs.writeFileSync(
      path.join(testProjectDir, 'README.md'),
      `# Test Project

This is a test project for Trinity Protocol validation testing.

## Features

- Calculator class with basic mathematical operations
- Math utilities for advanced calculations
- Comprehensive test coverage
- TypeScript support

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`typescript
import { Calculator } from './src/index';

const calc = new Calculator();
console.log(calc.add(2, 3)); // 5
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## API Documentation

### Calculator Class

#### add(a: number, b: number): number
Adds two numbers and returns the result.

#### multiply(a: number, b: number): number
Multiplies two numbers and returns the result.

### MathUtils Class

#### factorial(n: number): number
Calculates the factorial of a given number.

#### isPrime(n: number): boolean
Checks if a given number is prime.
`
    );

    fs.writeFileSync(
      path.join(testProjectDir, 'docs', 'api.md'),
      `# API Documentation

## Calculator

The Calculator class provides basic mathematical operations.

### Methods

- \`add(a: number, b: number): number\` - Adds two numbers
- \`multiply(a: number, b: number): number\` - Multiplies two numbers

## MathUtils

The MathUtils class provides advanced mathematical utilities.

### Methods

- \`factorial(n: number): number\` - Calculates factorial
- \`isPrime(n: number): boolean\` - Checks if number is prime

## Utilities

- \`utils.format(value: number): string\` - Formats number as string
- \`utils.validate(value: any): boolean\` - Validates if value is number
`
    );

    fs.writeFileSync(
      path.join(testProjectDir, 'docs', 'examples.md'),
      `# Usage Examples

## Basic Calculator Usage

\`\`\`typescript
import { Calculator } from '../src/index';

const calc = new Calculator();
console.log(calc.add(5, 3)); // 8
console.log(calc.multiply(4, 2)); // 8
\`\`\`

## Math Utils Usage

\`\`\`typescript
import { MathUtils } from '../src/math';

const math = new MathUtils();
console.log(math.factorial(5)); // 120
console.log(math.isPrime(7)); // true
\`\`\`
`
    );
  }

  describe('Project Validation', () => {
    it('should create validator instance', () => {
      expect(validator).toBeInstanceOf(TrinityValidator);
    });

    it('should validate complete project successfully', async () => {
      const result = await validator.validate('all');
      
      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.layers).toBeDefined();
      expect(result.layers.test).toBeDefined();
      expect(result.layers.implementation).toBeDefined();
      expect(result.layers.documentation).toBeDefined();
    });

    it('should detect validation results structure', async () => {
      const result = await validator.validate('all');
      
      expect(result.layers.implementation).toBeDefined();
      expect(result.layers.implementation.layer).toBe('implementation');
      expect(result.layers.implementation.score).toBeGreaterThanOrEqual(0);
    });

    it('should validate test layer', async () => {
      const result = await validator.validate('all');
      
      expect(result.layers.test).toBeDefined();
      expect(result.layers.test.layer).toBe('test');
      expect(result.layers.test.score).toBeGreaterThanOrEqual(0);
    });

    it('should validate documentation layer', async () => {
      const result = await validator.validate('all');
      
      expect(result.layers.documentation).toBeDefined();
      expect(result.layers.documentation.layer).toBe('documentation');
      expect(result.layers.documentation.score).toBeGreaterThanOrEqual(0);
    });

    it('should calculate proper Trinity score', async () => {
      const result = await validator.validate('all');
      
      expect(result.score.overall).toBeGreaterThanOrEqual(0);
      expect(result.score.overall).toBeLessThanOrEqual(100);
      
      // Should have some score based on project structure
      expect(result.score).toHaveProperty('test');
      expect(result.score).toHaveProperty('implementation');
      expect(result.score).toHaveProperty('documentation');
    });
  });

  describe('Layer Validation', () => {
    it('should validate implementation layer', async () => {
      const result = await validator.validate('all');
      const implLayer = result.layers.implementation;
      
      expect(implLayer.score).toBeGreaterThanOrEqual(0);
      expect(implLayer.layer).toBe('implementation');
      expect(implLayer.details).toBeDefined();
    });

    it('should validate test layer', async () => {
      const result = await validator.validate('all');
      const testLayer = result.layers.test;
      
      expect(testLayer.score).toBeGreaterThanOrEqual(0);
      expect(testLayer.layer).toBe('test');
      expect(testLayer.details).toBeDefined();
    });

    it('should validate documentation layer', async () => {
      const result = await validator.validate('all');
      const docsLayer = result.layers.documentation;
      
      expect(docsLayer.score).toBeGreaterThanOrEqual(0);
      expect(docsLayer.layer).toBe('documentation');
      expect(docsLayer.details).toBeDefined();
    });
  });

  describe('File Analysis', () => {
    it('should analyze project structure correctly', async () => {
      const result = await validator.validate('all');
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.projectName).toBeTruthy();
      expect(result.metadata.executionTime).toBeGreaterThan(0);
      expect(result.metadata.timestamp).toBeTruthy();
    });

    it('should detect errors and warnings', async () => {
      const result = await validator.validate('all');
      
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should provide synchronization results', async () => {
      const result = await validator.validate('all');
      
      expect(result.synchronization).toBeDefined();
      expect(typeof result.synchronization.synchronized).toBe('boolean');
      expect(Array.isArray(result.synchronization.missingTests)).toBe(true);
      expect(Array.isArray(result.synchronization.missingDocs)).toBe(true);
    });

    it('should provide recommendations', async () => {
      const result = await validator.validate('all');
      
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('Validation Options', () => {
    it('should handle different validation modes', async () => {
      const allResult = await validator.validate('all');
      const preCommitResult = await validator.validate('pre-commit');
      const prePushResult = await validator.validate('pre-push');
      
      expect(allResult).toBeDefined();
      expect(preCommitResult).toBeDefined();
      expect(prePushResult).toBeDefined();
      
      // All should have similar structure
      expect(allResult.layers).toBeDefined();
      expect(preCommitResult.layers).toBeDefined();
      expect(prePushResult.layers).toBeDefined();
    });

    it('should provide metadata information', async () => {
      const result = await validator.validate('all');
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.executionTime).toBeGreaterThan(0);
      expect(result.metadata.timestamp).toBeTruthy();
      expect(result.metadata.trinityVersion).toBeTruthy();
    });

    it('should validate mid-development mode', async () => {
      const result = await validator.validate('mid-dev');
      
      expect(result).toBeDefined();
      expect(result.layers.test).toBeDefined();
      expect(result.layers.implementation).toBeDefined();
      expect(result.layers.documentation).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing files gracefully', async () => {
      // Create a validator with non-existent project
      const badDir = path.join(os.tmpdir(), 'non-existent-project');
      const badOptions: TrinityValidationOptions = {
        projectPath: badDir,
        mode: 'all',
        language: 'typescript'
      };
      const badValidator = new TrinityValidator(badOptions);
      
      const result = await badValidator.validate();
      
      expect(result).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.score.overall).toBe(0);
    });

    it('should handle corrupted files gracefully', async () => {
      // Create a file with invalid content
      const corruptFile = path.join(testProjectDir, 'src', 'corrupt.ts');
      fs.writeFileSync(corruptFile, 'invalid typescript content {{{');
      
      try {
        const result = await validator.validate();
        
        expect(result).toBeDefined();
        // Should still complete validation despite corrupted file
        expect(result.score.overall).toBeGreaterThanOrEqual(0);
      } finally {
        // Clean up
        if (fs.existsSync(corruptFile)) {
          fs.unlinkSync(corruptFile);
        }
      }
    });

    it('should validate empty project', async () => {
      // Create empty project
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trinity-empty-test-'));
      const emptyOptions: TrinityValidationOptions = {
        projectPath: emptyDir,
        mode: 'all',
        language: 'typescript'
      };
      const emptyValidator = new TrinityValidator(emptyOptions);
      
      try {
        const result = await emptyValidator.validate();
        
        expect(result).toBeDefined();
        expect(result.score.overall).toBe(0);
        expect(result.layers.test.files.length).toBe(0);
        expect(result.layers.implementation.files.length).toBe(0);
        expect(result.layers.documentation.files.length).toBe(0);
      } finally {
        fs.rmSync(emptyDir, { recursive: true, force: true });
      }
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = Date.now();
      
      const result = await validator.validate();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large number of files efficiently', async () => {
      // Create many additional files
      const manyFilesDir = path.join(testProjectDir, 'src', 'generated');
      fs.mkdirSync(manyFilesDir, { recursive: true });
      
      try {
        // Create 50 files
        for (let i = 0; i < 50; i++) {
          fs.writeFileSync(
            path.join(manyFilesDir, `file${i}.ts`),
            `export const value${i} = ${i};`
          );
        }
        
        const startTime = Date.now();
        const result = await validator.validate();
        const endTime = Date.now();
        
        expect(result).toBeDefined();
        expect(endTime - startTime).toBeLessThan(10000); // Should still complete reasonably fast
        
      } finally {
        // Clean up generated files
        fs.rmSync(manyFilesDir, { recursive: true, force: true });
      }
    });
  });
});
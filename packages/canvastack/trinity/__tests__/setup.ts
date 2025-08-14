/**
 * Trinity Protocol Test Setup
 * Jest test environment configuration
 */

import * as fs from 'fs';
import * as path from 'path';

// Setup test environment
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TRINITY_TEST_MODE = 'true';
  
  // Create test directories if they don't exist
  const testDirs = [
    path.join(__dirname, 'fixtures'),
    path.join(__dirname, 'temp')
  ];
  
  testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  console.log('🧪 Trinity Protocol Test Suite - Environment Ready');
});

// Cleanup after tests
afterAll(() => {
  // Clean up test directories
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  console.log('🧹 Trinity Protocol Test Suite - Cleanup Complete');
});

// Global test utilities
global.trinityTestUtils = {
  /**
   * Create a temporary test project structure
   */
  createTestProject: (projectName: string, structure: any) => {
    const projectPath = path.join(__dirname, 'temp', projectName);
    
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
    
    fs.mkdirSync(projectPath, { recursive: true });
    
    // Create directory structure
    for (const [dirPath, files] of Object.entries(structure)) {
      const fullDirPath = path.join(projectPath, dirPath as string);
      fs.mkdirSync(fullDirPath, { recursive: true });
      
      if (typeof files === 'object' && files !== null) {
        for (const [fileName, content] of Object.entries(files as Record<string, string>)) {
          fs.writeFileSync(path.join(fullDirPath, fileName), content, 'utf8');
        }
      }
    }
    
    return projectPath;
  },

  /**
   * Clean up test project
   */
  cleanupTestProject: (projectPath: string) => {
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
  },

  /**
   * Create basic package.json for testing
   */
  createPackageJson: (options: any = {}) => {
    return JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      description: 'Test project for Trinity Protocol',
      main: 'index.js',
      scripts: {
        test: 'jest',
        build: 'tsc'
      },
      dependencies: {},
      devDependencies: {
        jest: '^29.0.0',
        typescript: '^5.0.0'
      },
      ...options
    }, null, 2);
  },

  /**
   * Create basic tsconfig.json for testing
   */
  createTsConfig: (options: any = {}) => {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        ...options
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '__tests__']
    }, null, 2);
  },

  /**
   * Create sample implementation file
   */
  createImplementationFile: (fileName: string = 'utils.ts') => {
    return `/**
 * Sample implementation file for testing
 */

export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export class Calculator {
  private value: number = 0;

  add(n: number): this {
    this.value += n;
    return this;
  }

  multiply(n: number): this {
    this.value *= n;
    return this;
  }

  getValue(): number {
    return this.value;
  }
}
`;
  },

  /**
   * Create sample test file
   */
  createTestFile: (fileName: string = 'utils.test.ts') => {
    return `/**
 * Sample test file for testing
 */

import { add, multiply, Calculator } from '../src/utils';

describe('Utils', () => {
  describe('add', () => {
    it('should add two numbers correctly', () => {
      expect(add(2, 3)).toBe(5);
      expect(add(-1, 1)).toBe(0);
      expect(add(0, 0)).toBe(0);
    });
  });

  describe('multiply', () => {
    it('should multiply two numbers correctly', () => {
      expect(multiply(2, 3)).toBe(6);
      expect(multiply(-1, 1)).toBe(-1);
      expect(multiply(0, 5)).toBe(0);
    });
  });

  describe('Calculator', () => {
    let calculator: Calculator;

    beforeEach(() => {
      calculator = new Calculator();
    });

    it('should start with value 0', () => {
      expect(calculator.getValue()).toBe(0);
    });

    it('should add correctly', () => {
      calculator.add(5).add(3);
      expect(calculator.getValue()).toBe(8);
    });

    it('should multiply correctly', () => {
      calculator.add(2).multiply(3);
      expect(calculator.getValue()).toBe(6);
    });

    it('should chain operations', () => {
      calculator.add(10).multiply(2).add(5);
      expect(calculator.getValue()).toBe(25);
    });
  });
});
`;
  },

  /**
   * Create sample README file
   */
  createReadmeFile: () => {
    return `# Test Project

This is a test project for Trinity Protocol validation.

## Features

- TypeScript support
- Jest testing
- Trinity Protocol compliance

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm test
npm run build
\`\`\`

## Trinity Protocol

This project follows Trinity Protocol methodology:
- **Implementation**: Source code in \`src/\`  
- **Tests**: Test files in \`__tests__/\`
- **Documentation**: README and docs in \`docs/\`
`;
  },

  /**
   * Expect Trinity score to be within range
   */
  expectTrinityScore: (score: number, min: number = 90, max: number = 100) => {
    expect(score).toBeGreaterThanOrEqual(min);
    expect(score).toBeLessThanOrEqual(max);
  },

  /**
   * Expect Trinity validation result to be valid
   */
  expectTrinityValid: (result: any) => {
    expect(result).toBeDefined();
    expect(result.valid).toBe(true);
    expect(result.score).toBeDefined();
    expect(result.score.overall).toBeGreaterThanOrEqual(90);
  }
};

// Extend Jest matchers for Trinity-specific assertions
expect.extend({
  toHaveValidTrinityScore(received: number) {
    const pass = received >= 90 && received <= 100;
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid Trinity score (90-100)`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected ${received} to be a valid Trinity score (90-100)`,
        pass: false
      };
    }
  },

  toBeValidTrinityResult(received: any) {
    const hasValidStructure = received && 
      typeof received.valid === 'boolean' &&
      typeof received.score === 'object' &&
      typeof received.score.overall === 'number';
    
    const hasValidScore = hasValidStructure && 
      received.score.overall >= 0 && 
      received.score.overall <= 100;
    
    if (hasValidStructure && hasValidScore) {
      return {
        message: () => `Expected not to be a valid Trinity result`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected to be a valid Trinity result with valid structure and score`,
        pass: false
      };
    }
  }
});

// Type augmentation for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveValidTrinityScore(): R;
      toBeValidTrinityResult(): R;
    }
  }
  
  var trinityTestUtils: {
    createTestProject: (projectName: string, structure: any) => string;
    cleanupTestProject: (projectPath: string) => void;
    createPackageJson: (options?: any) => string;
    createTsConfig: (options?: any) => string;
    createImplementationFile: (fileName?: string) => string;
    createTestFile: (fileName?: string) => string;
    createReadmeFile: () => string;
    expectTrinityScore: (score: number, min?: number, max?: number) => void;
    expectTrinityValid: (result: any) => void;
  };
}

export {};
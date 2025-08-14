/**
 * Validation Result Types
 */

import { TrinityScore, ValidationError } from './trinity-types';

export interface ValidationResultMetadata {
  totalFiles: number;
  testFiles: number;
  implementationFiles: number;
  documentationFiles: number;
  executionTime: number;
  timestamp: string;
  trinityVersion: string;
  projectName?: string;
}

export interface LayerValidationResult {
  layer: 'test' | 'implementation' | 'documentation';
  score: number;
  files: string[];
  errors: ValidationError[];
  warnings: ValidationError[];
  details: {
    totalFiles: number;
    validFiles: number;
    errorCount: number;
    warningCount: number;
  };
}

export interface SynchronizationResult {
  synchronized: boolean;
  missingTests: string[];
  missingDocs: string[];
  orphanedTests: string[];
  orphanedDocs: string[];
  coverage: {
    testCoverage: number;
    documentationCoverage: number;
  };
}

export interface TrinityValidationResult {
  valid: boolean;
  score: TrinityScore;
  errors: ValidationError[];
  warnings: ValidationError[];
  metadata: ValidationResultMetadata;
  layers: {
    test: LayerValidationResult;
    implementation: LayerValidationResult;
    documentation: LayerValidationResult;
  };
  synchronization: SynchronizationResult;
  recommendations: string[];
}

export interface FileValidationResult {
  file: string;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  imports: {
    total: number;
    resolved: number;
    broken: string[];
  };
  type: 'test' | 'implementation' | 'documentation' | 'config';
}

export interface ImportValidationResult {
  from: string;
  import: string;
  resolved: boolean;
  resolvedPath?: string;
  error?: string;
}

export interface TestSuiteResult {
  executed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  duration: number;
}
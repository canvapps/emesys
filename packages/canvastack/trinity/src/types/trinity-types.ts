/**
 * Trinity Protocol Core Types
 */

export interface TrinityScore {
  test: number;
  implementation: number;
  documentation: number;
  overall?: number;
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  file?: string;
  line?: number;
  category: 'test' | 'implementation' | 'documentation' | 'synchronization';
}

export interface TrinityValidationOptions {
  projectPath?: string;
  mode?: 'all' | 'pre-commit' | 'pre-push' | 'mid-dev';
  language?: 'javascript' | 'typescript' | 'python' | 'java' | 'csharp' | 'go';
  framework?: string;
  minTrinityScore?: number;
  excludePatterns?: string[];
  customRules?: ValidationRule[];
}

export interface ValidationRule {
  name: string;
  description: string;
  category: 'test' | 'implementation' | 'documentation';
  severity: 'error' | 'warning';
  validate: (context: ValidationContext) => ValidationResult[];
}

export interface ValidationContext {
  projectPath: string;
  files: ProjectFile[];
  config: TrinityValidationOptions;
}

export interface ProjectFile {
  path: string;
  type: 'test' | 'implementation' | 'documentation';
  language: string;
  content?: string;
  imports?: string[];
}

export interface ValidationResult {
  valid: boolean;
  score: TrinityScore;
  errors: ValidationError[];
  warnings: ValidationError[];
  metadata: {
    totalFiles: number;
    testFiles: number;
    implementationFiles: number;
    documentationFiles: number;
    executionTime: number;
    timestamp: string;
  };
}

export interface TrinityLayer {
  name: 'test' | 'implementation' | 'documentation';
  files: ProjectFile[];
  score: number;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ImportDependency {
  from: string;
  to: string;
  type: 'relative' | 'absolute' | 'package';
  resolved: boolean;
}

export interface TestCoverage {
  implementationFile: string;
  testFile?: string;
  hasTest: boolean;
  testCoverage?: number;
}

export interface DocumentationCoverage {
  file: string;
  hasDocumentation: boolean;
  documentationFiles: string[];
  completeness: number;
}

export type TrinityMode = 'all' | 'pre-commit' | 'pre-push' | 'mid-dev';
export type TrinityLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'csharp' | 'go';
export type ValidationSeverity = 'error' | 'warning' | 'info';
export type FileType = 'test' | 'implementation' | 'documentation' | 'config' | 'other';
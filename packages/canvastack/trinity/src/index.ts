/**
 * @canvastack/trinity-core
 * Trinity Protocol - Universal Development Quality Assurance Framework
 * 
 * Entry point for Trinity Protocol validation system
 */

// Core exports
export { TrinityValidator } from './core/validator';
export { TrinityConfig } from './core/config';
export { TrinityReporter } from './core/reporter';

// Adapter exports
export { JavaScriptAdapter } from './adapters/javascript';
export { TypeScriptAdapter } from './adapters/typescript';

// Utility exports
export { FileUtils } from './utils/file-utils';
export { ImportAnalyzer } from './utils/import-analyzer';
export { ScoreCalculator } from './utils/score-calculator';

// Types
export * from './types/trinity-types';
export * from './types/validation-result';
export * from './types/config-types';

// Constants
export * from './constants/validation-constants';

/**
 * Main Trinity Protocol validation function
 * Convenient wrapper for TrinityValidator
 */
export async function validateProject(options?: any) {
  const { TrinityValidator } = await import('./core/validator');
  const validator = new TrinityValidator(options);
  return await validator.validate();
}

/**
 * Quick Trinity validation with default settings
 */
export async function quickValidate(projectPath?: string) {
  const { TrinityValidator } = await import('./core/validator');
  const validator = new TrinityValidator({ projectPath });
  return await validator.validate('all');
}

/**
 * Trinity Protocol version
 */
export const TRINITY_VERSION = '1.0.0';

/**
 * Trinity Protocol methodology constants
 */
export const TRINITY_METHODOLOGY = {
  LAYERS: {
    TEST: 'test',
    IMPLEMENTATION: 'implementation', 
    DOCUMENTATION: 'documentation'
  },
  MIN_SCORE: 90,
  PERFECT_SCORE: 100
} as const;
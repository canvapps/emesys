/**
 * Trinity Protocol Validation Constants
 */

export const TRINITY_CONSTANTS = {
  // Version
  VERSION: '1.0.0',
  
  // Minimum scores
  MIN_TRINITY_SCORE: 90,
  PERFECT_SCORE: 100,
  
  // Layer weights (for overall score calculation)
  LAYER_WEIGHTS: {
    TEST: 1,
    IMPLEMENTATION: 1,
    DOCUMENTATION: 1
  },
  
  // Penalty points
  PENALTIES: {
    MISSING_DEPENDENCY: 5,
    BROKEN_IMPORT: 3,
    MISSING_TEST: 10,
    MISSING_DOCUMENTATION: 15,
    CRITICAL_FILE_MISSING: 20,
    FAILED_TEST: 25
  },
  
  // File extensions
  EXTENSIONS: {
    TYPESCRIPT: ['.ts', '.tsx'],
    JAVASCRIPT: ['.js', '.jsx', '.mjs', '.cjs'],
    MARKDOWN: ['.md', '.mdx'],
    ALL_SOURCE: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
    ALL_TEST: ['.test.ts', '.test.js', '.spec.ts', '.spec.js'],
    ALL_DOCS: ['.md', '.mdx', '.rst', '.txt']
  }
} as const;

export const DEFAULT_FILE_PATTERNS = {
  TEST_PATTERNS: [
    '**/__tests__/**/*.test.{js,ts,jsx,tsx}',
    '**/__tests__/**/*.spec.{js,ts,jsx,tsx}',
    '**/*.test.{js,ts,jsx,tsx}',
    '**/*.spec.{js,ts,jsx,tsx}'
  ],
  
  IMPLEMENTATION_PATTERNS: [
    'src/**/*.{js,ts,jsx,tsx}',
    'lib/**/*.{js,ts,jsx,tsx}',
    'app/**/*.{js,ts,jsx,tsx}',
    '!**/*.test.{js,ts,jsx,tsx}',
    '!**/*.spec.{js,ts,jsx,tsx}',
    '!**/*.d.ts'
  ],
  
  DOCUMENTATION_PATTERNS: [
    '**/*.md',
    '**/*.mdx',
    'docs/**/*',
    'README*',
    'CHANGELOG*',
    'CONTRIBUTING*'
  ],
  
  EXCLUDE_PATTERNS: [
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '.git/**',
    '*.log',
    '.env*'
  ]
} as const;

export const DEFAULT_DIRECTORIES = {
  TEST_DIRS: ['__tests__', 'test', 'tests'],
  SOURCE_DIRS: ['src', 'lib', 'app'],
  DOCS_DIRS: ['docs', 'documentation'],
  EXCLUDE_DIRS: ['node_modules', 'dist', 'build', 'coverage', '.git']
} as const;

export const VALIDATION_MESSAGES = {
  // Success messages
  SUCCESS: {
    VALIDATION_PASSED: '✅ Trinity validation passed!',
    LAYER_VALID: (layer: string, score: number) => `✅ ${layer} Layer Score: ${score}%`,
    ALL_TESTS_PASSING: (count: number) => `✅ All ${count} tests passing`,
    NO_ERRORS: '✅ No validation errors found',
    PERFECT_SCORE: '🏆 Perfect Trinity Score: 100%!'
  },
  
  // Error messages  
  ERROR: {
    VALIDATION_FAILED: '❌ Trinity validation failed!',
    MISSING_DEPENDENCY: (dep: string, file: string) => `Missing dependency: ${dep} in ${file}`,
    BROKEN_IMPORT: (imp: string, file: string) => `Broken import in ${file}: ${imp}`,
    MISSING_TEST: (file: string) => `Missing test file for: ${file}`,
    MISSING_DOCUMENTATION: (file: string) => `Key documentation missing: ${file}`,
    CRITICAL_FILE_MISSING: (file: string) => `Critical utility file missing: ${file}`,
    TEST_SUITE_FAILED: (failed: number) => `${failed} tests failing`,
    LAYER_VALIDATION_FAILED: (layer: string, error: string) => `${layer} layer validation failed: ${error}`,
    FILE_NOT_FOUND: (file: string) => `File scheduled for commit but doesn't exist: ${file}`
  },
  
  // Warning messages
  WARNING: {
    MISSING_RECOMMENDED_DIR: (dir: string) => `Recommended test directory missing: ${dir}`,
    CRITICAL_FILES_MODIFIED: (files: string[]) => `Critical files modified - ensure thorough testing: ${files.join(', ')}`,
    LOW_SCORE: (layer: string, score: number) => `⚠️ Low ${layer} score: ${score}% (minimum: ${TRINITY_CONSTANTS.MIN_TRINITY_SCORE}%)`
  },
  
  // Info messages
  INFO: {
    STARTING_VALIDATION: '🛡️ TRINITY PROTOCOL: Starting validation...',
    ANALYZING_FILES: (count: number) => `🔍 Analyzing ${count} files...`,
    FOUND_FILES: (type: string, count: number) => `Found ${count} ${type} files`,
    VALIDATION_MODE: (mode: string) => `Running ${mode} validation...`,
    CALCULATING_SCORE: '📊 Calculating Trinity Score...'
  }
} as const;

export const CLI_COLORS = {
  SUCCESS: '\x1b[32m',  // Green
  ERROR: '\x1b[31m',    // Red  
  WARNING: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',     // Cyan
  RESET: '\x1b[0m'      // Reset
} as const;

export const VALIDATION_MODES = {
  ALL: 'all',
  PRE_COMMIT: 'pre-commit',
  PRE_PUSH: 'pre-push', 
  MID_DEV: 'mid-dev'
} as const;

export const SUPPORTED_LANGUAGES = {
  JAVASCRIPT: 'javascript',
  TYPESCRIPT: 'typescript',
  PYTHON: 'python',
  JAVA: 'java',
  CSHARP: 'csharp',
  GO: 'go'
} as const;
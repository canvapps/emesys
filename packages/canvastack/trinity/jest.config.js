module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.js'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  
  // 🚀 OPTIMIZED FOR PERFORMANCE
  collectCoverage: false, // DISABLE coverage untuk speed
  maxWorkers: 1, // Single worker untuk resource control 
  cache: true, // Enable Jest cache
  
  // Coverage config (only when explicitly needed with --coverage flag)
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70, // Relaxed threshold untuk development
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  verbose: false, // Reduce verbose output untuk speed
  testTimeout: 5000, // Reduced timeout
  
  // 💡 Additional performance optimizations
  forceExit: true, // Force exit to prevent hanging processes
  detectOpenHandles: false, // Disable handle detection for speed
  clearMocks: true, // Clear mocks between tests
  restoreMocks: true, // Restore mocks after tests
  
  // Memory management
  logHeapUsage: false, // Disable heap logging
  errorOnDeprecated: false // Allow deprecated APIs untuk speed
};
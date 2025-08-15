// Trinity Protocol Configuration
// Copy this file to trinity.config.js and customize as needed

module.exports = {
  project: {
    projectName: 'my-project',
    language: 'typescript', // 'javascript' | 'typescript' | 'python' | etc.
    framework: 'react', // 'react' | 'vue' | 'angular' | 'express' | etc.
  },
  
  validation: {
    minTrinityScore: 90, // Minimum required Trinity score
    requireAllLayers: true, // Require test, implementation, and documentation layers
    enforceTestCoverage: true, // Enforce test coverage requirements
    enforceDocumentation: true, // Enforce documentation requirements
    strictMode: false // Enable strict validation mode
  },
  
  patterns: {
    testPatterns: [
      '**/__tests__/**/*.test.{js,ts,jsx,tsx}',
      '**/*.test.{js,ts,jsx,tsx}',
      '**/*.spec.{js,ts,jsx,tsx}'
    ],
    implementationPatterns: [
      'src/**/*.{js,ts,jsx,tsx}',
      '!**/*.test.{js,ts,jsx,tsx}',
      '!**/*.spec.{js,ts,jsx,tsx}'
    ],
    documentationPatterns: [
      '**/*.md',
      'docs/**/*',
      'README*'
    ],
    excludePatterns: [
      'node_modules/**',
      'dist/**',
      'build/**'
    ]
  },
  
  scoring: {
    testWeight: 1,
    implementationWeight: 1,
    documentationWeight: 1,
    errorPenalty: 5,
    warningPenalty: 2
  },
  
  git: {
    preCommitValidation: true,
    prePushValidation: true,
    blockCommitOnFailure: true,
    blockPushOnFailure: true
  },
  
  reporting: {
    outputFormat: 'console', // 'console' | 'json' | 'html'
    verboseLogging: false,
    includeWarnings: true,
    generateReports: false
  }
};
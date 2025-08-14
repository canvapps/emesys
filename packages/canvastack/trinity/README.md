# @canvastack/trinity-core

Trinity Protocol - Universal Development Quality Assurance Framework

[![npm version](https://badge.fury.io/js/%40canvastack%2Ftrinity-core.svg)](https://badge.fury.io/js/%40canvastack%2Ftrinity-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## 🎯 Overview

Trinity Protocol adalah framework universal untuk Quality Assurance dalam development yang memastikan sinkronisasi sempurna antara **Test**, **Implementation**, dan **Documentation** layers. Framework ini mengotomatisasi validasi kualitas code dan memberikan Trinity Score untuk mengukur compliance project terhadap best practices.

### 🔥 Key Features

- **🧪 Test Layer Validation** - Comprehensive test coverage analysis
- **⚙️ Implementation Layer Analysis** - Code quality and dependency validation  
- **📚 Documentation Layer Compliance** - Documentation completeness and accuracy
- **🎯 Trinity Score Calculation** - Weighted scoring system untuk quality metrics
- **🔄 Real-time Monitoring** - Watch mode untuk continuous validation
- **🚀 Git Integration** - Pre-commit dan pre-push hooks
- **🌍 Multi-language Support** - JavaScript, TypeScript, Python, Java, C#, Go
- **📊 Multiple Report Formats** - Console, JSON, HTML outputs
- **⚡ CLI Interface** - Powerful command-line tools

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g @canvastack/trinity-core

# Or install locally
npm install --save-dev @canvastack/trinity-core
```

### Initialize Trinity Protocol

```bash
# Initialize dengan template TypeScript
trinity init --template typescript

# Initialize dengan template React
trinity init --template react

# Initialize dengan template Node.js
trinity init --template node
```

### Run Validation

```bash
# Basic validation
trinity validate

# Validation dengan verbose output
trinity validate --verbose

# Generate JSON report
trinity validate --format json --output trinity-report.json

# Generate HTML report
trinity validate --format html --output trinity-report.html
```

### Watch Mode

```bash
# Continuous validation
trinity watch

# Watch dengan custom debounce
trinity watch --debounce 500
```

### Setup Git Hooks

```bash
# Setup pre-commit dan pre-push hooks
trinity setup-hooks

# Setup only pre-commit
trinity setup-hooks --pre-commit

# Setup only pre-push  
trinity setup-hooks --pre-push
```

## 📋 Commands

### `trinity init`

Initialize Trinity Protocol configuration untuk project baru.

```bash
trinity init [options]

Options:
  -p, --project <path>      Project directory path (default: current directory)
  -t, --template <type>     Template type (javascript|typescript|react|vue|node)
  -f, --force              Force overwrite existing configuration
  -h, --help               Display help information
```

### `trinity validate`

Run Trinity Protocol validation pada project.

```bash
trinity validate [options]

Options:
  -p, --project <path>      Project directory path (default: current directory)
  -c, --config <path>       Trinity config file path
  -f, --format <type>       Output format (console|json|html) (default: console)
  -o, --output <path>       Output file path untuk report
  -v, --verbose             Enable verbose logging
  --no-cache                Disable cache untuk fresh validation
  -h, --help               Display help information
```

### `trinity watch`

Enable watch mode untuk continuous Trinity validation.

```bash
trinity watch [options]

Options:
  -p, --project <path>      Project directory path (default: current directory)
  -c, --config <path>       Trinity config file path
  -i, --ignore <patterns>   Ignore patterns (comma separated)
  -d, --debounce <ms>       Debounce time dalam milliseconds (default: 300)
  -h, --help               Display help information
```

### `trinity setup-hooks`

Setup Git hooks untuk automatic Trinity validation.

```bash
trinity setup-hooks [options]

Options:
  -p, --project <path>      Project directory path (default: current directory)
  --pre-commit             Setup pre-commit hook only
  --pre-push              Setup pre-push hook only
  -h, --help              Display help information
```

### `trinity info`

Display Trinity Protocol dan project information.

```bash
trinity info [options]

Options:
  -p, --project <path>      Project directory path (default: current directory)
  -h, --help               Display help information
```

## ⚙️ Configuration

Trinity Protocol menggunakan `trinity.config.js` file untuk konfigurasi:

```javascript
// trinity.config.js
module.exports = {
  project: {
    projectName: 'my-awesome-project',
    language: 'typescript', // 'javascript' | 'typescript' | 'python' | etc.
    framework: 'react', // 'react' | 'vue' | 'angular' | 'express' | etc.
  },
  
  validation: {
    minTrinityScore: 90, // Minimum required Trinity score
    requireAllLayers: true, // Require test, implementation, dan documentation layers
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
```

## 📊 Trinity Score System

Trinity Protocol menggunakan weighted scoring system untuk mengukur project quality:

### Score Components

- **🧪 Test Score** (33.33%) - Test coverage, test quality, test structure
- **⚙️ Implementation Score** (33.33%) - Code quality, dependencies, structure  
- **📚 Documentation Score** (33.33%) - Documentation completeness, accuracy

### Score Calculation

```
Trinity Score = (Test Score × Test Weight + 
                Implementation Score × Implementation Weight + 
                Documentation Score × Documentation Weight) / 
                (Test Weight + Implementation Weight + Documentation Weight)
```

### Score Ranges

- **90-100%** - ✅ Excellent (Trinity Compliant)
- **80-89%** - ⚠️ Good (Needs Minor Improvements)
- **70-79%** - ⚡ Fair (Needs Improvements)
- **0-69%** - ❌ Poor (Major Issues)

## 🔧 API Reference

### TrinityValidator

Main validation class untuk Trinity Protocol compliance checking.

```typescript
import { TrinityValidator, TrinityValidationOptions } from '@canvastack/trinity-core';

const options: TrinityValidationOptions = {
  projectPath: './my-project',
  mode: 'all',
  language: 'typescript',
  minTrinityScore: 90
};

const validator = new TrinityValidator(options);
const result = await validator.validate();

console.log(`Trinity Score: ${result.score.overall}%`);
```

### TrinityConfig

Configuration management class untuk Trinity Protocol settings.

```typescript
import { TrinityConfig } from '@canvastack/trinity-core';

const config = new TrinityConfig('./my-project');
await config.load();

console.log('Project Info:', config.getProjectInfo());
console.log('Validation Config:', config.getValidationConfig());
```

### TrinityReporter

Report generation class dengan multiple output formats.

```typescript
import { TrinityReporter } from '@canvastack/trinity-core';

const reporter = new TrinityReporter();

// Console report
reporter.printConsoleReport(validationResult, { verbose: true });

// JSON report
await reporter.generateReport(validationResult, {
  format: 'json',
  outputPath: './trinity-report.json'
});

// HTML report
await reporter.generateReport(validationResult, {
  format: 'html',
  outputPath: './trinity-report.html'
});
```

## 🏗️ Project Structure

```
your-project/
├── src/                          # Implementation layer
│   ├── components/
│   ├── utils/
│   └── index.ts
├── __tests__/                    # Test layer
│   ├── components/
│   ├── utils/
│   └── index.test.ts
├── docs/                         # Documentation layer
│   ├── api.md
│   └── examples.md
├── README.md                     # Main documentation
├── package.json
├── tsconfig.json
└── trinity.config.js            # Trinity configuration
```

## 🚀 Integration Examples

### GitHub Actions

```yaml
# .github/workflows/trinity.yml
name: Trinity Protocol Validation

on: [push, pull_request]

jobs:
  trinity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx trinity validate --format json --output trinity-report.json
      - run: npx trinity validate --verbose
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "🔍 Running Trinity Protocol validation..."
trinity validate --format json --output trinity-report.json

if [ $? -ne 0 ]; then
    echo "❌ Trinity Protocol validation failed. Commit aborted."
    echo "📊 Check trinity-report.json for details."
    exit 1
fi

echo "✅ Trinity Protocol validation passed!"
exit 0
```

### Package.json Scripts

```json
{
  "scripts": {
    "trinity": "trinity validate",
    "trinity:watch": "trinity watch",
    "trinity:report": "trinity validate --format html --output trinity-report.html",
    "trinity:init": "trinity init --template typescript",
    "test": "jest && trinity validate"
  }
}
```

## 🌟 Best Practices

### 1. Test-Driven Development (TDD)

```typescript
// ❌ Bad: Implementation without test
export function calculateSum(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}

// ✅ Good: Test first, then implementation
// __tests__/calculator.test.ts
describe('calculateSum', () => {
  it('should calculate sum of numbers', () => {
    expect(calculateSum([1, 2, 3])).toBe(6);
  });
});

// src/calculator.ts  
export function calculateSum(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}
```

### 2. Documentation-Driven Development

```typescript
/**
 * Calculates the sum of an array of numbers
 * @param numbers Array of numbers to sum
 * @returns The sum of all numbers in the array
 * @example
 * ```typescript
 * calculateSum([1, 2, 3]); // returns 6
 * ```
 */
export function calculateSum(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}
```

### 3. Trinity Synchronization

```
Implementation File: src/components/Button.tsx
Test File:          __tests__/components/Button.test.tsx
Documentation:      docs/components/Button.md
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Low Trinity Score

```bash
# Check detailed report
trinity validate --verbose --format html --output trinity-report.html
```

#### 2. Missing Tests

```bash
# See missing test recommendations
trinity validate --verbose | grep "Missing test"
```

#### 3. Documentation Issues

```bash
# Check documentation coverage
trinity validate --format json | jq '.layers.documentation'
```

#### 4. Import/Dependency Errors

```bash
# Validate dependencies
trinity validate --verbose | grep "dependency"
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=trinity:* trinity validate --verbose
```

## 🤝 Contributing

We welcome contributions to Trinity Protocol! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone repository
git clone https://github.com/canvastack/trinity-core.git
cd trinity-core

# Install dependencies
npm install

# Build package
npm run build

# Run tests
npm test

# Run Trinity validation on itself
npm run validate
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test
npm test -- validator.test.ts
```

## 📝 License

MIT License - see the [LICENSE](./LICENSE) file for details.

## 🚀 Roadmap

- [ ] **Multi-language Adapters** - Python, Java, C#, Go support
- [ ] **IDE Extensions** - VSCode, IntelliJ plugins
- [ ] **Advanced Analytics** - Trend analysis, team metrics
- [ ] **Cloud Integration** - SaaS dashboard, team collaboration
- [ ] **AI Recommendations** - Intelligent code quality suggestions
- [ ] **Custom Rules Engine** - User-defined validation rules

## 📞 Support

- 📧 Email: support@canvastack.com  
- 💬 Discord: [CanvaStack Community](https://discord.gg/canvastack)
- 🐛 Issues: [GitHub Issues](https://github.com/canvastack/trinity-core/issues)
- 📚 Documentation: [Trinity Protocol Docs](https://trinity.canvastack.com)

---

**Made with ❤️ by [CanvaStack](https://canvastack.com)**

*Trinity Protocol - Where Code Quality Meets Excellence*
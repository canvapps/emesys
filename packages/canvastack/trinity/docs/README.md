# @canvastack/trinity-core

**Trinity Protocol - Universal Development Quality Assurance Framework**

Trinity Protocol adalah metodologi dan framework validasi kualitas development yang memastikan sinkronisasi 100% antara **Test-Implementation-Documentation** layers dalam setiap project software.

## 🎯 **Trinity Methodology**

Trinity Protocol menggunakan metodologi **3-Layer Synchronization**:

```
🧪 TEST LAYER          ⚙️ IMPLEMENTATION LAYER      📚 DOCUMENTATION LAYER
├── Unit Tests         ├── Source Code              ├── README.md  
├── Integration Tests  ├── Business Logic           ├── API Documentation
├── E2E Tests          ├── Data Models              ├── User Guides
└── Test Coverage      └── Utilities                └── Technical Specs

                   ↓ TRINITY SYNCHRONIZATION ↓
                     🛡️ TRINITY SCORE: 100%
```

## 🚀 **Quick Start**

### Installation

```bash
npm install @canvastack/trinity-core
```

### Basic Usage

```javascript
import { TrinityValidator } from '@canvastack/trinity-core';

const validator = new TrinityValidator({
  projectPath: './my-project',
  language: 'typescript',
  minTrinityScore: 90
});

const result = await validator.validate();

if (result.valid) {
  console.log('✅ Trinity validation passed!');
  console.log(`🎯 Trinity Score: ${result.score.overall}%`);
} else {
  console.log('❌ Trinity validation failed');
  console.log('Errors:', result.errors);
}
```

### CLI Usage

```bash
# Validate current project
npx trinity validate

# Initialize Trinity configuration
npx trinity init

# Watch mode for continuous validation
npx trinity watch

# Generate detailed report
npx trinity validate --output-format html --output-file trinity-report.html
```

## 📊 **Trinity Score Calculation**

Trinity Score dihitung berdasarkan 3 layer dengan bobot equal:

```typescript
Trinity Score = (Test Score + Implementation Score + Documentation Score) / 3

Test Score = 100 - (dependency_errors * 5) - (structure_penalty)
Implementation Score = 100 - (import_errors * 3) - (missing_utilities * 10)  
Documentation Score = completeness_score - (broken_links * 5)
```

**Passing Grade:** ≥ 90% (Grade A-)  
**Perfect Score:** 100% (Grade A+)

## ⚙️ **Configuration**

Create `trinity.config.js` in your project root:

```javascript
module.exports = {
  project: {
    language: 'typescript',
    framework: 'react'
  },
  
  validation: {
    minTrinityScore: 90,
    requireAllLayers: true,
    enforceTestCoverage: true,
    enforceDocumentation: true,
    strictMode: false
  },
  
  patterns: {
    testPatterns: ['**/__tests__/**/*.test.ts'],
    implementationPatterns: ['src/**/*.ts'],
    documentationPatterns: ['**/*.md', 'docs/**/*']
  },
  
  scoring: {
    testWeight: 1,
    implementationWeight: 1,
    documentationWeight: 1
  }
};
```

## 🧪 **Supported Languages & Frameworks**

### Languages
- ✅ **JavaScript** (ES6+, CommonJS, ESM)
- ✅ **TypeScript** (Full support dengan strict mode)
- 🚧 **Python** (Coming soon)
- 🚧 **Java** (Coming soon)
- 🚧 **C#** (Coming soon)
- 🚧 **Go** (Coming soon)

### Frameworks
- ✅ **React** (CRA, Vite, Next.js)
- ✅ **Vue** (Vue CLI, Vite, Nuxt.js)
- ✅ **Angular** (Angular CLI)
- ✅ **Express** (Node.js backend)
- ✅ **NestJS** (Enterprise Node.js)
- 🚧 **Django** (Python web framework)
- 🚧 **Spring Boot** (Java framework)

## 🔧 **API Reference**

### TrinityValidator

Main validation class untuk Trinity Protocol.

```typescript
class TrinityValidator {
  constructor(options: TrinityValidationOptions)
  
  async validate(mode?: 'all' | 'pre-commit' | 'pre-push' | 'mid-dev'): Promise<TrinityValidationResult>
}
```

### TrinityConfig

Configuration management class.

```typescript  
class TrinityConfig {
  constructor(projectRoot: string, customConfig?: Partial<TrinityFullConfig>)
  
  getConfig(): TrinityFullConfig
  updateConfig(updates: Partial<TrinityFullConfig>): void
  saveConfig(): void
}
```

### Language Adapters

Language-specific validation adapters.

```typescript
class JavaScriptAdapter {
  static detectProject(projectRoot: string): boolean
  validateJavaScriptRequirements(): ValidationError[]
  analyzeProjectFiles(): ProjectFile[]
}

class TypeScriptAdapter {
  static detectProject(projectRoot: string): boolean
  validateTypeScriptRequirements(): ValidationError[]
  validateTsConfig(): ValidationError[]
}
```

## 📈 **Trinity Compliance Levels**

| Score Range | Grade | Status | Description |
|-------------|-------|--------|-------------|
| 98-100% | A+ | 🏆 **Perfect** | Exemplary Trinity compliance |
| 95-97% | A | ✅ **Excellent** | Outstanding quality assurance |
| 90-94% | B+ | ✅ **Good** | Solid Trinity implementation |
| 85-89% | B | ⚠️ **Acceptable** | Minor improvements needed |
| 80-84% | C+ | ⚠️ **Below Standard** | Significant gaps present |
| 75-79% | C | ❌ **Poor** | Major compliance issues |
| <75% | F | ❌ **Failing** | Critical quality problems |

## 🎛️ **Validation Modes**

### `all` (Default)
Complete validation termasuk semua layers dan synchronization check.

```bash
npx trinity validate
npx trinity validate --mode all
```

### `pre-commit`
Fast validation untuk Git pre-commit hooks. Focus pada changed files only.

```bash
npx trinity validate --mode pre-commit
```

### `pre-push`  
Comprehensive validation dengan test suite execution untuk Git pre-push hooks.

```bash
npx trinity validate --mode pre-push
```

### `mid-dev`
Development-time validation tanpa test execution. Ideal untuk continuous feedback.

```bash
npx trinity validate --mode mid-dev
```

## 🎨 **Report Formats**

Trinity generates reports dalam multiple formats:

### Console (Default)
```bash
npx trinity validate
# Outputs colored console report
```

### JSON
```bash
npx trinity validate --output-format json --output-file report.json
```

### HTML
```bash
npx trinity validate --output-format html --output-file report.html
# Generates beautiful HTML report dengan charts
```

## 🔗 **Git Integration**

### Pre-commit Hook
```bash
# .git/hooks/pre-commit
#!/bin/sh
npx trinity validate --mode pre-commit
exit $?
```

### Pre-push Hook
```bash  
# .git/hooks/pre-push
#!/bin/sh
npx trinity validate --mode pre-push
exit $?
```

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
      - run: npm ci
      - run: npx trinity validate
      - run: npx trinity validate --output-format html --output-file trinity-report.html
      - uses: actions/upload-artifact@v3
        with:
          name: trinity-report
          path: trinity-report.html
```

## 🏆 **Best Practices**

### 1. **Follow Test-Driven Development (TDD)**
```javascript
// ✅ Good: Write test first
describe('Calculator', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});

// Then implement
export function add(a, b) {
  return a + b;
}
```

### 2. **Maintain Implementation-Test 1:1 Ratio**
```
src/utils/calculator.ts     → __tests__/utils/calculator.test.ts
src/services/user.ts       → __tests__/services/user.test.ts
src/components/Button.tsx  → __tests__/components/Button.test.tsx
```

### 3. **Document API Contracts**
```javascript
/**
 * Calculate user age based on birthdate
 * @param {Date} birthDate - User's birth date
 * @returns {number} Age in years
 * @throws {Error} If birthDate is invalid
 */
export function calculateAge(birthDate) {
  // implementation
}
```

### 4. **Use Meaningful Test Descriptions**
```javascript
// ✅ Good
describe('User Authentication', () => {
  describe('when valid credentials provided', () => {
    it('should return user data with token', () => {
      // test implementation
    });
  });
  
  describe('when invalid credentials provided', () => {
    it('should throw authentication error', () => {
      // test implementation  
    });
  });
});
```

## 🆘 **Troubleshooting**

### Common Issues

**Q: Trinity score rendah karena missing tests**
```bash
# A: Check file tanpa tests
npx trinity validate --verbose
# Create corresponding test files
```

**Q: Import errors dalam validation**  
```bash
# A: Check tsconfig.json paths dan dependencies
npm install  # Ensure all deps installed
npx trinity validate --fix-imports  # Auto-fix simple import issues
```

**Q: Documentation score rendah**
```bash
# A: Add missing documentation
touch README.md CHANGELOG.md
mkdir docs && touch docs/API.md
```

**Q: TypeScript configuration errors**
```bash
# A: Check strict mode settings
npx trinity validate --check-tsconfig
# Fix recommended dalam output
```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=trinity:* npx trinity validate

# Check specific layer
npx trinity validate --layer test
npx trinity validate --layer implementation  
npx trinity validate --layer documentation
```

## 🚀 **Advanced Usage**

### Custom Validation Rules

```javascript
import { TrinityValidator, ValidationRule } from '@canvastack/trinity-core';

const customRule: ValidationRule = {
  name: 'custom-naming-convention',
  description: 'Enforce custom naming conventions',
  category: 'implementation',
  severity: 'warning',
  validate: (context) => {
    // Custom validation logic
    return [];
  }
};

const validator = new TrinityValidator({
  customRules: [customRule]
});
```

### Multi-Project Validation

```javascript
import { TrinityValidator } from '@canvastack/trinity-core';

const projects = ['./frontend', './backend', './shared'];
const results = [];

for (const projectPath of projects) {
  const validator = new TrinityValidator({ projectPath });
  const result = await validator.validate();
  results.push({ project: projectPath, result });
}

// Generate summary report
console.table(results.map(r => ({
  project: r.project,
  score: r.result.score.overall,
  status: r.result.valid ? '✅' : '❌'
})));
```

## 📚 **Further Reading**

- [Trinity Protocol Methodology](./TRINITY-METHODOLOGY.md)
- [Configuration Guide](./CONFIGURATION.md)  
- [Language-Specific Guides](./language-guides/)
- [Integration Examples](./examples/)
- [Contributing Guide](./CONTRIBUTING.md)
- [API Reference](./API.md)

## 🤝 **Contributing**

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) untuk details tentang development process dan coding standards.

## 📜 **License**

MIT License - see [LICENSE](./LICENSE) file untuk details.

## 🆔 **About CanvaStack**

Trinity Protocol dikembangkan oleh **CanvaStack** sebagai bagian dari komitmen kami terhadap software quality excellence dan development methodology innovation.

---

**🛡️ Trinity Protocol - Ensuring 100% Test-Implementation-Documentation Synchronization**
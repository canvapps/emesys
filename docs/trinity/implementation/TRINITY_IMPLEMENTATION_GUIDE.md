# Trinity Protocol Implementation Guide

## 🛡️ Trinity Protocol Automated Validation System

Sistem validasi terintegrasi untuk memastikan sinkronisasi Test-Implementation-Documentation dalam setiap development workflow.

---

## 📦 Installation & Setup

### 1. Quick Setup
```bash
# Install Trinity Protocol hooks dan scripts
npm run trinity:setup

# Atau manual setup
node scripts/setup-trinity-hooks.js
```

### 2. Manual Installation
```bash
# Make hooks executable (Unix/Linux/Mac)
chmod +x .githooks/pre-commit
chmod +x .githooks/pre-push

# Copy hooks ke .git/hooks/
cp .githooks/pre-commit .git/hooks/
cp .githooks/pre-push .git/hooks/

# Configure Git untuk use custom hooks directory
git config core.hooksPath .githooks
```

---

## 🚀 Available Commands

### NPM Scripts
```bash
# Full Trinity validation
npm run trinity:validate

# Development validation (quick check)
npm run trinity:mid-dev

# Pre-commit validation
npm run trinity:pre-commit

# Pre-push validation (includes test suite)
npm run trinity:pre-push

# Setup Trinity Protocol
npm run trinity:setup
```

### Direct Node.js Execution
```bash
# Full validation
node scripts/trinity-validation.js all

# Specific validation modes
node scripts/trinity-validation.js pre-commit
node scripts/trinity-validation.js pre-push
node scripts/trinity-validation.js mid-dev
```

---

## 🔧 How Trinity Validation Works

### 📋 Pre-Commit Validation
**Triggered**: Setiap `git commit`
**Duration**: ~5-10 seconds
**Checks**:
- ✅ File existence dan import path resolution
- ✅ New implementation files have corresponding tests
- ✅ Critical files protection
- ✅ Debug code detection
- ✅ Large files warning

### 🚀 Pre-Push Validation  
**Triggered**: Setiap `git push`
**Duration**: ~30-60 seconds  
**Checks**:
- ✅ Complete test suite execution
- ✅ Trinity synchronization validation
- ✅ Trinity score calculation (minimum 90%)
- ✅ Sensitive data detection
- ✅ Branch protection awareness

### ⚡ Mid-Development Validation
**Triggered**: Manual atau IDE integration
**Duration**: ~10-20 seconds
**Checks**:
- ✅ Test layer validation
- ✅ Implementation layer validation  
- ✅ Documentation layer validation
- ✅ Trinity score calculation

---

## 📊 Trinity Score System

### Score Breakdown
```
🧪 Test Layer (0-100%)
├─ Test file structure compliance
├─ Test dependency resolution
├─ Test execution success
└─ Coverage completeness

⚙️ Implementation Layer (0-100%)  
├─ Import path resolution
├─ Missing utility detection
├─ File structure compliance
└─ Code quality metrics

📚 Documentation Layer (0-100%)
├─ Documentation file existence
├─ Documentation completeness
├─ Link validation
└─ Trinity protocol compliance

🎯 Overall Trinity Score = (Test + Implementation + Documentation) / 3
```

### Score Requirements
- **✅ PASS**: Trinity Score ≥ 90%
- **⚠️ WARNING**: Trinity Score 70-89%
- **❌ FAIL**: Trinity Score < 70%

---

## 🗂️ File Structure

### Trinity Protocol Files
```
├── scripts/
│   ├── trinity-validation.js      # Main validation engine
│   └── setup-trinity-hooks.js     # Installation script
├── .githooks/
│   ├── pre-commit                 # Pre-commit hook
│   └── pre-push                   # Pre-push hook
├── TRINITY_SYNCHRONIZATION_PROTOCOL.md
├── TRINITY_ENFORCEMENT_GUIDELINES.md
├── TRINITY_PROTOCOL_PROCEDURES_BEST_PRACTICES.md
└── TRINITY_IMPLEMENTATION_GUIDE.md (this file)
```

### Expected Test Structure
```
__tests__/
├── database/
│   ├── utilities/
│   │   └── db-connection.util.cjs
│   ├── integration/
│   ├── unit/
│   └── security/
├── archived/
└── [feature-tests]/
```

### Expected Implementation Structure  
```
src/
├── database/
│   ├── core/
│   ├── repositories/
│   └── utilities/
├── components/
├── hooks/
└── [feature-modules]/
```

---

## 🔍 Validation Details

### Test Layer Validation
- **File Structure**: Validates test directory organization
- **Dependencies**: Checks semua import paths resolve correctly
- **Test Execution**: Ensures tests dapat dijalankan
- **Coverage**: Validates implementation files have corresponding tests

### Implementation Layer Validation
- **Import Resolution**: Validates semua dependencies exist
- **Utility Files**: Checks critical utility files presence
- **Code Quality**: Basic code structure validation
- **File Naming**: Validates file naming conventions

### Documentation Layer Validation
- **Core Documentation**: Checks README.md dan Trinity docs exist
- **Completeness**: Validates documentation coverage
- **Link Validation**: Checks untuk broken documentation links
- **Protocol Compliance**: Ensures Trinity documentation up-to-date

---

## 🚨 Common Issues & Solutions

### Issue: Import Path Resolution Failed
```bash
❌ Missing dependency: ../utils/helper in src/components/Component.tsx

# Solution:
1. Check if file exists: src/utils/helper.ts
2. Verify file extension: .ts, .js, .tsx, .jsx
3. Check relative path correctness
4. Ensure file export is correct
```

### Issue: Test Suite Failures
```bash
❌ 5 tests failing in pre-push validation

# Solution:
npm test                    # Run tests to see details
npm run trinity:mid-dev     # Quick validation check
```

### Issue: Trinity Score Too Low
```bash
❌ Trinity Score: 75% (Required: ≥90%)

# Solution:
1. Fix import path errors (-3% each)
2. Add missing test files (-5% each missing)
3. Update documentation (-5% each missing doc)
4. Run: npm run trinity:validate untuk detailed analysis
```

### Issue: Critical Files Modified
```bash
⚠️ Critical files modified: src/database/core/connection.ts

# Solution:
1. Ensure thorough testing
2. Review changes carefully
3. Update corresponding tests
4. Document breaking changes
```

---

## 🎯 Best Practices

### Development Workflow
1. **Start Development**: Run `npm run trinity:mid-dev` untuk baseline
2. **During Development**: Regular validation checks
3. **Before Commit**: Auto-triggered pre-commit validation
4. **Before Push**: Auto-triggered comprehensive validation

### File Creation Guidelines
```bash
# When creating new implementation file:
src/features/new-feature.ts

# Always create corresponding test:
__tests__/features/new-feature.test.ts

# Update documentation if needed:
docs/features/new-feature.md
```

### Import Path Best Practices
```typescript
// ✅ Good - Use relative imports untuk local files
import { helper } from '../utils/helper';
import { config } from './config';

// ✅ Good - Use absolute imports untuk external packages  
import React from 'react';
import { describe, it, expect } from 'vitest';

// ❌ Bad - Incorrect relative paths
import { helper } from '../../wrong/path/helper';
```

---

## 🔧 Advanced Configuration

### Skipping Validation (Emergency Only)
```bash
# Skip pre-commit (NOT RECOMMENDED)
git commit --no-verify

# Skip pre-push (NOT RECOMMENDED)  
git push --no-verify
```

### Custom Validation Rules
Edit `scripts/trinity-validation.js` to customize:
- File patterns to check
- Required test coverage
- Documentation requirements
- Score thresholds

### IDE Integration
Most IDEs can be configured to run Trinity validation:
- **VS Code**: Add task untuk `npm run trinity:mid-dev`
- **WebStorm**: Configure file watcher
- **Vim/Neovim**: Add keybinding untuk validation

---

## 📈 Monitoring & Metrics

### Trinity Score Tracking
- Track Trinity scores over time
- Monitor improvement trends
- Identify problem areas
- Team compliance reporting

### Git Integration
- Pre-commit hook success rate
- Pre-push validation metrics
- Failed validation patterns
- Developer compliance tracking

---

## 🆘 Troubleshooting

### Script Execution Issues
```bash
# Permission denied (Unix/Linux/Mac)
chmod +x scripts/trinity-validation.js
chmod +x .githooks/pre-commit
chmod +x .githooks/pre-push

# Node.js not found
# Ensure Node.js is installed dan dalam PATH

# Git hooks not working
git config core.hooksPath .githooks
```

### Performance Issues
```bash
# Validation too slow
# Check for large test files
# Optimize test execution
# Use parallel testing

# High memory usage
# Check untuk memory leaks dalam tests
# Optimize test data usage
```

---

## 📞 Support & Resources

### Documentation
- [`TRINITY_SYNCHRONIZATION_PROTOCOL.md`](TRINITY_SYNCHRONIZATION_PROTOCOL.md) - Core protocol
- [`TRINITY_ENFORCEMENT_GUIDELINES.md`](TRINITY_ENFORCEMENT_GUIDELINES.md) - Enforcement rules
- [`TRINITY_PROTOCOL_PROCEDURES_BEST_PRACTICES.md`](TRINITY_PROTOCOL_PROCEDURES_BEST_PRACTICES.md) - Best practices

### Debugging Commands
```bash
# Verbose validation output
DEBUG=trinity node scripts/trinity-validation.js all

# Test individual layers
node scripts/trinity-validation.js mid-dev

# Check file structure only
npm run trinity:pre-commit
```

### Team Training
1. Review Trinity Protocol documentation
2. Practice dengan validation commands
3. Understanding Trinity score system
4. Implement dalam daily workflow

---

**🎉 Trinity Protocol ensures code quality, prevents integration issues, and maintains project integrity through automated validation!**
#!/usr/bin/env node

/**
 * Trinity Protocol Validation Scripts
 * Automated validation system for Test-Implementation-Documentation synchronization
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TrinityValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.errors = [];
    this.warnings = [];
    this.score = { test: 0, implementation: 0, documentation: 0 };
  }

  /**
   * Main validation entry point
   */
  async validate(mode = 'all') {
    console.log('🛡️  TRINITY PROTOCOL: Starting validation...\n');
    
    try {
      switch (mode) {
        case 'pre-commit':
          await this.validatePreCommit();
          break;
        case 'pre-push':
          await this.validatePrePush();
          break;
        case 'mid-dev':
          await this.validateMidDevelopment();
          break;
        case 'all':
        default:
          await this.validateAll();
          break;
      }

      this.generateReport();
      return this.isValid();
    } catch (error) {
      console.error('❌ Trinity validation failed with error:', error.message);
      return false;
    }
  }

  /**
   * Pre-commit validation
   */
  async validatePreCommit() {
    console.log('📋 Pre-commit Trinity validation...');
    
    const changedFiles = this.getChangedFiles();
    console.log(`🔍 Analyzing ${changedFiles.length} changed files...`);

    // Validate file existence and imports
    await this.validateFileStructure(changedFiles);
    
    // Validate import paths
    await this.validateImportPaths(changedFiles);
    
    // Check for new implementation files without tests
    await this.validateTestCoverage(changedFiles);
    
    // Check critical files protection
    await this.validateCriticalFiles(changedFiles);
  }

  /**
   * Pre-push validation
   */
  async validatePrePush() {
    console.log('🚀 Pre-push Trinity validation...');
    
    // Run full test suite
    await this.validateTestSuite();
    
    // Validate Trinity synchronization
    await this.validateSynchronization();
    
    // Check Trinity score
    await this.calculateTrinityScore();
  }

  /**
   * Mid-development validation
   */
  async validateMidDevelopment() {
    console.log('⚡ Mid-development Trinity validation...');
    
    // Test layer validation
    await this.validateTestLayer();
    
    // Implementation layer validation
    await this.validateImplementationLayer();
    
    // Documentation layer validation
    await this.validateDocumentationLayer();
    
    // Calculate Trinity score
    await this.calculateTrinityScore();
  }

  /**
   * Complete validation
   */
  async validateAll() {
    console.log('🎯 Complete Trinity validation...');
    
    await this.validateTestLayer();
    await this.validateImplementationLayer(); 
    await this.validateDocumentationLayer();
    await this.validateSynchronization();
    await this.calculateTrinityScore();
  }

  /**
   * Validate test layer
   */
  async validateTestLayer() {
    console.log('🧪 Validating Test Layer...');
    
    try {
      // Check test file structure
      const testFiles = this.findFiles('__tests__', /\.(test|spec)\.(ts|js|mjs|cjs)$/);
      console.log(`   Found ${testFiles.length} test files`);

      // Validate test dependencies
      let dependencyErrors = 0;
      for (const testFile of testFiles) {
        const imports = this.extractImports(testFile);
        for (const importPath of imports) {
          if (!this.validateImportPath(testFile, importPath)) {
            this.errors.push(`Test dependency missing: ${importPath} in ${testFile}`);
            dependencyErrors++;
          }
        }
      }

      // Run test structure validation
      const structureValid = await this.validateTestStructure();
      
      this.score.test = Math.max(0, 100 - (dependencyErrors * 5) - (structureValid ? 0 : 20));
      console.log(`   ✅ Test Layer Score: ${this.score.test}%`);
      
    } catch (error) {
      this.errors.push(`Test layer validation failed: ${error.message}`);
      this.score.test = 0;
    }
  }

  /**
   * Validate implementation layer
   */
  async validateImplementationLayer() {
    console.log('⚙️  Validating Implementation Layer...');
    
    try {
      // Find all implementation files
      const implFiles = this.findFiles('src', /\.(ts|js)$/);
      console.log(`   Found ${implFiles.length} implementation files`);

      // Validate file existence and imports
      let importErrors = 0;
      for (const implFile of implFiles) {
        const imports = this.extractImports(implFile);
        for (const importPath of imports) {
          if (!this.validateImportPath(implFile, importPath)) {
            this.errors.push(`Missing dependency: ${importPath} in ${implFile}`);
            importErrors++;
          }
        }
      }

      // Check for missing utility files
      const missingUtils = await this.checkRequiredUtilities();
      
      this.score.implementation = Math.max(0, 100 - (importErrors * 3) - (missingUtils * 10));
      console.log(`   ✅ Implementation Layer Score: ${this.score.implementation}%`);
      
    } catch (error) {
      this.errors.push(`Implementation layer validation failed: ${error.message}`);
      this.score.implementation = 0;
    }
  }

  /**
   * Validate documentation layer
   */
  async validateDocumentationLayer() {
    console.log('📚 Validating Documentation Layer...');
    
    try {
      // Check documentation files exist
      const docFiles = [
        'README.md',
        ...this.findFiles('docs', /\.md$/),
        ...this.findFiles('.', /\.md$/, 1) // Top-level MD files
      ];
      console.log(`   Found ${docFiles.length} documentation files`);

      // Validate documentation completeness
      const completeness = await this.validateDocumentationCompleteness();
      
      // Check for broken links in documentation
      const brokenLinks = await this.checkDocumentationLinks(docFiles);
      
      this.score.documentation = Math.max(0, completeness - (brokenLinks * 5));
      console.log(`   ✅ Documentation Layer Score: ${this.score.documentation}%`);
      
    } catch (error) {
      this.errors.push(`Documentation layer validation failed: ${error.message}`);
      this.score.documentation = 0;
    }
  }

  /**
   * Calculate Trinity score
   */
  async calculateTrinityScore() {
    const overallScore = Math.round((this.score.test + this.score.implementation + this.score.documentation) / 3);
    
    console.log('\n📊 TRINITY SCORE BREAKDOWN:');
    console.log(`   🧪 Test Layer:          ${this.score.test}%`);
    console.log(`   ⚙️  Implementation:     ${this.score.implementation}%`);  
    console.log(`   📚 Documentation:       ${this.score.documentation}%`);
    console.log(`   🎯 Overall Trinity:     ${overallScore}%`);
    
    return overallScore;
  }

  /**
   * Validate test suite execution
   */
  async validateTestSuite() {
    console.log('🧪 Running complete test suite...');
    
    try {
      const result = execSync('npm test', { encoding: 'utf8', stdio: 'pipe' });
      const testResults = this.parseTestResults(result);
      
      if (testResults.failed > 0) {
        this.errors.push(`${testResults.failed} tests failing`);
        return false;
      }
      
      console.log(`   ✅ All ${testResults.total} tests passing`);
      return true;
    } catch (error) {
      this.errors.push('Test suite execution failed');
      return false;
    }
  }

  /**
   * Utility methods
   */
  getChangedFiles() {
    try {
      const result = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      return result.trim().split('\n').filter(f => f.length > 0);
    } catch {
      return [];
    }
  }

  findFiles(dir, pattern, maxDepth = null) {
    const files = [];
    const fullDir = path.join(this.projectRoot, dir);
    
    if (!fs.existsSync(fullDir)) return files;
    
    const searchDir = (currentDir, depth = 0) => {
      if (maxDepth !== null && depth > maxDepth) return;
      
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(this.projectRoot, fullPath);
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          searchDir(fullPath, depth + 1);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(relativePath);
        }
      }
    };
    
    searchDir(fullDir);
    return files;
  }

  extractImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
      const imports = [];
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      
      return imports;
    } catch {
      return [];
    }
  }

  validateImportPath(fromFile, importPath) {
    if (importPath.startsWith('.')) {
      // Relative import
      const fromDir = path.dirname(fromFile);
      const resolvedPath = path.resolve(this.projectRoot, fromDir, importPath);
      
      // Check exact path first (for .js imports)
      if (fs.existsSync(resolvedPath)) return true;
      
      // Check possible extensions
      const extensions = ['.ts', '.js', '.tsx', '.jsx', '.cjs', '.mjs'];
      for (const ext of extensions) {
        if (fs.existsSync(resolvedPath + ext)) return true;
      }
      
      // Check if it's a directory with index file
      for (const ext of extensions) {
        if (fs.existsSync(path.join(resolvedPath, 'index' + ext))) return true;
      }
      
      return false;
    }
    
    // Absolute import - assume it's a package or will be resolved
    return true;
  }

  async validateTestStructure() {
    // Check if test structure follows conventions
    const requiredTestDirs = ['__tests__/database', '__tests__/archived'];
    
    for (const dir of requiredTestDirs) {
      if (!fs.existsSync(path.join(this.projectRoot, dir))) {
        this.warnings.push(`Recommended test directory missing: ${dir}`);
        return false;
      }
    }
    
    return true;
  }

  async checkRequiredUtilities() {
    const requiredFiles = [
      '__tests__/database/utilities/db-connection.util.cjs',
      'src/database/connection-js.cjs',
      'src/database/test-tenants-manual-js.cjs'
    ];
    
    let missing = 0;
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.projectRoot, file))) {
        this.errors.push(`Critical utility file missing: ${file}`);
        missing++;
      }
    }
    
    return missing;
  }

  async validateDocumentationCompleteness() {
    // Check if key documentation exists
    const requiredDocs = [
      'README.md',
      'CHANGELOG.md',
      'docs/trinity/protocols/TRINITY_SYNCHRONIZATION_PROTOCOL.md',
      'docs/trinity/protocols/TRINITY_ENFORCEMENT_GUIDELINES.md',
      'docs/trinity/README.md'
    ];
    
    let completeness = 100;
    for (const doc of requiredDocs) {
      if (!fs.existsSync(path.join(this.projectRoot, doc))) {
        this.warnings.push(`Key documentation missing: ${doc}`);
        completeness -= 15; // Adjusted for more docs
      }
    }
    
    return Math.max(0, completeness);
  }

  async checkDocumentationLinks(docFiles) {
    // Simple broken link detection (placeholder)
    return 0;
  }

  async validateSynchronization() {
    console.log('🔄 Validating Trinity synchronization...');
    
    // Check that test files exist for implementation files
    const implFiles = this.findFiles('src', /\.(ts|js)$/);
    let missingTests = 0;
    
    for (const implFile of implFiles) {
      // Skip certain files that don't need tests
      if (implFile.includes('types.ts') || implFile.includes('constants.ts')) continue;
      
      const testPath = this.getExpectedTestPath(implFile);
      if (!fs.existsSync(path.join(this.projectRoot, testPath))) {
        this.warnings.push(`Missing test file for: ${implFile}`);
        missingTests++;
      }
    }
    
    return missingTests === 0;
  }

  getExpectedTestPath(implFile) {
    // Convert src/module/file.ts -> __tests__/module/file.test.ts
    return implFile.replace(/^src\//, '__tests__/').replace(/\.(ts|js)$/, '.test.$1');
  }

  async validateFileStructure(changedFiles) {
    console.log('🗂️  Validating file structure...');
    
    for (const file of changedFiles) {
      if (!fs.existsSync(path.join(this.projectRoot, file))) {
        this.errors.push(`File scheduled for commit but doesn't exist: ${file}`);
      }
    }
  }

  async validateImportPaths(changedFiles) {
    console.log('🔗 Validating import paths...');
    
    for (const file of changedFiles) {
      if (file.match(/\.(ts|js|tsx|jsx)$/)) {
        const imports = this.extractImports(file);
        for (const importPath of imports) {
          if (!this.validateImportPath(file, importPath)) {
            this.errors.push(`Broken import in ${file}: ${importPath}`);
          }
        }
      }
    }
  }

  async validateTestCoverage(changedFiles) {
    console.log('📊 Validating test coverage...');
    
    const newImplFiles = changedFiles.filter(f => 
      f.startsWith('src/') && 
      f.match(/\.(ts|js)$/) && 
      !f.includes('types.ts') &&
      !f.includes('constants.ts')
    );
    
    for (const implFile of newImplFiles) {
      const testPath = this.getExpectedTestPath(implFile);
      if (!changedFiles.includes(testPath) && !fs.existsSync(path.join(this.projectRoot, testPath))) {
        this.errors.push(`New implementation file ${implFile} missing corresponding test file`);
      }
    }
  }

  async validateCriticalFiles(changedFiles) {
    const criticalFiles = [
      '__tests__/database/utilities/db-connection.util.cjs',
      'src/database/connection-js.cjs',
      'src/database/test-tenants-manual-js.cjs',
      'src/database/core/connection.ts'
    ];
    
    const modifiedCritical = changedFiles.filter(f => criticalFiles.includes(f));
    
    if (modifiedCritical.length > 0) {
      console.log('⚠️  Critical files modified:', modifiedCritical.join(', '));
      this.warnings.push(`Critical files modified - ensure thorough testing: ${modifiedCritical.join(', ')}`);
    }
  }

  parseTestResults(output) {
    // Simple test result parsing
    const totalMatch = output.match(/Tests\s+(\d+)\s+passed/);
    const failMatch = output.match(/(\d+)\s+failed/);
    
    return {
      total: totalMatch ? parseInt(totalMatch[1]) : 0,
      failed: failMatch ? parseInt(failMatch[1]) : 0
    };
  }

  isValid() {
    const trinityScore = Math.round((this.score.test + this.score.implementation + this.score.documentation) / 3);
    return this.errors.length === 0 && trinityScore >= 90;
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🛡️  TRINITY PROTOCOL VALIDATION REPORT');
    console.log('='.repeat(60));
    
    const trinityScore = Math.round((this.score.test + this.score.implementation + this.score.documentation) / 3);
    const status = this.isValid() ? '✅ PASS' : '❌ FAIL';
    
    console.log(`\n📊 OVERALL STATUS: ${status}`);
    console.log(`🎯 Trinity Score: ${trinityScore}% (Required: ≥90%)`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.errors.length}):`);
      this.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
    }
    
    if (this.isValid()) {
      console.log('\n✅ Trinity validation passed! Ready to proceed.');
    } else {
      console.log('\n❌ Trinity validation failed! Please fix issues above.');
    }
    
    console.log('='.repeat(60));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'all';
  
  const validator = new TrinityValidator();
  const success = await validator.validate(mode);
  
  process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = TrinityValidator;

// Run if called directly
if (require.main === module) {
  main();
}
/**
 * Trinity Protocol Core Validator
 * Extracted and enhanced from embedded trinity-validation.cjs
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  TrinityValidationOptions,
  TrinityScore,
  ValidationError
} from '../types/trinity-types';
import {
  TrinityValidationResult,
  LayerValidationResult,
  SynchronizationResult
} from '../types/validation-result';
import { TRINITY_CONSTANTS, VALIDATION_MESSAGES } from '../constants/validation-constants';
import { FileUtils } from '../utils/file-utils';
import { ImportAnalyzer } from '../utils/import-analyzer';
import { ScoreCalculator } from '../utils/score-calculator';

export class TrinityValidator {
  private projectRoot: string;
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];
  private score: TrinityScore = { test: 0, implementation: 0, documentation: 0 };
  private options: TrinityValidationOptions;
  private fileUtils: FileUtils;
  private importAnalyzer: ImportAnalyzer;
  private scoreCalculator: ScoreCalculator;

  constructor(options: TrinityValidationOptions = {}) {
    this.options = {
      projectPath: process.cwd(),
      mode: 'all',
      language: 'typescript',
      minTrinityScore: TRINITY_CONSTANTS.MIN_TRINITY_SCORE,
      excludePatterns: [],
      ...options
    };

    this.projectRoot = this.options.projectPath || process.cwd();
    this.fileUtils = new FileUtils(this.projectRoot);
    this.importAnalyzer = new ImportAnalyzer(this.projectRoot);
    this.scoreCalculator = new ScoreCalculator();
  }

  /**
   * Main validation entry point
   */
  async validate(mode: string = 'all'): Promise<TrinityValidationResult> {
    const startTime = Date.now();
    console.log(VALIDATION_MESSAGES.INFO.STARTING_VALIDATION);

    this.resetValidation();

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

      const executionTime = Date.now() - startTime;
      return this.generateValidationResult(executionTime);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Trinity validation failed with error:', errorMessage);
      
      this.errors.push({
        type: 'error',
        message: `Validation failed: ${errorMessage}`,
        category: 'synchronization'
      });

      const executionTime = Date.now() - startTime;
      return this.generateValidationResult(executionTime);
    }
  }

  /**
   * Project validation entry point for CLI integration
   */
  async validateProject(options: any = {}): Promise<TrinityValidationResult> {
    const mode = options.mode || 'all';
    const threshold = options.threshold || TRINITY_CONSTANTS.MIN_TRINITY_SCORE;
    
    // Update options with provided values
    this.options = {
      ...this.options,
      ...options,
      minTrinityScore: threshold
    };
    
    return await this.validate(mode);
  }

  /**
   * Reset validation state
   */
  private resetValidation(): void {
    this.errors = [];
    this.warnings = [];
    this.score = { test: 0, implementation: 0, documentation: 0 };
  }

  /**
   * Pre-commit validation
   */
  private async validatePreCommit(): Promise<void> {
    console.log('📋 Pre-commit Trinity validation...');
    
    const changedFiles = this.getChangedFiles();
    console.log(VALIDATION_MESSAGES.INFO.ANALYZING_FILES(changedFiles.length));

    await this.validateFileStructure(changedFiles);
    await this.validateImportPaths(changedFiles);
    await this.validateTestCoverage(changedFiles);
    await this.validateCriticalFiles(changedFiles);
  }

  /**
   * Pre-push validation
   */
  private async validatePrePush(): Promise<void> {
    console.log('🚀 Pre-push Trinity validation...');
    
    await this.validateTestSuite();
    await this.validateSynchronization();
    await this.calculateTrinityScore();
  }

  /**
   * Mid-development validation
   */
  private async validateMidDevelopment(): Promise<void> {
    console.log('⚡ Mid-development Trinity validation...');
    
    await this.validateTestLayer();
    await this.validateImplementationLayer();
    await this.validateDocumentationLayer();
    await this.calculateTrinityScore();
  }

  /**
   * Complete validation
   */
  private async validateAll(): Promise<void> {
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
  private async validateTestLayer(): Promise<void> {
    console.log('🧪 Validating Test Layer...');
    
    try {
      const testFiles = this.fileUtils.findTestFiles();
      console.log(VALIDATION_MESSAGES.INFO.FOUND_FILES('test', testFiles.length));

      let dependencyErrors = 0;
      for (const testFile of testFiles) {
        const imports = this.importAnalyzer.extractImports(testFile);
        for (const importPath of imports) {
          if (!this.importAnalyzer.validateImportPath(testFile, importPath)) {
            this.errors.push({
              type: 'error',
              message: VALIDATION_MESSAGES.ERROR.MISSING_DEPENDENCY(importPath, testFile),
              file: testFile,
              category: 'test'
            });
            dependencyErrors++;
          }
        }
      }

      const structureValid = await this.validateTestStructure();
      
      this.score.test = this.scoreCalculator.calculateTestScore(
        testFiles.length,
        dependencyErrors,
        structureValid
      );
      
      console.log(VALIDATION_MESSAGES.SUCCESS.LAYER_VALID('Test', this.score.test));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errors.push({
        type: 'error',
        message: VALIDATION_MESSAGES.ERROR.LAYER_VALIDATION_FAILED('Test', errorMessage),
        category: 'test'
      });
      this.score.test = 0;
    }
  }

  /**
   * Validate implementation layer
   */
  private async validateImplementationLayer(): Promise<void> {
    console.log('⚙️ Validating Implementation Layer...');
    
    try {
      const implFiles = this.fileUtils.findImplementationFiles();
      console.log(VALIDATION_MESSAGES.INFO.FOUND_FILES('implementation', implFiles.length));

      let importErrors = 0;
      for (const implFile of implFiles) {
        const imports = this.importAnalyzer.extractImports(implFile);
        for (const importPath of imports) {
          if (!this.importAnalyzer.validateImportPath(implFile, importPath)) {
            this.errors.push({
              type: 'error',
              message: VALIDATION_MESSAGES.ERROR.MISSING_DEPENDENCY(importPath, implFile),
              file: implFile,
              category: 'implementation'
            });
            importErrors++;
          }
        }
      }

      const missingUtils = await this.checkRequiredUtilities();
      
      this.score.implementation = this.scoreCalculator.calculateImplementationScore(
        implFiles.length,
        importErrors,
        missingUtils
      );
      
      console.log(VALIDATION_MESSAGES.SUCCESS.LAYER_VALID('Implementation', this.score.implementation));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errors.push({
        type: 'error',
        message: VALIDATION_MESSAGES.ERROR.LAYER_VALIDATION_FAILED('Implementation', errorMessage),
        category: 'implementation'
      });
      this.score.implementation = 0;
    }
  }

  /**
   * Validate documentation layer
   */
  private async validateDocumentationLayer(): Promise<void> {
    console.log('📚 Validating Documentation Layer...');
    
    try {
      const docFiles = this.fileUtils.findDocumentationFiles();
      console.log(VALIDATION_MESSAGES.INFO.FOUND_FILES('documentation', docFiles.length));

      const completeness = await this.validateDocumentationCompleteness();
      const brokenLinks = await this.checkDocumentationLinks(docFiles);
      
      this.score.documentation = this.scoreCalculator.calculateDocumentationScore(
        completeness,
        brokenLinks
      );
      
      console.log(VALIDATION_MESSAGES.SUCCESS.LAYER_VALID('Documentation', this.score.documentation));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errors.push({
        type: 'error',
        message: VALIDATION_MESSAGES.ERROR.LAYER_VALIDATION_FAILED('Documentation', errorMessage),
        category: 'documentation'
      });
      this.score.documentation = 0;
    }
  }

  /**
   * Calculate Trinity score
   */
  private async calculateTrinityScore(): Promise<number> {
    const overallScore = this.scoreCalculator.calculateOverallScore(this.score);
    this.score.overall = overallScore;
    
    console.log('\n📊 TRINITY SCORE BREAKDOWN:');
    console.log(VALIDATION_MESSAGES.SUCCESS.LAYER_VALID('Test', this.score.test));
    console.log(VALIDATION_MESSAGES.SUCCESS.LAYER_VALID('Implementation', this.score.implementation));
    console.log(VALIDATION_MESSAGES.SUCCESS.LAYER_VALID('Documentation', this.score.documentation));
    console.log(`   🎯 Overall Trinity:     ${overallScore}%`);
    
    return overallScore;
  }

  /**
   * Validate test suite execution
   */
  private async validateTestSuite(): Promise<boolean> {
    console.log('🧪 Running complete test suite...');
    
    try {
      const result = execSync('npm test', { encoding: 'utf8', stdio: 'pipe' });
      const testResults = this.parseTestResults(result);
      
      if (testResults.failed > 0) {
        this.errors.push({
          type: 'error',
          message: VALIDATION_MESSAGES.ERROR.TEST_SUITE_FAILED(testResults.failed),
          category: 'test'
        });
        return false;
      }
      
      console.log(VALIDATION_MESSAGES.SUCCESS.ALL_TESTS_PASSING(testResults.total));
      return true;
    } catch (error) {
      this.errors.push({
        type: 'error',
        message: 'Test suite execution failed',
        category: 'test'
      });
      return false;
    }
  }

  /**
   * Validate Trinity synchronization
   */
  private async validateSynchronization(): Promise<boolean> {
    console.log('🔄 Validating Trinity synchronization...');
    
    const implFiles = this.fileUtils.findImplementationFiles();
    let missingTests = 0;
    
    for (const implFile of implFiles) {
      if (this.shouldHaveTest(implFile)) {
        const testPath = this.getExpectedTestPath(implFile);
        if (!fs.existsSync(path.join(this.projectRoot, testPath))) {
          this.warnings.push({
            type: 'warning',
            message: VALIDATION_MESSAGES.ERROR.MISSING_TEST(implFile),
            file: implFile,
            category: 'synchronization'
          });
          missingTests++;
        }
      }
    }
    
    return missingTests === 0;
  }

  /**
   * Utility methods
   */
  private getChangedFiles(): string[] {
    try {
      const result = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      return result.trim().split('\n').filter(f => f.length > 0);
    } catch {
      return [];
    }
  }

  private shouldHaveTest(filePath: string): boolean {
    return !filePath.includes('types.ts') && 
           !filePath.includes('constants.ts') &&
           !filePath.includes('index.ts');
  }

  private getExpectedTestPath(implFile: string): string {
    return implFile.replace(/^src\//, '__tests__/').replace(/\.(ts|js)$/, '.test.$1');
  }

  private async validateTestStructure(): Promise<boolean> {
    const requiredTestDirs = ['__tests__'];
    
    for (const dir of requiredTestDirs) {
      if (!fs.existsSync(path.join(this.projectRoot, dir))) {
        this.warnings.push({
          type: 'warning',
          message: VALIDATION_MESSAGES.WARNING.MISSING_RECOMMENDED_DIR(dir),
          category: 'test'
        });
        return false;
      }
    }
    
    return true;
  }

  private async checkRequiredUtilities(): Promise<number> {
    // This would be project-specific - for now return 0
    return 0;
  }

  private async validateDocumentationCompleteness(): Promise<number> {
    const requiredDocs = ['README.md'];
    
    let completeness = 100;
    for (const doc of requiredDocs) {
      if (!fs.existsSync(path.join(this.projectRoot, doc))) {
        this.warnings.push({
          type: 'warning',
          message: VALIDATION_MESSAGES.ERROR.MISSING_DOCUMENTATION(doc),
          category: 'documentation'
        });
        completeness -= 15;
      }
    }
    
    return Math.max(0, completeness);
  }

  private async checkDocumentationLinks(docFiles: string[]): Promise<number> {
    // Simple implementation - return 0 broken links for now
    return 0;
  }

  private async validateFileStructure(changedFiles: string[]): Promise<void> {
    console.log('🗂️ Validating file structure...');
    
    for (const file of changedFiles) {
      if (!fs.existsSync(path.join(this.projectRoot, file))) {
        this.errors.push({
          type: 'error',
          message: VALIDATION_MESSAGES.ERROR.FILE_NOT_FOUND(file),
          file: file,
          category: 'synchronization'
        });
      }
    }
  }

  private async validateImportPaths(changedFiles: string[]): Promise<void> {
    console.log('🔗 Validating import paths...');
    
    for (const file of changedFiles) {
      if (file.match(/\.(ts|js|tsx|jsx)$/)) {
        const imports = this.importAnalyzer.extractImports(file);
        for (const importPath of imports) {
          if (!this.importAnalyzer.validateImportPath(file, importPath)) {
            this.errors.push({
              type: 'error',
              message: VALIDATION_MESSAGES.ERROR.BROKEN_IMPORT(importPath, file),
              file: file,
              category: 'implementation'
            });
          }
        }
      }
    }
  }

  private async validateTestCoverage(changedFiles: string[]): Promise<void> {
    console.log('📊 Validating test coverage...');
    
    const newImplFiles = changedFiles.filter(f => 
      f.startsWith('src/') && 
      f.match(/\.(ts|js)$/) && 
      this.shouldHaveTest(f)
    );
    
    for (const implFile of newImplFiles) {
      const testPath = this.getExpectedTestPath(implFile);
      if (!changedFiles.includes(testPath) && !fs.existsSync(path.join(this.projectRoot, testPath))) {
        this.errors.push({
          type: 'error',
          message: `New implementation file ${implFile} missing corresponding test file`,
          file: implFile,
          category: 'test'
        });
      }
    }
  }

  private async validateCriticalFiles(changedFiles: string[]): Promise<void> {
    const criticalFiles = [
      'src/core/validator.ts', // Self-reference for Trinity package
    ];
    
    const modifiedCritical = changedFiles.filter(f => criticalFiles.includes(f));
    
    if (modifiedCritical.length > 0) {
      console.log('⚠️ Critical files modified:', modifiedCritical.join(', '));
      this.warnings.push({
        type: 'warning',
        message: VALIDATION_MESSAGES.WARNING.CRITICAL_FILES_MODIFIED(modifiedCritical),
        category: 'synchronization'
      });
    }
  }

  private parseTestResults(output: string): { total: number; failed: number } {
    const totalMatch = output.match(/Tests\s+(\d+)\s+passed/);
    const failMatch = output.match(/(\d+)\s+failed/);
    
    return {
      total: totalMatch ? parseInt(totalMatch[1]) : 0,
      failed: failMatch ? parseInt(failMatch[1]) : 0
    };
  }

  private generateValidationResult(executionTime: number): TrinityValidationResult {
    const overallScore = this.score.overall || this.scoreCalculator.calculateOverallScore(this.score);
    
    return {
      valid: this.errors.length === 0 && overallScore >= (this.options.minTrinityScore || 90),
      score: { ...this.score, overall: overallScore },
      errors: this.errors,
      warnings: this.warnings,
      metadata: {
        totalFiles: 0, // Will be calculated by file utils
        testFiles: 0,
        implementationFiles: 0,
        documentationFiles: 0,
        executionTime,
        timestamp: new Date().toISOString(),
        trinityVersion: TRINITY_CONSTANTS.VERSION,
        projectName: this.options.projectPath ? path.basename(this.options.projectPath) : 'unknown'
      },
      layers: {
        test: this.createLayerResult('test', this.score.test),
        implementation: this.createLayerResult('implementation', this.score.implementation),
        documentation: this.createLayerResult('documentation', this.score.documentation)
      },
      synchronization: this.createSynchronizationResult(),
      recommendations: this.generateRecommendations()
    };
  }

  private createLayerResult(layer: 'test' | 'implementation' | 'documentation', score: number): LayerValidationResult {
    const layerErrors = this.errors.filter(e => e.category === layer);
    const layerWarnings = this.warnings.filter(w => w.category === layer);
    
    return {
      layer,
      score,
      files: [], // Will be populated by file utils
      errors: layerErrors,
      warnings: layerWarnings,
      details: {
        totalFiles: 0,
        validFiles: 0,
        errorCount: layerErrors.length,
        warningCount: layerWarnings.length
      }
    };
  }

  private createSynchronizationResult(): SynchronizationResult {
    return {
      synchronized: this.warnings.filter(w => w.category === 'synchronization').length === 0,
      missingTests: [],
      missingDocs: [],
      orphanedTests: [],
      orphanedDocs: [],
      coverage: {
        testCoverage: 0,
        documentationCoverage: 0
      }
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.score.test < 90) {
      recommendations.push('Improve test coverage and fix test dependencies');
    }
    
    if (this.score.implementation < 90) {
      recommendations.push('Fix implementation layer import errors and missing utilities');
    }
    
    if (this.score.documentation < 90) {
      recommendations.push('Add missing documentation and fix broken links');
    }
    
    return recommendations;
  }
}
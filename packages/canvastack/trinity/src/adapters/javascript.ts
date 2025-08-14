/**
 * JavaScript Adapter for Trinity Protocol
 * Handles JavaScript-specific project validation
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileUtils } from '../utils/file-utils';
import { ImportAnalyzer } from '../utils/import-analyzer';
import { ValidationError, ProjectFile } from '../types/trinity-types';

export class JavaScriptAdapter {
  private projectRoot: string;
  private fileUtils: FileUtils;
  private importAnalyzer: ImportAnalyzer;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.fileUtils = new FileUtils(projectRoot);
    this.importAnalyzer = new ImportAnalyzer(projectRoot);
  }

  /**
   * Detect if project is JavaScript-based
   */
  static detectProject(projectRoot: string): boolean {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const hasPackageJson = fs.existsSync(packageJsonPath);
    
    if (!hasPackageJson) return false;

    // Check for JavaScript files in common directories
    const srcDir = path.join(projectRoot, 'src');
    const libDir = path.join(projectRoot, 'lib');
    const appDir = path.join(projectRoot, 'app');

    return [srcDir, libDir, appDir].some(dir => {
      if (!fs.existsSync(dir)) return false;
      
      try {
        const files = fs.readdirSync(dir);
        return files.some(file => /\.(js|jsx|mjs|cjs)$/.test(file));
      } catch {
        return false;
      }
    });
  }

  /**
   * Get project structure information
   */
  getProjectStructure(): {
    hasPackageJson: boolean;
    hasTestFramework: boolean;
    hasLintConfig: boolean;
    hasBuildConfig: boolean;
    framework?: string;
    testFramework?: string;
  } {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    let packageJson: any = {};
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      } catch (error) {
        console.warn('Could not parse package.json');
      }
    }

    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    return {
      hasPackageJson: fs.existsSync(packageJsonPath),
      hasTestFramework: this.detectTestFramework(dependencies),
      hasLintConfig: this.detectLintConfig(),
      hasBuildConfig: this.detectBuildConfig(),
      framework: this.detectFramework(dependencies),
      testFramework: this.getTestFramework(dependencies)
    };
  }

  /**
   * Validate JavaScript-specific requirements
   */
  validateJavaScriptRequirements(): ValidationError[] {
    const errors: ValidationError[] = [];
    const structure = this.getProjectStructure();

    if (!structure.hasPackageJson) {
      errors.push({
        type: 'error',
        message: 'Missing package.json file',
        category: 'implementation'
      });
    }

    if (!structure.hasTestFramework) {
      errors.push({
        type: 'warning',
        message: 'No test framework detected (Jest, Mocha, Vitest, etc.)',
        category: 'test'
      });
    }

    return errors;
  }

  /**
   * Get recommended test file patterns for JavaScript projects
   */
  getTestPatterns(): string[] {
    const structure = this.getProjectStructure();
    
    const basePatterns = [
      '**/__tests__/**/*.test.js',
      '**/__tests__/**/*.spec.js',
      '**/*.test.js',
      '**/*.spec.js'
    ];

    if (structure.testFramework === 'jest') {
      basePatterns.push('**/__tests__/**/*.js');
    }

    return basePatterns;
  }

  /**
   * Get implementation file patterns
   */
  getImplementationPatterns(): string[] {
    return [
      'src/**/*.js',
      'lib/**/*.js',
      'app/**/*.js',
      'index.js',
      '!**/*.test.js',
      '!**/*.spec.js'
    ];
  }

  /**
   * Validate module system consistency
   */
  validateModuleSystem(): ValidationError[] {
    const errors: ValidationError[] = [];
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const moduleType = packageJson.type;
        
        // Check for mixed module systems
        const implementationFiles = this.fileUtils.findImplementationFiles()
          .filter(f => f.endsWith('.js'));
        
        let hasRequire = false;
        let hasImport = false;
        
        for (const file of implementationFiles.slice(0, 10)) { // Sample first 10 files
          const content = this.fileUtils.readFile(file);
          
          if (/\brequire\s*\(/.test(content)) hasRequire = true;
          if (/\bimport\s+.*?\s+from\s+/.test(content)) hasImport = true;
        }
        
        if (hasRequire && hasImport && moduleType !== 'module') {
          errors.push({
            type: 'warning',
            message: 'Mixed CommonJS and ES Module syntax detected',
            category: 'implementation'
          });
        }
      } catch (error) {
        errors.push({
          type: 'error',
          message: 'Could not validate module system: invalid package.json',
          category: 'implementation'
        });
      }
    }
    
    return errors;
  }

  /**
   * Get dependency validation results
   */
  validateDependencies(): ValidationError[] {
    const errors: ValidationError[] = [];
    const implementationFiles = this.fileUtils.findImplementationFiles()
      .filter(f => /\.js$/.test(f));
    
    for (const file of implementationFiles) {
      const imports = this.importAnalyzer.extractImports(file);
      
      for (const importPath of imports) {
        if (!this.importAnalyzer.validateImportPath(file, importPath)) {
          errors.push({
            type: 'error',
            message: `Unresolved import: ${importPath}`,
            file: file,
            category: 'implementation'
          });
        }
      }
    }
    
    return errors;
  }

  /**
   * Analyze project files
   */
  analyzeProjectFiles(): ProjectFile[] {
    const files: ProjectFile[] = [];
    
    // Get all JavaScript files
    const implementationFiles = this.fileUtils.findImplementationFiles()
      .filter(f => /\.(js|jsx)$/.test(f));
    
    const testFiles = this.fileUtils.findTestFiles()
      .filter(f => /\.(js|jsx)$/.test(f));
    
    const docFiles = this.fileUtils.findDocumentationFiles();

    // Process implementation files
    for (const filePath of implementationFiles) {
      const imports = this.importAnalyzer.extractImports(filePath);
      
      files.push({
        path: filePath,
        type: 'implementation',
        language: 'javascript',
        imports: imports
      });
    }

    // Process test files
    for (const filePath of testFiles) {
      const imports = this.importAnalyzer.extractImports(filePath);
      
      files.push({
        path: filePath,
        type: 'test',
        language: 'javascript',
        imports: imports
      });
    }

    // Process documentation files
    for (const filePath of docFiles) {
      files.push({
        path: filePath,
        type: 'documentation',
        language: 'markdown',
        imports: []
      });
    }

    return files;
  }

  /**
   * Detect test framework from dependencies
   */
  private detectTestFramework(dependencies: Record<string, string>): boolean {
    const testFrameworks = ['jest', 'mocha', 'chai', 'vitest', 'ava', 'tape', 'jasmine'];
    return testFrameworks.some(framework => dependencies[framework]);
  }

  /**
   * Get test framework name
   */
  private getTestFramework(dependencies: Record<string, string>): string | undefined {
    if (dependencies.jest) return 'jest';
    if (dependencies.mocha) return 'mocha';
    if (dependencies.vitest) return 'vitest';
    if (dependencies.ava) return 'ava';
    if (dependencies.jasmine) return 'jasmine';
    return undefined;
  }

  /**
   * Detect lint configuration
   */
  private detectLintConfig(): boolean {
    const lintFiles = [
      '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml',
      'eslint.config.js', '.jshintrc', '.jscsrc'
    ];

    return lintFiles.some(file => 
      fs.existsSync(path.join(this.projectRoot, file))
    );
  }

  /**
   * Detect build configuration
   */
  private detectBuildConfig(): boolean {
    const buildFiles = [
      'webpack.config.js', 'rollup.config.js', 'vite.config.js',
      'babel.config.js', '.babelrc', 'gulpfile.js', 'Gruntfile.js'
    ];

    return buildFiles.some(file => 
      fs.existsSync(path.join(this.projectRoot, file))
    );
  }

  /**
   * Detect JavaScript framework
   */
  private detectFramework(dependencies: Record<string, string>): string | undefined {
    if (dependencies.react) return 'react';
    if (dependencies.vue) return 'vue';
    if (dependencies.angular || dependencies['@angular/core']) return 'angular';
    if (dependencies.express) return 'express';
    if (dependencies.next) return 'nextjs';
    if (dependencies.nuxt) return 'nuxtjs';
    if (dependencies.svelte) return 'svelte';
    return undefined;
  }

  /**
   * Get recommended directory structure for JavaScript projects
   */
  getRecommendedStructure(): {
    directories: string[];
    files: string[];
    description: string;
  } {
    return {
      directories: [
        'src/',
        '__tests__/',
        'docs/',
        'lib/',
        'dist/' // build output
      ],
      files: [
        'package.json',
        'README.md',
        '.gitignore',
        '.eslintrc.js',
        'jest.config.js'
      ],
      description: 'Standard JavaScript project structure with source, tests, and documentation'
    };
  }

  /**
   * Validate Node.js version compatibility
   */
  validateNodeCompatibility(): ValidationError[] {
    const errors: ValidationError[] = [];
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const engines = packageJson.engines;
        
        if (!engines || !engines.node) {
          errors.push({
            type: 'warning',
            message: 'No Node.js version specified in package.json engines field',
            category: 'implementation'
          });
        }
      } catch (error) {
        // Already handled in other validations
      }
    }
    
    return errors;
  }
}
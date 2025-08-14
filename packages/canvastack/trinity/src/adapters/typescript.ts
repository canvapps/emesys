/**
 * TypeScript Adapter for Trinity Protocol
 * Handles TypeScript-specific project validation
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileUtils } from '../utils/file-utils';
import { ImportAnalyzer } from '../utils/import-analyzer';
import { ValidationError, ProjectFile } from '../types/trinity-types';

export class TypeScriptAdapter {
  private projectRoot: string;
  private fileUtils: FileUtils;
  private importAnalyzer: ImportAnalyzer;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.fileUtils = new FileUtils(projectRoot);
    this.importAnalyzer = new ImportAnalyzer(projectRoot);
  }

  /**
   * Detect if project is TypeScript-based
   */
  static detectProject(projectRoot: string): boolean {
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) return true;

    // Check for TypeScript files in common directories
    const srcDir = path.join(projectRoot, 'src');
    const libDir = path.join(projectRoot, 'lib');
    const appDir = path.join(projectRoot, 'app');

    return [srcDir, libDir, appDir].some(dir => {
      if (!fs.existsSync(dir)) return false;
      
      try {
        const files = fs.readdirSync(dir);
        return files.some(file => /\.(ts|tsx)$/.test(file));
      } catch {
        return false;
      }
    });
  }

  /**
   * Get TypeScript project configuration
   */
  getTypeScriptConfig(): {
    hasTsConfig: boolean;
    tsConfigPath?: string;
    compilerOptions?: any;
    strict?: boolean;
    target?: string;
    module?: string;
    declaration?: boolean;
  } {
    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    
    if (!fs.existsSync(tsconfigPath)) {
      return { hasTsConfig: false };
    }

    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      const compilerOptions = tsconfig.compilerOptions || {};

      return {
        hasTsConfig: true,
        tsConfigPath: tsconfigPath,
        compilerOptions,
        strict: compilerOptions.strict,
        target: compilerOptions.target,
        module: compilerOptions.module,
        declaration: compilerOptions.declaration
      };
    } catch (error) {
      return {
        hasTsConfig: true,
        tsConfigPath: tsconfigPath
      };
    }
  }

  /**
   * Get project structure information
   */
  getProjectStructure(): {
    hasTsConfig: boolean;
    hasPackageJson: boolean;
    hasTestFramework: boolean;
    hasTypeDefinitions: boolean;
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
    const tsConfig = this.getTypeScriptConfig();
    
    return {
      hasTsConfig: tsConfig.hasTsConfig,
      hasPackageJson: fs.existsSync(packageJsonPath),
      hasTestFramework: this.detectTestFramework(dependencies),
      hasTypeDefinitions: this.detectTypeDefinitions(dependencies),
      hasLintConfig: this.detectLintConfig(),
      hasBuildConfig: this.detectBuildConfig(),
      framework: this.detectFramework(dependencies),
      testFramework: this.getTestFramework(dependencies)
    };
  }

  /**
   * Validate TypeScript-specific requirements
   */
  validateTypeScriptRequirements(): ValidationError[] {
    const errors: ValidationError[] = [];
    const structure = this.getProjectStructure();
    const tsConfig = this.getTypeScriptConfig();

    if (!structure.hasTsConfig) {
      errors.push({
        type: 'error',
        message: 'Missing tsconfig.json file',
        category: 'implementation'
      });
    }

    if (!structure.hasPackageJson) {
      errors.push({
        type: 'error',
        message: 'Missing package.json file',
        category: 'implementation'
      });
    }

    if (tsConfig.hasTsConfig && !tsConfig.strict) {
      errors.push({
        type: 'warning',
        message: 'TypeScript strict mode is not enabled',
        category: 'implementation'
      });
    }

    if (!structure.hasTestFramework) {
      errors.push({
        type: 'warning',
        message: 'No TypeScript-compatible test framework detected (Jest, Vitest, etc.)',
        category: 'test'
      });
    }

    if (!structure.hasTypeDefinitions) {
      errors.push({
        type: 'warning',
        message: 'No type definition dependencies found',
        category: 'implementation'
      });
    }

    return errors;
  }

  /**
   * Validate TypeScript configuration
   */
  validateTsConfig(): ValidationError[] {
    const errors: ValidationError[] = [];
    const tsConfig = this.getTypeScriptConfig();

    if (!tsConfig.hasTsConfig) {
      return [{
        type: 'error',
        message: 'TypeScript configuration file (tsconfig.json) is missing',
        category: 'implementation'
      }];
    }

    if (!tsConfig.compilerOptions) {
      errors.push({
        type: 'error',
        message: 'Invalid tsconfig.json: missing compilerOptions',
        category: 'implementation'
      });
      return errors;
    }

    const options = tsConfig.compilerOptions;

    // Check for recommended compiler options
    const recommendations = [
      { option: 'strict', value: true, message: 'Enable strict type checking' },
      { option: 'noImplicitAny', value: true, message: 'Disable implicit any types' },
      { option: 'noImplicitReturns', value: true, message: 'Ensure all code paths return a value' },
      { option: 'noFallthroughCasesInSwitch', value: true, message: 'Prevent switch case fallthrough' }
    ];

    for (const rec of recommendations) {
      if (options[rec.option] !== rec.value) {
        errors.push({
          type: 'warning',
          message: `TypeScript: ${rec.message} (${rec.option}: ${rec.value})`,
          category: 'implementation'
        });
      }
    }

    // Check for declaration generation if this is a library
    if (this.isLibraryProject() && !options.declaration) {
      errors.push({
        type: 'warning',
        message: 'Library project should generate type declarations (declaration: true)',
        category: 'implementation'
      });
    }

    return errors;
  }

  /**
   * Get recommended test file patterns for TypeScript projects
   */
  getTestPatterns(): string[] {
    return [
      '**/__tests__/**/*.test.ts',
      '**/__tests__/**/*.test.tsx',
      '**/__tests__/**/*.spec.ts',
      '**/__tests__/**/*.spec.tsx',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx'
    ];
  }

  /**
   * Get implementation file patterns
   */
  getImplementationPatterns(): string[] {
    return [
      'src/**/*.ts',
      'src/**/*.tsx',
      'lib/**/*.ts',
      'lib/**/*.tsx',
      'app/**/*.ts',
      'app/**/*.tsx',
      'index.ts',
      '!**/*.test.ts',
      '!**/*.test.tsx',
      '!**/*.spec.ts',
      '!**/*.spec.tsx',
      '!**/*.d.ts'
    ];
  }

  /**
   * Validate TypeScript imports and module resolution
   */
  validateTypeScriptImports(): ValidationError[] {
    const errors: ValidationError[] = [];
    const implementationFiles = this.fileUtils.findImplementationFiles()
      .filter(f => /\.tsx?$/.test(f));
    
    for (const file of implementationFiles) {
      const imports = this.importAnalyzer.extractImports(file);
      
      for (const importPath of imports) {
        if (!this.importAnalyzer.validateImportPath(file, importPath)) {
          errors.push({
            type: 'error',
            message: `Unresolved TypeScript import: ${importPath}`,
            file: file,
            category: 'implementation'
          });
        }
      }
    }
    
    return errors;
  }

  /**
   * Check for type-only imports consistency
   */
  validateTypeImports(): ValidationError[] {
    const errors: ValidationError[] = [];
    const implementationFiles = this.fileUtils.findImplementationFiles()
      .filter(f => /\.tsx?$/.test(f));
    
    for (const file of implementationFiles) {
      try {
        const content = this.fileUtils.readFile(file);
        
        // Check for potential type-only imports that could be optimized
        const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"`]([^'"`]+)['"`]/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
          const importedItems = match[1];
          const module = match[2];
          
          // Simple heuristic: if all imports are capitalized, they might be types
          const items = importedItems.split(',').map(s => s.trim());
          const allCapitalized = items.every(item => /^[A-Z]/.test(item));
          
          if (allCapitalized && items.length > 1 && !importedItems.includes('type ')) {
            errors.push({
              type: 'warning',
              message: `Consider using type-only import for ${module}`,
              file: file,
              category: 'implementation'
            });
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    return errors;
  }

  /**
   * Analyze project files
   */
  analyzeProjectFiles(): ProjectFile[] {
    const files: ProjectFile[] = [];
    
    // Get all TypeScript files
    const implementationFiles = this.fileUtils.findImplementationFiles()
      .filter(f => /\.(ts|tsx)$/.test(f));
    
    const testFiles = this.fileUtils.findTestFiles()
      .filter(f => /\.(ts|tsx)$/.test(f));
    
    const docFiles = this.fileUtils.findDocumentationFiles();

    // Process implementation files
    for (const filePath of implementationFiles) {
      const imports = this.importAnalyzer.extractImports(filePath);
      
      files.push({
        path: filePath,
        type: 'implementation',
        language: 'typescript',
        imports: imports
      });
    }

    // Process test files
    for (const filePath of testFiles) {
      const imports = this.importAnalyzer.extractImports(filePath);
      
      files.push({
        path: filePath,
        type: 'test',
        language: 'typescript',
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
    const testFrameworks = [
      'jest', '@types/jest', 'ts-jest',
      'mocha', '@types/mocha', 'ts-mocha',
      'vitest', 'ava', '@types/ava'
    ];
    return testFrameworks.some(framework => dependencies[framework]);
  }

  /**
   * Get test framework name
   */
  private getTestFramework(dependencies: Record<string, string>): string | undefined {
    if (dependencies.jest || dependencies['@types/jest'] || dependencies['ts-jest']) return 'jest';
    if (dependencies.mocha || dependencies['@types/mocha'] || dependencies['ts-mocha']) return 'mocha';
    if (dependencies.vitest) return 'vitest';
    if (dependencies.ava || dependencies['@types/ava']) return 'ava';
    return undefined;
  }

  /**
   * Detect type definitions
   */
  private detectTypeDefinitions(dependencies: Record<string, string>): boolean {
    const typeDefinitions = Object.keys(dependencies).filter(dep => dep.startsWith('@types/'));
    return typeDefinitions.length > 0 || dependencies.typescript !== undefined;
  }

  /**
   * Detect lint configuration
   */
  private detectLintConfig(): boolean {
    const lintFiles = [
      '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml',
      'eslint.config.js', 'tslint.json'
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
      'webpack.config.js', 'webpack.config.ts',
      'rollup.config.js', 'rollup.config.ts',
      'vite.config.js', 'vite.config.ts',
      'babel.config.js', '.babelrc'
    ];

    return buildFiles.some(file => 
      fs.existsSync(path.join(this.projectRoot, file))
    );
  }

  /**
   * Detect TypeScript framework
   */
  private detectFramework(dependencies: Record<string, string>): string | undefined {
    if (dependencies.react || dependencies['@types/react']) return 'react';
    if (dependencies.vue || dependencies['@vue/composition-api']) return 'vue';
    if (dependencies.angular || dependencies['@angular/core']) return 'angular';
    if (dependencies.express || dependencies['@types/express']) return 'express';
    if (dependencies.next) return 'nextjs';
    if (dependencies.nuxt) return 'nuxtjs';
    if (dependencies.svelte) return 'svelte';
    if (dependencies.nestjs || dependencies['@nestjs/core']) return 'nestjs';
    return undefined;
  }

  /**
   * Check if this is a library project
   */
  private isLibraryProject(): boolean {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return packageJson.main || packageJson.module || packageJson.exports;
      } catch (error) {
        return false;
      }
    }
    
    return false;
  }

  /**
   * Get recommended directory structure for TypeScript projects
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
        'dist/', // build output
        'types/' // type definitions
      ],
      files: [
        'package.json',
        'tsconfig.json',
        'README.md',
        '.gitignore',
        '.eslintrc.js',
        'jest.config.js'
      ],
      description: 'Standard TypeScript project structure with strong typing and testing'
    };
  }

  /**
   * Validate TypeScript version compatibility
   */
  validateTypeScriptVersion(): ValidationError[] {
    const errors: ValidationError[] = [];
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (!dependencies.typescript) {
          errors.push({
            type: 'warning',
            message: 'TypeScript not found in dependencies',
            category: 'implementation'
          });
        }
      } catch (error) {
        // Already handled in other validations
      }
    }
    
    return errors;
  }

  /**
   * Check for unused type imports
   */
  getUnusedTypeImports(): ValidationError[] {
    const errors: ValidationError[] = [];
    // This would require more sophisticated AST parsing
    // For now, return empty array - can be implemented later
    return errors;
  }
}
/**
 * Trinity Configuration Manager
 * Handles loading and managing Trinity configuration
 */

import * as fs from 'fs';
import * as path from 'path';
import { TrinityFullConfig, TrinityProjectConfig } from '../types/config-types';
import { DEFAULT_FILE_PATTERNS, DEFAULT_DIRECTORIES } from '../constants/validation-constants';

export class TrinityConfig {
  private config: TrinityFullConfig;
  private configPath: string;
  private projectRoot: string;

  constructor(projectRoot: string, customConfig?: Partial<TrinityFullConfig>) {
    this.projectRoot = projectRoot;
    this.configPath = path.join(projectRoot, 'trinity.config.js');
    this.config = this.loadConfig(projectRoot, customConfig);
  }

  /**
   * Load configuration from file or use defaults
   */
  private loadConfig(projectRoot: string, customConfig?: Partial<TrinityFullConfig>): TrinityFullConfig {
    let fileConfig: Partial<TrinityFullConfig> = {};

    // Try to load from trinity.config.js
    if (fs.existsSync(this.configPath)) {
      try {
        delete require.cache[require.resolve(this.configPath)];
        fileConfig = require(this.configPath);
      } catch (error) {
        console.warn(`Warning: Could not load trinity.config.js: ${error}`);
      }
    }

    // Merge default config with file config and custom config
    const defaultConfig = this.getDefaultConfig(projectRoot);
    return this.mergeConfigs(defaultConfig, fileConfig, customConfig || {});
  }

  /**
   * Get default Trinity configuration
   */
  private getDefaultConfig(projectRoot: string): TrinityFullConfig {
    return {
      project: {
        projectName: path.basename(projectRoot),
        projectPath: projectRoot,
        language: 'typescript',
        framework: 'auto-detect',
        version: '1.0.0'
      },
      validation: {
        minTrinityScore: 90,
        requireAllLayers: true,
        enforceTestCoverage: true,
        enforceDocumentation: true,
        strictMode: false
      },
      patterns: {
        testPatterns: [...DEFAULT_FILE_PATTERNS.TEST_PATTERNS],
        implementationPatterns: [...DEFAULT_FILE_PATTERNS.IMPLEMENTATION_PATTERNS],
        documentationPatterns: [...DEFAULT_FILE_PATTERNS.DOCUMENTATION_PATTERNS],
        excludePatterns: [...DEFAULT_FILE_PATTERNS.EXCLUDE_PATTERNS]
      },
      directories: {
        testDir: [...DEFAULT_DIRECTORIES.TEST_DIRS],
        sourceDir: [...DEFAULT_DIRECTORIES.SOURCE_DIRS],
        docsDir: [...DEFAULT_DIRECTORIES.DOCS_DIRS],
        excludeDirs: [...DEFAULT_DIRECTORIES.EXCLUDE_DIRS]
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
        blockPushOnFailure: true,
        generateCommitMessages: false
      },
      reporting: {
        outputFormat: 'console',
        verboseLogging: false,
        includeWarnings: true,
        generateReports: false
      }
    };
  }

  /**
   * Deep merge configurations
   */
  private mergeConfigs(...configs: Partial<TrinityFullConfig>[]): TrinityFullConfig {
    const result: any = {};

    for (const config of configs) {
      for (const key in config) {
        if (config.hasOwnProperty(key)) {
          const value = (config as any)[key];
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            result[key] = this.mergeObjects(result[key] || {}, value);
          } else {
            result[key] = value;
          }
        }
      }
    }

    return result as TrinityFullConfig;
  }

  /**
   * Deep merge objects
   */
  private mergeObjects(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const value = source[key];
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result[key] = this.mergeObjects(result[key] || {}, value);
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Get full configuration
   */
  getConfig(): TrinityFullConfig {
    return this.config;
  }

  /**
   * Get project configuration
   */
  getProjectConfig(): TrinityProjectConfig {
    return this.config.project;
  }

  /**
   * Get validation configuration
   */
  getValidationConfig() {
    return this.config.validation;
  }

  /**
   * Get file patterns
   */
  getFilePatterns() {
    return this.config.patterns;
  }

  /**
   * Get directories configuration
   */
  getDirectories() {
    return this.config.directories;
  }

  /**
   * Get scoring configuration
   */
  getScoringConfig() {
    return this.config.scoring;
  }

  /**
   * Get git integration configuration
   */
  getGitConfig() {
    return this.config.git;
  }

  /**
   * Get reporting configuration
   */
  getReportingConfig() {
    return this.config.reporting;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<TrinityFullConfig>): void {
    this.config = this.mergeConfigs(this.config, updates);
  }

  /**
   * Save configuration to file
   */
  saveConfig(): void {
    const configContent = this.generateConfigFileContent();
    fs.writeFileSync(this.configPath, configContent, 'utf8');
  }

  /**
   * Generate configuration file content
   */
  private generateConfigFileContent(): string {
    return `module.exports = ${JSON.stringify(this.config, null, 2)};`;
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate project config
    if (!this.config.project.language) {
      errors.push('Project language is required');
    }

    if (!this.config.project.projectPath) {
      errors.push('Project path is required');
    }

    // Validate validation config
    if (this.config.validation.minTrinityScore < 0 || this.config.validation.minTrinityScore > 100) {
      errors.push('Minimum Trinity score must be between 0 and 100');
    }

    // Validate scoring weights
    const scoring = this.config.scoring;
    if (scoring.testWeight < 0 || scoring.implementationWeight < 0 || scoring.documentationWeight < 0) {
      errors.push('Scoring weights must be non-negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Auto-detect project language and framework
   */
  autoDetectProject(): void {
    const projectPath = this.config.project.projectPath!;
    
    // Detect language
    if (fs.existsSync(path.join(projectPath, 'tsconfig.json'))) {
      this.config.project.language = 'typescript';
    } else if (fs.existsSync(path.join(projectPath, 'package.json'))) {
      this.config.project.language = 'javascript';
    }

    // Detect framework
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (dependencies.react) {
          this.config.project.framework = 'react';
        } else if (dependencies.vue) {
          this.config.project.framework = 'vue';
        } else if (dependencies.angular || dependencies['@angular/core']) {
          this.config.project.framework = 'angular';
        } else if (dependencies.express) {
          this.config.project.framework = 'express';
        } else if (dependencies.next) {
          this.config.project.framework = 'nextjs';
        } else {
          this.config.project.framework = 'vanilla';
        }
      } catch (error) {
        console.warn('Could not parse package.json for framework detection');
        this.config.project.framework = 'unknown';
      }
    }
  }

  /**
   * Create example configuration file
   */
  static createExampleConfig(projectPath: string): void {
    const exampleConfig = new TrinityConfig(projectPath);
    const examplePath = path.join(projectPath, 'trinity.config.example.js');
    
    const content = `// Trinity Protocol Configuration
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
};`;

    fs.writeFileSync(examplePath, content, 'utf8');
    console.log(`Example configuration created at: ${examplePath}`);
  }

  /**
   * Load configuration from specified file path
   */
  async load(configPath?: string): Promise<void> {
    if (configPath) {
      this.configPath = path.isAbsolute(configPath) ? configPath : path.join(this.projectRoot, configPath);
    }
    
    this.config = this.loadConfig(this.projectRoot);
  }

  /**
   * Check if configuration file exists
   */
  async exists(): Promise<boolean> {
    return fs.existsSync(this.configPath);
  }

  /**
   * Get project information
   */
  getProjectInfo() {
    return {
      name: this.config.project.projectName,
      path: this.config.project.projectPath,
      type: this.detectProjectType(),
      language: this.config.project.language,
      framework: this.config.project.framework,
      version: this.config.project.version
    };
  }

  /**
   * Detect project type based on files and structure
   */
  private detectProjectType(): string {
    const projectPath = this.config.project.projectPath!;
    
    if (fs.existsSync(path.join(projectPath, 'package.json'))) {
      const packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
      
      // Check if it's a library/package
      if (packageJson.main && packageJson.name && packageJson.version) {
        return 'library';
      }
      
      // Check dependencies for app type
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.react && (deps['react-dom'] || deps['next'])) {
        return 'web-app';
      } else if (deps.express || deps.koa || deps.fastify) {
        return 'api-server';
      } else if (deps.electron) {
        return 'desktop-app';
      } else if (deps['react-native']) {
        return 'mobile-app';
      } else {
        return 'node-app';
      }
    }
    
    if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
      return 'rust-app';
    }
    
    if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
      return 'go-app';
    }
    
    if (fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
        fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
      return 'python-app';
    }
    
    return 'unknown';
  }

  /**
   * Initialize configuration with template
   */
  async initialize(options: {
    template: string;
    projectPath: string;
  }): Promise<void> {
    // Auto-detect project characteristics
    this.autoDetectProject();
    
    // Apply template-specific configurations
    this.applyTemplate(options.template);
    
    // Generate and save configuration file
    const configContent = this.generateConfigFileContent();
    fs.writeFileSync(this.configPath, configContent, 'utf8');
    
    // Create example file as reference
    TrinityConfig.createExampleConfig(options.projectPath);
  }

  /**
   * Apply template-specific configurations
   */
  private applyTemplate(template: string): void {
    const templates: Record<string, Partial<TrinityFullConfig>> = {
      javascript: {
        project: {
          language: 'javascript' as const
        },
        patterns: {
          testPatterns: ['**/*.test.js', '**/*.spec.js', '__tests__/**/*.js'],
          implementationPatterns: ['src/**/*.js', '!**/*.test.js', '!**/*.spec.js'],
          documentationPatterns: ['**/*.md', 'docs/**/*', 'README*'],
          excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
        }
      },
      typescript: {
        project: {
          language: 'typescript' as const
        },
        patterns: {
          testPatterns: ['**/*.test.ts', '**/*.spec.ts', '__tests__/**/*.ts'],
          implementationPatterns: ['src/**/*.ts', '!**/*.test.ts', '!**/*.spec.ts'],
          documentationPatterns: ['**/*.md', 'docs/**/*', 'README*'],
          excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
        }
      },
      react: {
        project: {
          language: 'typescript' as const,
          framework: 'react'
        },
        patterns: {
          testPatterns: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}', '__tests__/**/*.{ts,tsx,js,jsx}'],
          implementationPatterns: ['src/**/*.{ts,tsx,js,jsx}', '!**/*.test.{ts,tsx,js,jsx}', '!**/*.spec.{ts,tsx,js,jsx}'],
          documentationPatterns: ['**/*.md', 'docs/**/*', 'README*'],
          excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
        }
      },
      vue: {
        project: {
          language: 'typescript' as const,
          framework: 'vue'
        },
        patterns: {
          testPatterns: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}', '__tests__/**/*.{ts,js}'],
          implementationPatterns: ['src/**/*.{ts,js,vue}', '!**/*.test.{ts,js}', '!**/*.spec.{ts,js}'],
          documentationPatterns: ['**/*.md', 'docs/**/*', 'README*'],
          excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
        }
      },
      node: {
        project: {
          language: 'typescript' as const,
          framework: 'express'
        },
        patterns: {
          testPatterns: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}', '__tests__/**/*.{ts,js}'],
          implementationPatterns: ['src/**/*.{ts,js}', '!**/*.test.{ts,js}', '!**/*.spec.{ts,js}'],
          documentationPatterns: ['**/*.md', 'docs/**/*', 'README*'],
          excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
        }
      }
    };

    const templateConfig = templates[template] || templates.javascript;
    this.config = this.mergeConfigs(this.config, templateConfig);
  }

  /**
   * Get validation configuration object for CLI
   */
  get validation() {
    return this.config.validation;
  }
}
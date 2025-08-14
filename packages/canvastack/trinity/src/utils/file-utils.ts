/**
 * File Utilities for Trinity Protocol
 * Handles file system operations and pattern matching
 */

import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_FILE_PATTERNS, DEFAULT_DIRECTORIES } from '../constants/validation-constants';

export class FileUtils {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Find all test files in the project
   */
  findTestFiles(): string[] {
    const testFiles: string[] = [];
    
    for (const testDir of DEFAULT_DIRECTORIES.TEST_DIRS) {
      const files = this.findFiles(testDir, /\.(test|spec)\.(ts|js|jsx|tsx|mjs|cjs)$/);
      testFiles.push(...files);
    }
    
    // Also search for test files in src directory
    const srcTestFiles = this.findFiles('src', /\.(test|spec)\.(ts|js|jsx|tsx)$/);
    testFiles.push(...srcTestFiles);
    
    return this.removeDuplicates(testFiles);
  }

  /**
   * Find all implementation files in the project
   */
  findImplementationFiles(): string[] {
    const implFiles: string[] = [];
    
    for (const sourceDir of DEFAULT_DIRECTORIES.SOURCE_DIRS) {
      const files = this.findFiles(sourceDir, /\.(ts|js|jsx|tsx)$/, {
        exclude: [/\.(test|spec)\.(ts|js|jsx|tsx)$/, /\.d\.ts$/]
      });
      implFiles.push(...files);
    }
    
    return this.removeDuplicates(implFiles);
  }

  /**
   * Find all documentation files in the project
   */
  findDocumentationFiles(): string[] {
    const docFiles: string[] = [];
    
    // Find in docs directories
    for (const docsDir of DEFAULT_DIRECTORIES.DOCS_DIRS) {
      const files = this.findFiles(docsDir, /\.(md|mdx|rst|txt)$/);
      docFiles.push(...files);
    }
    
    // Find top-level documentation files
    const topLevelDocs = this.findFiles('.', /\.(md|mdx)$/, { maxDepth: 1 });
    docFiles.push(...topLevelDocs);
    
    return this.removeDuplicates(docFiles);
  }

  /**
   * Find files matching pattern in directory
   */
  findFiles(
    dir: string, 
    pattern: RegExp, 
    options: {
      maxDepth?: number;
      exclude?: RegExp[];
    } = {}
  ): string[] {
    const files: string[] = [];
    const fullDir = path.join(this.projectRoot, dir);
    
    if (!fs.existsSync(fullDir)) return files;
    
    const { maxDepth = null, exclude = [] } = options;
    
    const searchDir = (currentDir: string, depth: number = 0): void => {
      if (maxDepth !== null && depth > maxDepth) return;
      
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          const relativePath = path.relative(this.projectRoot, fullPath);
          
          // Skip excluded directories
          if (entry.isDirectory() && this.shouldExcludeDirectory(entry.name)) {
            continue;
          }
          
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            searchDir(fullPath, depth + 1);
          } else if (entry.isFile() && pattern.test(entry.name)) {
            // Check exclude patterns
            const shouldExclude = exclude.some(excludePattern => 
              excludePattern.test(relativePath) || excludePattern.test(entry.name)
            );
            
            if (!shouldExclude) {
              files.push(relativePath);
            }
          }
        }
      } catch (error) {
        // Skip directories that can't be read
        console.warn(`Cannot read directory: ${currentDir}`);
      }
    };
    
    searchDir(fullDir);
    return files;
  }

  /**
   * Check if file exists
   */
  fileExists(filePath: string): boolean {
    return fs.existsSync(path.join(this.projectRoot, filePath));
  }

  /**
   * Read file content
   */
  readFile(filePath: string): string {
    try {
      return fs.readFileSync(path.join(this.projectRoot, filePath), 'utf8');
    } catch (error) {
      throw new Error(`Cannot read file ${filePath}: ${error}`);
    }
  }

  /**
   * Get file stats
   */
  getFileStats(filePath: string): fs.Stats | null {
    try {
      return fs.statSync(path.join(this.projectRoot, filePath));
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if directory should be excluded
   */
  private shouldExcludeDirectory(dirName: string): boolean {
    return (DEFAULT_DIRECTORIES.EXCLUDE_DIRS as readonly string[]).includes(dirName) ||
           dirName.startsWith('.') ||
           dirName === 'node_modules';
  }

  /**
   * Remove duplicate file paths
   */
  private removeDuplicates(files: string[]): string[] {
    return Array.from(new Set(files));
  }

  /**
   * Get file type based on path
   */
  getFileType(filePath: string): 'test' | 'implementation' | 'documentation' | 'config' | 'other' {
    if (this.isTestFile(filePath)) return 'test';
    if (this.isImplementationFile(filePath)) return 'implementation';
    if (this.isDocumentationFile(filePath)) return 'documentation';
    if (this.isConfigFile(filePath)) return 'config';
    return 'other';
  }

  /**
   * Check if file is a test file
   */
  isTestFile(filePath: string): boolean {
    return /\.(test|spec)\.(ts|js|jsx|tsx|mjs|cjs)$/.test(filePath) ||
           filePath.includes('__tests__/');
  }

  /**
   * Check if file is an implementation file
   */
  isImplementationFile(filePath: string): boolean {
    const isSourceFile = /\.(ts|js|jsx|tsx)$/.test(filePath) && 
                        !filePath.endsWith('.d.ts');
    const isInSourceDir = DEFAULT_DIRECTORIES.SOURCE_DIRS.some(dir => 
      filePath.startsWith(dir + '/')
    );
    const isNotTest = !this.isTestFile(filePath);
    
    return isSourceFile && isInSourceDir && isNotTest;
  }

  /**
   * Check if file is a documentation file
   */
  isDocumentationFile(filePath: string): boolean {
    return /\.(md|mdx|rst|txt)$/.test(filePath) ||
           filePath.startsWith('docs/') ||
           ['README', 'CHANGELOG', 'CONTRIBUTING', 'LICENSE'].some(name => 
             filePath.toUpperCase().includes(name)
           );
  }

  /**
   * Check if file is a configuration file
   */
  isConfigFile(filePath: string): boolean {
    const configFiles = [
      'package.json', 'tsconfig.json', 'jest.config.js', 
      'eslint.config.js', '.eslintrc', 'babel.config.js',
      'webpack.config.js', 'rollup.config.js', 'vite.config.js'
    ];
    
    return configFiles.some(config => 
      filePath.includes(config) || path.basename(filePath) === config
    );
  }

  /**
   * Normalize file path for cross-platform compatibility
   */
  normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Get relative path from project root
   */
  getRelativePath(filePath: string): string {
    return path.relative(this.projectRoot, filePath);
  }
}
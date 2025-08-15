/**
 * Import Analyzer for Trinity Protocol
 * Analyzes and validates import statements in source files
 */

import * as fs from 'fs';
import * as path from 'path';

export class ImportAnalyzer {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Extract all import statements from a file
   */
  extractImports(filePath: string): string[] {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      return this.parseImports(content);
    } catch (error) {
      console.warn(`Could not read file for import analysis: ${filePath}`);
      return [];
    }
  }

  /**
   * Parse import statements from file content
   */
  private parseImports(content: string): string[] {
    const imports: string[] = [];
    
    // Match various import patterns
    const patterns = [
      // ES6 imports: import {name} from 'path'
      /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
      // Direct imports: import 'path'
      /import\s+['"`]([^'"`]+)['"`]/g,
      // Dynamic imports: import('path')
      /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      // require() statements: require('path')
      /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      // export from: export {name} from 'path'
      /export\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }

    return this.removeDuplicates(imports);
  }

  /**
   * Validate that an import path can be resolved
   */
  validateImportPath(fromFile: string, importPath: string): boolean {
    if (importPath.startsWith('.')) {
      return this.validateRelativeImport(fromFile, importPath);
    }
    
    if (importPath.startsWith('/')) {
      return this.validateAbsoluteImport(importPath);
    }
    
    // Package imports - assume valid for now
    // In a real implementation, we could check node_modules
    return this.validatePackageImport(importPath);
  }

  /**
   * Validate relative import (./file or ../file)
   */
  private validateRelativeImport(fromFile: string, importPath: string): boolean {
    const fromDir = path.dirname(fromFile);
    const resolvedPath = path.resolve(this.projectRoot, fromDir, importPath);
    
    // Check if exact path exists
    if (fs.existsSync(resolvedPath)) return true;
    
    // Check with common extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
    for (const ext of extensions) {
      if (fs.existsSync(resolvedPath + ext)) return true;
    }
    
    // Check if it's a directory with index file
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, 'index' + ext);
      if (fs.existsSync(indexPath)) return true;
    }
    
    return false;
  }

  /**
   * Validate absolute import (/src/file)
   */
  private validateAbsoluteImport(importPath: string): boolean {
    const fullPath = path.join(this.projectRoot, importPath.substring(1));
    return fs.existsSync(fullPath);
  }

  /**
   * Validate package import (lodash, react, etc.)
   */
  private validatePackageImport(importPath: string): boolean {
    // Extract package name (handle scoped packages like @types/node)
    const packageName = importPath.startsWith('@')
      ? importPath.split('/').slice(0, 2).join('/')
      : importPath.split('/')[0];

    // Check if package exists in node_modules
    const packagePath = path.join(this.projectRoot, 'node_modules', packageName);
    if (fs.existsSync(packagePath)) return true;

    // Check if it's a built-in Node.js module
    const builtInModules = [
      'fs', 'path', 'http', 'https', 'url', 'util', 'crypto',
      'child_process', 'stream', 'events', 'os', 'buffer'
    ];
    
    if (builtInModules.includes(packageName)) return true;

    // For now, assume other package imports are valid
    // In production, we might want to be stricter
    return true;
  }

  /**
   * Get import dependency tree for a file
   */
  getDependencyTree(filePath: string, visited: Set<string> = new Set()): string[] {
    if (visited.has(filePath)) return [];
    
    visited.add(filePath);
    const dependencies: string[] = [];
    
    const imports = this.extractImports(filePath);
    
    for (const importPath of imports) {
      if (importPath.startsWith('.')) {
        const resolvedPath = this.resolveRelativePath(filePath, importPath);
        if (resolvedPath) {
          dependencies.push(resolvedPath);
          const subDependencies = this.getDependencyTree(resolvedPath, visited);
          dependencies.push(...subDependencies);
        }
      }
    }
    
    return this.removeDuplicates(dependencies);
  }

  /**
   * Resolve relative import path to actual file path
   */
  private resolveRelativePath(fromFile: string, importPath: string): string | null {
    const fromDir = path.dirname(fromFile);
    const resolvedPath = path.resolve(this.projectRoot, fromDir, importPath);
    const relativePath = path.relative(this.projectRoot, resolvedPath);
    
    // Check exact path
    if (fs.existsSync(resolvedPath)) return relativePath;
    
    // Check with extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
    for (const ext of extensions) {
      const pathWithExt = resolvedPath + ext;
      if (fs.existsSync(pathWithExt)) {
        return path.relative(this.projectRoot, pathWithExt);
      }
    }
    
    // Check index files
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, 'index' + ext);
      if (fs.existsSync(indexPath)) {
        return path.relative(this.projectRoot, indexPath);
      }
    }
    
    return null;
  }

  /**
   * Check for circular dependencies
   */
  hasCircularDependencies(filePath: string): boolean {
    const dependencies = this.getDependencyTree(filePath);
    return dependencies.includes(filePath);
  }

  /**
   * Get unused imports in a file
   */
  getUnusedImports(filePath: string): string[] {
    const content = this.getFileContent(filePath);
    if (!content) return [];
    
    const imports = this.parseImportStatements(content);
    const unusedImports: string[] = [];
    
    for (const importStatement of imports) {
      const importedNames = this.extractImportedNames(importStatement);
      
      for (const name of importedNames) {
        if (!this.isNameUsedInContent(name, content, importStatement.statement)) {
          unusedImports.push(name);
        }
      }
    }
    
    return unusedImports;
  }

  /**
   * Parse full import statements with details
   */
  private parseImportStatements(content: string): Array<{
    statement: string;
    source: string;
    line: number;
  }> {
    const imports: Array<{ statement: string; source: string; line: number }> = [];
    const lines = content.split('\n');
    
    const importRegex = /^import\s+.*?from\s+['"`]([^'"`]+)['"`]/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = importRegex.exec(line);
      
      if (match) {
        imports.push({
          statement: line,
          source: match[1],
          line: i + 1
        });
      }
    }
    
    return imports;
  }

  /**
   * Extract imported names from import statement
   */
  private extractImportedNames(importStatement: { statement: string; source: string }): string[] {
    const names: string[] = [];
    const statement = importStatement.statement;
    
    // Handle default imports: import Name from 'path'
    const defaultMatch = statement.match(/import\s+(\w+)\s+from/);
    if (defaultMatch) {
      names.push(defaultMatch[1]);
    }
    
    // Handle named imports: import { name1, name2 } from 'path'
    const namedMatch = statement.match(/import\s*\{([^}]+)\}/);
    if (namedMatch) {
      const namedImports = namedMatch[1].split(',').map(name => {
        const cleanName = name.trim().split(' as ')[0].trim();
        return cleanName;
      });
      names.push(...namedImports);
    }
    
    // Handle namespace imports: import * as Name from 'path'
    const namespaceMatch = statement.match(/import\s+\*\s+as\s+(\w+)/);
    if (namespaceMatch) {
      names.push(namespaceMatch[1]);
    }
    
    return names;
  }

  /**
   * Check if imported name is used in content
   */
  private isNameUsedInContent(name: string, content: string, importStatement: string): boolean {
    // Remove the import statement from content for checking usage
    const contentWithoutImport = content.replace(importStatement, '');
    
    // Simple usage check - look for the name in the content
    const nameRegex = new RegExp(`\\b${name}\\b`);
    return nameRegex.test(contentWithoutImport);
  }

  /**
   * Get file content safely
   */
  private getFileContent(filePath: string): string | null {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      return fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove duplicate strings from array
   */
  private removeDuplicates(arr: string[]): string[] {
    return Array.from(new Set(arr));
  }
}
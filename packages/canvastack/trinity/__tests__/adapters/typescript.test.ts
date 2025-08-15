/**
 * @fileoverview Tests for TypeScript Language Adapter
 * @module __tests__/adapters/typescript.test
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { TypeScriptAdapter } from '../../src/adapters/typescript';
import * as path from 'path';
import * as fs from 'fs';
import { PathLike } from 'fs';

jest.mock('fs');

// Mock types - simple direct types instead of missing ./types import
interface MockedFileSystem {
  existsSync: jest.MockedFunction<typeof fs.existsSync>;
  readFileSync: jest.MockedFunction<typeof fs.readFileSync>;
  readdirSync: jest.MockedFunction<typeof fs.readdirSync>;
}

// Mock types
type MockFunction<T extends (...args: any) => any> = jest.MockedFunction<T>;

describe('TypeScriptAdapter', () => {
    const mockProjectRoot = '/test/project';
    let adapter: TypeScriptAdapter;

    beforeEach(() => {
        adapter = new TypeScriptAdapter(mockProjectRoot);
        (fs.existsSync as MockFunction<typeof fs.existsSync>).mockReset();
        (fs.readFileSync as MockFunction<typeof fs.readFileSync>).mockReset();
        (fs.readdirSync as MockFunction<typeof fs.readdirSync>).mockReset();
        
        // Setup default mock implementations
        (fs.readdirSync as MockFunction<typeof fs.readdirSync>).mockReturnValue([]);
        (fs.readFileSync as MockFunction<typeof fs.readFileSync>).mockReturnValue(Buffer.from(''));
        (fs.existsSync as MockFunction<typeof fs.existsSync>).mockReturnValue(true);
    });

    describe('detectProject', () => {
        test('should detect TypeScript project with tsconfig.json', () => {
            (fs.existsSync as MockFunction<typeof fs.existsSync>).mockImplementation((filePath: PathLike) => 
                filePath.toString() === path.join(mockProjectRoot, 'tsconfig.json')
            );

            expect(TypeScriptAdapter.detectProject(mockProjectRoot)).toBe(true);
        });

        test('should detect TypeScript project with .ts files', () => {
            (fs.existsSync as MockFunction<typeof fs.existsSync>).mockImplementation((filePath: PathLike) => 
                filePath.toString().endsWith('.ts')
            );

            expect(TypeScriptAdapter.detectProject(mockProjectRoot)).toBe(true);
        });
    });

    describe('validateTypeScriptRequirements', () => {
        test('should validate tsconfig.json existence', () => {
            (fs.existsSync as MockFunction<typeof fs.existsSync>).mockImplementation((filePath: PathLike) => 
                filePath.toString() === path.join(mockProjectRoot, 'tsconfig.json')
            );
            (fs.readFileSync as MockFunction<typeof fs.readFileSync>).mockReturnValue('{"compilerOptions": {}}');

            const errors = adapter.validateTypeScriptRequirements();
            expect(errors.length).toBe(2); // Will have package.json and testFramework warnings
        });

        test('should return error for missing tsconfig.json', () => {
            (fs.existsSync as MockFunction<typeof fs.existsSync>).mockReturnValue(false);

            const errors = adapter.validateTypeScriptRequirements();
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].message).toContain('tsconfig.json');
        });

        test('should validate compiler options', () => {
            (fs.existsSync as MockFunction<typeof fs.existsSync>).mockReturnValue(true);
            (fs.readFileSync as MockFunction<typeof fs.readFileSync>).mockReturnValue(JSON.stringify({
                compilerOptions: {
                    strict: true,
                    target: "ES2020"
                }
            }));

            const errors = adapter.validateTypeScriptRequirements();
            expect(errors.length).toBe(2); // Will have package.json and testFramework warnings
        });
    });

    describe('getProjectStructure', () => {
        beforeEach(() => {
            (fs.existsSync as MockFunction<typeof fs.existsSync>).mockReturnValue(true);
            (fs.readFileSync as MockFunction<typeof fs.readFileSync>).mockReturnValue(JSON.stringify({
                compilerOptions: {
                    strict: true,
                    target: "ES2020"
                },
                devDependencies: {
                    '@types/jest': '^27.0.0'
                }
            }));
        });

        test('should detect TypeScript configuration', () => {
            const structure = adapter.getProjectStructure();
            expect(structure.hasTsConfig).toBe(true);
            expect(structure.testFramework).toBe('jest');
        });

        test('should detect test framework from package.json', () => {
            (fs.readFileSync as MockFunction<typeof fs.readFileSync>).mockReturnValue(JSON.stringify({
                devDependencies: {
                    '@types/jest': '^27.0.0'
                }
            }));

            const structure = adapter.getProjectStructure();
            expect(structure.testFramework).toBe('jest');
        });
    });

    describe('validateTypeImports', () => {
        test('should validate type imports', () => {
            // Setup mocks
            (fs.existsSync as MockFunction<typeof fs.existsSync>).mockReturnValue(true);
            (fs.readFileSync as MockFunction<typeof fs.readFileSync>).mockReturnValue(Buffer.from(`
                // Simple test content without external imports that cause dependency issues
                export const testFunction = () => 'hello world';
                export interface TestInterface { name: string; }
            `));
            
            // Mock readdirSync to return an empty array
            // We'll control file existence through existsSync instead
            (fs.readdirSync as MockFunction<typeof fs.readdirSync>).mockReturnValue([]);
            (fs.existsSync as MockFunction<typeof fs.existsSync>)
                .mockImplementation((filePath: PathLike) =>
                    filePath.toString().includes('src/') ||
                    filePath.toString().endsWith('index.ts')
                );

            const errors = adapter.validateTypeImports();
            expect(Array.isArray(errors)).toBe(true);
        });
    });

    describe('getTestPatterns', () => {
        test('should return TypeScript test patterns', () => {
            const patterns = adapter.getTestPatterns();
            expect(patterns).toContain('**/__tests__/**/*.test.ts');
            expect(patterns).toContain('**/__tests__/**/*.spec.ts');
        });
    });

    describe('getImplementationPatterns', () => {
        test('should return TypeScript implementation patterns', () => {
            const patterns = adapter.getImplementationPatterns();
            expect(patterns).toContain('src/**/*.ts');
            expect(patterns).not.toContain('**/*.test.ts');
            expect(patterns).not.toContain('**/*.d.ts');
        });
    });

    describe('analyzeProjectFiles', () => {
        test('should analyze TypeScript project files', () => {
            // Setup file system mocks
            (fs.existsSync as MockFunction<typeof fs.existsSync>).mockReturnValue(true);
            (fs.readFileSync as MockFunction<typeof fs.readFileSync>).mockReturnValue(`
                // Simple TypeScript content without problematic imports
                export const projectAnalyzer = {
                    name: 'test-project',
                    version: '1.0.0'
                };
                export function analyzeProject(): string {
                    return 'analyzed';
                }
            `);
            
            // Setup directory structure
            (fs.readdirSync as MockFunction<typeof fs.readdirSync>).mockReturnValue([]);
            (fs.existsSync as MockFunction<typeof fs.existsSync>)
                .mockImplementation((filePath: PathLike) => {
                    const path = filePath.toString();
                    return path.includes('src/') || path.endsWith('tsconfig.json');
                });

            const files = adapter.analyzeProjectFiles();
            expect(Array.isArray(files)).toBe(true);
        });
    });

    describe('getRecommendedStructure', () => {
        test('should return recommended project structure', () => {
            const structure = adapter.getRecommendedStructure();
            expect(structure.directories).toContain('src/');
            expect(structure.files).toContain('tsconfig.json');
            expect(structure.description).toBeDefined();
        });
    });
});
/**
 * @fileoverview Tests for JavaScript Language Adapter
 * @module __tests__/adapters/javascript.test
 */

import { JavaScriptAdapter } from '../../src/adapters/javascript';

describe('JavaScriptAdapter', () => {
    let adapter: JavaScriptAdapter;

    beforeEach(() => {
        adapter = new JavaScriptAdapter();
    });

    test('should create JavaScriptAdapter instance', () => {
        expect(adapter).toBeInstanceOf(JavaScriptAdapter);
    });

    test('should have detect method', () => {
        expect(typeof adapter.detect).toBe('function');
    });

    test('should have getFilePatterns method', () => {
        expect(typeof adapter.getFilePatterns).toBe('function');
    });

    test('should have validateFile method', () => {
        expect(typeof adapter.validateFile).toBe('function');
    });

    test('should detect JavaScript project correctly', async () => {
        const projectPath = process.cwd();
        const isJavaScript = await adapter.detect(projectPath);
        
        expect(typeof isJavaScript).toBe('boolean');
    });

    test('should return correct file patterns', () => {
        const patterns = adapter.getFilePatterns();
        
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBeGreaterThan(0);
    });

    test('should validate JavaScript file', async () => {
        const testFile = 'test.js';
        const content = 'console.log("Hello World");';
        
        const result = await adapter.validateFile(testFile, content);
        
        expect(result).toHaveProperty('valid');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');
        expect(Array.isArray(result.errors)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('should handle empty file content', async () => {
        const testFile = 'empty.js';
        const content = '';
        
        const result = await adapter.validateFile(testFile, content);
        
        expect(result).toHaveProperty('valid');
        expect(typeof result.valid).toBe('boolean');
    });

    test('should handle invalid JavaScript syntax', async () => {
        const testFile = 'invalid.js';
        const content = 'function invalid() { console.log("missing closing brace"';
        
        const result = await adapter.validateFile(testFile, content);
        
        expect(result).toHaveProperty('valid');
        expect(result).toHaveProperty('errors');
    });
});
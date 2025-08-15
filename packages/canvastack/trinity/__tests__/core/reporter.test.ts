/**
 * @fileoverview Tests for TrinityReporter
 * @module __tests__/core/reporter.test
 */

import { describe, beforeEach, afterEach, jest, test, expect } from '@jest/globals';
import { TrinityReporter } from '../../src/core/reporter';
import { TrinityValidationResult, FileValidationResult } from '../../src/types/validation-result';
import { VALIDATION_MESSAGES } from '../../src/constants/validation-constants';
import { ValidationError } from '../../src/types/trinity-types';

describe('TrinityReporter', () => {
    let reporter: TrinityReporter;
    let mockResult: TrinityValidationResult;

    beforeEach(() => {
        reporter = new TrinityReporter();
        
        // Mock validation result
        mockResult = {
            valid: true,
            score: {
                overall: 95,
                test: 90,
                implementation: 100,
                documentation: 95
            },
            errors: [],
            warnings: [
                {
                    category: 'test',
                    message: 'Missing test file for src/test.ts',
                    file: 'src/test.ts',
                    line: undefined,
                    type: 'warning'
                }
            ],
            metadata: {
                totalFiles: 30,
                testFiles: 10,
                implementationFiles: 15,
                documentationFiles: 5,
                executionTime: 1500,
                timestamp: '2025-08-14T20:00:00.000Z',
                trinityVersion: '1.0.0',
                projectName: 'test-project'
            },
            layers: {
                test: {
                    layer: 'test',
                    score: 90,
                    files: ['test1.test.ts', 'test2.test.ts'],
                    errors: [],
                    warnings: [],
                    details: {
                        totalFiles: 10,
                        validFiles: 9,
                        errorCount: 0,
                        warningCount: 1
                    }
                },
                implementation: {
                    layer: 'implementation',
                    score: 100,
                    files: ['src/core.ts', 'src/utils.ts'],
                    errors: [],
                    warnings: [],
                    details: {
                        totalFiles: 15,
                        validFiles: 15,
                        errorCount: 0,
                        warningCount: 0
                    }
                },
                documentation: {
                    layer: 'documentation',
                    score: 95,
                    files: ['docs/readme.md', 'docs/api.md'],
                    errors: [],
                    warnings: [],
                    details: {
                        totalFiles: 5,
                        validFiles: 5,
                        errorCount: 0,
                        warningCount: 0
                    }
                }
            },
            synchronization: {
                synchronized: true,
                missingTests: [],
                missingDocs: [],
                orphanedTests: [],
                orphanedDocs: [],
                coverage: {
                    testCoverage: 90,
                    documentationCoverage: 95
                }
            },
            recommendations: [
                'Add missing test files for better coverage'
            ]
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        test('should create TrinityReporter instance', () => {
            expect(reporter).toBeInstanceOf(TrinityReporter);
        });

        test('should have required methods', () => {
            expect(typeof reporter.printConsoleReport).toBe('function');
            expect(typeof reporter.generateJSONReport).toBe('function');
            expect(typeof reporter.generateHTMLReport).toBe('function');
            expect(typeof reporter.saveReport).toBe('function');
        });
    });

    describe('printConsoleReport', () => {
        test('should print basic console report', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            reporter.printConsoleReport(mockResult);
            
            expect(consoleSpy).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('TRINITY PROTOCOL VALIDATION REPORT')
            );
            
            consoleSpy.mockRestore();
        });

        test('should print verbose console report', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            reporter.printConsoleReport(mockResult, { verbose: true });
            
            expect(consoleSpy).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('TRINITY PROTOCOL VALIDATION REPORT')
            );
            
            consoleSpy.mockRestore();
        });

        test('should print compact console report', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            reporter.printConsoleReport(mockResult, { compact: true });
            
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        test('should handle different modes', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            reporter.printConsoleReport(mockResult, { mode: 'pre-commit' });
            
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('generateJSONReport', () => {
        test('should generate valid JSON report', () => {
            const jsonReport = reporter.generateJSONReport(mockResult);
            
            expect(() => JSON.parse(jsonReport)).not.toThrow();
            
            const parsed = JSON.parse(jsonReport);
            expect(parsed).toHaveProperty('score');
            expect(parsed.score).toHaveProperty('overall', 95);
            expect(parsed).toHaveProperty('valid', true);
            expect(parsed).toHaveProperty('timestamp');
        });

        test('should include all required fields in JSON', () => {
            const jsonReport = reporter.generateJSONReport(mockResult);
            const parsed = JSON.parse(jsonReport);
            
            expect(parsed).toHaveProperty('valid');
            expect(parsed).toHaveProperty('score');
            expect(parsed).toHaveProperty('errors');
            expect(parsed).toHaveProperty('warnings');
            expect(parsed).toHaveProperty('layers');
            expect(parsed).toHaveProperty('synchronization');
            expect(parsed).toHaveProperty('recommendations');
            expect(parsed).toHaveProperty('metadata');
        });
    });

    describe('generateHTMLReport', () => {
        test('should generate valid HTML report', () => {
            const htmlReport = reporter.generateHTMLReport(mockResult);
            
            expect(htmlReport).toContain('<!DOCTYPE html>');
            expect(htmlReport).toContain('<html');
            expect(htmlReport).toContain('<head>');
            expect(htmlReport).toContain('<body>');
            expect(htmlReport).toContain('Trinity Protocol Report');
        });

        test('should include Trinity score in HTML', () => {
            const htmlReport = reporter.generateHTMLReport(mockResult);
            
            expect(htmlReport).toContain('95%');
            expect(htmlReport).toContain('Overall Score');
        });

        test('should include layer breakdowns', () => {
            const htmlReport = reporter.generateHTMLReport(mockResult);
            
            expect(htmlReport).toContain('Test Layer');
            expect(htmlReport).toContain('Implementation');
            expect(htmlReport).toContain('Documentation');
        });
    });

    describe('saveReport', () => {
        test('should save report to file', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            const mockWriteFileSync = jest.spyOn(require('fs'), 'writeFileSync').mockImplementation(() => {});
            const mockExistsSync = jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
            
            const content = '{"test": "data"}';
            reporter.saveReport(content, '/test/report.json', 'json');
            
            expect(mockWriteFileSync).toHaveBeenCalledWith('/test/report.json', content, 'utf8');
            expect(consoleSpy).toHaveBeenCalledWith('Report saved to: /test/report.json');
            
            mockWriteFileSync.mockRestore();
            mockExistsSync.mockRestore();
            consoleSpy.mockRestore();
        });
    });

    describe('Error Handling', () => {
        test('should handle null result gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            expect(() => {
                reporter.printConsoleReport(null as any);
            }).not.toThrow();
            
            consoleSpy.mockRestore();
        });

        test('should handle undefined options', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            expect(() => {
                reporter.printConsoleReport(mockResult, undefined);
            }).not.toThrow();
            
            consoleSpy.mockRestore();
        });
    });

    describe('Score Formatting', () => {
        test('should format high scores with green color', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            const highScoreResult = { ...mockResult, score: { ...mockResult.score, overall: 98 } };
            reporter.printConsoleReport(highScoreResult);
            
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        test('should format low scores with red color', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            const lowScoreResult = { ...mockResult, score: { ...mockResult.score, overall: 75 } };
            reporter.printConsoleReport(lowScoreResult);
            
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('Report Metadata', () => {
        test('should include execution time in report', () => {
            const jsonReport = reporter.generateJSONReport(mockResult);
            const parsed = JSON.parse(jsonReport);
            
            expect(parsed.metadata.executionTime).toBe(1500);
        });

        test('should include Trinity version', () => {
            const jsonReport = reporter.generateJSONReport(mockResult);
            const parsed = JSON.parse(jsonReport);
            
            expect(parsed.metadata.trinityVersion).toBe('1.0.0');
        });

        test('should include project name', () => {
            const jsonReport = reporter.generateJSONReport(mockResult);
            const parsed = JSON.parse(jsonReport);
            
            expect(parsed.metadata.projectName).toBe('test-project');
        });
    });

    describe('Additional Features', () => {
        test('should generate summary report for multiple projects', () => {
            const results = [mockResult, mockResult];
            const summaryReport = reporter.generateSummaryReport(results);
            const parsed = JSON.parse(summaryReport);
            
            expect(parsed.totalProjects).toBe(2);
            expect(parsed.passingProjects).toBe(2);
            expect(parsed.averageScore).toBe(95);
        });

        test('should generate trend report', () => {
            const trendReport = reporter.generateTrendReport(mockResult, [mockResult]);
            const parsed = JSON.parse(trendReport);
            
            expect(parsed.current.score).toBe(95);
            expect(parsed).toHaveProperty('trend');
            expect(parsed).toHaveProperty('improvements');
            expect(parsed).toHaveProperty('regressions');
        });
    });
});
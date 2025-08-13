// ===============================================
// Global Test Runner - Event Management Engine
// ===============================================
// Purpose: Run all test categories dengan organized reporting
// Usage: node __tests__/global-test-runner.cjs
// Author: Kilo Code
// Created: 2025-08-12

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI Color codes untuk output formatting
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class GlobalTestRunner {
    constructor() {
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.testResults = [];
        this.startTime = Date.now();
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    async runTestCategory(categoryName, testFiles) {
        this.log(`\n📁 ${categoryName}`, 'cyan');
        this.log('='.repeat(50), 'blue');
        
        let categoryPassed = 0;
        let categoryFailed = 0;
        let categoryResults = [];

        for (const testFile of testFiles) {
            const testPath = path.join(__dirname, testFile);
            
            if (!fs.existsSync(testPath)) {
                this.log(`   ⚠️  Test file not found: ${testFile}`, 'yellow');
                continue;
            }

            try {
                this.log(`\n   🧪 Running: ${path.basename(testFile)}`, 'bright');
                
                const startTime = Date.now();
                execSync(`node "${testPath}"`, { 
                    stdio: 'pipe',
                    cwd: process.cwd()
                });
                const duration = Date.now() - startTime;

                this.log(`   ✅ PASSED (${duration}ms)`, 'green');
                categoryPassed++;
                categoryResults.push({
                    test: path.basename(testFile),
                    status: 'PASSED',
                    duration: duration
                });

            } catch (error) {
                const duration = Date.now() - Date.now();
                this.log(`   ❌ FAILED`, 'red');
                this.log(`   Error: ${error.message}`, 'red');
                categoryFailed++;
                categoryResults.push({
                    test: path.basename(testFile),
                    status: 'FAILED',
                    error: error.message,
                    duration: duration
                });
            }
        }

        this.passedTests += categoryPassed;
        this.failedTests += categoryFailed;
        this.totalTests += (categoryPassed + categoryFailed);

        // Category summary
        this.log(`\n📊 ${categoryName} Summary:`, 'magenta');
        this.log(`   ✅ Passed: ${categoryPassed}`, categoryPassed > 0 ? 'green' : 'reset');
        this.log(`   ❌ Failed: ${categoryFailed}`, categoryFailed > 0 ? 'red' : 'reset');
        this.log(`   📈 Total: ${categoryPassed + categoryFailed}`, 'bright');

        this.testResults.push({
            category: categoryName,
            passed: categoryPassed,
            failed: categoryFailed,
            total: categoryPassed + categoryFailed,
            results: categoryResults
        });
    }

    async runAllTests() {
        this.log('🧪 EVENT MANAGEMENT ENGINE - GLOBAL TEST SUITE', 'bright');
        this.log('🚀 Starting comprehensive test execution...', 'cyan');
        this.log('='.repeat(80), 'blue');

        // Test Categories Configuration
        const testCategories = [
            {
                name: 'Database Validation Tests',
                files: [
                    'database/validation-tests/post-transformation.test.cjs'
                ]
            },
            {
                name: 'Database Performance Tests',
                files: [
                    'database/performance-tests/slow-query-detector.test.cjs',
                    'database/performance-tests/index-benchmark-simple.test.cjs',
                    'database/performance-tests/index-benchmark.test.cjs',
                    'database/performance-tests/index-performance-comprehensive.test.cjs'
                ]
            },
            {
                name: 'Security Tests',
                files: [
                    'security/rls-isolation.test.cjs',
                    'security/roles-permissions.test.cjs'
                ]
            },
            {
                name: 'Integration Tests',
                files: [
                    'integration/event-management-simple.test.cjs',
                    'integration/event-management-engine.test.cjs',
                    'integration/realtime-crud.test.cjs',
                    'integration/database-realtime-verification.test.cjs'
                ]
            },
            {
                name: 'Database Migration Tests',
                files: [
                    'database/migration-tests/pre-migration.test.cjs',
                    'database/migration-tests/post-migration.test.cjs'
                ]
            },
            {
                name: 'Database Comprehensive Tests',
                files: [
                    'database/comprehensive-tests/tenant-users.test.cjs',
                    'database/comprehensive-tests/tenant-users-simple.test.cjs'
                ]
            },
            {
                name: 'Manual Testing Suite - FIXED',
                files: [
                    'database/manual-tests/tenant-users-manual.test.cjs',
                    'database/manual-tests/tenant-users-advanced.test.cjs',
                    'database/manual-tests/tenants-comprehensive.test.cjs'
                ]
            }
        ];

        // Run each test category
        for (const category of testCategories) {
            await this.runTestCategory(category.name, category.files);
        }

        // Final Summary
        this.generateFinalReport();
    }

    generateFinalReport() {
        const totalDuration = Date.now() - this.startTime;
        
        this.log('\n' + '='.repeat(80), 'blue');
        this.log('🎯 GLOBAL TEST EXECUTION SUMMARY', 'bright');
        this.log('='.repeat(80), 'blue');

        // Overall Statistics
        this.log('\n📊 Overall Results:', 'magenta');
        this.log(`   ✅ Total Passed: ${this.passedTests}`, this.passedTests > 0 ? 'green' : 'reset');
        this.log(`   ❌ Total Failed: ${this.failedTests}`, this.failedTests > 0 ? 'red' : 'reset');
        this.log(`   📈 Total Tests: ${this.totalTests}`, 'bright');
        this.log(`   ⏱️  Execution Time: ${totalDuration}ms`, 'cyan');

        // Success Rate
        const successRate = this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(1) : 0;
        this.log(`   🎯 Success Rate: ${successRate}%`, successRate == 100 ? 'green' : 'yellow');

        // Category Breakdown
        this.log('\n📋 Category Breakdown:', 'magenta');
        this.testResults.forEach(category => {
            const categoryRate = category.total > 0 ? ((category.passed / category.total) * 100).toFixed(1) : 0;
            this.log(`   📁 ${category.category}:`, 'cyan');
            this.log(`      ✅ ${category.passed}/${category.total} passed (${categoryRate}%)`,
                    category.failed === 0 ? 'green' : 'yellow');
        });

        // Final Status
        this.log('\n🏆 FINAL STATUS:', 'bright');
        if (this.failedTests === 0) {
            this.log('   🎉 ALL TESTS PASSED! System is healthy and ready for production.', 'green');
            this.log('   🚀 Platform ready for next development phase.', 'green');
        } else {
            this.log('   ⚠️  SOME TESTS FAILED! Review and fix issues before deployment.', 'red');
            this.log('   🔧 Check individual test outputs for detailed error information.', 'yellow');
        }

        // Next Steps
        this.log('\n📋 Next Steps:', 'magenta');
        if (this.failedTests === 0) {
            this.log('   1. ✅ All systems validated - proceed with confidence', 'green');
            this.log('   2. 🚀 Ready for FASE 1B: JWT Authentication Implementation', 'green');
            this.log('   3. 🔧 Consider adding more test coverage untuk new features', 'cyan');
        } else {
            this.log('   1. 🔍 Investigate failed tests', 'red');
            this.log('   2. 🛠️  Fix underlying issues', 'yellow');
            this.log('   3. 🔄 Re-run global tests until all pass', 'yellow');
            this.log('   4. 📞 Escalate if issues persist', 'red');
        }

        this.log('\n' + '='.repeat(80), 'blue');
        
        // Exit with appropriate code
        process.exit(this.failedTests > 0 ? 1 : 0);
    }
}

// Usage Information
function showUsage() {
    console.log(`
🧪 Global Test Runner - Event Management Engine

Usage:
  node __tests__/global-test-runner.cjs                # Run all tests
  node __tests__/global-test-runner.cjs --help         # Show this help

Test Categories:
  📁 Database Migration Tests    - Validate database transformation
  📁 Database Performance Tests  - Ensure query performance standards  
  📁 Database Integration Tests  - Test system integration
  📁 Authentication Tests        - Validate security & user management

Individual Category Testing:
  node __tests__/database/migration-tests/pre-migration.test.cjs
  node __tests__/database/migration-tests/post-migration.test.cjs
  node __tests__/database/performance-tests/slow-query-detector.test.cjs
  node __tests__/database/integration-tests/tenant-isolation.test.cjs
  node __tests__/auth/roles-permissions.test.cjs

For more information, see __tests__/README.md
`);
}

// Main Execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        showUsage();
        return;
    }

    const runner = new GlobalTestRunner();
    await runner.runAllTests();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error(`${colors.red}❌ Uncaught Exception: ${error.message}${colors.reset}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error(`${colors.red}❌ Unhandled Rejection: ${reason}${colors.reset}`);
    process.exit(1);
});

// Run if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error(`${colors.red}❌ Global Test Runner Error: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

module.exports = { GlobalTestRunner };
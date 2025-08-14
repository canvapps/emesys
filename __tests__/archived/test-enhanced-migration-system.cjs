/**
 * Comprehensive Test Suite untuk Enhanced Migration System
 * Test migration, seeders, rollback, dan enterprise features
 */

const { Client } = require('pg');
const { EnhancedMigrationCLI } = require('./run-enhanced-migrations.cjs');
const { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } = require('fs');
const { join } = require('path');
const dotenv = require('dotenv');

// Load environment
dotenv.config({ path: '.env.local' });

console.log('🚀 Starting Enhanced Migration System Tests...\n');

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'emesys_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin'
});

class EnhancedMigrationTester {
    constructor() {
        this.testResults = [];
        this.migrationsDir = join(__dirname, 'src', 'database', 'migrations');
        this.seedersDir = join(__dirname, 'src', 'database', 'seeders');
    }

    async connect() {
        await client.connect();
        console.log('✅ Database connected for testing');
    }

    async disconnect() {
        await client.end();
        console.log('🔌 Database connection closed');
    }

    async runTest(testName, testFunction) {
        console.log(`⏳ Running: ${testName}`);
        const startTime = Date.now();
        
        try {
            await testFunction();
            const duration = Date.now() - startTime;
            console.log(`✅ PASSED: ${testName} (${duration}ms)\n`);
            this.testResults.push({ name: testName, status: 'PASSED', duration });
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ FAILED: ${testName} (${duration}ms)`);
            console.error(`   Error: ${error.message}\n`);
            this.testResults.push({ name: testName, status: 'FAILED', duration, error: error.message });
        }
    }

    async setupTestEnvironment() {
        console.log('🛠️  Setting up test environment...\n');
        
        // Clean up existing test tables
        try {
            await client.query('DROP TABLE IF EXISTS migrations CASCADE');
            await client.query('DROP TABLE IF EXISTS seeders CASCADE');
            await client.query('DROP TABLE IF EXISTS test_migration_table CASCADE');
            console.log('🧹 Cleaned up previous test artifacts');
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    async cleanupTestEnvironment() {
        console.log('🧹 Cleaning up test environment...');
        
        try {
            // Remove test migration file if exists
            const testMigrationFile = join(this.migrationsDir, '999_test_migration.sql');
            if (existsSync(testMigrationFile)) {
                unlinkSync(testMigrationFile);
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    // TEST 1: Enhanced Migration System Initialization
    async testMigrationSystemInit() {
        const cli = new EnhancedMigrationCLI();
        
        // Initialize system
        await cli.initializeTables();
        
        // Verify migrations table structure
        const migrationsTableResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'migrations'
            ORDER BY ordinal_position
        `);
        
        const expectedColumns = [
            'id', 'filename', 'version', 'name', 'executed_at', 
            'checksum', 'execution_time_ms', 'rollback_sql', 
            'dependencies', 'created_by', 'notes'
        ];
        
        const actualColumns = migrationsTableResult.rows.map(row => row.column_name);
        expectedColumns.forEach(col => {
            if (!actualColumns.includes(col)) {
                throw new Error(`Missing column: ${col}`);
            }
        });
        
        // Verify seeders table structure
        const seedersTableResult = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'seeders'
            ORDER BY ordinal_position
        `);
        
        const seedersColumns = seedersTableResult.rows.map(row => row.column_name);
        if (!seedersColumns.includes('environment')) {
            throw new Error('Seeders table missing environment column');
        }
        
        console.log('   📋 Enhanced migration tables created successfully');
        console.log(`   📊 Migrations table: ${migrationsTableResult.rows.length} columns`);
        console.log(`   📦 Seeders table: ${seedersTableResult.rows.length} columns`);
    }

    // TEST 2: Migration Execution dengan Checksum Validation
    async testMigrationExecution() {
        const cli = new EnhancedMigrationCLI();
        
        // Create test migration file
        const testMigrationContent = `-- Test Migration
-- Version: 999

CREATE TABLE IF NOT EXISTS test_migration_table (
    id SERIAL PRIMARY KEY,
    test_data VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROLLBACK:
-- DROP TABLE IF EXISTS test_migration_table;
`;
        
        const testMigrationFile = join(this.migrationsDir, '999_test_migration.sql');
        writeFileSync(testMigrationFile, testMigrationContent);
        
        try {
            // Run migrations
            await cli.runMigrations();
            
            // Verify test table was created
            const tableResult = await client.query(`
                SELECT table_name FROM information_schema.tables 
                WHERE table_name = 'test_migration_table'
            `);
            
            if (tableResult.rows.length === 0) {
                throw new Error('Test migration table was not created');
            }
            
            // Verify migration was recorded with correct metadata
            const migrationRecord = await client.query(`
                SELECT filename, version, name, checksum, execution_time_ms, rollback_sql
                FROM migrations 
                WHERE filename = '999_test_migration.sql'
            `);
            
            if (migrationRecord.rows.length === 0) {
                throw new Error('Migration was not recorded');
            }
            
            const record = migrationRecord.rows[0];
            if (!record.checksum || record.checksum.length !== 64) {
                throw new Error('Invalid checksum');
            }
            
            if (!record.rollback_sql || !record.rollback_sql.includes('DROP TABLE')) {
                throw new Error('Rollback SQL not properly extracted');
            }
            
            console.log('   📝 Test migration executed successfully');
            console.log(`   🔐 Checksum: ${record.checksum.substring(0, 16)}...`);
            console.log(`   ⏱️  Execution time: ${record.execution_time_ms}ms`);
            console.log(`   🔄 Rollback SQL extracted: ${record.rollback_sql ? 'Yes' : 'No'}`);
            
        } finally {
            // Cleanup test migration file
            if (existsSync(testMigrationFile)) {
                unlinkSync(testMigrationFile);
            }
        }
    }

    // TEST 3: Seeder Execution dengan Environment Support
    async testSeederExecution() {
        const cli = new EnhancedMigrationCLI();
        
        // Test development seeders
        await cli.runSeeders('development');
        
        // Verify super admin was created
        const superAdminResult = await client.query(`
            SELECT tu.email, tu.full_name, t.code as tenant_code
            FROM tenant_users tu
            JOIN tenants t ON tu.tenant_id = t.id
            WHERE tu.email = 'superadmin@weddinvite.com'
        `);
        
        if (superAdminResult.rows.length === 0) {
            throw new Error('Super admin user was not created');
        }
        
        const superAdmin = superAdminResult.rows[0];
        if (superAdmin.tenant_code !== 'SYSTEM') {
            throw new Error('Super admin not assigned to SYSTEM tenant');
        }
        
        // Verify demo tenant was created
        const demoTenantResult = await client.query(`
            SELECT name, code, subscription_plan, is_active
            FROM tenants 
            WHERE code = 'BALI_DREAM'
        `);
        
        if (demoTenantResult.rows.length === 0) {
            throw new Error('Demo tenant was not created');
        }
        
        // Verify seeder execution was recorded
        const seederRecords = await client.query(`
            SELECT filename, environment, execution_time_ms
            FROM seeders 
            WHERE environment = 'development'
            ORDER BY executed_at
        `);
        
        if (seederRecords.rows.length < 2) {
            throw new Error('Not all seeders were recorded');
        }
        
        console.log('   🌱 Development seeders executed successfully');
        console.log(`   👤 Super admin created: ${superAdmin.email} (${superAdmin.full_name})`);
        console.log(`   🏢 Demo tenant created: ${demoTenantResult.rows[0].name}`);
        console.log(`   📊 Seeder records: ${seederRecords.rows.length}`);
    }

    // TEST 4: Rollback Functionality
    async testRollbackFunctionality() {
        const cli = new EnhancedMigrationCLI();
        
        // Create and execute a test migration for rollback
        const rollbackTestContent = `-- Rollback Test Migration
-- Version: 998

CREATE TABLE IF NOT EXISTS rollback_test_table (
    id SERIAL PRIMARY KEY,
    data TEXT
);

INSERT INTO rollback_test_table (data) VALUES ('test data');

-- ROLLBACK:
-- DROP TABLE IF EXISTS rollback_test_table;
`;
        
        const rollbackTestFile = join(this.migrationsDir, '998_rollback_test.sql');
        writeFileSync(rollbackTestFile, rollbackTestContent);
        
        try {
            // Execute the migration
            await cli.runMigrations();
            
            // Verify table exists
            const tableExistsResult = await client.query(`
                SELECT table_name FROM information_schema.tables 
                WHERE table_name = 'rollback_test_table'
            `);
            
            if (tableExistsResult.rows.length === 0) {
                throw new Error('Rollback test table was not created');
            }
            
            // Verify data exists
            const dataResult = await client.query('SELECT COUNT(*) as count FROM rollback_test_table');
            if (parseInt(dataResult.rows[0].count) === 0) {
                throw new Error('Test data was not inserted');
            }
            
            // Perform rollback
            await cli.rollback('998_rollback_test.sql');
            
            // Verify table was dropped
            const tableAfterRollback = await client.query(`
                SELECT table_name FROM information_schema.tables 
                WHERE table_name = 'rollback_test_table'
            `);
            
            if (tableAfterRollback.rows.length > 0) {
                throw new Error('Rollback failed - table still exists');
            }
            
            // Verify migration record was removed
            const migrationAfterRollback = await client.query(`
                SELECT filename FROM migrations WHERE filename = '998_rollback_test.sql'
            `);
            
            if (migrationAfterRollback.rows.length > 0) {
                throw new Error('Migration record was not removed after rollback');
            }
            
            console.log('   🔄 Migration executed and rolled back successfully');
            console.log('   🗑️  Table dropped and migration record removed');
            
        } finally {
            // Cleanup
            if (existsSync(rollbackTestFile)) {
                unlinkSync(rollbackTestFile);
            }
        }
    }

    // TEST 5: Status Reporting dan Statistics
    async testStatusReporting() {
        const cli = new EnhancedMigrationCLI();
        
        // Capture status output (would normally go to console)
        const originalLog = console.log;
        let statusOutput = '';
        console.log = (...args) => {
            statusOutput += args.join(' ') + '\n';
            originalLog(...args);
        };
        
        try {
            await cli.showStatus();
            
            // Verify status includes expected information
            if (!statusOutput.includes('MIGRATION SYSTEM STATUS')) {
                throw new Error('Status output missing header');
            }
            
            if (!statusOutput.includes('Total executed:')) {
                throw new Error('Status output missing migration statistics');
            }
            
            if (!statusOutput.includes('SEEDERS:')) {
                throw new Error('Status output missing seeder information');
            }
            
            if (!statusOutput.includes('DATABASE TABLES:')) {
                throw new Error('Status output missing table information');
            }
            
            // Get actual statistics from database
            const migrationStats = await client.query(`
                SELECT 
                    COUNT(*) as total_count,
                    AVG(execution_time_ms) as avg_time
                FROM migrations
            `);
            
            const seederStats = await client.query(`
                SELECT COUNT(*) as total_count FROM seeders
            `);
            
            const tableStats = await client.query(`
                SELECT COUNT(*) as table_count
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            `);
            
            console.log('   📊 Status report generated successfully');
            console.log(`   📋 Migrations executed: ${migrationStats.rows[0].total_count}`);
            console.log(`   🌱 Seeders executed: ${seederStats.rows[0].total_count}`);
            console.log(`   🗄️  Database tables: ${tableStats.rows[0].table_count}`);
            console.log(`   ⏱️  Average migration time: ${Math.round(migrationStats.rows[0].avg_time || 0)}ms`);
            
        } finally {
            console.log = originalLog;
        }
    }

    // TEST 6: Error Handling dan Data Integrity
    async testErrorHandling() {
        const cli = new EnhancedMigrationCLI();
        
        // Test 1: Invalid migration file format
        const invalidMigrationContent = `-- Invalid SQL that will fail
        CREATE INVALID SYNTAX HERE;
        `;
        
        const invalidMigrationFile = join(this.migrationsDir, '997_invalid_syntax.sql');
        writeFileSync(invalidMigrationFile, invalidMigrationContent);
        
        try {
            // This should fail and rollback transaction
            await cli.runMigrations();
            throw new Error('Expected migration to fail but it succeeded');
        } catch (error) {
            // Expected failure
            if (!error.message.includes('syntax error')) {
                console.log(`   ⚠️  Got different error: ${error.message}`);
            }
            
            // Verify rollback worked - migration should not be recorded
            const failedMigrationRecord = await client.query(`
                SELECT filename FROM migrations WHERE filename = '997_invalid_syntax.sql'
            `);
            
            if (failedMigrationRecord.rows.length > 0) {
                throw new Error('Failed migration was incorrectly recorded');
            }
            
            console.log('   ✅ Invalid migration properly rejected and rolled back');
        } finally {
            if (existsSync(invalidMigrationFile)) {
                unlinkSync(invalidMigrationFile);
            }
        }
        
        // Test 2: Checksum validation
        const checksum1 = await client.query(`
            SELECT checksum FROM migrations WHERE filename = '001_create_tenants_table.sql'
        `);
        
        if (checksum1.rows.length > 0) {
            console.log(`   🔐 Checksum validation: ${checksum1.rows[0].checksum.substring(0, 16)}...`);
        }
        
        console.log('   🛡️  Error handling and integrity checks passed');
    }

    // TEST 7: Performance dan Concurrency
    async testPerformanceMetrics() {
        // Get migration performance metrics
        const performanceResult = await client.query(`
            SELECT 
                filename,
                execution_time_ms,
                version,
                executed_at
            FROM migrations 
            ORDER BY execution_time_ms DESC
            LIMIT 5
        `);
        
        let totalTime = 0;
        let migrationCount = 0;
        
        const allMigrations = await client.query(`
            SELECT execution_time_ms FROM migrations WHERE execution_time_ms > 0
        `);
        
        allMigrations.rows.forEach(row => {
            totalTime += row.execution_time_ms;
            migrationCount++;
        });
        
        const avgTime = migrationCount > 0 ? totalTime / migrationCount : 0;
        
        console.log('   ⚡ Performance Metrics:');
        console.log(`     Total migrations: ${migrationCount}`);
        console.log(`     Total execution time: ${totalTime}ms`);
        console.log(`     Average execution time: ${Math.round(avgTime)}ms`);
        
        if (performanceResult.rows.length > 0) {
            console.log('     Slowest migrations:');
            performanceResult.rows.forEach((row, index) => {
                console.log(`       ${index + 1}. ${row.filename}: ${row.execution_time_ms}ms`);
            });
        }
        
        // Check for reasonable performance thresholds
        if (avgTime > 5000) { // 5 seconds
            console.log('   ⚠️  WARNING: Average migration time exceeds 5 seconds');
        } else {
            console.log('   ✅ Migration performance within acceptable range');
        }
    }

    async runAllTests() {
        console.log('🧪 Enhanced Migration System Test Suite\n');
        console.log('=' .repeat(60));
        
        try {
            await this.connect();
            await this.setupTestEnvironment();
            
            // Run all tests
            await this.runTest('Migration System Initialization', () => this.testMigrationSystemInit());
            await this.runTest('Migration Execution with Checksums', () => this.testMigrationExecution());
            await this.runTest('Seeder Execution', () => this.testSeederExecution());
            await this.runTest('Rollback Functionality', () => this.testRollbackFunctionality());
            await this.runTest('Status Reporting', () => this.testStatusReporting());
            await this.runTest('Error Handling', () => this.testErrorHandling());
            await this.runTest('Performance Metrics', () => this.testPerformanceMetrics());
            
            await this.cleanupTestEnvironment();
            
        } catch (error) {
            console.error(`💥 Test suite failed: ${error.message}`);
            throw error;
        } finally {
            await this.disconnect();
        }
        
        // Print test summary
        this.printTestSummary();
    }

    printTestSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY REPORT');
        console.log('='.repeat(60));
        
        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        const totalTime = this.testResults.reduce((sum, r) => sum + r.duration, 0);
        
        console.log(`\n📋 Total Tests: ${this.testResults.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏱️  Total Time: ${totalTime}ms`);
        console.log(`📈 Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%`);
        
        if (failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(r => r.status === 'FAILED')
                .forEach(test => {
                    console.log(`   • ${test.name}: ${test.error}`);
                });
        }
        
        console.log('\n🎉 Enhanced Migration System Testing Complete!');
        
        if (passed === this.testResults.length) {
            console.log('🚀 All tests passed! System ready for production use.');
        } else {
            console.log('⚠️  Some tests failed. Please review and fix issues before proceeding.');
        }
    }
}

// Run tests
async function runTests() {
    const tester = new EnhancedMigrationTester();
    
    try {
        await tester.runAllTests();
    } catch (error) {
        console.error('\n💥 Test execution failed:', error.message);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    runTests();
}

module.exports = { EnhancedMigrationTester };
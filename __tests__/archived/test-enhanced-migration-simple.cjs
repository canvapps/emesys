/**
 * Simplified Test untuk Enhanced Migration System
 * Focus pada core functionality tanpa hanging issues
 */

const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment
dotenv.config({ path: '.env.local' });

console.log('🧪 Simple Enhanced Migration System Test\n');

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'emesys_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin'
});

class SimpleMigrationTester {
    constructor() {
        this.testResults = [];
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
        console.log(`⏳ Testing: ${testName}`);
        const startTime = Date.now();
        
        try {
            await testFunction();
            const duration = Date.now() - startTime;
            console.log(`✅ PASSED: ${testName} (${duration}ms)\n`);
            this.testResults.push({ name: testName, status: 'PASSED', duration });
            return true;
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ FAILED: ${testName} (${duration}ms)`);
            console.error(`   Error: ${error.message}\n`);
            this.testResults.push({ name: testName, status: 'FAILED', duration, error: error.message });
            return false;
        }
    }

    // TEST 1: Check Migration Tables Exist
    async testMigrationTablesExist() {
        // Check migrations table
        const migrationsResult = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_name = 'migrations'
        `);
        
        if (migrationsResult.rows.length === 0) {
            throw new Error('Migrations table does not exist');
        }

        // Check seeders table
        const seedersResult = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_name = 'seeders'
        `);
        
        if (seedersResult.rows.length === 0) {
            throw new Error('Seeders table does not exist');
        }

        console.log('   📋 Enhanced migration tables verified');
    }

    // TEST 2: Check Migration Records
    async testMigrationRecords() {
        const result = await client.query(`
            SELECT filename, executed_at, checksum, execution_time_ms
            FROM migrations 
            ORDER BY executed_at
        `);
        
        if (result.rows.length === 0) {
            throw new Error('No migration records found');
        }

        console.log(`   📝 Found ${result.rows.length} migration records:`);
        result.rows.forEach(row => {
            console.log(`     • ${row.filename} - ${row.checksum?.substring(0, 8)}...`);
        });
    }

    // TEST 3: Check Seeder Records  
    async testSeederRecords() {
        const result = await client.query(`
            SELECT filename, environment, executed_at, execution_time_ms
            FROM seeders
            ORDER BY executed_at
        `);
        
        if (result.rows.length === 0) {
            throw new Error('No seeder records found');
        }

        console.log(`   🌱 Found ${result.rows.length} seeder records:`);
        result.rows.forEach(row => {
            console.log(`     • ${row.filename} (${row.environment}) - ${row.execution_time_ms}ms`);
        });
    }

    // TEST 4: Check Super Admin User (Fixed Schema)
    async testSuperAdminUser() {
        const result = await client.query(`
            SELECT 
                tu.email, 
                tu.first_name,
                tu.last_name, 
                tu.role,
                tu.status,
                t.name as tenant_name
            FROM tenant_users tu
            JOIN tenants t ON tu.tenant_id = t.id
            WHERE tu.email = 'superadmin@weddinvite.com'
        `);
        
        if (result.rows.length === 0) {
            throw new Error('Super admin user not found');
        }

        const superAdmin = result.rows[0];
        if (superAdmin.tenant_name !== 'System Admin') {
            throw new Error('Super admin not in System Admin tenant');
        }

        if (superAdmin.role !== 'super_admin') {
            throw new Error('Super admin has wrong role');
        }

        console.log(`   👤 Super admin verified: ${superAdmin.email}`);
        console.log(`     Name: ${superAdmin.first_name} ${superAdmin.last_name}`);
        console.log(`     Role: ${superAdmin.role}`);
        console.log(`     Status: ${superAdmin.status}`);
    }

    // TEST 5: Check Demo Tenant (Fixed Schema)
    async testDemoTenant() {
        const result = await client.query(`
            SELECT name, type, status, subscription_plan
            FROM tenants 
            WHERE name = 'Bali Dream Wedding'
        `);
        
        if (result.rows.length === 0) {
            throw new Error('Demo tenant not found');
        }

        const tenant = result.rows[0];
        console.log(`   🏢 Demo tenant verified: ${tenant.name}`);
        console.log(`     Type: ${tenant.type}`);
        console.log(`     Status: ${tenant.status}`);
        console.log(`     Plan: ${tenant.subscription_plan}`);
    }

    // TEST 6: Check Demo Users (Fixed Schema)
    async testDemoUsers() {
        const result = await client.query(`
            SELECT 
                tu.email,
                tu.first_name,
                tu.last_name,
                tu.role,
                tu.status,
                t.name as tenant_name
            FROM tenant_users tu
            JOIN tenants t ON tu.tenant_id = t.id
            WHERE t.name = 'Bali Dream Wedding'
            ORDER BY tu.email
        `);
        
        if (result.rows.length === 0) {
            throw new Error('No demo users found');
        }

        console.log(`   👥 Found ${result.rows.length} demo users:`);
        result.rows.forEach(user => {
            console.log(`     • ${user.email} - ${user.first_name} ${user.last_name} (${user.role})`);
        });

        // Check expected users
        const emails = result.rows.map(r => r.email);
        const expectedEmails = [
            'admin@balidreamwedding.com',
            'designer@balidreamwedding.com', 
            'cs@balidreamwedding.com'
        ];

        expectedEmails.forEach(email => {
            if (!emails.includes(email)) {
                throw new Error(`Expected demo user ${email} not found`);
            }
        });
    }

    // TEST 7: Check Role Assignments
    async testRoleAssignments() {
        const result = await client.query(`
            SELECT 
                tu.email,
                ur.name as role_name,
                ura.is_active
            FROM tenant_users tu
            JOIN user_role_assignments ura ON tu.id = ura.user_id
            JOIN user_roles ur ON ur.id = ura.role_id
            WHERE ura.is_active = true
            ORDER BY tu.email
        `);
        
        if (result.rows.length === 0) {
            throw new Error('No role assignments found');
        }

        console.log(`   🎭 Found ${result.rows.length} active role assignments:`);
        result.rows.forEach(assignment => {
            console.log(`     • ${assignment.email} → ${assignment.role_name}`);
        });
    }

    // TEST 8: Performance Check
    async testPerformanceMetrics() {
        // Migration performance
        const migrationPerf = await client.query(`
            SELECT 
                COUNT(*) as total_migrations,
                AVG(execution_time_ms) as avg_time,
                MAX(execution_time_ms) as max_time,
                SUM(execution_time_ms) as total_time
            FROM migrations
        `);

        // Seeder performance
        const seederPerf = await client.query(`
            SELECT 
                COUNT(*) as total_seeders,
                AVG(execution_time_ms) as avg_time,
                MAX(execution_time_ms) as max_time
            FROM seeders
        `);

        const migStats = migrationPerf.rows[0];
        const seedStats = seederPerf.rows[0];

        console.log('   ⚡ Performance Metrics:');
        console.log(`     Migrations: ${migStats.total_migrations} executed`);
        console.log(`     Migration avg time: ${Math.round(migStats.avg_time || 0)}ms`);
        console.log(`     Seeders: ${seedStats.total_seeders} executed`);
        console.log(`     Seeder avg time: ${Math.round(seedStats.avg_time || 0)}ms`);
        
        if ((migStats.avg_time || 0) > 5000) {
            throw new Error('Migration performance too slow');
        }
    }

    // TEST 9: Database Schema Integrity
    async testSchemaIntegrity() {
        // Check all expected tables exist
        const expectedTables = [
            'tenants',
            'tenant_users', 
            'permissions',
            'user_roles',
            'role_permissions',
            'user_role_assignments',
            'migrations',
            'seeders'
        ];

        const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `);

        const actualTables = tablesResult.rows.map(r => r.table_name);
        
        expectedTables.forEach(expectedTable => {
            if (!actualTables.includes(expectedTable)) {
                throw new Error(`Expected table ${expectedTable} not found`);
            }
        });

        console.log(`   🗄️  Schema integrity verified: ${expectedTables.length} tables exist`);
    }

    async runAllTests() {
        console.log('============================================================');
        console.log('🚀 SIMPLE ENHANCED MIGRATION SYSTEM TEST SUITE');
        console.log('============================================================\n');
        
        let passedTests = 0;
        
        try {
            await this.connect();
            
            // Run all tests
            if (await this.runTest('Migration Tables Exist', () => this.testMigrationTablesExist())) passedTests++;
            if (await this.runTest('Migration Records', () => this.testMigrationRecords())) passedTests++;
            if (await this.runTest('Seeder Records', () => this.testSeederRecords())) passedTests++;
            if (await this.runTest('Super Admin User', () => this.testSuperAdminUser())) passedTests++;
            if (await this.runTest('Demo Tenant', () => this.testDemoTenant())) passedTests++;
            if (await this.runTest('Demo Users', () => this.testDemoUsers())) passedTests++;
            if (await this.runTest('Role Assignments', () => this.testRoleAssignments())) passedTests++;
            if (await this.runTest('Performance Metrics', () => this.testPerformanceMetrics())) passedTests++;
            if (await this.runTest('Schema Integrity', () => this.testSchemaIntegrity())) passedTests++;
            
        } catch (error) {
            console.error(`💥 Test suite failed: ${error.message}`);
        } finally {
            await this.disconnect();
        }
        
        // Print summary
        this.printTestSummary(passedTests);
    }

    printTestSummary(passedTests) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY REPORT');
        console.log('='.repeat(60));
        
        const totalTests = this.testResults.length;
        const failed = totalTests - passedTests;
        const totalTime = this.testResults.reduce((sum, r) => sum + r.duration, 0);
        
        console.log(`\n📋 Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏱️  Total Time: ${totalTime}ms`);
        console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
        
        if (failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(r => r.status === 'FAILED')
                .forEach(test => {
                    console.log(`   • ${test.name}: ${test.error}`);
                });
        }
        
        console.log('\n🎉 Enhanced Migration System Testing Complete!');
        
        if (passedTests === totalTests) {
            console.log('🚀 All tests passed! Enhanced migration system fully operational.');
        } else {
            console.log(`⚠️  ${failed} test(s) failed. System partially functional.`);
        }
    }
}

// Run tests
async function runTests() {
    const tester = new SimpleMigrationTester();
    
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

module.exports = { SimpleMigrationTester };
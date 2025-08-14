// ===============================================
// Pre-Migration Validation Test (RED Phase)
// ===============================================
// Purpose: Validate database state BEFORE Event Management Engine transformation
// Category: Database Migration Tests
// Expected: All tests PASS - validate current state before migration
// Usage: node __tests__/database/migration-tests/pre-migration.test.cjs
// Author: Kilo Code
// Created: 2025-08-12

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'emesys_dev',
    password: process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT || 5432,
};

async function runPreMigrationTests() {
    const pool = new Pool(config);
    console.log('🧪 PRE-MIGRATION VALIDATION (RED Phase)\n');
    
    const testResults = [];
    let passCount = 0;
    let failCount = 0;

    try {
        const client = await pool.connect();
        console.log('✅ Database connection established');

        // TEST 1: Generic Event Tables Should NOT Exist
        console.log('\n📋 TEST 1: Generic Event Tables Should NOT Exist');
        const genericTablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('events', 'event_types', 'event_participants', 'event_sections', 'event_templates')
            ORDER BY table_name;
        `;
        const genericTablesResult = await client.query(genericTablesQuery);
        const foundGenericTables = genericTablesResult.rows.map(row => row.table_name);
        
        if (foundGenericTables.length === 0) {
            console.log('   ✅ PASS: No generic event tables found (correct current state)');
            testResults.push({ test: 'Generic tables should not exist', status: 'PASS' });
            passCount++;
        } else {
            console.log(`   ❌ FAIL: Found generic tables: ${foundGenericTables.join(', ')}`);
            testResults.push({ test: 'Generic tables should not exist', status: 'FAIL' });
            failCount++;
        }

        // TEST 2: Multi-tenant Infrastructure Check
        console.log('\n📋 TEST 2: Multi-tenant Infrastructure Validation');
        const tenantInfraCheck = `
            SELECT 
                (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'tenants') as tenants_table,
                (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'tenant_users') as tenant_users_table,
                (SELECT COUNT(*) FROM tenants) as tenant_count,
                (SELECT COUNT(*) FROM tenant_users) as user_count;
        `;
        const tenantInfraResult = await client.query(tenantInfraCheck);
        const tenantData = tenantInfraResult.rows[0];
        
        if (tenantData.tenants_table > 0 && tenantData.tenant_users_table > 0) {
            console.log('   ✅ PASS: Multi-tenant infrastructure exists');
            console.log(`   📊 Data: ${tenantData.tenant_count} tenants, ${tenantData.user_count} users`);
            testResults.push({ test: 'Multi-tenant infrastructure ready', status: 'PASS' });
            passCount++;
        } else {
            console.log('   ❌ FAIL: Multi-tenant infrastructure missing');
            testResults.push({ test: 'Multi-tenant infrastructure ready', status: 'FAIL' });
            failCount++;
        }

        // TEST 3: Required Extensions Check
        console.log('\n📋 TEST 3: PostgreSQL Extensions Validation');
        const extensionsQuery = `SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp';`;
        const extensionsResult = await client.query(extensionsQuery);
        
        if (extensionsResult.rows.length > 0) {
            console.log('   ✅ PASS: uuid-ossp extension available');
            testResults.push({ test: 'Required extensions ready', status: 'PASS' });
            passCount++;
        } else {
            console.log('   ❌ FAIL: uuid-ossp extension missing');
            testResults.push({ test: 'Required extensions ready', status: 'FAIL' });
            failCount++;
        }

        // TEST 4: Migration Readiness Assessment
        console.log('\n📋 TEST 4: Migration Readiness Assessment');
        try {
            await client.query('CREATE TEMP TABLE migration_test_temp AS SELECT 1 as test_col');
            await client.query('DROP TABLE migration_test_temp');
            
            console.log('   ✅ PASS: Database permissions sufficient for migration');
            testResults.push({ test: 'Migration readiness', status: 'PASS' });
            passCount++;
        } catch (error) {
            console.log(`   ❌ FAIL: Migration readiness issues: ${error.message}`);
            testResults.push({ test: 'Migration readiness', status: 'FAIL' });
            failCount++;
        }

        client.release();

        // Results Summary
        console.log('\n' + '='.repeat(50));
        console.log('🧪 PRE-MIGRATION TEST RESULTS');
        console.log('='.repeat(50));
        testResults.forEach((test, index) => {
            const status = test.status === 'PASS' ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${test.test}`);
        });

        console.log(`\n📊 SUMMARY: ${passCount} passed, ${failCount} failed, ${testResults.length} total`);
        
        if (failCount === 0) {
            console.log('\n🎉 ALL PRE-MIGRATION TESTS PASSED');
            console.log('🟢 DATABASE READY FOR TRANSFORMATION MIGRATION');
        } else {
            console.log('\n⚠️  SOME PRE-MIGRATION TESTS FAILED');
        }

        return { passCount, failCount, total: testResults.length };

    } catch (error) {
        console.error('❌ Pre-migration test error:', error.message);
        return { passCount: 0, failCount: 1, total: 1, error: error.message };
    } finally {
        await pool.end();
    }
}

// Run tests
if (require.main === module) {
    runPreMigrationTests()
        .then(results => {
            process.exit(results.failCount > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { runPreMigrationTests };
// ===============================================
// Post-Migration Validation Test (GREEN Phase)
// ===============================================
// Purpose: Validate Event Management Engine transformation SUCCESS
// Category: Database Migration Tests
// Expected: All tests PASS - validate successful transformation
// Usage: node __tests__/database/migration-tests/post-migration.test.cjs
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

async function runPostMigrationTests() {
    const pool = new Pool(config);
    console.log('🧪 POST-MIGRATION VALIDATION (GREEN Phase)\n');
    
    const testResults = [];
    let passCount = 0;
    let failCount = 0;

    try {
        const client = await pool.connect();
        console.log('✅ Database connection established');

        // TEST 1: Generic Event Tables Should Exist
        console.log('\n📋 TEST 1: Generic Event Tables Should Exist');
        const genericTablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('event_types', 'events', 'event_participants', 'event_sections', 'event_templates')
            ORDER BY table_name;
        `;
        const genericTablesResult = await client.query(genericTablesQuery);
        const foundTables = genericTablesResult.rows.map(row => row.table_name);
        const expectedTables = ['event_participants', 'event_sections', 'event_templates', 'event_types', 'events'];
        
        if (foundTables.length === 5 && expectedTables.every(t => foundTables.includes(t))) {
            console.log('   ✅ PASS: All generic event tables exist');
            testResults.push({ test: 'Generic event tables exist', status: 'PASS' });
            passCount++;
        } else {
            console.log(`   ❌ FAIL: Missing tables. Found: ${foundTables.join(', ')}`);
            testResults.push({ test: 'Generic event tables exist', status: 'FAIL' });
            failCount++;
        }

        // TEST 2: Wedding Event Type Configuration
        console.log('\n📋 TEST 2: Wedding Event Type Configuration');
        const weddingTypeQuery = `
            SELECT name, display_name, category, is_system_type,
                   jsonb_array_length(required_fields) as required_count,
                   default_config->>'supports_rsvp' as supports_rsvp
            FROM event_types 
            WHERE name = 'wedding';
        `;
        const weddingTypeResult = await client.query(weddingTypeQuery);
        
        if (weddingTypeResult.rows.length === 1) {
            const wedding = weddingTypeResult.rows[0];
            console.log('   ✅ PASS: Wedding event type exists');
            console.log(`   📊 Config: ${wedding.display_name} (${wedding.category})`);
            console.log(`   🔧 Required fields: ${wedding.required_count}, RSVP: ${wedding.supports_rsvp}`);
            testResults.push({ test: 'Wedding event type configuration', status: 'PASS' });
            passCount++;
        } else {
            console.log('   ❌ FAIL: Wedding event type missing');
            testResults.push({ test: 'Wedding event type configuration', status: 'FAIL' });
            failCount++;
        }

        // TEST 3: Performance Indexes Validation
        console.log('\n📋 TEST 3: Performance Indexes Validation');
        const indexesQuery = `
            SELECT COUNT(*) as index_count
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND tablename IN ('events', 'event_participants', 'event_sections', 'event_templates', 'event_types');
        `;
        const indexesResult = await client.query(indexesQuery);
        const indexCount = indexesResult.rows[0].index_count;
        
        if (indexCount >= 25) {
            console.log(`   ✅ PASS: ${indexCount} performance indexes created`);
            testResults.push({ test: 'Performance indexes created', status: 'PASS' });
            passCount++;
        } else {
            console.log(`   ❌ FAIL: Only ${indexCount} indexes found (expected ≥25)`);
            testResults.push({ test: 'Performance indexes created', status: 'FAIL' });
            failCount++;
        }

        // TEST 4: Backward Compatibility Views
        console.log('\n📋 TEST 4: Backward Compatibility Views');
        const viewsQuery = `
            SELECT COUNT(*) as view_count
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name IN ('wedding_invitations', 'wedding_guests', 'wedding_templates', 'wedding_sections');
        `;
        const viewsResult = await client.query(viewsQuery);
        const viewCount = viewsResult.rows[0].view_count;
        
        if (viewCount === 4) {
            console.log('   ✅ PASS: All compatibility views created');
            console.log('   👁️  wedding_invitations, wedding_guests, wedding_templates, wedding_sections');
            testResults.push({ test: 'Backward compatibility views', status: 'PASS' });
            passCount++;
        } else {
            console.log(`   ❌ FAIL: Only ${viewCount} views found (expected 4)`);
            testResults.push({ test: 'Backward compatibility views', status: 'FAIL' });
            failCount++;
        }

        // TEST 5: Sample Data Operations Test
        console.log('\n📋 TEST 5: Sample Data Operations Test');
        try {
            // Get wedding event type ID
            const weddingTypeId = await client.query(`SELECT id FROM event_types WHERE name = 'wedding'`);
            const eventTypeId = weddingTypeId.rows[0].id;
            
            // Get a tenant ID
            const tenantResult = await client.query(`SELECT id FROM tenants LIMIT 1`);
            const tenantId = tenantResult.rows[0].id;
            
            // Insert sample wedding event
            const eventResult = await client.query(`
                INSERT INTO events (
                    event_type_id, title, event_date, tenant_id,
                    form_data, location, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id;
            `, [
                eventTypeId,
                'Test Wedding Event',
                '2025-12-31',
                tenantId,
                JSON.stringify({
                    bride_name: 'Jane Doe',
                    groom_name: 'John Doe',
                    reception_time: '18:00'
                }),
                JSON.stringify({
                    venue: 'Test Venue',
                    address: '123 Test Street'
                }),
                'draft'
            ]);
            
            const eventId = eventResult.rows[0].id;
            
            // Test wedding_invitations view
            const viewResult = await client.query(`
                SELECT bride_name, groom_name, venue_name 
                FROM wedding_invitations 
                WHERE id = $1;
            `, [eventId]);
            
            if (viewResult.rows.length === 1) {
                const wedding = viewResult.rows[0];
                console.log('   ✅ PASS: Sample data operations successful');
                console.log(`   👰 Wedding: ${wedding.bride_name} & ${wedding.groom_name}`);
                console.log(`   🏛️  Venue: ${wedding.venue_name}`);
                testResults.push({ test: 'Sample data operations', status: 'PASS' });
                passCount++;
                
                // Cleanup test data
                await client.query('DELETE FROM events WHERE id = $1', [eventId]);
            } else {
                console.log('   ❌ FAIL: View query failed');
                testResults.push({ test: 'Sample data operations', status: 'FAIL' });
                failCount++;
            }
            
        } catch (error) {
            console.log(`   ❌ FAIL: Sample data error: ${error.message}`);
            testResults.push({ test: 'Sample data operations', status: 'FAIL' });
            failCount++;
        }

        // TEST 6: Migration Logs Validation
        console.log('\n📋 TEST 6: Migration Logs Validation');
        const migrationLogsQuery = `
            SELECT COUNT(*) as completed_count
            FROM migration_logs 
            WHERE operation LIKE 'migration_00%' AND status = 'completed';
        `;
        const logsResult = await client.query(migrationLogsQuery);
        const completedCount = logsResult.rows[0].completed_count;
        
        if (completedCount >= 3) {
            console.log(`   ✅ PASS: ${completedCount} migrations completed successfully`);
            testResults.push({ test: 'Migration logs validation', status: 'PASS' });
            passCount++;
        } else {
            console.log(`   ❌ FAIL: Only ${completedCount} migrations completed`);
            testResults.push({ test: 'Migration logs validation', status: 'FAIL' });
            failCount++;
        }

        client.release();

        // Results Summary
        console.log('\n' + '='.repeat(50));
        console.log('🧪 POST-MIGRATION TEST RESULTS');
        console.log('='.repeat(50));
        testResults.forEach((test, index) => {
            const status = test.status === 'PASS' ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${test.test}`);
        });

        console.log(`\n📊 SUMMARY: ${passCount} passed, ${failCount} failed, ${testResults.length} total`);
        
        if (failCount === 0) {
            console.log('\n🎉 ALL POST-MIGRATION TESTS PASSED!');
            console.log('✅ EVENT MANAGEMENT ENGINE TRANSFORMATION SUCCESSFUL');
            console.log('🚀 Platform ready for generic event handling');
            console.log('🔄 Backward compatibility maintained');
            console.log('⚡ Performance optimized');
        } else {
            console.log('\n⚠️  SOME POST-MIGRATION TESTS FAILED');
            console.log('🔧 Review failures and fix before proceeding');
        }

        return { passCount, failCount, total: testResults.length };

    } catch (error) {
        console.error('❌ Post-migration test error:', error.message);
        return { passCount: 0, failCount: 1, total: 1, error: error.message };
    } finally {
        await pool.end();
    }
}

// Run tests
if (require.main === module) {
    runPostMigrationTests()
        .then(results => {
            process.exit(results.failCount > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { runPostMigrationTests };
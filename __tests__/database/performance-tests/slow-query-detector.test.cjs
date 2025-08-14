// ===============================================
// Slow Query Detector Test
// ===============================================
// Purpose: Monitor and detect database query performance issues
// Category: Database Performance Tests
// Expected: All queries execute under <50ms performance targets
// Usage: node __tests__/database/performance-tests/slow-query-detector.test.cjs
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

// Performance targets
const PERFORMANCE_TARGETS = {
    FAST_QUERY: 10, // ms
    ACCEPTABLE_QUERY: 50, // ms
    SLOW_QUERY_WARNING: 100, // ms
    CRITICAL_SLOW_QUERY: 500 // ms
};

async function runSlowQueryDetectorTests() {
    const pool = new Pool(config);
    console.log('🧪 SLOW QUERY DETECTOR - Performance Monitoring\n');
    
    const testResults = [];
    let passCount = 0;
    let failCount = 0;
    let warningCount = 0;

    try {
        const client = await pool.connect();
        console.log('✅ Database connection established');

        // TEST 1: Basic Table Query Performance
        console.log('\n📋 TEST 1: Basic Table Query Performance');
        const basicQueries = [
            { name: 'events_basic_select', query: 'SELECT COUNT(*) FROM events' },
            { name: 'event_types_basic_select', query: 'SELECT COUNT(*) FROM event_types' },
            { name: 'event_participants_basic_select', query: 'SELECT COUNT(*) FROM event_participants' },
            { name: 'tenants_basic_select', query: 'SELECT COUNT(*) FROM tenants' },
            { name: 'tenant_users_basic_select', query: 'SELECT COUNT(*) FROM tenant_users' }
        ];

        for (const queryTest of basicQueries) {
            const startTime = process.hrtime.bigint();
            try {
                await client.query(queryTest.query);
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000; // Convert to ms

                if (duration <= PERFORMANCE_TARGETS.FAST_QUERY) {
                    console.log(`   ✅ ${queryTest.name}: ${duration.toFixed(2)}ms (FAST)`);
                    testResults.push({ test: queryTest.name, status: 'PASS', duration });
                    passCount++;
                } else if (duration <= PERFORMANCE_TARGETS.ACCEPTABLE_QUERY) {
                    console.log(`   ✅ ${queryTest.name}: ${duration.toFixed(2)}ms (ACCEPTABLE)`);
                    testResults.push({ test: queryTest.name, status: 'PASS', duration });
                    passCount++;
                } else if (duration <= PERFORMANCE_TARGETS.SLOW_QUERY_WARNING) {
                    console.log(`   ⚠️  ${queryTest.name}: ${duration.toFixed(2)}ms (WARNING - SLOW)`);
                    testResults.push({ test: queryTest.name, status: 'WARNING', duration });
                    warningCount++;
                } else {
                    console.log(`   ❌ ${queryTest.name}: ${duration.toFixed(2)}ms (CRITICAL - TOO SLOW)`);
                    testResults.push({ test: queryTest.name, status: 'FAIL', duration });
                    failCount++;
                }
            } catch (error) {
                console.log(`   ❌ ${queryTest.name}: Query failed - ${error.message}`);
                testResults.push({ test: queryTest.name, status: 'FAIL', error: error.message });
                failCount++;
            }
        }

        // TEST 2: Index Performance Validation
        console.log('\n📋 TEST 2: Index Performance Validation');
        const indexQueries = [
            { 
                name: 'events_tenant_lookup', 
                query: 'SELECT id, title FROM events WHERE tenant_id = (SELECT id FROM tenants LIMIT 1) LIMIT 10'
            },
            { 
                name: 'events_by_status', 
                query: 'SELECT id, title FROM events WHERE status = \'published\' LIMIT 10'
            },
            { 
                name: 'participants_by_event', 
                query: 'SELECT id, contact_info FROM event_participants WHERE event_id = (SELECT id FROM events LIMIT 1) LIMIT 10'
            },
            { 
                name: 'participants_rsvp_status', 
                query: 'SELECT COUNT(*) FROM event_participants WHERE rsvp_status = \'pending\''
            }
        ];

        for (const queryTest of indexQueries) {
            const startTime = process.hrtime.bigint();
            try {
                await client.query(queryTest.query);
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000; // Convert to ms

                if (duration <= PERFORMANCE_TARGETS.ACCEPTABLE_QUERY) {
                    console.log(`   ✅ ${queryTest.name}: ${duration.toFixed(2)}ms (INDEXED - GOOD)`);
                    testResults.push({ test: queryTest.name, status: 'PASS', duration });
                    passCount++;
                } else if (duration <= PERFORMANCE_TARGETS.SLOW_QUERY_WARNING) {
                    console.log(`   ⚠️  ${queryTest.name}: ${duration.toFixed(2)}ms (INDEX MAY NEED OPTIMIZATION)`);
                    testResults.push({ test: queryTest.name, status: 'WARNING', duration });
                    warningCount++;
                } else {
                    console.log(`   ❌ ${queryTest.name}: ${duration.toFixed(2)}ms (INDEX PROBLEM - TOO SLOW)`);
                    testResults.push({ test: queryTest.name, status: 'FAIL', duration });
                    failCount++;
                }
            } catch (error) {
                console.log(`   ❌ ${queryTest.name}: Query failed - ${error.message}`);
                testResults.push({ test: queryTest.name, status: 'FAIL', error: error.message });
                failCount++;
            }
        }

        // TEST 3: JSON Query Performance (GIN Indexes)
        console.log('\n📋 TEST 3: JSON Query Performance (GIN Indexes)');
        const jsonQueries = [
            { 
                name: 'events_form_data_search', 
                query: 'SELECT id FROM events WHERE form_data @> \'{"bride_name": "Jane"}\' LIMIT 10'
            },
            { 
                name: 'participants_contact_email_search', 
                query: 'SELECT id FROM event_participants WHERE contact_info @> \'{"email": "test@example.com"}\' LIMIT 10'
            },
            { 
                name: 'events_location_venue_search', 
                query: 'SELECT id FROM events WHERE location @> \'{"venue": "Test Venue"}\' LIMIT 10'
            }
        ];

        for (const queryTest of jsonQueries) {
            const startTime = process.hrtime.bigint();
            try {
                await client.query(queryTest.query);
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000; // Convert to ms

                if (duration <= PERFORMANCE_TARGETS.ACCEPTABLE_QUERY) {
                    console.log(`   ✅ ${queryTest.name}: ${duration.toFixed(2)}ms (GIN INDEX - GOOD)`);
                    testResults.push({ test: queryTest.name, status: 'PASS', duration });
                    passCount++;
                } else if (duration <= PERFORMANCE_TARGETS.SLOW_QUERY_WARNING) {
                    console.log(`   ⚠️  ${queryTest.name}: ${duration.toFixed(2)}ms (GIN INDEX - ACCEPTABLE)`);
                    testResults.push({ test: queryTest.name, status: 'WARNING', duration });
                    warningCount++;
                } else {
                    console.log(`   ❌ ${queryTest.name}: ${duration.toFixed(2)}ms (GIN INDEX PROBLEM)`);
                    testResults.push({ test: queryTest.name, status: 'FAIL', duration });
                    failCount++;
                }
            } catch (error) {
                console.log(`   ❌ ${queryTest.name}: Query failed - ${error.message}`);
                testResults.push({ test: queryTest.name, status: 'FAIL', error: error.message });
                failCount++;
            }
        }

        // TEST 4: Complex Join Performance
        console.log('\n📋 TEST 4: Complex Join Performance');
        const joinQueries = [
            { 
                name: 'events_with_participants_count', 
                query: `
                    SELECT e.id, e.title, COUNT(ep.id) as participant_count
                    FROM events e
                    LEFT JOIN event_participants ep ON ep.event_id = e.id
                    WHERE e.tenant_id = (SELECT id FROM tenants LIMIT 1)
                    GROUP BY e.id, e.title
                    LIMIT 10
                `
            },
            { 
                name: 'events_with_type_info', 
                query: `
                    SELECT e.id, e.title, et.display_name, et.category
                    FROM events e
                    JOIN event_types et ON et.id = e.event_type_id
                    WHERE e.status = 'published'
                    LIMIT 10
                `
            },
            { 
                name: 'wedding_view_performance', 
                query: `
                    SELECT bride_name, groom_name, venue_name, wedding_date
                    FROM wedding_invitations
                    LIMIT 10
                `
            }
        ];

        for (const queryTest of joinQueries) {
            const startTime = process.hrtime.bigint();
            try {
                await client.query(queryTest.query);
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000; // Convert to ms

                if (duration <= PERFORMANCE_TARGETS.ACCEPTABLE_QUERY) {
                    console.log(`   ✅ ${queryTest.name}: ${duration.toFixed(2)}ms (JOIN - OPTIMIZED)`);
                    testResults.push({ test: queryTest.name, status: 'PASS', duration });
                    passCount++;
                } else if (duration <= PERFORMANCE_TARGETS.SLOW_QUERY_WARNING) {
                    console.log(`   ⚠️  ${queryTest.name}: ${duration.toFixed(2)}ms (JOIN - NEEDS ATTENTION)`);
                    testResults.push({ test: queryTest.name, status: 'WARNING', duration });
                    warningCount++;
                } else {
                    console.log(`   ❌ ${queryTest.name}: ${duration.toFixed(2)}ms (JOIN - TOO SLOW)`);
                    testResults.push({ test: queryTest.name, status: 'FAIL', duration });
                    failCount++;
                }
            } catch (error) {
                console.log(`   ❌ ${queryTest.name}: Query failed - ${error.message}`);
                testResults.push({ test: queryTest.name, status: 'FAIL', error: error.message });
                failCount++;
            }
        }

        client.release();

        // Performance Summary
        console.log('\n' + '='.repeat(60));
        console.log('🧪 SLOW QUERY DETECTOR RESULTS');
        console.log('='.repeat(60));

        console.log('\n📊 Performance Summary:');
        testResults.forEach((test, index) => {
            let status, color;
            if (test.status === 'PASS') {
                status = '✅ PASS';
            } else if (test.status === 'WARNING') {
                status = '⚠️  WARNING';
            } else {
                status = '❌ FAIL';
            }
            
            const duration = test.duration ? `${test.duration.toFixed(2)}ms` : 'N/A';
            console.log(`${index + 1}. ${status} ${test.test} (${duration})`);
        });

        console.log(`\n📈 SUMMARY: ${passCount} passed, ${warningCount} warnings, ${failCount} failed, ${testResults.length} total`);
        
        // Performance Analysis
        const avgDuration = testResults
            .filter(t => t.duration)
            .reduce((sum, t) => sum + t.duration, 0) / testResults.filter(t => t.duration).length;

        console.log(`⚡ Average Query Time: ${avgDuration ? avgDuration.toFixed(2) : 'N/A'}ms`);
        
        if (failCount === 0 && warningCount === 0) {
            console.log('\n🎉 ALL QUERIES PERFORMING OPTIMALLY');
            console.log('✅ Database performance meets all targets');
        } else if (failCount === 0) {
            console.log('\n✅ ALL QUERIES WITHIN ACCEPTABLE LIMITS');
            console.log('⚠️  Some queries have warnings - consider optimization');
        } else {
            console.log('\n⚠️  PERFORMANCE ISSUES DETECTED');
            console.log('🔧 Review slow queries and optimize indexes');
        }

        return { passCount, failCount, warningCount, total: testResults.length };

    } catch (error) {
        console.error('❌ Slow query detector error:', error.message);
        return { passCount: 0, failCount: 1, warningCount: 0, total: 1, error: error.message };
    } finally {
        await pool.end();
    }
}

// Run tests
if (require.main === module) {
    runSlowQueryDetectorTests()
        .then(results => {
            process.exit(results.failCount > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { runSlowQueryDetectorTests };
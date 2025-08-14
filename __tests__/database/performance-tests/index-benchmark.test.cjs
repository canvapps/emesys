// ===============================================
// Index Benchmark Test
// ===============================================
// Purpose: Benchmark database index performance and validate optimization
// Category: Database Performance Tests
// Expected: Index performance meets <50ms targets and shows proper usage
// Usage: node __tests__/database/performance-tests/index-benchmark.test.cjs
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

// Performance benchmarks
const BENCHMARK_TARGETS = {
    INDEX_SCAN_MAX: 50,      // ms - Maximum acceptable index scan time
    SEQ_SCAN_WARNING: 100,   // ms - Sequential scan warning threshold
    JOIN_PERFORMANCE_MAX: 75, // ms - Maximum join operation time
    JSON_SEARCH_MAX: 100     // ms - Maximum JSON search time (GIN indexes)
};

async function runIndexBenchmarkTests() {
    const pool = new Pool(config);
    console.log('🏁 INDEX BENCHMARK - Performance Analysis\n');
    
    const benchmarkResults = [];
    let passCount = 0;
    let failCount = 0;
    let warningCount = 0;

    try {
        const client = await pool.connect();
        console.log('✅ Database connection established');

        // TEST 1: Primary Key Index Performance
        console.log('\n📋 TEST 1: Primary Key Index Performance');
        const primaryKeyTests = [
            {
                name: 'events_pk_lookup',
                query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM events WHERE id = (SELECT id FROM events ORDER BY id LIMIT 1)',
                expectIndex: true
            },
            {
                name: 'tenants_pk_lookup',
                query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM tenants WHERE id = (SELECT id FROM tenants ORDER BY id LIMIT 1)',
                expectIndex: true
            },
            {
                name: 'event_participants_pk_lookup',
                query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM event_participants WHERE id = (SELECT id FROM event_participants ORDER BY id LIMIT 1)',
                expectIndex: true
            }
        ];

        for (const test of primaryKeyTests) {
            const startTime = process.hrtime.bigint();
            try {
                const result = await client.query(test.query);
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000;
                
                const planText = result.rows.map(row => row['QUERY PLAN']).join('\n');
                const isUsingIndex = planText.includes('Index Scan') && !planText.includes('Seq Scan');
                const actualTime = parseFloat(planText.match(/actual time=(\d+\.\d+)/)?.[1] || '0');

                if (isUsingIndex && actualTime <= BENCHMARK_TARGETS.INDEX_SCAN_MAX) {
                    console.log(`   ✅ ${test.name}: ${actualTime.toFixed(2)}ms (INDEX SCAN - OPTIMAL)`);
                    benchmarkResults.push({ test: test.name, status: 'PASS', duration: actualTime, indexUsed: true });
                    passCount++;
                } else if (isUsingIndex && actualTime <= BENCHMARK_TARGETS.SEQ_SCAN_WARNING) {
                    console.log(`   ⚠️  ${test.name}: ${actualTime.toFixed(2)}ms (INDEX SCAN - ACCEPTABLE)`);
                    benchmarkResults.push({ test: test.name, status: 'WARNING', duration: actualTime, indexUsed: true });
                    warningCount++;
                } else {
                    console.log(`   ❌ ${test.name}: ${actualTime.toFixed(2)}ms (${isUsingIndex ? 'SLOW INDEX' : 'NO INDEX'})`);
                    benchmarkResults.push({ test: test.name, status: 'FAIL', duration: actualTime, indexUsed: isUsingIndex });
                    failCount++;
                }
            } catch (error) {
                console.log(`   ❌ ${test.name}: Error - ${error.message}`);
                benchmarkResults.push({ test: test.name, status: 'FAIL', error: error.message });
                failCount++;
            }
        }

        // TEST 2: Foreign Key Index Performance  
        console.log('\n📋 TEST 2: Foreign Key Index Performance');
        const foreignKeyTests = [
            {
                name: 'events_tenant_fk_lookup',
                query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM events WHERE tenant_id = (SELECT id FROM tenants ORDER BY id LIMIT 1)'
            },
            {
                name: 'participants_event_fk_lookup',
                query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM event_participants WHERE event_id = (SELECT id FROM events ORDER BY id LIMIT 1)'
            },
            {
                name: 'events_type_fk_lookup',
                query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM events WHERE event_type_id = (SELECT id FROM event_types ORDER BY id LIMIT 1)'
            }
        ];

        for (const test of foreignKeyTests) {
            const startTime = process.hrtime.bigint();
            try {
                const result = await client.query(test.query);
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000;
                
                const planText = result.rows.map(row => row['QUERY PLAN']).join('\n');
                const isUsingIndex = planText.includes('Index Scan') || planText.includes('Bitmap Index Scan');
                const actualTime = parseFloat(planText.match(/actual time=(\d+\.\d+)/)?.[1] || '0');

                if (isUsingIndex && actualTime <= BENCHMARK_TARGETS.INDEX_SCAN_MAX) {
                    console.log(`   ✅ ${test.name}: ${actualTime.toFixed(2)}ms (FK INDEX - OPTIMAL)`);
                    benchmarkResults.push({ test: test.name, status: 'PASS', duration: actualTime, indexUsed: true });
                    passCount++;
                } else if (actualTime <= BENCHMARK_TARGETS.SEQ_SCAN_WARNING) {
                    console.log(`   ⚠️  ${test.name}: ${actualTime.toFixed(2)}ms (${isUsingIndex ? 'FK INDEX - SLOW' : 'NO FK INDEX'})`);
                    benchmarkResults.push({ test: test.name, status: 'WARNING', duration: actualTime, indexUsed: isUsingIndex });
                    warningCount++;
                } else {
                    console.log(`   ❌ ${test.name}: ${actualTime.toFixed(2)}ms (FK INDEX PROBLEM)`);
                    benchmarkResults.push({ test: test.name, status: 'FAIL', duration: actualTime, indexUsed: isUsingIndex });
                    failCount++;
                }
            } catch (error) {
                console.log(`   ❌ ${test.name}: Error - ${error.message}`);
                benchmarkResults.push({ test: test.name, status: 'FAIL', error: error.message });
                failCount++;
            }
        }

        // TEST 3: Composite Index Performance
        console.log('\n📋 TEST 3: Composite Index Performance');
        const compositeIndexTests = [
            {
                name: 'events_tenant_status_composite',
                query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM events WHERE tenant_id = (SELECT id FROM tenants ORDER BY id LIMIT 1) AND status = \'published\''
            },
            {
                name: 'participants_event_rsvp_composite',
                query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM event_participants WHERE event_id = (SELECT id FROM events ORDER BY id LIMIT 1) AND rsvp_status = \'pending\''
            },
            {
                name: 'events_type_status_composite',
                query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM events WHERE event_type_id = (SELECT id FROM event_types ORDER BY id LIMIT 1) AND status = \'draft\''
            }
        ];

        for (const test of compositeIndexTests) {
            const startTime = process.hrtime.bigint();
            try {
                const result = await client.query(test.query);
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000;
                
                const planText = result.rows.map(row => row['QUERY PLAN']).join('\n');
                const isUsingIndex = planText.includes('Index Scan') || planText.includes('Bitmap Index Scan');
                const actualTime = parseFloat(planText.match(/actual time=(\d+\.\d+)/)?.[1] || '0');

                if (isUsingIndex && actualTime <= BENCHMARK_TARGETS.INDEX_SCAN_MAX) {
                    console.log(`   ✅ ${test.name}: ${actualTime.toFixed(2)}ms (COMPOSITE INDEX - OPTIMAL)`);
                    benchmarkResults.push({ test: test.name, status: 'PASS', duration: actualTime, indexUsed: true });
                    passCount++;
                } else if (actualTime <= BENCHMARK_TARGETS.JOIN_PERFORMANCE_MAX) {
                    console.log(`   ⚠️  ${test.name}: ${actualTime.toFixed(2)}ms (COMPOSITE INDEX - NEEDS TUNING)`);
                    benchmarkResults.push({ test: test.name, status: 'WARNING', duration: actualTime, indexUsed: isUsingIndex });
                    warningCount++;
                } else {
                    console.log(`   ❌ ${test.name}: ${actualTime.toFixed(2)}ms (COMPOSITE INDEX PROBLEM)`);
                    benchmarkResults.push({ test: test.name, status: 'FAIL', duration: actualTime, indexUsed: isUsingIndex });
                    failCount++;
                }
            } catch (error) {
                console.log(`   ❌ ${test.name}: Error - ${error.message}`);
                benchmarkResults.push({ test: test.name, status: 'FAIL', error: error.message });
                failCount++;
            }
        }

        // TEST 4: GIN Index Performance (JSON Fields)
        console.log('\n📋 TEST 4: GIN Index Performance (JSON Fields)');
        const ginIndexTests = [
            { 
                name: 'events_form_data_gin_search', 
                query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM events WHERE form_data @> \'{"bride_name": "test"}\''
            },
            { 
                name: 'participants_contact_gin_search', 
                query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM event_participants WHERE contact_info @> \'{"email": "test@example.com"}\''
            },
            { 
                name: 'events_location_gin_search', 
                query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT COUNT(*) FROM events WHERE location @> \'{"venue": "test venue"}\''
            }
        ];

        for (const test of ginIndexTests) {
            const startTime = process.hrtime.bigint();
            try {
                const result = await client.query(test.query);
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000;
                
                const planText = result.rows.map(row => row['QUERY PLAN']).join('\n');
                const isUsingGinIndex = planText.includes('Bitmap Index Scan') && planText.includes('gin');
                const actualTime = parseFloat(planText.match(/actual time=(\d+\.\d+)/)?.[1] || '0');

                if (isUsingGinIndex && actualTime <= BENCHMARK_TARGETS.JSON_SEARCH_MAX) {
                    console.log(`   ✅ ${test.name}: ${actualTime.toFixed(2)}ms (GIN INDEX - OPTIMAL)`);
                    benchmarkResults.push({ test: test.name, status: 'PASS', duration: actualTime, indexUsed: true });
                    passCount++;
                } else if (actualTime <= BENCHMARK_TARGETS.JSON_SEARCH_MAX * 1.5) {
                    console.log(`   ⚠️  ${test.name}: ${actualTime.toFixed(2)}ms (${isUsingGinIndex ? 'GIN INDEX - SLOW' : 'NO GIN INDEX'})`);
                    benchmarkResults.push({ test: test.name, status: 'WARNING', duration: actualTime, indexUsed: isUsingGinIndex });
                    warningCount++;
                } else {
                    console.log(`   ❌ ${test.name}: ${actualTime.toFixed(2)}ms (GIN INDEX PROBLEM)`);
                    benchmarkResults.push({ test: test.name, status: 'FAIL', duration: actualTime, indexUsed: isUsingGinIndex });
                    failCount++;
                }
            } catch (error) {
                console.log(`   ❌ ${test.name}: Error - ${error.message}`);
                benchmarkResults.push({ test: test.name, status: 'FAIL', error: error.message });
                failCount++;
            }
        }

        client.release();

        // Benchmark Summary
        console.log('\n' + '='.repeat(60));
        console.log('🏁 INDEX BENCHMARK RESULTS');
        console.log('='.repeat(60));

        console.log('\n📊 Performance Benchmark Summary:');
        benchmarkResults.forEach((test, index) => {
            let status;
            if (test.status === 'PASS') {
                status = '✅ PASS';
            } else if (test.status === 'WARNING') {
                status = '⚠️  WARNING';
            } else {
                status = '❌ FAIL';
            }
            
            const duration = test.duration ? `${test.duration.toFixed(2)}ms` : 'N/A';
            const indexInfo = test.indexUsed ? '(INDEX)' : '(NO INDEX)';
            console.log(`${index + 1}. ${status} ${test.test} ${duration} ${indexInfo}`);
        });

        console.log(`\n📈 BENCHMARK SUMMARY: ${passCount} passed, ${warningCount} warnings, ${failCount} failed, ${benchmarkResults.length} total`);
        
        // Performance Analysis
        const validResults = benchmarkResults.filter(t => t.duration && !isNaN(t.duration));
        const avgDuration = validResults.length > 0 ? validResults.reduce((sum, t) => sum + t.duration, 0) / validResults.length : 0;
        const indexUsageRate = benchmarkResults.filter(t => t.indexUsed).length / benchmarkResults.length * 100;

        console.log(`⚡ Average Query Time: ${avgDuration.toFixed(2)}ms`);
        console.log(`📊 Index Usage Rate: ${indexUsageRate.toFixed(1)}%`);
        
        if (failCount === 0 && warningCount === 0) {
            console.log('\n🎉 ALL INDEXES PERFORMING OPTIMALLY');
            console.log('✅ Database indexes meet all performance benchmarks');
        } else if (failCount === 0) {
            console.log('\n✅ INDEX PERFORMANCE ACCEPTABLE');
            console.log('⚠️  Some indexes may benefit from optimization');
        } else {
            console.log('\n⚠️  INDEX PERFORMANCE ISSUES DETECTED');
            console.log('🔧 Review failing indexes and consider restructuring');
        }

        return { passCount, failCount, warningCount, total: benchmarkResults.length };

    } catch (error) {
        console.error('❌ Index benchmark error:', error.message);
        return { passCount: 0, failCount: 1, warningCount: 0, total: 1, error: error.message };
    } finally {
        await pool.end();
    }
}

// Run tests
if (require.main === module) {
    runIndexBenchmarkTests()
        .then(results => {
            process.exit(results.failCount > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { runIndexBenchmarkTests };
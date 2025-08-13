#!/usr/bin/env node

/**
 * 🧪 CHUNK 1A.7: Database Indexing Performance Tests
 * ================================================
 * 
 * Test-First Development (TFD) Approach:
 * 1. Write failing performance tests first
 * 2. Measure baseline query performance WITHOUT indexes
 * 3. Implement indexes to meet performance targets
 * 4. Validate performance improvements
 * 5. Document results dan establish monitoring
 * 
 * Performance Targets:
 * - Tenant isolation queries: < 50ms
 * - User lookup queries: < 30ms  
 * - Role/permission queries: < 40ms
 * - All queries: < 200ms maximum
 */

const { Client } = require('pg');
const { connectToDatabase } = require('./connection-js.cjs');
const { createTestTenant, cleanupTestTenant } = require('./test-tenants-manual-js.cjs');

// Test configuration
const TEST_ITERATIONS = 100;
const PERFORMANCE_TARGETS = {
  tenant_isolation: 50,    // ms
  user_lookup: 30,         // ms
  role_permission: 40,     // ms
  max_query_time: 200      // ms
};

// Test data counters
let testTenantId = null;
let testUserId = null;
let testRoleId = null;

/**
 * 📊 Performance Test Suite
 */
async function runPerformanceTests() {
  console.log('🧪 CHUNK 1A.7: Database Indexing Performance Tests');
  console.log('================================================');
  
  const startTime = Date.now();
  let passedTests = 0;
  let totalTests = 0;
  
  try {
    // Setup test environment
    console.log('\n🔧 Setting up test environment...');
    await setupTestEnvironment();
    
    // Run individual performance tests
    console.log('\n🏃 Running performance tests...\n');
    
    // Test 1: Tenant isolation query performance
    totalTests++;
    if (await testTenantIsolationPerformance()) {
      passedTests++;
      console.log('✅ Tenant isolation query performance test PASSED');
    } else {
      console.log('❌ Tenant isolation query performance test FAILED');
    }
    
    // Test 2: User lookup performance  
    totalTests++;
    if (await testUserLookupPerformance()) {
      passedTests++;
      console.log('✅ User lookup performance test PASSED');
    } else {
      console.log('❌ User lookup performance test FAILED');
    }
    
    // Test 3: Role/permission query performance
    totalTests++;
    if (await testRolePermissionPerformance()) {
      passedTests++;
      console.log('✅ Role/permission query performance test PASSED');
    } else {
      console.log('❌ Role/permission query performance test FAILED');
    }
    
    // Test 4: Composite query performance
    totalTests++;
    if (await testCompositeQueryPerformance()) {
      passedTests++;
      console.log('✅ Composite query performance test PASSED');
    } else {
      console.log('❌ Composite query performance test FAILED');
    }
    
    // Test 5: Bulk operation performance
    totalTests++;
    if (await testBulkOperationPerformance()) {
      passedTests++;
      console.log('✅ Bulk operation performance test PASSED');
    } else {
      console.log('❌ Bulk operation performance test FAILED');
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test environment...');
    await cleanupTestEnvironment();
    
  } catch (error) {
    console.error('💥 Performance test suite failed:', error.message);
    await cleanupTestEnvironment();
    process.exit(1);
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Test results summary
  console.log('\n📊 PERFORMANCE TEST RESULTS SUMMARY');
  console.log('=====================================');
  console.log(`📋 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`⏱️ Total Time: ${totalTime}ms`);
  console.log(`📈 Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL PERFORMANCE TESTS PASSED!');
    console.log('🚀 Ready to implement database indexing optimizations');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some performance tests failed');
    console.log('🔧 Indexing implementation required to meet targets');
    process.exit(1);
  }
}

/**
 * 🛠️ Setup Test Environment
 */
async function setupTestEnvironment() {
  try {
    // Create test tenant
    testTenantId = await createTestTenant('performance_test_tenant');
    
    // Create test user
    const client = await connectToDatabase();
    const userResult = await client.query(
      `INSERT INTO tenant_users (tenant_id, email, first_name, last_name, status, profile_data) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [testTenantId, 'test@example.com', 'Test', 'User', 'active', JSON.stringify({test: true})]
    );
    testUserId = userResult.rows[0].id;
    
    // Create test role
    const roleResult = await client.query(
      `INSERT INTO user_roles (tenant_id, role_name, role_description) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [testTenantId, 'test_role', 'Performance Test Role']
    );
    testRoleId = roleResult.rows[0].id;
    
    // Assign role to user
    await client.query(
      `INSERT INTO user_role_assignments (user_id, role_id) 
       VALUES ($1, $2)`,
      [testUserId, testRoleId]
    );
    
    // Add permissions to role
    await client.query(
      `INSERT INTO role_permissions (role_id, permission_name) 
       VALUES ($1, $2), ($1, $3)`,
      [testRoleId, 'read:test', 'write:test']
    );
    
    await client.end();
    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Test environment setup failed:', error.message);
    throw error;
  }
}

/**
 * 🧹 Cleanup Test Environment
 */
async function cleanupTestEnvironment() {
  try {
    if (testTenantId) {
      await cleanupTestTenant(testTenantId);
    }
    console.log('✅ Test environment cleanup complete');
  } catch (error) {
    console.error('❌ Test environment cleanup failed:', error.message);
  }
}

/**
 * 🧪 Test 1: Tenant Isolation Query Performance
 */
async function testTenantIsolationPerformance() {
  try {
    const client = await connectToDatabase();
    const startTime = Date.now();
    
    // Execute tenant isolation query multiple times
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      await client.query(
        `SELECT u.id, u.email, u.first_name, u.last_name 
         FROM tenant_users u 
         WHERE u.tenant_id = $1 AND u.status = 'active'`,
        [testTenantId]
      );
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / TEST_ITERATIONS;
    
    await client.end();
    
    console.log(`   Tenant isolation avg query time: ${avgTime.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.tenant_isolation}ms)`);
    
    return avgTime < PERFORMANCE_TARGETS.tenant_isolation;
  } catch (error) {
    console.error('   Tenant isolation test error:', error.message);
    return false;
  }
}

/**
 * 🧪 Test 2: User Lookup Performance
 */
async function testUserLookupPerformance() {
  try {
    const client = await connectToDatabase();
    const startTime = Date.now();
    
    // Execute user lookup query multiple times
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      await client.query(
        `SELECT id, email, first_name, last_name, status, profile_data, created_at 
         FROM tenant_users 
         WHERE tenant_id = $1 AND email = $2`,
        [testTenantId, 'test@example.com']
      );
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / TEST_ITERATIONS;
    
    await client.end();
    
    console.log(`   User lookup avg query time: ${avgTime.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.user_lookup}ms)`);
    
    return avgTime < PERFORMANCE_TARGETS.user_lookup;
  } catch (error) {
    console.error('   User lookup test error:', error.message);
    return false;
  }
}

/**
 * 🧪 Test 3: Role/Permission Query Performance
 */
async function testRolePermissionPerformance() {
  try {
    const client = await connectToDatabase();
    const startTime = Date.now();
    
    // Execute role/permission query multiple times
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      await client.query(
        `SELECT r.role_name, p.permission_name 
         FROM user_roles r
         JOIN role_permissions p ON r.id = p.role_id
         JOIN user_role_assignments a ON r.id = a.role_id
         WHERE a.user_id = $1`,
        [testUserId]
      );
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / TEST_ITERATIONS;
    
    await client.end();
    
    console.log(`   Role/permission avg query time: ${avgTime.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.role_permission}ms)`);
    
    return avgTime < PERFORMANCE_TARGETS.role_permission;
  } catch (error) {
    console.error('   Role/permission test error:', error.message);
    return false;
  }
}

/**
 * 🧪 Test 4: Composite Query Performance
 */
async function testCompositeQueryPerformance() {
  try {
    const client = await connectToDatabase();
    const startTime = Date.now();
    
    // Execute complex composite query multiple times
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      await client.query(
        `SELECT 
           u.id, u.email, u.first_name, u.last_name,
           r.role_name,
           array_agg(p.permission_name) as permissions
         FROM tenant_users u
         LEFT JOIN user_role_assignments a ON u.id = a.user_id
         LEFT JOIN user_roles r ON a.role_id = r.id
         LEFT JOIN role_permissions p ON r.id = p.role_id
         WHERE u.tenant_id = $1 AND u.status = 'active'
         GROUP BY u.id, r.role_name
         ORDER BY u.created_at DESC
         LIMIT 10`,
        [testTenantId]
      );
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / TEST_ITERATIONS;
    
    await client.end();
    
    console.log(`   Composite query avg time: ${avgTime.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.max_query_time}ms)`);
    
    return avgTime < PERFORMANCE_TARGETS.max_query_time;
  } catch (error) {
    console.error('   Composite query test error:', error.message);
    return false;
  }
}

/**
 * 🧪 Test 5: Bulk Operation Performance
 */
async function testBulkOperationPerformance() {
  try {
    const client = await connectToDatabase();
    const startTime = Date.now();
    
    // Execute bulk insert operation
    await client.query('BEGIN');
    
    const bulkInsertQuery = `
      INSERT INTO tenant_users (tenant_id, email, first_name, last_name, status, profile_data)
      VALUES `;
    
    const values = [];
    const placeholders = [];
    
    for (let i = 0; i < 50; i++) {
      values.push(testTenantId, `bulk${i}@test.com`, `First${i}`, `Last${i}`, 'active', JSON.stringify({bulk: true, index: i}));
      placeholders.push(`($${values.length - 5}, $${values.length - 4}, $${values.length - 3}, $${values.length - 2}, $${values.length - 1}, $${values.length})`);
    }
    
    const finalQuery = bulkInsertQuery + placeholders.join(', ');
    await client.query(finalQuery, values);
    
    await client.query('COMMIT');
    
    const endTime = Date.now();
    const operationTime = endTime - startTime;
    
    await client.end();
    
    console.log(`   Bulk operation time: ${operationTime}ms (target: <500ms)`);
    
    return operationTime < 500;
  } catch (error) {
    console.error('   Bulk operation test error:', error.message);
    return false;
  }
}

// Run the performance tests
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

module.exports = {
  runPerformanceTests,
  setupTestEnvironment,
  cleanupTestEnvironment,
  testTenantIsolationPerformance,
  testUserLookupPerformance,
  testRolePermissionPerformance,
  testCompositeQueryPerformance,
  testBulkOperationPerformance
};
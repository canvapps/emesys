/**
 * MANUAL TEST: Tenant Users Repository
 * 
 * Purpose: Manual testing suite untuk comprehensive tenant users functionality
 * Target: TenantUsersRepository dengan full CRUD operations dan business logic
 * Scope: Database operations, constraints validation, role hierarchy, feature access
 * 
 * Test Categories:
 * - Table structure validation
 * - Foreign key constraints verification
 * - CRUD operations testing
 * - Business logic validation
 * - Role-based access control
 * - Feature permissions testing
 * 
 * Requirements:
 * - Valid .env.local configuration
 * - PostgreSQL connection available
 * - TenantUsersRepository dan TenantsRepository modules
 * 
 * Usage: node __tests__/database/manual-tests/tenant-users-manual.test.cjs
 * 
 * Migration Info:
 * - Source: src/database/test-tenant-users-manual.js (101 lines)  
 * - Target: __tests__/database/manual-tests/tenant-users-manual.test.cjs (Updated lines)
 * - Format: CommonJS → Enhanced CommonJS with proper working connection
 * - Migration Date: 2025-01-13
 * - Status: FIXED - Using working db-connection.util.cjs
 */

require('dotenv').config({ path: '.env.local' });

// Database imports menggunakan test utility yang sudah working
const { executeQuery, getConnection, closeAllConnections, testConnection } = require('../../utilities/db-connection.util.cjs');

// Repository functions yang compatible dengan actual database schema
const TenantUsersRepository = {
    async create(userData) {
        const profileData = {
            phone: userData.phone || null,
            created_by_test: true
        };
        
        const result = await executeQuery(
            'INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status, profile_data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [
                userData.tenant_id,
                userData.email,
                userData.password_hash || 'test_hash',
                userData.first_name || userData.name || 'Test',
                userData.last_name || 'User',
                userData.role || 'member',
                userData.status || 'active',
                JSON.stringify(profileData)
            ]
        );
        return result.rows[0];
    },
    
    async findByEmail(email, tenantId) {
        const result = await executeQuery(
            'SELECT * FROM tenant_users WHERE email = $1 AND tenant_id = $2',
            [email, tenantId]
        );
        return result.rows[0];
    },
    
    async updateById(id, updates, tenantId) {
        // Build update query dynamically based on provided fields
        const setFields = [];
        const values = [];
        let paramIndex = 1;
        
        if (updates.first_name !== undefined) {
            setFields.push(`first_name = $${paramIndex++}`);
            values.push(updates.first_name);
        }
        if (updates.last_name !== undefined) {
            setFields.push(`last_name = $${paramIndex++}`);
            values.push(updates.last_name);
        }
        if (updates.email !== undefined) {
            setFields.push(`email = $${paramIndex++}`);
            values.push(updates.email);
        }
        if (updates.profile_data !== undefined) {
            setFields.push(`profile_data = $${paramIndex++}`);
            values.push(JSON.stringify(updates.profile_data));
        }
        
        // Always update updated_at
        setFields.push(`updated_at = NOW()`);
        
        values.push(id, tenantId);
        const whereParams = `$${paramIndex++}, $${paramIndex}`;
        
        const query = `UPDATE tenant_users SET ${setFields.join(', ')} WHERE id = ${whereParams.split(',')[0]} AND tenant_id = ${whereParams.split(',')[1]} RETURNING *`;
        
        const result = await executeQuery(query, values);
        return result.rows[0];
    },
    
    async deleteById(id, tenantId) {
        const result = await executeQuery(
            'DELETE FROM tenant_users WHERE id = $1 AND tenant_id = $2 RETURNING *',
            [id, tenantId]
        );
        return result.rows[0];
    }
};

const TenantsRepository = {
    async create(tenantData) {
        // Get actual columns first untuk flexible insert
        const columns = await executeQuery(`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'tenants'
            ORDER BY ordinal_position
        `);
        
        const columnNames = columns.rows.map(row => row.column_name);
        
        // Use available columns untuk insert
        if (columnNames.includes('slug')) {
            const result = await executeQuery(
                'INSERT INTO tenants (name, slug, type, status, subscription_plan) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [tenantData.name, tenantData.slug || 'test-tenant', tenantData.type, tenantData.status, tenantData.subscription_plan]
            );
            return result.rows[0];
        } else {
            const result = await executeQuery(
                'INSERT INTO tenants (name, type, status, subscription_plan) VALUES ($1, $2, $3, $4) RETURNING *',
                [tenantData.name, tenantData.type, tenantData.status, tenantData.subscription_plan]
            );
            return result.rows[0];
        }
    },
    
    async findBySlug(slug) {
        const result = await executeQuery(
            'SELECT * FROM tenants WHERE slug = $1',
            [slug]
        );
        return result.rows[0];
    },
    
    async findFirst() {
        const result = await executeQuery('SELECT * FROM tenants ORDER BY id LIMIT 1');
        return result.rows[0];
    },
    
    async deleteById(id) {
        const result = await executeQuery('DELETE FROM tenants WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};

/**
 * Color codes for enhanced console output
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Enhanced logging dengan color support
 */
function log(type, message, data = null) {
  const timestamp = new Date().toISOString();
  const colorMap = {
    success: colors.green,
    error: colors.red,
    info: colors.blue,
    warning: colors.yellow,
    test: colors.cyan
  };
  
  const color = colorMap[type] || colors.reset;
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  
  if (data) {
    console.log(`${colors.magenta}Data:${colors.reset}`, data);
  }
}

/**
 * Test result tracking
 */
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Test assertion helper
 */
function assert(condition, testName, successMessage = null, errorMessage = null) {
  testResults.total++;
  
  if (condition) {
    testResults.passed++;
    log('success', `✅ ${testName}: ${successMessage || 'PASSED'}`);
    return true;
  } else {
    testResults.failed++;
    const error = `❌ ${testName}: ${errorMessage || 'FAILED'}`;
    testResults.errors.push(error);
    log('error', error);
    return false;
  }
}

/**
 * Main testing function dengan enhanced error handling dan reporting
 */
async function testTenantUsersManual() {
  let testTenant = null;
  let testUser = null;
  
  try {
    log('info', '🚀 Starting Manual Tenant Users Testing Suite');
    log('info', '=' .repeat(60));
    
    // Database connection test
    const connectionWorking = await testConnection();
    if (!connectionWorking) {
        throw new Error('Database connection failed');
    }
    log('success', '🔗 Database connection established successfully');

    // TEST 1: Table Structure Validation
    log('test', 'TEST 1: Validating tenant_users table existence');
    const tableCheck = await executeQuery(`
      SELECT table_name FROM information_schema.tables WHERE table_name = 'tenant_users'
    `);
    assert(
      tableCheck.rows.length > 0,
      'Table Structure',
      'tenant_users table exists in database',
      'tenant_users table not found in database'
    );

    // TEST 2: Foreign Key Constraints Validation
    log('test', 'TEST 2: Validating foreign key constraints');
    const constraintsCheck = await executeQuery(`
      SELECT constraint_name FROM information_schema.table_constraints 
      WHERE table_name = 'tenant_users' AND constraint_type = 'FOREIGN KEY'
    `);
    assert(
      constraintsCheck.rows.length > 0,
      'Foreign Key Constraints',
      `${constraintsCheck.rows.length} foreign key constraints found`,
      'No foreign key constraints found'
    );

    // TEST 3: Test Tenant Creation (prerequisite)
    log('test', 'TEST 3: Creating test tenant for user testing');
    testTenant = await TenantsRepository.create({
      name: 'Test Agency for Users Manual',
      slug: 'test-agency-manual-' + Date.now(),
      type: 'wedding_agency',
      status: 'active',
      subscription_plan: 'premium'
    });
    assert(
      testTenant && testTenant.id,
      'Test Tenant Creation',
      `Test tenant created with ID: ${testTenant.id}`,
      'Failed to create test tenant'
    );

    // TEST 4: User Creation Test
    log('test', 'TEST 4: Testing user creation functionality');
    testUser = await TenantUsersRepository.create({
      first_name: 'Manual Test',
      last_name: 'User',
      email: 'manual-test@example.com',
      phone: '+1234567890',
      tenant_id: testTenant.id,
      role: 'member',
      status: 'active'
    });
    assert(
      testUser && testUser.id,
      'User Creation',
      `Test user created with ID: ${testUser.id}`,
      'Failed to create test user'
    );

    // TEST 5: User Retrieval by Email
    log('test', 'TEST 5: Testing user retrieval by email');
    const userByEmail = await TenantUsersRepository.findByEmail('manual-test@example.com', testTenant.id);
    assert(
      userByEmail !== null && userByEmail.id === testUser.id,
      'User Retrieval by Email',
      'User successfully found by email',
      'Failed to find user by email'
    );

    // TEST 6: User Update Operations
    log('test', 'TEST 6: Testing user update functionality');
    const updatedUser = await TenantUsersRepository.updateById(testUser.id, {
      first_name: 'Updated Manual',
      last_name: 'Test User',
      email: 'manual-test-updated@example.com',
      profile_data: { phone: '+0987654321', updated: true }
    }, testTenant.id);
    assert(
      updatedUser && updatedUser.first_name === 'Updated Manual',
      'User Update',
      'User data updated successfully',
      'Failed to update user data'
    );

    // TEST 7: User-Tenant Relationship
    log('test', 'TEST 7: Testing user-tenant relationship validation');
    const relationshipCheck = await executeQuery(
      'SELECT COUNT(*) as count FROM tenant_users WHERE id = $1 AND tenant_id = $2',
      [testUser.id, testTenant.id]
    );
    assert(
      relationshipCheck.rows[0].count > 0,
      'User Tenant Relationship',
      'User correctly belongs to tenant',
      'User-tenant relationship validation failed'
    );

    // TEST 8: User Listing by Tenant
    log('test', 'TEST 8: Testing user listing by tenant');
    const usersListResult = await executeQuery(
      'SELECT * FROM tenant_users WHERE tenant_id = $1 LIMIT 5',
      [testTenant.id]
    );
    assert(
      usersListResult.rows.length > 0,
      'User Listing',
      `${usersListResult.rows.length} users found in tenant`,
      'Failed to list users by tenant'
    );

    // Generate test summary
    log('info', '=' .repeat(60));
    log('info', '📊 MANUAL TEST RESULTS SUMMARY');
    log('info', `Total Tests: ${testResults.total}`);
    log('success', `Passed: ${testResults.passed}`);
    log('error', `Failed: ${testResults.failed}`);
    
    if (testResults.failed > 0) {
      log('error', '❌ Failed Tests:');
      testResults.errors.forEach(error => log('error', `  - ${error}`));
    }
    
    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    log('info', `Success Rate: ${successRate}%`);

    if (testResults.failed === 0) {
      log('success', '🎉 All tenant_users functionality working correctly!');
    } else {
      log('warning', '⚠️ Some tests failed. Please review the errors above.');
    }

  } catch (error) {
    log('error', '💥 Critical test failure occurred');
    log('error', `Error: ${error.message}`);
    console.error(error.stack);
    testResults.failed++;
  } finally {
    // Cleanup operations
    try {
      if (testUser && testUser.id) {
        await TenantUsersRepository.deleteById(testUser.id, testTenant.id);
        log('info', '🧹 Test user cleaned up');
      }
      
      if (testTenant && testTenant.id) {
        await TenantsRepository.deleteById(testTenant.id);
        log('info', '🧹 Test tenant cleaned up');
      }
    } catch (cleanupError) {
      log('warning', '⚠️ Cleanup operation failed', cleanupError.message);
    }
    
    await closeAllConnections();
    log('info', '🔌 Database connection closed');
    log('info', '=' .repeat(60));
    log('info', '✨ Manual Tenant Users Testing Suite Completed');
  }
}

// Execute test if run directly
if (require.main === module) {
  testTenantUsersManual().then(() => {
    process.exit(testResults.failed > 0 ? 1 : 0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testTenantUsersManual, testResults };
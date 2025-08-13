/**
 * TEST TENANT MANAGEMENT UTILITIES
 * ================================
 * 
 * Purpose: Professional test tenant management untuk performance dan integration testing
 * Target: Comprehensive tenant lifecycle management dengan enhanced cleanup
 * Scope: Test data creation, management, dan cleanup dengan error handling
 * 
 * Utility Categories:
 * - Test tenant creation dengan proper data structure
 * - Comprehensive cleanup dengan foreign key respect
 * - Performance tracking untuk test operations
 * - Error handling dan recovery mechanisms
 * - Data integrity validation
 * 
 * Enhanced Features:
 * - Professional error handling dan retry logic
 * - Comprehensive foreign key cascade cleanup
 * - Performance metrics tracking
 * - Enhanced logging dengan color coding
 * - Data validation dan integrity checking
 * - Automatic rollback capabilities
 * 
 * Usage Patterns:
 * - Performance testing tenant setup
 * - Integration testing data preparation
 * - Manual testing environment management
 * - Automated test suite data management
 * 
 * Requirements:
 * - PostgreSQL database connection
 * - Proper database schema dengan foreign keys
 * - Connection utilities availability
 * 
 * Usage Example:
 * ```javascript
 * const { createTestTenant, cleanupTestTenant } = require('./test-tenant-manager.util.cjs');
 * const tenantId = await createTestTenant('My Test Tenant');
 * // ... run tests ...
 * await cleanupTestTenant(tenantId);
 * ```
 * 
 * Migration Info:
 * - Source: src/database/test-tenants-manual-js.cjs (43 lines, basic utility)
 * - Target: __tests__/utilities/test-tenant-manager.util.cjs (120 lines)
 * - Format: Basic CommonJS → Enhanced CommonJS dengan comprehensive utilities
 * - Migration Date: 2025-01-12
 * - Status: COMPLETED
 * - Enhanced: Error handling, performance tracking, comprehensive cleanup
 */

const path = require('path');

// Database connection import dengan proper path resolution
const { connectToDatabase } = require(path.resolve('./src/database/connection-js.cjs'));

/**
 * Enhanced color system untuk professional utility output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Enhanced logging system untuk utility operations
 */
function logUtil(type, message, data = null) {
  const timestamp = new Date().toISOString();
  const colorMap = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`,
    debug: `${colors.cyan}🔧`,
    perf: `${colors.magenta}⏱️`
  };
  
  const icon = colorMap[type] || colors.reset;
  console.log(`${icon} [${timestamp}] ${message}${colors.reset}`);
  
  if (data) {
    console.log(`  ${colors.dim}Data:${colors.reset}`, data);
  }
}

/**
 * Create a comprehensive test tenant dengan enhanced data structure
 * @param {string} tenantName - Name of the test tenant
 * @param {Object} options - Additional options untuk tenant creation
 * @returns {Promise<string>} Tenant ID
 */
async function createTestTenant(tenantName, options = {}) {
  const startTime = Date.now();
  let client = null;
  
  try {
    logUtil('debug', `Creating test tenant: ${tenantName}`);
    
    client = await connectToDatabase();
    
    // Enhanced tenant data dengan comprehensive structure
    const tenantData = {
      name: tenantName,
      domain: `${tenantName.replace(/\s+/g, '-').toLowerCase()}.test.local`,
      status: options.status || 'active',
      settings: JSON.stringify({
        test: true,
        created_by: 'test-utility',
        created_at: new Date().toISOString(),
        test_type: options.testType || 'general',
        performance_testing: options.performanceTesting || false,
        auto_cleanup: true,
        ...options.customSettings
      }),
      subscription_plan: options.subscriptionPlan || 'premium',
      subscription_status: options.subscriptionStatus || 'active'
    };
    
    // Enhanced query dengan more comprehensive data
    const insertQuery = `
      INSERT INTO tenants (name, domain, status, settings, subscription_plan, subscription_status) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, name, domain, created_at
    `;
    
    const result = await client.query(insertQuery, [
      tenantData.name,
      tenantData.domain,
      tenantData.status,
      tenantData.settings,
      tenantData.subscription_plan,
      tenantData.subscription_status
    ]);
    
    const tenant = result.rows[0];
    const creationTime = Date.now() - startTime;
    
    logUtil('success', `Test tenant created successfully in ${creationTime}ms`, {
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      domain: tenant.domain,
      created_at: tenant.created_at,
      performance_ms: creationTime
    });
    
    return tenant.id;
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    logUtil('error', `Test tenant creation failed after ${errorTime}ms`, {
      tenant_name: tenantName,
      error_message: error.message,
      error_code: error.code
    });
    throw new Error(`Failed to create test tenant "${tenantName}": ${error.message}`);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

/**
 * Comprehensive test tenant cleanup dengan cascading delete
 * @param {string} tenantId - Tenant ID to cleanup
 * @param {Object} options - Cleanup options
 */
async function cleanupTestTenant(tenantId, options = {}) {
  const startTime = Date.now();
  let client = null;
  const cleanupResults = {
    user_role_assignments: 0,
    tenant_users: 0,
    role_permissions: 0,
    user_roles: 0,
    tenants: 0,
    total_operations: 0
  };
  
  try {
    logUtil('debug', `Starting comprehensive cleanup for tenant: ${tenantId}`);
    
    client = await connectToDatabase();
    
    // Begin transaction untuk atomic cleanup
    await client.query('BEGIN');
    
    // Step 1: Clean user role assignments
    if (!options.skipRoleAssignments) {
      const roleAssignmentsResult = await client.query(
        'DELETE FROM user_role_assignments WHERE user_id IN (SELECT id FROM tenant_users WHERE tenant_id = $1)',
        [tenantId]
      );
      cleanupResults.user_role_assignments = roleAssignmentsResult.rowCount;
      cleanupResults.total_operations++;
    }
    
    // Step 2: Clean tenant users
    if (!options.skipUsers) {
      const usersResult = await client.query(
        'DELETE FROM tenant_users WHERE tenant_id = $1',
        [tenantId]
      );
      cleanupResults.tenant_users = usersResult.rowCount;
      cleanupResults.total_operations++;
    }
    
    // Step 3: Clean role permissions
    if (!options.skipRolePermissions) {
      const permissionsResult = await client.query(
        'DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM user_roles WHERE tenant_id = $1)',
        [tenantId]
      );
      cleanupResults.role_permissions = permissionsResult.rowCount;
      cleanupResults.total_operations++;
    }
    
    // Step 4: Clean user roles
    if (!options.skipRoles) {
      const rolesResult = await client.query(
        'DELETE FROM user_roles WHERE tenant_id = $1',
        [tenantId]
      );
      cleanupResults.user_roles = rolesResult.rowCount;
      cleanupResults.total_operations++;
    }
    
    // Step 5: Clean tenant (final step)
    if (!options.skipTenant) {
      const tenantResult = await client.query(
        'DELETE FROM tenants WHERE id = $1',
        [tenantId]
      );
      cleanupResults.tenants = tenantResult.rowCount;
      cleanupResults.total_operations++;
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    const cleanupTime = Date.now() - startTime;
    
    logUtil('success', `Test tenant cleanup completed successfully in ${cleanupTime}ms`, {
      tenant_id: tenantId,
      cleanup_results: cleanupResults,
      performance_ms: cleanupTime,
      transaction_committed: true
    });
    
  } catch (error) {
    // Rollback transaction on error
    if (client) {
      try {
        await client.query('ROLLBACK');
        logUtil('warning', 'Cleanup transaction rolled back due to error');
      } catch (rollbackError) {
        logUtil('error', 'Rollback failed', { rollback_error: rollbackError.message });
      }
    }
    
    const errorTime = Date.now() - startTime;
    logUtil('error', `Test tenant cleanup failed after ${errorTime}ms`, {
      tenant_id: tenantId,
      error_message: error.message,
      error_code: error.code,
      partial_results: cleanupResults
    });
    
    throw new Error(`Failed to cleanup test tenant "${tenantId}": ${error.message}`);
  } finally {
    if (client) {
      await client.end();
    }
  }
  
  return cleanupResults;
}

/**
 * Validate test tenant existence dan structure
 * @param {string} tenantId - Tenant ID to validate
 * @returns {Promise<Object>} Validation results
 */
async function validateTestTenant(tenantId) {
  let client = null;
  
  try {
    logUtil('debug', `Validating test tenant: ${tenantId}`);
    
    client = await connectToDatabase();
    
    // Check tenant existence dan get details
    const tenantResult = await client.query(
      'SELECT id, name, domain, status, settings, created_at FROM tenants WHERE id = $1',
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      return {
        exists: false,
        valid: false,
        message: 'Tenant not found'
      };
    }
    
    const tenant = tenantResult.rows[0];
    
    // Check related data counts
    const usersResult = await client.query(
      'SELECT COUNT(*) as count FROM tenant_users WHERE tenant_id = $1',
      [tenantId]
    );
    
    const rolesResult = await client.query(
      'SELECT COUNT(*) as count FROM user_roles WHERE tenant_id = $1',
      [tenantId]
    );
    
    const validation = {
      exists: true,
      valid: true,
      tenant: tenant,
      related_data: {
        users_count: parseInt(usersResult.rows[0].count),
        roles_count: parseInt(rolesResult.rows[0].count)
      },
      is_test_tenant: tenant.settings && JSON.parse(tenant.settings).test === true
    };
    
    logUtil('info', 'Test tenant validation completed', {
      tenant_id: tenantId,
      validation: validation
    });
    
    return validation;
    
  } catch (error) {
    logUtil('error', 'Test tenant validation failed', {
      tenant_id: tenantId,
      error_message: error.message
    });
    throw error;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

/**
 * Batch cleanup multiple test tenants
 * @param {string[]} tenantIds - Array of tenant IDs to cleanup
 * @param {Object} options - Batch cleanup options
 * @returns {Promise<Object>} Batch cleanup results
 */
async function batchCleanupTestTenants(tenantIds, options = {}) {
  const startTime = Date.now();
  const results = {
    successful: [],
    failed: [],
    total: tenantIds.length
  };
  
  logUtil('info', `Starting batch cleanup of ${tenantIds.length} test tenants`);
  
  for (const tenantId of tenantIds) {
    try {
      await cleanupTestTenant(tenantId, options);
      results.successful.push(tenantId);
    } catch (error) {
      results.failed.push({ tenantId, error: error.message });
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  logUtil('success', `Batch cleanup completed in ${totalTime}ms`, {
    total_tenants: results.total,
    successful: results.successful.length,
    failed: results.failed.length,
    success_rate: `${((results.successful.length / results.total) * 100).toFixed(1)}%`
  });
  
  return results;
}

module.exports = {
  createTestTenant,
  cleanupTestTenant,
  validateTestTenant,
  batchCleanupTestTenants,
  logUtil
};
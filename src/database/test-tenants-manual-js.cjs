const { connectToDatabase } = require('./connection-js.cjs');
const { Client } = require('pg');

/**
 * Create a test tenant for performance testing
 * @param {string} tenantName - Name of the test tenant
 * @returns {Promise<string>} Tenant ID
 */
async function createTestTenant(tenantName) {
  const client = await connectToDatabase();
  try {
    const result = await client.query(
      'INSERT INTO tenants (name, domain, status, settings) VALUES ($1, $2, $3, $4) RETURNING id',
      [tenantName, `${tenantName.replace(/\s+/g, '-').toLowerCase()}.test.local`, 'active', JSON.stringify({test: true})]
    );
    return result.rows[0].id;
  } finally {
    await client.end();
  }
}

/**
 * Cleanup test tenant and all associated data
 * @param {string} tenantId - Tenant ID to cleanup
 */
async function cleanupTestTenant(tenantId) {
  const client = await connectToDatabase();
  try {
    // Delete in proper order to respect foreign key constraints
    await client.query('DELETE FROM user_role_assignments WHERE user_id IN (SELECT id FROM tenant_users WHERE tenant_id = $1)', [tenantId]);
    await client.query('DELETE FROM tenant_users WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM user_roles WHERE tenant_id = $1)', [tenantId]);
    await client.query('DELETE FROM user_roles WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
  } finally {
    await client.end();
  }
}

module.exports = {
  createTestTenant,
  cleanupTestTenant
};
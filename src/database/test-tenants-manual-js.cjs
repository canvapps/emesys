/**
 * Test Tenant Management Module (Manual JS)
 * =========================================
 * 
 * Purpose: Tenant creation dan cleanup untuk performance/integration testing
 * Features: Manual tenant management dengan proper cleanup
 * Target: Support performance tests dan integration tests
 * 
 * Functions:
 * - createTestTenant: Create test tenant dengan unique domain
 * - cleanupTestTenant: Remove test tenant dan related data
 * - setupTestTenantData: Populate test tenant dengan sample data
 * - listTestTenants: List semua test tenants untuk debugging
 * 
 * Usage: const { createTestTenant, cleanupTestTenant } = require('./src/database/test-tenants-manual-js.cjs');
 */

const { connectToDatabase } = require('./connection-js.cjs');

// Test tenant tracking
const activeTenants = new Map();

/**
 * Generate unique domain name untuk test tenant
 */
function generateTestDomain(prefix = 'test') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}.local`;
}

/**
 * Create test tenant dengan comprehensive setup
 */
async function createTestTenant(prefix = 'integration', options = {}) {
    let client = null;
    
    try {
        const domain = generateTestDomain(prefix);
        const tenantName = options.name || `Test Tenant - ${prefix}`;
        const tenantType = options.type || 'business';
        
        console.log(`🏗️ Creating test tenant: ${domain}`);
        
        client = await connectToDatabase();
        
        // Create tenant dalam transaction
        await client.query('BEGIN');
        
        const tenantResult = await client.query(`
            INSERT INTO tenants (
                name, 
                domain, 
                type, 
                status, 
                settings, 
                created_at, 
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING id, name, domain
        `, [
            tenantName,
            domain,
            tenantType,
            'active',
            JSON.stringify({
                test: true,
                integration: true,
                prefix,
                created: new Date().toISOString(),
                ...options.settings
            })
        ]);
        
        const tenant = tenantResult.rows[0];
        
        // Setup default data jika diminta
        if (options.setupData !== false) {
            await setupDefaultTenantData(client, tenant.id, options);
        }
        
        await client.query('COMMIT');
        
        // Track active tenant untuk cleanup
        activeTenants.set(tenant.id, {
            id: tenant.id,
            domain: tenant.domain,
            name: tenant.name,
            createdAt: new Date(),
            prefix
        });
        
        console.log(`✅ Test tenant created successfully: ${tenant.name} (ID: ${tenant.id})`);
        console.log(`   Domain: ${tenant.domain}`);
        
        return tenant.id;
        
    } catch (error) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('❌ Rollback failed:', rollbackError.message);
            }
        }
        
        console.error('❌ Test tenant creation failed:', error.message);
        throw error;
    } finally {
        if (client) {
            try {
                client.release();
            } catch (releaseError) {
                console.warn('⚠️ Error releasing client:', releaseError.message);
            }
        }
    }
}

/**
 * Setup default data untuk test tenant
 */
async function setupDefaultTenantData(client, tenantId, options = {}) {
    try {
        console.log(`📊 Setting up default data for tenant ${tenantId}...`);
        
        // Create default admin user
        if (options.createAdmin !== false) {
            await client.query(`
                INSERT INTO tenant_users (
                    tenant_id,
                    email,
                    first_name,
                    last_name,
                    status,
                    role,
                    profile_data,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            `, [
                tenantId,
                options.adminEmail || `admin@${options.prefix || 'test'}.local`,
                'Test',
                'Admin',
                'active',
                'admin',
                JSON.stringify({
                    test: true,
                    role: 'admin',
                    permissions: ['read', 'write', 'admin']
                })
            ]);
        }
        
        // Create test roles
        if (options.createRoles !== false) {
            const roles = [
                { name: 'test_admin', description: 'Test Administrator' },
                { name: 'test_user', description: 'Test User' },
                { name: 'test_viewer', description: 'Test Viewer' }
            ];
            
            for (const role of roles) {
                await client.query(`
                    INSERT INTO user_roles (
                        tenant_id,
                        role_name,
                        role_description,
                        created_at,
                        updated_at
                    ) VALUES ($1, $2, $3, NOW(), NOW())
                `, [tenantId, role.name, role.description]);
            }
        }
        
        console.log('✅ Default tenant data setup completed');
        
    } catch (error) {
        console.error('❌ Default tenant data setup failed:', error.message);
        throw error;
    }
}

/**
 * Cleanup test tenant dan semua related data
 */
async function cleanupTestTenant(tenantId) {
    let client = null;
    
    try {
        console.log(`🧹 Cleaning up test tenant: ${tenantId}`);
        
        client = await connectToDatabase();
        await client.query('BEGIN');
        
        // Delete related data dalam urutan yang benar (foreign keys)
        const cleanupQueries = [
            // Role assignments
            'DELETE FROM user_role_assignments WHERE role_id IN (SELECT id FROM user_roles WHERE tenant_id = $1)',
            
            // Role permissions
            'DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM user_roles WHERE tenant_id = $1)',
            
            // User roles
            'DELETE FROM user_roles WHERE tenant_id = $1',
            
            // Event participants (if exists)
            'DELETE FROM event_participants WHERE event_id IN (SELECT id FROM events WHERE tenant_id = $1)',
            
            // Events (if exists)
            'DELETE FROM events WHERE tenant_id = $1',
            
            // Tenant users
            'DELETE FROM tenant_users WHERE tenant_id = $1',
            
            // Finally, tenant itself
            'DELETE FROM tenants WHERE id = $1'
        ];
        
        for (const query of cleanupQueries) {
            try {
                const result = await client.query(query, [tenantId]);
                if (result.rowCount > 0) {
                    console.log(`   ✅ Cleaned: ${result.rowCount} records from ${query.split(' ')[2]}`);
                }
            } catch (error) {
                // Some tables might not exist, that's OK
                if (!error.message.includes('relation') && !error.message.includes('does not exist')) {
                    console.warn(`   ⚠️ Cleanup warning for ${query.split(' ')[2]}: ${error.message}`);
                }
            }
        }
        
        await client.query('COMMIT');
        
        // Remove from tracking
        if (activeTenants.has(tenantId)) {
            const tenant = activeTenants.get(tenantId);
            activeTenants.delete(tenantId);
            console.log(`✅ Test tenant cleanup completed: ${tenant.domain}`);
        } else {
            console.log(`✅ Test tenant cleanup completed: ${tenantId}`);
        }
        
        return true;
        
    } catch (error) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('❌ Cleanup rollback failed:', rollbackError.message);
            }
        }
        
        console.error('❌ Test tenant cleanup failed:', error.message);
        return false;
    } finally {
        if (client) {
            try {
                client.release();
            } catch (releaseError) {
                console.warn('⚠️ Error releasing cleanup client:', releaseError.message);
            }
        }
    }
}

/**
 * Cleanup semua active test tenants
 */
async function cleanupAllTestTenants() {
    console.log(`🧹 Cleaning up ${activeTenants.size} active test tenants...`);
    
    const cleanupPromises = Array.from(activeTenants.keys()).map(async (tenantId) => {
        try {
            await cleanupTestTenant(tenantId);
            return { tenantId, success: true };
        } catch (error) {
            console.error(`❌ Failed to cleanup tenant ${tenantId}:`, error.message);
            return { tenantId, success: false, error: error.message };
        }
    });
    
    const results = await Promise.all(cleanupPromises);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Test tenant cleanup completed: ${successful} successful, ${failed} failed`);
    
    return { successful, failed, total: results.length };
}

/**
 * List semua active test tenants untuk debugging
 */
function listActiveTenants() {
    console.log(`📋 Active test tenants: ${activeTenants.size}`);
    
    for (const [tenantId, info] of activeTenants) {
        const age = Math.floor((Date.now() - info.createdAt.getTime()) / 1000);
        console.log(`   - ${info.name} (${info.domain})`);
        console.log(`     ID: ${tenantId}, Age: ${age}s, Prefix: ${info.prefix}`);
    }
    
    return Array.from(activeTenants.entries());
}

/**
 * Get test tenant information
 */
async function getTestTenantInfo(tenantId) {
    let client = null;
    
    try {
        client = await connectToDatabase();
        
        const tenantResult = await client.query(`
            SELECT 
                t.id,
                t.name,
                t.domain,
                t.type,
                t.status,
                t.settings,
                t.created_at,
                COUNT(u.id) as user_count
            FROM tenants t
            LEFT JOIN tenant_users u ON t.id = u.tenant_id
            WHERE t.id = $1
            GROUP BY t.id, t.name, t.domain, t.type, t.status, t.settings, t.created_at
        `, [tenantId]);
        
        if (tenantResult.rows.length === 0) {
            return null;
        }
        
        const tenant = tenantResult.rows[0];
        
        // Check if it's a test tenant
        const settings = typeof tenant.settings === 'string' 
            ? JSON.parse(tenant.settings) 
            : tenant.settings;
            
        return {
            ...tenant,
            isTest: settings?.test === true,
            users: parseInt(tenant.user_count),
            settings
        };
        
    } catch (error) {
        console.error('❌ Failed to get tenant info:', error.message);
        return null;
    } finally {
        if (client) {
            try {
                client.release();
            } catch (releaseError) {
                console.warn('⚠️ Error releasing client:', releaseError.message);
            }
        }
    }
}

/**
 * Bulk create test tenants untuk load testing
 */
async function createBulkTestTenants(count = 5, prefix = 'bulk') {
    console.log(`🏭 Creating ${count} bulk test tenants...`);
    
    const promises = [];
    for (let i = 0; i < count; i++) {
        promises.push(createTestTenant(`${prefix}-${i}`, {
            name: `Bulk Test Tenant ${i + 1}`,
            setupData: false, // Skip default data untuk speed
        }));
    }
    
    try {
        const tenantIds = await Promise.all(promises);
        console.log(`✅ Bulk test tenants created: ${tenantIds.length}`);
        return tenantIds;
    } catch (error) {
        console.error('❌ Bulk tenant creation failed:', error.message);
        throw error;
    }
}

module.exports = {
    createTestTenant,
    cleanupTestTenant,
    cleanupAllTestTenants,
    listActiveTenants,
    getTestTenantInfo,
    createBulkTestTenants,
    setupDefaultTenantData,
    generateTestDomain
};
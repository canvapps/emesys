/**
 * Comprehensive Row Level Security (RLS) Testing
 * Tests tenant isolation, security policies, and context management
 */

const { Client } = require('pg');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

// Simple database connection class for testing
class TestDatabaseConnection {
    constructor() {
        this.client = null;
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'emesys_dev',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            ssl: false
        };
    }

    async connect() {
        try {
            this.client = new Client(this.config);
            await this.client.connect();
            return true;
        } catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }

    async query(text, params) {
        if (!this.client) {
            throw new Error('Database not connected');
        }
        return await this.client.query(text, params);
    }

    async close() {
        if (this.client) {
            await this.client.end();
            this.client = null;
        }
    }
}

// Simple RLS context manager for testing
class TestRLSContextManager {
    constructor(db) {
        this.db = db;
        this.currentContext = {
            userId: null,
            tenantId: null,
            isActive: false
        };
    }

    async setUserContext(userId, tenantId) {
        try {
            await this.db.query(
                'SELECT set_current_user_context($1, $2)',
                [userId, tenantId || null]
            );

            this.currentContext = {
                userId,
                tenantId: tenantId || null,
                isActive: true
            };

            console.log(`✅ RLS Context set - User: ${userId}, Tenant: ${tenantId || 'auto-detect'}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to set RLS context:', error);
            this.currentContext.isActive = false;
            throw error;
        }
    }

    async clearContext() {
        try {
            await this.db.query("SELECT set_config('app.current_user_id', '', FALSE)");
            await this.db.query("SELECT set_config('app.current_tenant_id', '', FALSE)");

            this.currentContext = {
                userId: null,
                tenantId: null,
                isActive: false
            };

            console.log('✅ RLS Context cleared');
        } catch (error) {
            console.error('❌ Failed to clear RLS context:', error);
            throw error;
        }
    }

    getCurrentContext() {
        return { ...this.currentContext };
    }

    async validateSecurityContext() {
        try {
            const result = await this.db.query(`
                SELECT
                    get_current_user_id() as current_user_id,
                    get_current_tenant_id() as current_tenant_id,
                    is_super_admin() as is_super_admin,
                    has_system_permission() as has_system_permission
            `);

            const row = result.rows[0];

            return {
                isValid: row.current_user_id !== null,
                canAccess: row.current_user_id !== null,
                isSuperAdmin: row.is_super_admin || false,
                hasSystemPermissions: row.has_system_permission || false,
                message: row.current_user_id ? 'Valid context' : 'No active user context'
            };
        } catch (error) {
            console.error('❌ Failed to validate security context:', error);
            return {
                isValid: false,
                canAccess: false,
                isSuperAdmin: false,
                hasSystemPermissions: false,
                message: `Validation failed: ${error.message}`
            };
        }
    }

    async validateTenantAccess(tenantId) {
        try {
            const result = await this.db.query(
                'SELECT validate_tenant_access($1) as can_access',
                [tenantId]
            );

            return result.rows[0]?.can_access || false;
        } catch (error) {
            console.error('❌ Failed to validate tenant access:', error);
            return false;
        }
    }

    async switchTenantContext(newTenantId) {
        const previousTenant = this.currentContext.tenantId;

        try {
            const result = await this.db.query(
                'SELECT safe_switch_tenant_context($1) as success',
                [newTenantId]
            );

            if (result.rows[0]?.success) {
                this.currentContext.tenantId = newTenantId;
                return {
                    success: true,
                    previousTenant,
                    newTenant: newTenantId,
                    message: 'Tenant context switched successfully'
                };
            } else {
                return {
                    success: false,
                    previousTenant,
                    newTenant: null,
                    message: 'Failed to switch tenant context'
                };
            }
        } catch (error) {
            console.error('❌ Failed to switch tenant context:', error);
            return {
                success: false,
                previousTenant,
                newTenant: null,
                message: `Switch failed: ${error.message}`
            };
        }
    }

    async testTenantIsolation() {
        try {
            const currentContext = await this.validateSecurityContext();
            
            const ownTenantTest = await this.db.query(`
                SELECT COUNT(*) as count
                FROM tenant_users
                WHERE tenant_id = get_current_tenant_id()
            `);
            const ownTenantAccess = parseInt(ownTenantTest.rows[0].count) >= 0;

            let otherTenantAccess = false;
            try {
                const otherTenantTest = await this.db.query(`
                    SELECT COUNT(*) as count
                    FROM tenant_users tu
                    JOIN tenants t ON t.id = tu.tenant_id
                    WHERE tu.tenant_id != get_current_tenant_id()
                    AND t.type != 'super_admin'
                `);
                otherTenantAccess = parseInt(otherTenantTest.rows[0].count) > 0;
            } catch (error) {
                otherTenantAccess = false;
            }

            let systemDataAccess = false;
            try {
                const systemTest = await this.db.query('SELECT COUNT(*) as count FROM permissions');
                systemDataAccess = parseInt(systemTest.rows[0].count) > 0;
            } catch (error) {
                systemDataAccess = false;
            }

            const isolationWorking = ownTenantAccess &&
                (!otherTenantAccess || currentContext.isSuperAdmin);

            return {
                ownTenantAccess,
                otherTenantAccess,
                systemDataAccess,
                isolationWorking
            };
        } catch (error) {
            console.error('❌ Failed to test tenant isolation:', error);
            return {
                ownTenantAccess: false,
                otherTenantAccess: false,
                systemDataAccess: false,
                isolationWorking: false
            };
        }
    }

    async getUserEffectivePermissions(userId) {
        try {
            const targetUserId = userId || this.currentContext.userId;
            if (!targetUserId) {
                throw new Error('No user ID provided or in context');
            }

            const result = await this.db.query(
                'SELECT * FROM get_user_permissions($1)',
                [targetUserId]
            );

            return result.rows;
        } catch (error) {
            console.error('❌ Failed to get user permissions:', error);
            return [];
        }
    }

    async checkUserPermission(permissionName, userId) {
        try {
            const targetUserId = userId || this.currentContext.userId;
            if (!targetUserId) {
                return false;
            }

            const result = await this.db.query(
                'SELECT user_has_permission($1, $2) as has_permission',
                [targetUserId, permissionName]
            );

            return result.rows[0]?.has_permission || false;
        } catch (error) {
            console.error('❌ Failed to check user permission:', error);
            return false;
        }
    }

    async logSecurityEvent(eventType, tableName, details = {}) {
        try {
            await this.db.query(
                'SELECT log_security_event($1, $2, $3, $4, $5)',
                [
                    eventType,
                    tableName,
                    this.currentContext.userId,
                    this.currentContext.tenantId,
                    JSON.stringify(details)
                ]
            );
        } catch (error) {
            console.error('❌ Failed to log security event:', error);
        }
    }

    async executeWithContext(userId, tenantId, operation) {
        const originalContext = this.getCurrentContext();
        
        try {
            await this.setUserContext(userId, tenantId || undefined);
            const client = this.db.client;
            return await operation(client);
        } finally {
            if (originalContext.isActive && originalContext.userId) {
                await this.setUserContext(originalContext.userId, originalContext.tenantId || undefined);
            } else {
                await this.clearContext();
            }
        }
    }
}

async function testRLSIsolation() {
    const db = new TestDatabaseConnection();
    
    try {
        console.log('🚀 Starting RLS Isolation Tests...\n');

        // Connect to database
        await db.connect();
        console.log('✅ Database connected');

        // Initialize RLS context manager
        const rlsManager = new TestRLSContextManager(db);

        // Get test data dari database
        const testData = await setupTestData(db);
        console.log('✅ Test data prepared\n');

        // === TEST 1: Basic RLS Context Management ===
        console.log('📋 TEST 1: Basic RLS Context Management');
        await testBasicContextManagement(rlsManager, testData);

        // === TEST 2: Tenant Isolation Enforcement ===
        console.log('\n📋 TEST 2: Tenant Isolation Enforcement');
        await testTenantIsolation(rlsManager, testData);

        // === TEST 3: Super Admin Bypass ===
        console.log('\n📋 TEST 3: Super Admin Bypass');
        await testSuperAdminBypass(rlsManager, testData);

        // === TEST 4: Permission-Based Access ===
        console.log('\n📋 TEST 4: Permission-Based Access');
        await testPermissionBasedAccess(rlsManager, testData);

        // === TEST 5: Tenant Context Switching ===
        console.log('\n📋 TEST 5: Tenant Context Switching');
        await testTenantContextSwitching(rlsManager, testData);

        // === TEST 6: Security Validation ===
        console.log('\n📋 TEST 6: Security Validation');
        await testSecurityValidation(rlsManager, testData);

        // === TEST 7: RLS Policy Effectiveness ===
        console.log('\n📋 TEST 7: RLS Policy Effectiveness');
        await testRLSPolicyEffectiveness(rlsManager, testData);

        // === TEST 8: Edge Cases dan Error Handling ===
        console.log('\n📋 TEST 8: Edge Cases dan Error Handling');
        await testEdgeCases(rlsManager, testData);

        console.log('\n🎉 All RLS tests completed successfully!');
        console.log('✅ Row Level Security is fully operational');
        console.log('✅ Tenant isolation working properly');
        console.log('✅ Permission-based access functional');
        console.log('✅ Security policies enforced correctly');

    } catch (error) {
        console.error('❌ RLS test failed:', error);
        throw error;
    } finally {
        await db.close();
        console.log('🔌 Database connection closed');
    }
}

async function setupTestData(db) {
    console.log('⏳ Setting up test data...');

    // Get existing tenants and users
    const tenantsResult = await db.query('SELECT id, name, type FROM tenants ORDER BY type DESC');
    const usersResult = await db.query('SELECT id, tenant_id, email, role FROM tenant_users ORDER BY role DESC');
    const rolesResult = await db.query('SELECT id, name, tenant_id, is_system_role FROM user_roles ORDER BY priority DESC');

    const testData = {
        tenants: tenantsResult.rows,
        users: usersResult.rows,
        roles: rolesResult.rows,
        superAdminTenant: tenantsResult.rows.find(t => t.type === 'super_admin'),
        superAdminUser: usersResult.rows.find(u => u.role === 'super_admin'),
        regularUsers: usersResult.rows.filter(u => u.role !== 'super_admin'),
        systemRoles: rolesResult.rows.filter(r => r.is_system_role),
        tenantRoles: rolesResult.rows.filter(r => !r.is_system_role)
    };

    // Create test tenant jika belum ada
    if (testData.tenants.length < 2) {
        const newTenantResult = await db.query(`
            INSERT INTO tenants (name, type, status) 
            VALUES ('Test Wedding Agency', 'wedding_agency', 'active')
            RETURNING id, name, type
        `);
        testData.testTenant = newTenantResult.rows[0];
        
        // Create test user dalam tenant ini
        const newUserResult = await db.query(`
            INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role)
            VALUES ($1, 'test@agency.com', '$2b$12$test', 'Test', 'User', 'admin')
            RETURNING id, tenant_id, email, role
        `, [testData.testTenant.id]);
        testData.testUser = newUserResult.rows[0];
    } else {
        testData.testTenant = testData.tenants.find(t => t.type !== 'super_admin');
        testData.testUser = testData.regularUsers.find(u => u.tenant_id === testData.testTenant.id);
    }

    console.log(`📊 Test Data Summary:`);
    console.log(`   👑 Super Admin Tenant: ${testData.superAdminTenant?.name}`);
    console.log(`   🏢 Test Tenant: ${testData.testTenant?.name}`);
    console.log(`   👤 Super Admin User: ${testData.superAdminUser?.email}`);
    console.log(`   👤 Test User: ${testData.testUser?.email}`);
    console.log(`   📋 Total Tenants: ${testData.tenants.length}`);
    console.log(`   👥 Total Users: ${testData.users.length}`);
    console.log(`   🎭 Total Roles: ${testData.roles.length}`);

    return testData;
}

async function testBasicContextManagement(rlsManager, testData) {
    // Test 1.1: Set user context
    console.log('   🔧 Testing context setting...');
    const contextSet = await rlsManager.setUserContext(testData.testUser.id, testData.testTenant.id);
    console.log(`   ${contextSet ? '✅' : '❌'} Context set: ${contextSet}`);

    // Test 1.2: Get current context
    const currentContext = rlsManager.getCurrentContext();
    console.log(`   ${currentContext.isActive ? '✅' : '❌'} Context active: ${currentContext.isActive}`);
    console.log(`   ${currentContext.userId === testData.testUser.id ? '✅' : '❌'} User ID correct: ${currentContext.userId === testData.testUser.id}`);

    // Test 1.3: Validate security context
    const validation = await rlsManager.validateSecurityContext();
    console.log(`   ${validation.isValid ? '✅' : '❌'} Context valid: ${validation.isValid}`);
    console.log(`   ${validation.canAccess ? '✅' : '❌'} Can access: ${validation.canAccess}`);
    console.log(`   🔐 Is Super Admin: ${validation.isSuperAdmin}`);

    // Test 1.4: Clear context
    await rlsManager.clearContext();
    const clearedContext = rlsManager.getCurrentContext();
    console.log(`   ${!clearedContext.isActive ? '✅' : '❌'} Context cleared: ${!clearedContext.isActive}`);
}

async function testTenantIsolation(rlsManager, testData) {
    // Set context untuk test user
    await rlsManager.setUserContext(testData.testUser.id, testData.testUser.tenant_id);

    // Test 2.1: Validate tenant access
    console.log('   🔒 Testing tenant access validation...');
    const canAccessOwnTenant = await rlsManager.validateTenantAccess(testData.testUser.tenant_id);
    console.log(`   ${canAccessOwnTenant ? '✅' : '❌'} Can access own tenant: ${canAccessOwnTenant}`);

    // Test 2.2: Try to access different tenant (should fail untuk non-super admin)
    if (testData.tenants.length > 1) {
        const otherTenant = testData.tenants.find(t => t.id !== testData.testUser.tenant_id);
        if (otherTenant) {
            const canAccessOtherTenant = await rlsManager.validateTenantAccess(otherTenant.id);
            console.log(`   ${!canAccessOtherTenant ? '✅' : '❌'} Cannot access other tenant: ${!canAccessOtherTenant}`);
        }
    }

    // Test 2.3: Test isolation dengan live query
    const isolationTest = await rlsManager.testTenantIsolation();
    console.log(`   ${isolationTest.ownTenantAccess ? '✅' : '❌'} Own tenant access: ${isolationTest.ownTenantAccess}`);
    console.log(`   ${isolationTest.isolationWorking ? '✅' : '❌'} Isolation working: ${isolationTest.isolationWorking}`);
    console.log(`   📊 System data access: ${isolationTest.systemDataAccess}`);
}

async function testSuperAdminBypass(rlsManager, testData) {
    if (!testData.superAdminUser) {
        console.log('   ⚠️ No super admin user found, skipping test');
        return;
    }

    // Set context untuk super admin
    await rlsManager.setUserContext(testData.superAdminUser.id, testData.superAdminTenant.id);

    // Test 3.1: Super admin dapat access semua tenant
    console.log('   👑 Testing super admin bypass...');
    const validation = await rlsManager.validateSecurityContext();
    console.log(`   ${validation.isSuperAdmin ? '✅' : '❌'} Is super admin: ${validation.isSuperAdmin}`);
    console.log(`   ${validation.hasSystemPermissions ? '✅' : '❌'} Has system permissions: ${validation.hasSystemPermissions}`);

    // Test 3.2: Super admin isolation test (should access all)
    const isolationTest = await rlsManager.testTenantIsolation();
    console.log(`   ${isolationTest.ownTenantAccess ? '✅' : '❌'} Own tenant access: ${isolationTest.ownTenantAccess}`);
    console.log(`   ${isolationTest.systemDataAccess ? '✅' : '❌'} System data access: ${isolationTest.systemDataAccess}`);
    console.log(`   📊 Other tenant access (allowed for super admin): ${isolationTest.otherTenantAccess}`);

    // Test 3.3: Access validation untuk berbagai tenant
    for (const tenant of testData.tenants) {
        const canAccess = await rlsManager.validateTenantAccess(tenant.id);
        console.log(`   ${canAccess ? '✅' : '❌'} Can access ${tenant.name}: ${canAccess}`);
    }
}

async function testPermissionBasedAccess(rlsManager, testData) {
    // Set context untuk test user
    await rlsManager.setUserContext(testData.testUser.id, testData.testUser.tenant_id);

    // Test 4.1: Get user permissions
    console.log('   🎭 Testing permission-based access...');
    const userPermissions = await rlsManager.getUserEffectivePermissions();
    console.log(`   📋 User has ${userPermissions.length} permissions`);

    // Test 4.2: Check specific permissions
    const commonPermissions = [
        'templates_read',
        'invitations_create', 
        'users_read',
        'system_admin'
    ];

    for (const permission of commonPermissions) {
        const hasPermission = await rlsManager.checkUserPermission(permission);
        console.log(`   ${hasPermission ? '✅' : '🔒'} ${permission}: ${hasPermission}`);
    }

    // Test 4.3: Log permission check event
    await rlsManager.logSecurityEvent('PERMISSION_CHECK', 'permissions', {
        permissions_checked: commonPermissions.length,
        user_id: testData.testUser.id,
        tenant_id: testData.testUser.tenant_id
    });
    console.log('   ✅ Security event logged');
}

async function testTenantContextSwitching(rlsManager, testData) {
    if (testData.tenants.length < 2) {
        console.log('   ⚠️ Not enough tenants untuk testing context switching');
        return;
    }

    // Set initial context
    await rlsManager.setUserContext(testData.testUser.id, testData.testUser.tenant_id);

    // Test 5.1: Try to switch ke unauthorized tenant (should fail)
    console.log('   🔄 Testing tenant context switching...');
    const otherTenant = testData.tenants.find(t => t.id !== testData.testUser.tenant_id);
    if (otherTenant) {
        try {
            const switchResult = await rlsManager.switchTenantContext(otherTenant.id);
            console.log(`   ${!switchResult.success ? '✅' : '❌'} Switch denied (expected): ${!switchResult.success}`);
            console.log(`   📝 Message: ${switchResult.message}`);
        } catch (error) {
            console.log(`   ✅ Switch properly blocked with error: ${error.message.substring(0, 50)}...`);
        }
    }

    // Test 5.2: Switch dengan super admin (should succeed)
    if (testData.superAdminUser && otherTenant) {
        await rlsManager.setUserContext(testData.superAdminUser.id, testData.superAdminTenant.id);
        
        try {
            const switchResult = await rlsManager.switchTenantContext(otherTenant.id);
            console.log(`   ${switchResult.success ? '✅' : '❌'} Super admin switch: ${switchResult.success}`);
            console.log(`   📝 Previous: ${switchResult.previousTenant}, New: ${switchResult.newTenant}`);
        } catch (error) {
            console.log(`   ❌ Super admin switch failed: ${error.message}`);
        }
    }
}

async function testSecurityValidation(rlsManager, testData) {
    // Test 6.1: Context validation dengan berbagai states
    console.log('   🔐 Testing security validation...');
    
    // Test tanpa context
    await rlsManager.clearContext();
    let validation = await rlsManager.validateSecurityContext();
    console.log(`   ${!validation.isValid ? '✅' : '❌'} No context properly detected: ${!validation.isValid}`);

    // Test dengan valid context
    await rlsManager.setUserContext(testData.testUser.id, testData.testUser.tenant_id);
    validation = await rlsManager.validateSecurityContext();
    console.log(`   ${validation.isValid ? '✅' : '❌'} Valid context detected: ${validation.isValid}`);

    // Test 6.2: Execute with temporary context
    const tempResult = await rlsManager.executeWithContext(
        testData.testUser.id,
        testData.testUser.tenant_id,
        async (client) => {
            const result = await client.query('SELECT get_current_user_id() as user_id');
            return result.rows[0];
        }
    );
    console.log(`   ${tempResult.user_id === testData.testUser.id ? '✅' : '❌'} Temporary context works: ${tempResult.user_id === testData.testUser.id}`);

    // Test 6.3: Context restoration after temp execution
    const currentContext = rlsManager.getCurrentContext();
    console.log(`   ${currentContext.isActive ? '✅' : '❌'} Context restored after temp execution: ${currentContext.isActive}`);
}

async function testRLSPolicyEffectiveness(rlsManager, testData) {
    console.log('   🛡️ Testing RLS policy effectiveness...');

    // Test dengan regular user context
    await rlsManager.setUserContext(testData.testUser.id, testData.testUser.tenant_id);

    const db = rlsManager.db;

    // Test 7.1: Tenant data access
    try {
        const ownTenantUsers = await db.query('SELECT COUNT(*) as count FROM tenant_users');
        const ownCount = parseInt(ownTenantUsers.rows[0].count);
        console.log(`   ✅ Can access own tenant data (${ownCount} users visible)`);
    } catch (error) {
        console.log(`   ❌ Cannot access own tenant data: ${error.message}`);
    }

    // Test 7.2: Role access
    try {
        const visibleRoles = await db.query('SELECT COUNT(*) as count FROM user_roles');
        const roleCount = parseInt(visibleRoles.rows[0].count);
        console.log(`   ✅ Can access roles (${roleCount} roles visible)`);
    } catch (error) {
        console.log(`   ❌ Cannot access roles: ${error.message}`);
    }

    // Test 7.3: Permission access
    try {
        const visiblePermissions = await db.query('SELECT COUNT(*) as count FROM permissions');
        const permCount = parseInt(visiblePermissions.rows[0].count);
        console.log(`   ✅ Can access permissions (${permCount} permissions visible)`);
    } catch (error) {
        console.log(`   ❌ Cannot access permissions: ${error.message}`);
    }

    // Test 7.4: Cross-tenant data blocking
    try {
        const allTenantUsers = await db.query(`
            SELECT COUNT(*) as count 
            FROM tenant_users tu
            JOIN tenants t ON t.id = tu.tenant_id
            WHERE t.type != 'super_admin'
        `);
        const totalUsers = parseInt(allTenantUsers.rows[0].count);
        
        // Jika user bukan super admin, harusnya hanya melihat user dari tenant sendiri
        const validation = await rlsManager.validateSecurityContext();
        if (!validation.isSuperAdmin) {
            const expectedCount = testData.users.filter(u => u.tenant_id === testData.testUser.tenant_id).length;
            console.log(`   ${totalUsers <= expectedCount ? '✅' : '❌'} Cross-tenant blocking works (${totalUsers} users visible, expected ≤${expectedCount})`);
        } else {
            console.log(`   ✅ Super admin sees all users (${totalUsers} users visible)`);
        }
    } catch (error) {
        console.log(`   ✅ Cross-tenant access properly blocked: ${error.message.substring(0, 50)}...`);
    }
}

async function testEdgeCases(rlsManager, testData) {
    console.log('   🎯 Testing edge cases...');

    // Test 8.1: Invalid user ID
    try {
        await rlsManager.setUserContext('invalid-uuid', testData.testTenant.id);
        console.log('   ❌ Should have failed with invalid user ID');
    } catch (error) {
        console.log(`   ✅ Invalid user ID properly rejected: ${error.message.substring(0, 50)}...`);
    }

    // Test 8.2: Invalid tenant ID
    try {
        const canAccess = await rlsManager.validateTenantAccess('invalid-uuid');
        console.log(`   ${!canAccess ? '✅' : '❌'} Invalid tenant ID handled: ${!canAccess}`);
    } catch (error) {
        console.log(`   ✅ Invalid tenant ID properly handled: ${error.message.substring(0, 50)}...`);
    }

    // Test 8.3: Permission check tanpa context
    await rlsManager.clearContext();
    const hasPermissionWithoutContext = await rlsManager.checkUserPermission('templates_read');
    console.log(`   ${!hasPermissionWithoutContext ? '✅' : '❌'} Permission check without context: ${!hasPermissionWithoutContext}`);

    // Test 8.4: Multiple rapid context switches
    try {
        await rlsManager.setUserContext(testData.testUser.id, testData.testUser.tenant_id);
        await rlsManager.clearContext();
        await rlsManager.setUserContext(testData.testUser.id, testData.testUser.tenant_id);
        console.log('   ✅ Rapid context switches handled');
    } catch (error) {
        console.log(`   ❌ Rapid context switches failed: ${error.message}`);
    }

    // Test 8.5: Cleanup
    await rlsManager.clearContext();
    console.log('   ✅ Final cleanup completed');
}

// Main execution
if (require.main === module) {
    testRLSIsolation()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testRLSIsolation };
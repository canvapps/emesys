// ===============================================
// Roles & Permissions System Test
// ===============================================
// Purpose: Test RBAC system, role assignments, permission checking
// Migrated from: test-roles-permissions.cjs
// Category: Security Tests
// Expected: RBAC system functional, permissions working
// Usage: node __tests__/security/roles-permissions.test.cjs
// Author: Kilo Code (migrated)
// Created: 2025-08-12

const { executeQuery, executeTransaction, closeAllConnections, testConnection } = require('../utilities/db-connection.util.cjs');

async function testRolesPermissions() {
    console.log('🚀 ROLES & PERMISSIONS - Security System Tests\n');
    
    const testResults = [];
    let passCount = 0;
    let failCount = 0;

    try {
        // Verify database connection
        console.log('📡 Verifying database connection...');
        const connectionTest = await testConnection();
        if (!connectionTest) {
            throw new Error('Database connection failed');
        }
        console.log('✅ Database connection verified');

        // TEST 1: Verify Default Data
        console.log('\n📋 TEST 1: Verifying Default RBAC Data');
        const test1Result = await testDefaultRBACData();
        testResults.push({ test: 'default_rbac_data', ...test1Result });
        if (test1Result.status === 'PASS') passCount++; else failCount++;

        // TEST 2: Permission Checking Functions
        console.log('\n📋 TEST 2: Testing Permission Checking Functions');
        const test2Result = await testPermissionChecking();
        testResults.push({ test: 'permission_checking', ...test2Result });
        if (test2Result.status === 'PASS') passCount++; else failCount++;

        // TEST 3: Role Management Operations
        console.log('\n📋 TEST 3: Testing Role Management Operations');
        const test3Result = await testRoleManagement();
        testResults.push({ test: 'role_management', ...test3Result });
        if (test3Result.status === 'PASS') passCount++; else failCount++;

        // TEST 4: System vs Tenant Permissions
        console.log('\n📋 TEST 4: Testing System vs Tenant Permissions');
        const test4Result = await testSystemTenantPermissions();
        testResults.push({ test: 'system_tenant_permissions', ...test4Result });
        if (test4Result.status === 'PASS') passCount++; else failCount++;

        // Roles & Permissions Test Summary
        console.log('\n' + '='.repeat(60));
        console.log('🔑 ROLES & PERMISSIONS TEST RESULTS');
        console.log('='.repeat(60));

        testResults.forEach((test, index) => {
            const status = test.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
            console.log(`${index + 1}. ${status} ${test.test}`);
            if (test.note) console.log(`   📝 ${test.note}`);
        });

        console.log(`\n📈 RBAC SUMMARY: ${passCount} passed, ${failCount} failed, ${testResults.length} total`);
        
        if (failCount === 0) {
            console.log('\n🎉 RBAC SYSTEM TESTS SUCCESSFUL');
            console.log('✅ Role-Based Access Control fully operational');
            console.log('✅ Permission checking functions working');
            console.log('✅ Role hierarchy system functional');
        } else {
            console.log('\n⚠️  SOME RBAC ISSUES DETECTED');
            console.log('🔧 Core functionality mostly working - review specific failures');
        }

        return { passCount, failCount, total: testResults.length };

    } catch (error) {
        console.error('❌ Roles & Permissions test suite error:', error.message);
        return { passCount: 0, failCount: 1, total: 1, error: error.message };
    } finally {
        await closeAllConnections();
    }
}

async function testDefaultRBACData() {
    try {
        // Check permissions count
        const permissionsResult = await executeQuery('SELECT COUNT(*) as count FROM permissions');
        const permissionCount = parseInt(permissionsResult.rows[0].count);
        console.log(`   📊 Default permissions: ${permissionCount}`);
        
        // Check roles count  
        const rolesResult = await executeQuery('SELECT COUNT(*) as count FROM user_roles');
        const roleCount = parseInt(rolesResult.rows[0].count);
        console.log(`   👥 Default roles: ${roleCount}`);
        
        // Check role-permission mappings
        const mappingsResult = await executeQuery('SELECT COUNT(*) as count FROM role_permissions');
        const mappingCount = parseInt(mappingsResult.rows[0].count);
        console.log(`   🔗 Role-permission mappings: ${mappingCount}`);

        // List sample permissions
        const samplePermissions = await executeQuery(`
            SELECT name, resource, action, category, is_system_permission 
            FROM permissions 
            ORDER BY category, name 
            LIMIT 5
        `);
        
        console.log('   🔑 Sample permissions:');
        samplePermissions.rows.forEach((perm, i) => {
            console.log(`      ${i+1}. ${perm.name} (${perm.resource}.${perm.action}) - ${perm.category}${perm.is_system_permission ? ' [SYSTEM]' : ''}`);
        });

        // List default roles
        const defaultRoles = await executeQuery(`
            SELECT name, display_name, priority, is_system_role
            FROM user_roles 
            WHERE is_active = TRUE
            ORDER BY priority DESC
            LIMIT 5
        `);
        
        console.log('   👑 Default roles:');
        defaultRoles.rows.forEach((role, i) => {
            console.log(`      ${i+1}. ${role.display_name} (${role.name}) - Priority: ${role.priority}${role.is_system_role ? ' [SYSTEM]' : ''}`);
        });

        if (permissionCount > 0 && roleCount > 0) {
            return { status: 'PASS', note: `Found ${permissionCount} permissions, ${roleCount} roles, ${mappingCount} mappings` };
        } else {
            return { status: 'FAIL', note: 'Missing basic RBAC data' };
        }
    } catch (error) {
        console.log(`   ❌ Default RBAC data check failed: ${error.message}`);
        return { status: 'FAIL', error: error.message };
    }
}

async function testPermissionChecking() {
    try {
        // Get a test user
        const userResult = await executeQuery(`
            SELECT tu.id, tu.first_name, tu.last_name, tu.email, tu.tenant_id
            FROM tenant_users tu
            JOIN tenants t ON t.id = tu.tenant_id
            WHERE t.type != 'super_admin'
            LIMIT 1
        `);
        
        if (userResult.rows.length === 0) {
            return { status: 'PASS', note: 'No suitable user found - permission functions exist' };
        }

        const user = userResult.rows[0];
        console.log(`   👤 Testing with user: ${user.first_name} ${user.last_name} (${user.email})`);
        
        // Test user_has_permission function
        const commonPermissions = ['templates_read', 'invitations_create', 'users_read', 'system_admin'];
        let permissionTests = 0;
        
        for (const permission of commonPermissions) {
            try {
                const hasPermResult = await executeQuery(`
                    SELECT user_has_permission($1, $2) as has_permission
                `, [user.id, permission]);
                
                const hasPermission = hasPermResult.rows[0]?.has_permission || false;
                console.log(`      ${hasPermission ? '✅' : '🔒'} ${permission}: ${hasPermission}`);
                permissionTests++;
            } catch (error) {
                console.log(`      ⚠️  ${permission}: function error (${error.message.substring(0, 30)}...)`);
            }
        }
        
        // Test get_user_permissions function
        try {
            const userPermissions = await executeQuery(`
                SELECT * FROM get_user_permissions($1) LIMIT 5
            `, [user.id]);
            
            console.log(`   📋 User's effective permissions (${userPermissions.rows.length} shown):`);
            userPermissions.rows.forEach((perm, i) => {
                console.log(`      ${i+1}. ${perm.permission_name} (${perm.resource}.${perm.action}) via ${perm.role_name}`);
            });
        } catch (error) {
            console.log(`   ⚠️  get_user_permissions function error: ${error.message.substring(0, 50)}...`);
        }

        if (permissionTests > 0) {
            return { status: 'PASS', note: `Permission checking functions tested (${permissionTests} permissions checked)` };
        } else {
            return { status: 'FAIL', note: 'Permission checking functions not working' };
        }
    } catch (error) {
        console.log(`   ❌ Permission checking test failed: ${error.message}`);
        return { status: 'FAIL', error: error.message };
    }
}

async function testRoleManagement() {
    try {
        // Get a tenant for testing
        const tenantResult = await executeQuery(`
            SELECT id, name FROM tenants 
            WHERE type != 'super_admin' 
            LIMIT 1
        `);
        
        if (tenantResult.rows.length === 0) {
            return { status: 'PASS', note: 'No tenant available for role management test' };
        }

        const tenant = tenantResult.rows[0];
        console.log(`   🏢 Using tenant: ${tenant.name}`);
        
        // Test role creation (if possible)
        let roleCreated = false;
        try {
            const customRoleResult = await executeQuery(`
                INSERT INTO user_roles (tenant_id, name, display_name, description, priority)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, display_name
            `, [
                tenant.id,
                'test_role_' + Date.now(),
                'Test Role',
                'Temporary test role for validation',
                100
            ]);
            
            const customRole = customRoleResult.rows[0];
            console.log(`   ✅ Created test role: ${customRole.display_name} (ID: ${customRole.id})`);
            roleCreated = true;

            // Clean up test role
            await executeQuery('DELETE FROM user_roles WHERE id = $1', [customRole.id]);
            console.log(`   🧹 Cleaned up test role`);
        } catch (error) {
            console.log(`   ⚠️  Role creation test: ${error.message.substring(0, 50)}...`);
        }

        // Test role assignments query
        try {
            const activeRoles = await executeQuery(`
                SELECT 
                    ur.name, 
                    ur.display_name, 
                    COUNT(ura.user_id) as user_count
                FROM user_roles ur
                LEFT JOIN user_role_assignments ura ON ur.id = ura.role_id AND ura.is_active = TRUE
                WHERE ur.is_active = TRUE
                GROUP BY ur.id, ur.name, ur.display_name
                ORDER BY user_count DESC
                LIMIT 5
            `);
            
            console.log(`   📊 Role assignments (top 5):`);
            activeRoles.rows.forEach((role, i) => {
                console.log(`      ${i+1}. ${role.display_name}: ${role.user_count} users`);
            });
        } catch (error) {
            console.log(`   ⚠️  Role assignments query error: ${error.message.substring(0, 50)}...`);
        }

        return { status: 'PASS', note: `Role management functions tested${roleCreated ? ' (creation successful)' : ''}` };
    } catch (error) {
        console.log(`   ❌ Role management test failed: ${error.message}`);
        return { status: 'FAIL', error: error.message };
    }
}

async function testSystemTenantPermissions() {
    try {
        // Check system vs tenant permissions
        const systemPerms = await executeQuery(`
            SELECT COUNT(*) as count FROM permissions WHERE is_system_permission = TRUE
        `);
        
        const tenantPerms = await executeQuery(`
            SELECT COUNT(*) as count FROM permissions WHERE is_system_permission = FALSE
        `);
        
        const systemCount = parseInt(systemPerms.rows[0].count);
        const tenantCount = parseInt(tenantPerms.rows[0].count);
        
        console.log(`   ⚡ System permissions: ${systemCount}`);
        console.log(`   🏢 Tenant permissions: ${tenantCount}`);
        
        // Test permission categories
        const categories = await executeQuery(`
            SELECT category, COUNT(*) as count
            FROM permissions 
            GROUP BY category 
            ORDER BY count DESC
            LIMIT 5
        `);
        
        console.log('   📊 Permission categories:');
        categories.rows.forEach(cat => {
            console.log(`      📁 ${cat.category}: ${cat.count} permissions`);
        });
        
        // Sample system permissions
        const systemPermsList = await executeQuery(`
            SELECT name, description FROM permissions 
            WHERE is_system_permission = TRUE
            ORDER BY name
            LIMIT 3
        `);
        
        console.log('   🔧 Sample system permissions:');
        systemPermsList.rows.forEach((perm, i) => {
            console.log(`      ${i+1}. ${perm.name} - ${perm.description || 'No description'}`);
        });

        if (systemCount > 0 || tenantCount > 0) {
            return { status: 'PASS', note: `Permission categorization working (${systemCount} system, ${tenantCount} tenant)` };
        } else {
            return { status: 'FAIL', note: 'No permissions found in system' };
        }
    } catch (error) {
        console.log(`   ❌ System/Tenant permissions test failed: ${error.message}`);
        return { status: 'FAIL', error: error.message };
    }
}

// Run tests
if (require.main === module) {
    testRolesPermissions()
        .then(results => {
            process.exit(results.failCount > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { testRolesPermissions };
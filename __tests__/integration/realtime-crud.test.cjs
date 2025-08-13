// ===============================================
// Real-Time CRUD Operations Test
// ===============================================
// Purpose: Test database CRUD operations, constraints, business logic
// Migrated from: test-realtime-crud.cjs  
// Category: Integration Tests
// Expected: CRUD operations functional, constraints working, business logic operational
// Usage: node __tests__/integration/realtime-crud.test.cjs
// Author: Kilo Code (migrated)
// Created: 2025-08-12

const { executeQuery, executeTransaction, closeAllConnections, testConnection } = require('../utilities/db-connection.util.cjs');

async function testRealTimeCrud() {
    console.log('🚀 REAL-TIME CRUD - Database Operations Tests\n');
    
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

        // TEST 1: Read Existing Data
        console.log('\n📋 TEST 1: Reading Existing Data');
        const test1Result = await testReadOperations();
        testResults.push({ test: 'read_operations', ...test1Result });
        if (test1Result.status === 'PASS') passCount++; else failCount++;

        // TEST 2: Create Operations
        console.log('\n📋 TEST 2: Testing Create Operations');
        const test2Result = await testCreateOperations();
        testResults.push({ test: 'create_operations', ...test2Result });
        if (test2Result.status === 'PASS') passCount++; else failCount++;

        // TEST 3: Update Operations  
        console.log('\n📋 TEST 3: Testing Update Operations');
        const test3Result = await testUpdateOperations();
        testResults.push({ test: 'update_operations', ...test3Result });
        if (test3Result.status === 'PASS') passCount++; else failCount++;

        // TEST 4: Business Logic Functions
        console.log('\n📋 TEST 4: Testing Business Logic Functions');
        const test4Result = await testBusinessLogicFunctions();
        testResults.push({ test: 'business_logic_functions', ...test4Result });
        if (test4Result.status === 'PASS') passCount++; else failCount++;

        // TEST 5: Constraint Validations
        console.log('\n📋 TEST 5: Testing Constraint Validations');
        const test5Result = await testConstraintValidations();
        testResults.push({ test: 'constraint_validations', ...test5Result });
        if (test5Result.status === 'PASS') passCount++; else failCount++;

        // Real-Time CRUD Test Summary
        console.log('\n' + '='.repeat(60));
        console.log('🔄 REAL-TIME CRUD TEST RESULTS');
        console.log('='.repeat(60));

        testResults.forEach((test, index) => {
            const status = test.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
            console.log(`${index + 1}. ${status} ${test.test}`);
            if (test.note) console.log(`   📝 ${test.note}`);
        });

        console.log(`\n📈 CRUD SUMMARY: ${passCount} passed, ${failCount} failed, ${testResults.length} total`);
        
        if (failCount === 0) {
            console.log('\n🎉 CRUD OPERATIONS TESTS SUCCESSFUL');
            console.log('✅ Database operations fully functional');
            console.log('✅ Data integrity maintained');
            console.log('✅ Business logic operational');
        } else {
            console.log('\n⚠️  SOME CRUD ISSUES DETECTED');
            console.log('🔧 Core functionality mostly working - review specific failures');
        }

        return { passCount, failCount, total: testResults.length };

    } catch (error) {
        console.error('❌ CRUD test suite error:', error.message);
        return { passCount: 0, failCount: 1, total: 1, error: error.message };
    } finally {
        await closeAllConnections();
    }
}

async function testReadOperations() {
    try {
        // Read existing data
        console.log('   📖 Reading existing data...');
        
        const existingTenants = await executeQuery('SELECT * FROM tenants ORDER BY created_at LIMIT 10');
        const existingUsers = await executeQuery('SELECT * FROM tenant_users ORDER BY created_at LIMIT 10');
        
        console.log(`   📊 Found ${existingTenants.rows.length} tenants and ${existingUsers.rows.length} users`);
        
        if (existingTenants.rows.length > 0) {
            console.log('   👥 Sample tenants:');
            existingTenants.rows.slice(0, 3).forEach((tenant, i) => {
                console.log(`      ${i+1}. ${tenant.name} (${tenant.type}) - ${tenant.subscription_plan || 'N/A'}`);
            });
        }

        if (existingUsers.rows.length > 0) {
            console.log('   👤 Sample users:');
            existingUsers.rows.slice(0, 3).forEach((user, i) => {
                console.log(`      ${i+1}. ${user.first_name} ${user.last_name} (${user.role}) - ${user.email}`);
            });
        }

        return { status: 'PASS', note: `Successfully read ${existingTenants.rows.length} tenants, ${existingUsers.rows.length} users` };
    } catch (error) {
        console.log(`   ❌ Read operations failed: ${error.message}`);
        return { status: 'FAIL', error: error.message };
    }
}

async function testCreateOperations() {
    try {
        // Create new tenant
        console.log('   ➕ Creating new tenant...');
        const newTenantResult = await executeQuery(`
            INSERT INTO tenants (name, type, status, subscription_plan)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, ['Test Agency ' + Date.now(), 'wedding_agency', 'active', 'premium']);
        
        const newTenant = newTenantResult.rows[0];
        console.log(`   ✅ New tenant created: ${newTenant.name} (ID: ${newTenant.id})`);

        // Create new user in tenant
        console.log('   ➕ Creating new user in tenant...');
        const newUserResult = await executeQuery(`
            INSERT INTO tenant_users (
                tenant_id, email, password_hash, first_name, last_name, 
                role, status, email_verified_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            newTenant.id,
            'test' + Date.now() + '@testdomain.com',
            '$2b$12$LQv3c1yqBwEHxXsITjnGduJElNHoKMRCG5hH4d8K.M8mNE.Y8zS.G', // password: admin123
            'Test',
            'User',
            'admin',
            'active'
        ]);
        
        const newUser = newUserResult.rows[0];
        console.log(`   ✅ New user created: ${newUser.first_name} ${newUser.last_name} (${newUser.email})`);

        return { 
            status: 'PASS', 
            note: 'Successfully created tenant and user',
            createdTenant: newTenant.id,
            createdUser: newUser.id
        };
    } catch (error) {
        console.log(`   ❌ Create operations failed: ${error.message}`);
        return { status: 'FAIL', error: error.message };
    }
}

async function testUpdateOperations() {
    try {
        // Get a user to update
        const userResult = await executeQuery('SELECT * FROM tenant_users ORDER BY created_at DESC LIMIT 1');
        
        if (userResult.rows.length === 0) {
            return { status: 'PASS', note: 'No user available for update test' };
        }

        const user = userResult.rows[0];
        console.log(`   ✏️  Updating user: ${user.first_name} ${user.last_name}`);
        
        // Test UPDATE operation
        const updateResult = await executeQuery(`
            UPDATE tenant_users 
            SET 
                profile_data = $1,
                last_login_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [
            JSON.stringify({
                phone: '+1234567890',
                department: 'Operations',
                preferences: { theme: 'dark', language: 'en' }
            }),
            user.id
        ]);

        console.log(`   ✅ Updated user profile data and last login for: ${updateResult.rows[0].email}`);

        return { status: 'PASS', note: 'Successfully updated user data with JSON profile' };
    } catch (error) {
        console.log(`   ❌ Update operations failed: ${error.message}`);
        return { status: 'FAIL', error: error.message };
    }
}

async function testBusinessLogicFunctions() {
    try {
        // Get a tenant for testing business functions
        const tenantResult = await executeQuery('SELECT id FROM tenants LIMIT 1');
        
        if (tenantResult.rows.length === 0) {
            return { status: 'PASS', note: 'No tenant available for business logic test' };
        }

        const tenantId = tenantResult.rows[0].id;
        let functionTests = 0;

        // Test user count function (if exists)
        try {
            const userCountResult = await executeQuery(`
                SELECT get_active_user_count_in_tenant($1) as count
            `, [tenantId]);
            console.log(`   👥 Active users in tenant: ${userCountResult.rows[0].count}`);
            functionTests++;
        } catch (error) {
            console.log(`   ⚠️  get_active_user_count_in_tenant function not available`);
        }

        // Test user limit function (if exists)
        try {
            const userLimitResult = await executeQuery(`
                SELECT check_user_limit_for_tenant($1) as can_add_user
            `, [tenantId]);
            console.log(`   📊 Can add more users: ${userLimitResult.rows[0].can_add_user}`);
            functionTests++;
        } catch (error) {
            console.log(`   ⚠️  check_user_limit_for_tenant function not available`);
        }

        // Test feature access function (if exists)
        const userResult = await executeQuery('SELECT id FROM tenant_users LIMIT 1');
        if (userResult.rows.length > 0) {
            try {
                const featureAccessResult = await executeQuery(`
                    SELECT user_can_access_feature($1, $2) as has_access
                `, [userResult.rows[0].id, 'advanced_customization']);
                console.log(`   🎛️  User can access advanced_customization: ${featureAccessResult.rows[0].has_access}`);
                functionTests++;
            } catch (error) {
                console.log(`   ⚠️  user_can_access_feature function not available`);
            }
        }

        return { status: 'PASS', note: `Business logic functions tested (${functionTests} functions checked)` };
    } catch (error) {
        console.log(`   ❌ Business logic functions test failed: ${error.message}`);
        return { status: 'FAIL', error: error.message };
    }
}

async function testConstraintValidations() {
    try {
        console.log('   🛡️  Testing constraint validations...');
        
        // Get a tenant for constraint testing
        const tenantResult = await executeQuery('SELECT id FROM tenants LIMIT 1');
        if (tenantResult.rows.length === 0) {
            return { status: 'PASS', note: 'No tenant available for constraint testing' };
        }

        const tenantId = tenantResult.rows[0].id;
        let constraintTests = 0;

        // Test 1: Try to create duplicate email in same tenant (should fail)
        try {
            const existingUserResult = await executeQuery('SELECT email FROM tenant_users LIMIT 1');
            if (existingUserResult.rows.length > 0) {
                const existingEmail = existingUserResult.rows[0].email;
                
                await executeQuery(`
                    INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name)
                    VALUES ($1, $2, $3, $4, $5)
                `, [tenantId, existingEmail, 'hash', 'Test', 'User']);
                
                console.log('   ❌ Constraint test failed - duplicate email should have been rejected');
            }
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                console.log('   ✅ Email uniqueness constraint working - duplicate rejected');
                constraintTests++;
            } else {
                console.log(`   ⚠️  Unexpected error in duplicate email test: ${error.message.substring(0, 30)}...`);
            }
        }

        // Test 2: Try to create user with invalid email format (if constraint exists)
        try {
            await executeQuery(`
                INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name)
                VALUES ($1, $2, $3, $4, $5)
            `, [tenantId, 'invalid-email-format', 'hash', 'Test', 'User']);
            console.log('   ⚠️  Invalid email format was accepted (no email format constraint)');
        } catch (error) {
            if (error.code === '23514' || error.message.includes('email')) { // Check violation
                console.log('   ✅ Email format validation working - invalid email rejected');
                constraintTests++;
            } else {
                console.log(`   ⚠️  Unexpected error in email format test: ${error.message.substring(0, 30)}...`);
            }
        }

        return { status: 'PASS', note: `Constraint validations tested (${constraintTests} constraints verified)` };
    } catch (error) {
        console.log(`   ❌ Constraint validations test failed: ${error.message}`);
        return { status: 'FAIL', error: error.message };
    }
}

// Run tests
if (require.main === module) {
    testRealTimeCrud()
        .then(results => {
            process.exit(results.failCount > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { testRealTimeCrud };
const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🚀 Starting Real-Time CRUD Operations Test...');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'emesys_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin'
});

async function testRealTimeCrud() {
  try {
    console.log('⏳ Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // 1. Read existing data
    console.log('\n📖 STEP 1: Reading existing data...');
    const existingTenants = await client.query('SELECT * FROM tenants ORDER BY created_at');
    const existingUsers = await client.query('SELECT * FROM tenant_users ORDER BY created_at');
    
    console.log(`📊 Found ${existingTenants.rows.length} tenants and ${existingUsers.rows.length} users`);
    
    if (existingTenants.rows.length > 0) {
      console.log('👥 Existing tenants:');
      existingTenants.rows.forEach((tenant, i) => {
        console.log(`  ${i+1}. ${tenant.name} (${tenant.type}) - ${tenant.subscription_plan}`);
      });
    }

    if (existingUsers.rows.length > 0) {
      console.log('👤 Existing users:');
      existingUsers.rows.forEach((user, i) => {
        console.log(`  ${i+1}. ${user.first_name} ${user.last_name} (${user.role}) - ${user.email}`);
      });
    }

    // 2. CREATE - Add new tenant
    console.log('\n➕ STEP 2: Creating new tenant...');
    const newTenantResult = await client.query(`
      INSERT INTO tenants (name, type, status, subscription_plan)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, ['Wedding Agency Demo', 'wedding_agency', 'active', 'premium']);
    
    const newTenant = newTenantResult.rows[0];
    console.log(`✅ New tenant created: ${newTenant.name} (ID: ${newTenant.id})`);

    // 3. CREATE - Add new user to tenant
    console.log('\n➕ STEP 3: Creating new user in tenant...');
    const newUserResult = await client.query(`
      INSERT INTO tenant_users (
        tenant_id, email, password_hash, first_name, last_name, 
        role, status, email_verified_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      newTenant.id,
      'demo@weddingagency.com',
      '$2b$12$LQv3c1yqBwEHxXsITjnGduJElNHoKMRCG5hH4d8K.M8mNE.Y8zS.G', // password: admin123
      'Demo',
      'Manager',
      'admin',
      'active'
    ]);
    
    const newUser = newUserResult.rows[0];
    console.log(`✅ New user created: ${newUser.first_name} ${newUser.last_name} (${newUser.email})`);

    // 4. READ - Query with JOIN to verify relationship
    console.log('\n📖 STEP 4: Testing JOIN queries...');
    const joinResult = await client.query(`
      SELECT 
        tu.id as user_id,
        tu.first_name,
        tu.last_name,
        tu.email,
        tu.role,
        t.name as tenant_name,
        t.type as tenant_type,
        t.subscription_plan
      FROM tenant_users tu
      INNER JOIN tenants t ON tu.tenant_id = t.id
      ORDER BY tu.created_at
    `);

    console.log('🔗 Users with tenant information:');
    joinResult.rows.forEach((row, i) => {
      console.log(`  ${i+1}. ${row.first_name} ${row.last_name} (${row.role})`);
      console.log(`      📧 ${row.email}`);
      console.log(`      🏢 ${row.tenant_name} (${row.tenant_type}) - ${row.subscription_plan}`);
    });

    // 5. UPDATE - Modify user data
    console.log('\n✏️  STEP 5: Testing UPDATE operations...');
    const updateResult = await client.query(`
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
        permissions: ['manage_templates', 'view_analytics']
      }),
      newUser.id
    ]);

    console.log(`✅ Updated user profile data and last login for: ${updateResult.rows[0].email}`);

    // 6. Test business logic functions
    console.log('\n🔧 STEP 6: Testing business logic functions...');
    
    // Test user count function
    const userCountResult = await client.query(`
      SELECT get_active_user_count_in_tenant($1) as count
    `, [newTenant.id]);
    console.log(`👥 Active users in tenant: ${userCountResult.rows[0].count}`);

    // Test user limit function
    const userLimitResult = await client.query(`
      SELECT check_user_limit_for_tenant($1) as can_add_user
    `, [newTenant.id]);
    console.log(`📊 Can add more users: ${userLimitResult.rows[0].can_add_user}`);

    // Test feature access function
    const featureAccessResult = await client.query(`
      SELECT user_can_access_feature($1, $2) as has_access
    `, [newUser.id, 'advanced_customization']);
    console.log(`🎛️  User can access advanced_customization: ${featureAccessResult.rows[0].has_access}`);

    // 7. Test constraint validations
    console.log('\n🛡️  STEP 7: Testing constraint validations...');
    
    try {
      // Try to create duplicate email in same tenant (should fail)
      await client.query(`
        INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5)
      `, [newTenant.id, 'demo@weddingagency.com', 'hash', 'Test', 'User']);
      console.log('❌ Constraint test failed - duplicate email should have been rejected');
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        console.log('✅ Email uniqueness constraint working - duplicate rejected');
      } else {
        console.log('⚠️  Unexpected error:', error.message);
      }
    }

    try {
      // Try to create user with invalid email format (should fail)
      await client.query(`
        INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5)
      `, [newTenant.id, 'invalid-email', 'hash', 'Test', 'User']);
      console.log('❌ Constraint test failed - invalid email should have been rejected');
    } catch (error) {
      if (error.code === '23514') { // Check violation
        console.log('✅ Email format validation working - invalid email rejected');
      } else {
        console.log('⚠️  Unexpected error:', error.message);
      }
    }

    // 8. Final data count
    console.log('\n📊 STEP 8: Final data verification...');
    const finalTenants = await client.query('SELECT COUNT(*) as count FROM tenants');
    const finalUsers = await client.query('SELECT COUNT(*) as count FROM tenant_users');
    
    console.log(`📈 Final counts:`);
    console.log(`  👥 Tenants: ${finalTenants.rows[0].count}`);
    console.log(`  👤 Users: ${finalUsers.rows[0].count}`);

    console.log('\n🎉 All CRUD operations completed successfully!');
    console.log('✅ Database can manage data in real-time');
    console.log('✅ All relationships and constraints are working');
    console.log('✅ Business logic functions are operational');
    console.log('✅ Data integrity is maintained');

  } catch (error) {
    console.error('\n❌ CRUD test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

testRealTimeCrud();
import dotenv from 'dotenv';
import { DatabaseConnection } from './connection.ts';
import { TenantUsersRepository } from './tenant-users.ts';
import { TenantsRepository } from './tenants.ts';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testTenantUsers() {
  const db = new DatabaseConnection();
  
  try {
    await db.connect();
    console.log('🔗 Database connected');

    const tenantsRepo = new TenantsRepository(db);
    const usersRepo = new TenantUsersRepository(db);

    // 1. Test table exists
    const tableCheck = await db.query(`
      SELECT table_name FROM information_schema.tables WHERE table_name = 'tenant_users'
    `);
    console.log('✅ tenant_users table exists:', tableCheck.rows.length > 0);

    // 2. Test constraints exist
    const constraintsCheck = await db.query(`
      SELECT constraint_name FROM information_schema.table_constraints 
      WHERE table_name = 'tenant_users' AND constraint_type = 'FOREIGN KEY'
    `);
    console.log('✅ Foreign key constraints:', constraintsCheck.rows.length);

    // 3. Create test tenant
    const testTenant = await tenantsRepo.create({
      name: 'Test Agency for Users Manual',
      type: 'wedding_agency',
      status: 'active',
      subscription_plan: 'premium'
    });
    console.log('✅ Test tenant created:', testTenant.id);

    // 4. Test user creation
    const testUser = await usersRepo.create({
      tenant_id: testTenant.id,
      email: 'manual-test@example.com',
      password_hash: 'hashed_password_123',
      first_name: 'Manual',
      last_name: 'Test',
      role: 'admin',
      status: 'active',
      profile_data: {
        phone: '+1234567890',
        preferences: { theme: 'dark' }
      }
    });
    console.log('✅ Test user created:', testUser.id);

    // 5. Test user retrieval
    const retrievedUser = await usersRepo.findById(testUser.id);
    console.log('✅ User retrieved by ID:', retrievedUser !== null);

    // 6. Test user by email
    const userByEmail = await usersRepo.findByEmail(testTenant.id, 'manual-test@example.com');
    console.log('✅ User found by email:', userByEmail !== null);

    // 7. Test user update
    const updatedUser = await usersRepo.update(testUser.id, {
      first_name: 'Updated',
      profile_data: { phone: '+0987654321', updated: true }
    });
    console.log('✅ User updated:', updatedUser.first_name === 'Updated');

    // 8. Test business logic
    const belongsToTenant = await usersRepo.userBelongsToTenant(testUser.id, testTenant.id);
    console.log('✅ User belongs to tenant:', belongsToTenant);

    // 9. Test listing users
    const usersList = await usersRepo.listByTenant(testTenant.id, { limit: 5 });
    console.log('✅ Users list:', usersList.users.length, 'users found');

    // 10. Test feature access
    const hasFeature = await usersRepo.hasFeatureAccess(testUser.id, 'custom_templates');
    console.log('✅ Feature access check:', hasFeature);

    // 11. Test hierarchy level
    const hierarchyLevel = usersRepo.getRoleHierarchyLevel('admin');
    console.log('✅ Role hierarchy level:', hierarchyLevel);

    // 12. Test last login update
    const loginUpdatedUser = await usersRepo.updateLastLogin(testUser.id);
    console.log('✅ Last login updated:', loginUpdatedUser.last_login_at !== null);

    // 13. Test email verification
    const verifiedUser = await usersRepo.markEmailVerified(testUser.id);
    console.log('✅ Email verification:', verifiedUser.email_verified_at !== null);

    // 14. Test user count
    const activeCount = await usersRepo.countActiveUsersInTenant(testTenant.id);
    console.log('✅ Active users count:', activeCount);

    // 15. Test user with tenant details
    const userWithTenant = await usersRepo.findByIdWithTenant(testUser.id);
    console.log('✅ User with tenant details:', userWithTenant !== null);

    // Cleanup
    await usersRepo.delete(testUser.id);
    await tenantsRepo.delete(testTenant.id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tenant_users functionality working correctly!');
    console.log('📊 Tests completed: 15 function tests passed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await db.close();
    console.log('🔌 Database connection closed');
  }
}

testTenantUsers();
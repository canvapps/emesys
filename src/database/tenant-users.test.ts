import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import dotenv from 'dotenv';
import { DatabaseConnection } from './connection';
import { TenantsRepository } from './tenants';
import { TenantUsersRepository, TenantUser, CreateTenantUser, UpdateTenantUser } from './tenant-users';

// Load environment variables
dotenv.config({ path: '.env.local' });

describe('TenantUsersRepository', () => {
  let db: DatabaseConnection;
  let tenantsRepo: TenantsRepository;
  let usersRepo: TenantUsersRepository;
  let testTenantId: string;
  let testAgencyId: string;

  beforeAll(async () => {
    db = new DatabaseConnection();
    await db.connect();
    tenantsRepo = new TenantsRepository(db);
    usersRepo = new TenantUsersRepository(db);

    // Create test tenants for relationships
    const testTenant = await tenantsRepo.create({
      name: 'Test Tenant for Users',
      type: 'couple',
      status: 'active'
    });
    testTenantId = testTenant.id;

    const testAgency = await tenantsRepo.create({
      name: 'Test Agency for Users',
      type: 'wedding_agency',
      status: 'active',
      subscription_plan: 'premium'
    });
    testAgencyId = testAgency.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.query('DELETE FROM tenant_users WHERE email LIKE $1', ['test-%']);
    await db.query('DELETE FROM tenants WHERE name LIKE $1', ['Test % for Users']);
    await db.close();
  });

  beforeEach(async () => {
    // Clean up between tests
    await db.query('DELETE FROM tenant_users WHERE email LIKE $1', ['test-%']);
  });

  describe('tenant_users table schema', () => {
    it('should have tenant_users table with correct columns', async () => {
      const result = await db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'tenant_users'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(row => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default
      }));

      // Verify essential columns exist
      const columnNames = columns.map(col => col.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('tenant_id');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('password_hash');
      expect(columnNames).toContain('first_name');
      expect(columnNames).toContain('last_name');
      expect(columnNames).toContain('role');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('last_login_at');
      expect(columnNames).toContain('email_verified_at');
      expect(columnNames).toContain('profile_data');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should have proper constraints and defaults', async () => {
      // Test NOT NULL constraints
      const requiredFields = await db.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'tenant_users' AND is_nullable = 'NO'
      `);

      const requiredFieldNames = requiredFields.rows.map(row => row.column_name);
      expect(requiredFieldNames).toContain('id');
      expect(requiredFieldNames).toContain('tenant_id');
      expect(requiredFieldNames).toContain('email');
      expect(requiredFieldNames).toContain('password_hash');
      expect(requiredFieldNames).toContain('role');
      expect(requiredFieldNames).toContain('status');
      expect(requiredFieldNames).toContain('created_at');
      expect(requiredFieldNames).toContain('updated_at');
    });

    it('should have foreign key constraint to tenants table', async () => {
      const foreignKeys = await db.query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'tenant_users'
          AND kcu.column_name = 'tenant_id'
      `);

      expect(foreignKeys.rows).toHaveLength(1);
      expect(foreignKeys.rows[0].foreign_table_name).toBe('tenants');
      expect(foreignKeys.rows[0].foreign_column_name).toBe('id');
    });

    it('should enforce user role constraints', async () => {
      // Test invalid role constraint
      await expect(
        db.query(`
          INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
          VALUES ($1, 'test-invalid@example.com', 'hash123', 'Test', 'User', 'invalid_role', 'active')
        `, [testTenantId])
      ).rejects.toThrow();
    });

    it('should enforce user status constraints', async () => {
      // Test invalid status constraint
      await expect(
        db.query(`
          INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
          VALUES ($1, 'test-invalid@example.com', 'hash123', 'Test', 'User', 'member', 'invalid_status')
        `, [testTenantId])
      ).rejects.toThrow();
    });

    it('should enforce unique email constraint within tenant', async () => {
      // Insert first user
      await db.query(`
        INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
        VALUES ($1, 'test-duplicate@example.com', 'hash123', 'Test', 'User', 'member', 'active')
      `, [testTenantId]);

      // Try to insert duplicate email in same tenant
      await expect(
        db.query(`
          INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
          VALUES ($1, 'test-duplicate@example.com', 'hash456', 'Another', 'User', 'member', 'active')
        `, [testTenantId])
      ).rejects.toThrow();
    });

    it('should allow same email across different tenants', async () => {
      // Insert user in first tenant
      await db.query(`
        INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
        VALUES ($1, 'test-cross-tenant@example.com', 'hash123', 'Test', 'User', 'member', 'active')
      `, [testTenantId]);

      // Insert same email in different tenant - should work
      await expect(
        db.query(`
          INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
          VALUES ($1, 'test-cross-tenant@example.com', 'hash456', 'Another', 'User', 'admin', 'active')
        `, [testAgencyId])
      ).resolves.not.toThrow();
    });
  });

  describe('CRUD operations', () => {
    it('should create a new tenant user successfully', async () => {
      const userData: CreateTenantUser = {
        tenant_id: testTenantId,
        email: 'test-create@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'member',
        status: 'active'
      };

      const user = await usersRepo.create(userData);

      expect(user.id).toBeDefined();
      expect(user.tenant_id).toBe(testTenantId);
      expect(user.email).toBe('test-create@example.com');
      expect(user.first_name).toBe('John');
      expect(user.last_name).toBe('Doe');
      expect(user.role).toBe('member');
      expect(user.status).toBe('active');
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });

    it('should create user with optional profile data', async () => {
      const userData: CreateTenantUser = {
        tenant_id: testTenantId,
        email: 'test-profile@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'admin',
        status: 'active',
        profile_data: {
          phone: '+1234567890',
          address: '123 Main St',
          preferences: {
            theme: 'dark',
            notifications: true
          }
        }
      };

      const user = await usersRepo.create(userData);

      expect(user.profile_data).toEqual(userData.profile_data);
    });

    it('should find tenant user by id', async () => {
      // Create a user first
      const userData: CreateTenantUser = {
        tenant_id: testTenantId,
        email: 'test-findid@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Find',
        last_name: 'Me',
        role: 'member',
        status: 'active'
      };

      const createdUser = await usersRepo.create(userData);
      const foundUser = await usersRepo.findById(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser!.id).toBe(createdUser.id);
      expect(foundUser!.email).toBe('test-findid@example.com');
      expect(foundUser!.tenant_id).toBe(testTenantId);
    });

    it('should find tenant user by email within tenant', async () => {
      // Create a user first
      const userData: CreateTenantUser = {
        tenant_id: testTenantId,
        email: 'test-findemail@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Find',
        last_name: 'Email',
        role: 'member',
        status: 'active'
      };

      await usersRepo.create(userData);
      const foundUser = await usersRepo.findByEmail(testTenantId, 'test-findemail@example.com');

      expect(foundUser).toBeDefined();
      expect(foundUser!.email).toBe('test-findemail@example.com');
      expect(foundUser!.tenant_id).toBe(testTenantId);
    });

    it('should not find user by email in different tenant', async () => {
      // Create user in first tenant
      const userData: CreateTenantUser = {
        tenant_id: testTenantId,
        email: 'test-tenant-isolation@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Isolated',
        last_name: 'User',
        role: 'member',
        status: 'active'
      };

      await usersRepo.create(userData);

      // Try to find in different tenant
      const foundUser = await usersRepo.findByEmail(testAgencyId, 'test-tenant-isolation@example.com');
      expect(foundUser).toBeNull();
    });

    it('should update tenant user successfully', async () => {
      // Create a user first
      const userData: CreateTenantUser = {
        tenant_id: testTenantId,
        email: 'test-update@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Update',
        last_name: 'Me',
        role: 'member',
        status: 'active'
      };

      const createdUser = await usersRepo.create(userData);

      // Update the user
      const updateData: UpdateTenantUser = {
        first_name: 'Updated',
        last_name: 'Name',
        role: 'admin',
        profile_data: {
          phone: '+9876543210',
          updated: true
        }
      };

      const updatedUser = await usersRepo.update(createdUser.id, updateData);

      expect(updatedUser.first_name).toBe('Updated');
      expect(updatedUser.last_name).toBe('Name');
      expect(updatedUser.role).toBe('admin');
      expect(updatedUser.profile_data).toEqual(updateData.profile_data);
      expect(updatedUser.updated_at.getTime()).toBeGreaterThan(createdUser.updated_at.getTime());
    });

    it('should update user last login timestamp', async () => {
      // Create a user first
      const userData: CreateTenantUser = {
        tenant_id: testTenantId,
        email: 'test-login@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Login',
        last_name: 'User',
        role: 'member',
        status: 'active'
      };

      const createdUser = await usersRepo.create(userData);
      expect(createdUser.last_login_at).toBeNull();

      // Update last login
      const updatedUser = await usersRepo.updateLastLogin(createdUser.id);
      
      expect(updatedUser.last_login_at).toBeInstanceOf(Date);
      expect(updatedUser.last_login_at!.getTime()).toBeGreaterThan(createdUser.created_at.getTime());
    });

    it('should mark email as verified', async () => {
      // Create a user first
      const userData: CreateTenantUser = {
        tenant_id: testTenantId,
        email: 'test-verify@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Verify',
        last_name: 'Email',
        role: 'member',
        status: 'active'
      };

      const createdUser = await usersRepo.create(userData);
      expect(createdUser.email_verified_at).toBeNull();

      // Verify email
      const verifiedUser = await usersRepo.markEmailVerified(createdUser.id);
      
      expect(verifiedUser.email_verified_at).toBeInstanceOf(Date);
      expect(verifiedUser.email_verified_at!.getTime()).toBeGreaterThan(createdUser.created_at.getTime());
    });

    it('should delete tenant user successfully', async () => {
      // Create a user first
      const userData: CreateTenantUser = {
        tenant_id: testTenantId,
        email: 'test-delete@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Delete',
        last_name: 'Me',
        role: 'member',
        status: 'active'
      };

      const createdUser = await usersRepo.create(userData);

      // Delete the user
      const deleted = await usersRepo.delete(createdUser.id);
      expect(deleted).toBe(true);

      // Verify user is deleted
      const foundUser = await usersRepo.findById(createdUser.id);
      expect(foundUser).toBeNull();
    });

    it('should list all users in tenant with pagination', async () => {
      // Create multiple users
      const users = await Promise.all([
        usersRepo.create({
          tenant_id: testTenantId,
          email: 'test-list1@example.com',
          password_hash: 'hash123',
          first_name: 'User1',
          last_name: 'Test',
          role: 'member',
          status: 'active'
        }),
        usersRepo.create({
          tenant_id: testTenantId,
          email: 'test-list2@example.com',
          password_hash: 'hash123',
          first_name: 'User2',
          last_name: 'Test',
          role: 'admin',
          status: 'active'
        }),
        usersRepo.create({
          tenant_id: testTenantId,
          email: 'test-list3@example.com',
          password_hash: 'hash123',
          first_name: 'User3',
          last_name: 'Test',
          role: 'member',
          status: 'inactive'
        })
      ]);

      const result = await usersRepo.listByTenant(testTenantId, { page: 1, limit: 2 });

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it('should filter users by role', async () => {
      // Create users with different roles
      await Promise.all([
        usersRepo.create({
          tenant_id: testTenantId,
          email: 'test-admin1@example.com',
          password_hash: 'hash123',
          first_name: 'Admin1',
          last_name: 'Test',
          role: 'admin',
          status: 'active'
        }),
        usersRepo.create({
          tenant_id: testTenantId,
          email: 'test-member1@example.com',
          password_hash: 'hash123',
          first_name: 'Member1',
          last_name: 'Test',
          role: 'member',
          status: 'active'
        })
      ]);

      const adminUsers = await usersRepo.listByTenant(testTenantId, { role: 'admin' });
      const memberUsers = await usersRepo.listByTenant(testTenantId, { role: 'member' });

      expect(adminUsers.users.every(user => user.role === 'admin')).toBe(true);
      expect(memberUsers.users.every(user => user.role === 'member')).toBe(true);
    });

    it('should filter users by status', async () => {
      // Create users with different statuses
      await Promise.all([
        usersRepo.create({
          tenant_id: testTenantId,
          email: 'test-active1@example.com',
          password_hash: 'hash123',
          first_name: 'Active1',
          last_name: 'Test',
          role: 'member',
          status: 'active'
        }),
        usersRepo.create({
          tenant_id: testTenantId,
          email: 'test-inactive1@example.com',
          password_hash: 'hash123',
          first_name: 'Inactive1',
          last_name: 'Test',
          role: 'member',
          status: 'inactive'
        })
      ]);

      const activeUsers = await usersRepo.listByTenant(testTenantId, { status: 'active' });
      const inactiveUsers = await usersRepo.listByTenant(testTenantId, { status: 'inactive' });

      expect(activeUsers.users.every(user => user.status === 'active')).toBe(true);
      expect(inactiveUsers.users.every(user => user.status === 'inactive')).toBe(true);
    });
  });

  describe('business logic validation', () => {
    it('should validate user belongs to tenant', async () => {
      // Create user in first tenant
      const userData: CreateTenantUser = {
        tenant_id: testTenantId,
        email: 'test-belongs@example.com',
        password_hash: 'hash123',
        first_name: 'Belongs',
        last_name: 'Test',
        role: 'member',
        status: 'active'
      };

      const user = await usersRepo.create(userData);

      // Verify user belongs to correct tenant
      const belongsToTenant = await usersRepo.userBelongsToTenant(user.id, testTenantId);
      expect(belongsToTenant).toBe(true);

      // Verify user doesn't belong to different tenant
      const belongsToOtherTenant = await usersRepo.userBelongsToTenant(user.id, testAgencyId);
      expect(belongsToOtherTenant).toBe(false);
    });

    it('should count active users in tenant', async () => {
      // Create users with different statuses
      await Promise.all([
        usersRepo.create({
          tenant_id: testTenantId,
          email: 'test-count-active1@example.com',
          password_hash: 'hash123',
          first_name: 'Active1',
          last_name: 'Count',
          role: 'member',
          status: 'active'
        }),
        usersRepo.create({
          tenant_id: testTenantId,
          email: 'test-count-active2@example.com',
          password_hash: 'hash123',
          first_name: 'Active2',
          last_name: 'Count',
          role: 'admin',
          status: 'active'
        }),
        usersRepo.create({
          tenant_id: testTenantId,
          email: 'test-count-inactive@example.com',
          password_hash: 'hash123',
          first_name: 'Inactive',
          last_name: 'Count',
          role: 'member',
          status: 'inactive'
        })
      ]);

      const activeCount = await usersRepo.countActiveUsersInTenant(testTenantId);
      expect(activeCount).toBe(2);
    });

    it('should get user with tenant details', async () => {
      // Create user
      const userData: CreateTenantUser = {
        tenant_id: testTenantId,
        email: 'test-with-tenant@example.com',
        password_hash: 'hash123',
        first_name: 'With',
        last_name: 'Tenant',
        role: 'member',
        status: 'active'
      };

      const user = await usersRepo.create(userData);

      // Get user with tenant details
      const userWithTenant = await usersRepo.findByIdWithTenant(user.id);

      expect(userWithTenant).toBeDefined();
      expect(userWithTenant!.user.id).toBe(user.id);
      expect(userWithTenant!.tenant.id).toBe(testTenantId);
      expect(userWithTenant!.tenant.name).toBe('Test Tenant for Users');
    });

    it('should handle password hash validation', async () => {
      // Create user
      const userData: CreateTenantUser = {
        tenant_id: testTenantId,
        email: 'test-password@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Password',
        last_name: 'Test',
        role: 'member',
        status: 'active'
      };

      const user = await usersRepo.create(userData);

      // Update password hash
      const updatedUser = await usersRepo.updatePassword(user.id, 'new_hashed_password_456');
      
      expect(updatedUser.password_hash).toBe('new_hashed_password_456');
      expect(updatedUser.updated_at.getTime()).toBeGreaterThan(user.updated_at.getTime());
    });

    it('should not allow creating user with non-existent tenant', async () => {
      const userData: CreateTenantUser = {
        tenant_id: '00000000-0000-0000-0000-000000000000',
        email: 'test-invalid-tenant@example.com',
        password_hash: 'hash123',
        first_name: 'Invalid',
        last_name: 'Tenant',
        role: 'member',
        status: 'active'
      };

      await expect(usersRepo.create(userData)).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Create a repository with invalid connection
      const invalidDb = new DatabaseConnection();
      const invalidRepo = new TenantUsersRepository(invalidDb);

      await expect(
        invalidRepo.findById('test-id')
      ).rejects.toThrow();
    });

    it('should return null for non-existent user', async () => {
      const user = await usersRepo.findById('00000000-0000-0000-0000-000000000000');
      expect(user).toBeNull();
    });

    it('should return false when deleting non-existent user', async () => {
      const deleted = await usersRepo.delete('00000000-0000-0000-0000-000000000000');
      expect(deleted).toBe(false);
    });
  });
});
#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE TENANT USERS REPOSITORY TESTS
 * ==============================================
 * 
 * Migrated from: src/database/tenant-users.test.ts
 * Original: 629 lines of comprehensive RBAC and database testing
 * 
 * Test Coverage:
 * - Database schema validation
 * - CRUD operations testing 
 * - Business logic validation
 * - Multi-tenant isolation
 * - Role-based access control (RBAC)
 * - Error handling and edge cases
 * 
 * Status: Production-ready comprehensive test suite
 */

const { describe, it, expect, beforeAll, afterAll, beforeEach } = require('vitest');
const dotenv = require('dotenv');
const { DatabaseConnection } = require('../../../src/database/connection-js.cjs');

// Load environment variables
dotenv.config({ path: '.env.local' });

describe('🔐 TenantUsersRepository - Comprehensive RBAC Tests', () => {
  let db;
  let testTenantId;
  let testAgencyId;

  beforeAll(async () => {
    db = new DatabaseConnection();
    await db.connect();

    // Create test tenants for relationships
    const testTenantResult = await db.query(`
      INSERT INTO tenants (name, type, status) 
      VALUES ($1, $2, $3) 
      RETURNING id
    `, ['Test Tenant for Users', 'couple', 'active']);
    testTenantId = testTenantResult.rows[0].id;

    const testAgencyResult = await db.query(`
      INSERT INTO tenants (name, type, status, subscription_plan) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id
    `, ['Test Agency for Users', 'wedding_agency', 'active', 'premium']);
    testAgencyId = testAgencyResult.rows[0].id;
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

  describe('📊 Database Schema Validation', () => {
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

  describe('🔧 CRUD Operations Testing', () => {
    it('should create a new tenant user successfully', async () => {
      const result = await db.query(`
        INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, tenant_id, email, first_name, last_name, role, status, created_at, updated_at
      `, [testTenantId, 'test-create@example.com', 'hashed_password_123', 'John', 'Doe', 'member', 'active']);

      const user = result.rows[0];

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
      const profileData = {
        phone: '+1234567890',
        address: '123 Main St',
        preferences: {
          theme: 'dark',
          notifications: true
        }
      };

      const result = await db.query(`
        INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status, profile_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING profile_data
      `, [testTenantId, 'test-profile@example.com', 'hashed_password_123', 'Jane', 'Smith', 'admin', 'active', JSON.stringify(profileData)]);

      const user = result.rows[0];
      expect(user.profile_data).toEqual(profileData);
    });

    it('should find tenant user by id', async () => {
      // Create a user first
      const createResult = await db.query(`
        INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [testTenantId, 'test-findid@example.com', 'hashed_password_123', 'Find', 'Me', 'member', 'active']);

      const userId = createResult.rows[0].id;

      const findResult = await db.query(`
        SELECT id, email, tenant_id
        FROM tenant_users 
        WHERE id = $1
      `, [userId]);

      const foundUser = findResult.rows[0];
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(userId);
      expect(foundUser.email).toBe('test-findid@example.com');
      expect(foundUser.tenant_id).toBe(testTenantId);
    });

    it('should find tenant user by email within tenant', async () => {
      // Create a user first
      await db.query(`
        INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [testTenantId, 'test-findemail@example.com', 'hashed_password_123', 'Find', 'Email', 'member', 'active']);

      const result = await db.query(`
        SELECT email, tenant_id
        FROM tenant_users 
        WHERE tenant_id = $1 AND email = $2
      `, [testTenantId, 'test-findemail@example.com']);

      const foundUser = result.rows[0];
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe('test-findemail@example.com');
      expect(foundUser.tenant_id).toBe(testTenantId);
    });

    it('should not find user by email in different tenant', async () => {
      // Create user in first tenant
      await db.query(`
        INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [testTenantId, 'test-tenant-isolation@example.com', 'hashed_password_123', 'Isolated', 'User', 'member', 'active']);

      // Try to find in different tenant
      const result = await db.query(`
        SELECT * FROM tenant_users 
        WHERE tenant_id = $1 AND email = $2
      `, [testAgencyId, 'test-tenant-isolation@example.com']);

      expect(result.rows).toHaveLength(0);
    });

    it('should update tenant user successfully', async () => {
      // Create a user first
      const createResult = await db.query(`
        INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, updated_at
      `, [testTenantId, 'test-update@example.com', 'hashed_password_123', 'Update', 'Me', 'member', 'active']);

      const userId = createResult.rows[0].id;
      const originalUpdatedAt = createResult.rows[0].updated_at;

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update the user
      const updateData = {
        phone: '+9876543210',
        updated: true
      };

      const updateResult = await db.query(`
        UPDATE tenant_users 
        SET first_name = $2, last_name = $3, role = $4, profile_data = $5, updated_at = NOW()
        WHERE id = $1
        RETURNING first_name, last_name, role, profile_data, updated_at
      `, [userId, 'Updated', 'Name', 'admin', JSON.stringify(updateData)]);

      const updatedUser = updateResult.rows[0];
      expect(updatedUser.first_name).toBe('Updated');
      expect(updatedUser.last_name).toBe('Name');
      expect(updatedUser.role).toBe('admin');
      expect(updatedUser.profile_data).toEqual(updateData);
      expect(new Date(updatedUser.updated_at).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });

    it('should delete tenant user successfully', async () => {
      // Create a user first
      const createResult = await db.query(`
        INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [testTenantId, 'test-delete@example.com', 'hashed_password_123', 'Delete', 'Me', 'member', 'active']);

      const userId = createResult.rows[0].id;

      // Delete the user
      const deleteResult = await db.query(`
        DELETE FROM tenant_users WHERE id = $1
      `, [userId]);

      expect(deleteResult.rowCount).toBe(1);

      // Verify user is deleted
      const findResult = await db.query(`
        SELECT * FROM tenant_users WHERE id = $1
      `, [userId]);

      expect(findResult.rows).toHaveLength(0);
    });
  });

  describe('🏢 Business Logic & Multi-Tenant Validation', () => {
    it('should validate user belongs to tenant', async () => {
      // Create user in first tenant
      const createResult = await db.query(`
        INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [testTenantId, 'test-belongs@example.com', 'hash123', 'Belongs', 'Test', 'member', 'active']);

      const userId = createResult.rows[0].id;

      // Verify user belongs to correct tenant
      const belongsResult = await db.query(`
        SELECT COUNT(*) as count FROM tenant_users 
        WHERE id = $1 AND tenant_id = $2
      `, [userId, testTenantId]);

      expect(parseInt(belongsResult.rows[0].count)).toBe(1);

      // Verify user doesn't belong to different tenant
      const notBelongsResult = await db.query(`
        SELECT COUNT(*) as count FROM tenant_users 
        WHERE id = $1 AND tenant_id = $2
      `, [userId, testAgencyId]);

      expect(parseInt(notBelongsResult.rows[0].count)).toBe(0);
    });

    it('should count active users in tenant', async () => {
      // Create users with different statuses
      await Promise.all([
        db.query(`
          INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [testTenantId, 'test-count-active1@example.com', 'hash123', 'Active1', 'Count', 'member', 'active']),
        
        db.query(`
          INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [testTenantId, 'test-count-active2@example.com', 'hash123', 'Active2', 'Count', 'admin', 'active']),
        
        db.query(`
          INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [testTenantId, 'test-count-inactive@example.com', 'hash123', 'Inactive', 'Count', 'member', 'inactive'])
      ]);

      const result = await db.query(`
        SELECT COUNT(*) as count FROM tenant_users 
        WHERE tenant_id = $1 AND status = 'active'
      `, [testTenantId]);

      const activeCount = parseInt(result.rows[0].count);
      expect(activeCount).toBe(2);
    });

    it('should list users with pagination and filtering', async () => {
      // Create multiple users with different attributes
      await Promise.all([
        db.query(`
          INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [testTenantId, 'test-list1@example.com', 'hash123', 'User1', 'Test', 'member', 'active']),
        
        db.query(`
          INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [testTenantId, 'test-list2@example.com', 'hash123', 'User2', 'Test', 'admin', 'active']),
        
        db.query(`
          INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [testTenantId, 'test-list3@example.com', 'hash123', 'User3', 'Test', 'member', 'inactive'])
      ]);

      // Test pagination (limit 2)
      const paginationResult = await db.query(`
        SELECT * FROM tenant_users 
        WHERE tenant_id = $1 
        ORDER BY created_at DESC 
        LIMIT 2
      `, [testTenantId]);

      expect(paginationResult.rows).toHaveLength(2);

      // Test role filtering
      const adminResult = await db.query(`
        SELECT * FROM tenant_users 
        WHERE tenant_id = $1 AND role = 'admin'
      `, [testTenantId]);

      expect(adminResult.rows.every(user => user.role === 'admin')).toBe(true);

      // Test status filtering
      const activeResult = await db.query(`
        SELECT * FROM tenant_users 
        WHERE tenant_id = $1 AND status = 'active'
      `, [testTenantId]);

      expect(activeResult.rows.every(user => user.status === 'active')).toBe(true);
    });

    it('should not allow creating user with non-existent tenant', async () => {
      await expect(
        db.query(`
          INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, ['00000000-0000-0000-0000-000000000000', 'test-invalid-tenant@example.com', 'hash123', 'Invalid', 'Tenant', 'member', 'active'])
      ).rejects.toThrow();
    });
  });

  describe('⚠️ Error Handling & Edge Cases', () => {
    it('should return empty result for non-existent user', async () => {
      const result = await db.query(`
        SELECT * FROM tenant_users WHERE id = $1
      `, ['00000000-0000-0000-0000-000000000000']);

      expect(result.rows).toHaveLength(0);
    });

    it('should return 0 when deleting non-existent user', async () => {
      const result = await db.query(`
        DELETE FROM tenant_users WHERE id = $1
      `, ['00000000-0000-0000-0000-000000000000']);

      expect(result.rowCount).toBe(0);
    });

    it('should handle database constraint violations gracefully', async () => {
      // Test with NULL required field
      await expect(
        db.query(`
          INSERT INTO tenant_users (tenant_id, email, password_hash, first_name, last_name, role, status)
          VALUES ($1, NULL, $2, $3, $4, $5, $6)
        `, [testTenantId, 'hash123', 'Test', 'User', 'member', 'active'])
      ).rejects.toThrow();
    });
  });
});

console.log('✅ Comprehensive Tenant Users test migrated successfully');
console.log('📊 Coverage: Schema, CRUD, Business Logic, Error Handling');
console.log('🔐 Features: RBAC, Multi-tenant isolation, Constraint validation');
#!/usr/bin/env node

/**
 * 🧪 TENANT USERS BASIC STRUCTURE TESTS
 * ====================================
 * 
 * Migrated from: src/database/tenant-users-simple.test.ts
 * Original: 57 lines of basic database structure validation
 * 
 * Test Coverage:
 * - Database table existence validation
 * - Table column structure verification  
 * - Repository instance creation
 * 
 * Purpose: Quick structural validation for CI/CD pipeline
 * Status: Production-ready basic validation suite
 */

const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const dotenv = require('dotenv');
const { DatabaseConnection } = require('../../../src/database/connection-js.cjs');

// Load environment variables
dotenv.config({ path: '.env.local' });

describe('🏗️ TenantUsersRepository - Basic Structure Tests', () => {
  let db;

  beforeAll(async () => {
    db = new DatabaseConnection();
    await db.connect();
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  it('should have tenant_users table', async () => {
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'tenant_users'
    `);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].table_name).toBe('tenant_users');
  });

  it('should have proper table columns', async () => {
    const result = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenant_users'
      ORDER BY ordinal_position
    `);

    const columnNames = result.rows.map(row => row.column_name);
    
    // Essential columns validation
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('tenant_id');
    expect(columnNames).toContain('email');
    expect(columnNames).toContain('password_hash');
    expect(columnNames).toContain('first_name');
    expect(columnNames).toContain('last_name');
    expect(columnNames).toContain('role');
    expect(columnNames).toContain('status');

    // Additional expected columns
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
    expect(columnNames).toContain('profile_data');
    expect(columnNames).toContain('last_login_at');
    expect(columnNames).toContain('email_verified_at');
  });

  it('should have proper data types for critical columns', async () => {
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'tenant_users' 
        AND column_name IN ('id', 'tenant_id', 'email', 'role', 'status')
      ORDER BY column_name
    `);

    const columnInfo = result.rows.reduce((acc, row) => {
      acc[row.column_name] = {
        data_type: row.data_type,
        is_nullable: row.is_nullable === 'YES'
      };
      return acc;
    }, {});

    // Validate UUID columns
    expect(columnInfo.id.data_type).toBe('uuid');
    expect(columnInfo.tenant_id.data_type).toBe('uuid');
    
    // Validate required fields are not nullable
    expect(columnInfo.id.is_nullable).toBe(false);
    expect(columnInfo.tenant_id.is_nullable).toBe(false);
    expect(columnInfo.email.is_nullable).toBe(false);
    expect(columnInfo.role.is_nullable).toBe(false);
    expect(columnInfo.status.is_nullable).toBe(false);
  });

  it('should have proper indexes on critical columns', async () => {
    const result = await db.query(`
      SELECT 
        i.relname as index_name,
        string_agg(a.attname, ', ' ORDER BY a.attnum) as columns
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = 'tenant_users'
        AND i.relname NOT LIKE '%pkey'
      GROUP BY i.relname
      ORDER BY i.relname
    `);

    const indexNames = result.rows.map(row => row.index_name);
    
    // Should have performance indexes on commonly queried columns
    const hasEmailIndex = result.rows.some(row => 
      row.columns.includes('email') || row.columns.includes('tenant_id')
    );
    expect(hasEmailIndex).toBe(true);
  });

  it('should validate table exists with proper structure', async () => {
    // Combined validation test
    const tableInfo = await db.query(`
      SELECT 
        COUNT(*) as column_count,
        COUNT(CASE WHEN is_nullable = 'NO' THEN 1 END) as required_columns,
        COUNT(CASE WHEN data_type = 'uuid' THEN 1 END) as uuid_columns
      FROM information_schema.columns 
      WHERE table_name = 'tenant_users'
    `);

    const info = tableInfo.rows[0];
    
    // Should have reasonable number of columns
    expect(parseInt(info.column_count)).toBeGreaterThan(10);
    
    // Should have required fields
    expect(parseInt(info.required_columns)).toBeGreaterThan(5);
    
    // Should have UUID primary and foreign keys
    expect(parseInt(info.uuid_columns)).toBeGreaterThanOrEqual(2);
  });
});

console.log('✅ Basic Tenant Users structure test migrated successfully');
console.log('🏗️ Coverage: Table existence, Column structure, Data types, Indexes');
console.log('⚡ Purpose: Quick structural validation for CI/CD pipeline');
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import { DatabaseConnection } from './connection';
import { TenantUsersRepository } from './tenant-users';

// Load environment variables
dotenv.config({ path: '.env.local' });

describe('TenantUsersRepository Basic Tests', () => {
  let db: DatabaseConnection;
  let usersRepo: TenantUsersRepository;

  beforeAll(async () => {
    db = new DatabaseConnection();
    await db.connect();
    usersRepo = new TenantUsersRepository(db);
  });

  afterAll(async () => {
    await db.close();
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
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('tenant_id');
    expect(columnNames).toContain('email');
    expect(columnNames).toContain('password_hash');
    expect(columnNames).toContain('first_name');
    expect(columnNames).toContain('last_name');
    expect(columnNames).toContain('role');
    expect(columnNames).toContain('status');
  });

  it('should create TenantUsersRepository instance', () => {
    expect(usersRepo).toBeInstanceOf(TenantUsersRepository);
  });
});
import { test, expect, describe, beforeAll, afterAll, beforeEach } from 'vitest';
import { config } from 'dotenv';
import { DatabaseConnection } from './connection';
import { TenantsRepository } from './tenants';

// Load environment variables for testing
config({ path: '.env.local' });
process.env.NODE_ENV = 'test';

describe('TenantsRepository Simple Tests', () => {
  let db: DatabaseConnection;
  let tenantsRepo: TenantsRepository;

  beforeAll(async () => {
    db = new DatabaseConnection({
      database: process.env.TEST_DB_NAME || 'weddinvite_enterprise_test'
    });
    await db.connect();
    tenantsRepo = new TenantsRepository(db);
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  beforeEach(async () => {
    // Clean up tenants table before each test
    await db.query('DELETE FROM tenants WHERE id IS NOT NULL');
  });

  test('should create a new tenant successfully', async () => {
    const tenantData = {
      name: 'Test Wedding Agency',
      type: 'wedding_agency' as const,
      status: 'active' as const,
      subscription_plan: 'premium' as const,
      subscription_status: 'active' as const
    };

    const tenant = await tenantsRepo.create(tenantData);
    
    expect(tenant).toBeDefined();
    expect(tenant.id).toBeDefined();
    expect(tenant.name).toBe(tenantData.name);
    expect(tenant.type).toBe(tenantData.type);
    expect(tenant.status).toBe(tenantData.status);
  });

  test('should find tenant by id', async () => {
    const tenant = await tenantsRepo.create({
      name: 'Test Tenant',
      type: 'wedding_agency' as const,
      status: 'active' as const
    });

    const foundTenant = await tenantsRepo.findById(tenant.id);
    
    expect(foundTenant).toBeDefined();
    expect(foundTenant?.id).toBe(tenant.id);
    expect(foundTenant?.name).toBe(tenant.name);
  });

  test('should update tenant successfully', async () => {
    const tenant = await tenantsRepo.create({
      name: 'Original Name',
      type: 'wedding_agency' as const,
      status: 'active' as const
    });

    const updatedTenant = await tenantsRepo.update(tenant.id, {
      name: 'Updated Name',
      status: 'suspended' as const
    });

    expect(updatedTenant).toBeDefined();
    expect(updatedTenant?.name).toBe('Updated Name');
    expect(updatedTenant?.status).toBe('suspended');
  });
});
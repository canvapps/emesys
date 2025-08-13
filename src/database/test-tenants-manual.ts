import { config } from 'dotenv';
import { DatabaseConnection } from './connection.js';
import { TenantsRepository } from './tenants.js';
import { MigrationRunner } from './migrate.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });
process.env.NODE_ENV = 'test';

async function runMigrations(db: DatabaseConnection) {
  console.log('🔧 Running database migrations...');
  
  try {
    // Run migrations
    const migrationRunner = new MigrationRunner(db);
    await migrationRunner.runAllMigrations();
    console.log('✅ Database migrations completed\n');
  } catch (error) {
    console.log('⚠️  Migrations may have failed (tables might already exist), continuing...\n');
  }
}

async function runTests() {
  console.log('🧪 Starting Tenants Repository Tests...\n');
  
  let db: DatabaseConnection;
  let tenantsRepo: TenantsRepository;
  
  try {
    // Setup
    console.log('📝 Setting up database connection...');
    db = new DatabaseConnection({
      database: process.env.TEST_DB_NAME || 'weddinvite_enterprise_test',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.TEST_DB_USER || process.env.DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'admin'
    });
    
    const connected = await db.connect();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }
    
    console.log('✅ Database connected successfully');
    
    // Run migrations first
    await runMigrations(db);
    
    tenantsRepo = new TenantsRepository(db);
    
    // Clean up before tests
    await db.query('DELETE FROM tenants WHERE id IS NOT NULL');
    console.log('🧹 Cleaned up test data\n');
    
    // Test 1: Create tenant
    console.log('🔧 Test 1: Create a new tenant');
    const tenantData = {
      name: 'Test Wedding Agency',
      type: 'wedding_agency' as const,
      status: 'active' as const,
      subscription_plan: 'premium' as const,
      subscription_status: 'active' as const
    };
    
    const tenant = await tenantsRepo.create(tenantData);
    console.log('✅ Created tenant:', {
      id: tenant.id,
      name: tenant.name,
      type: tenant.type,
      status: tenant.status
    });
    
    // Test 2: Find tenant by ID
    console.log('\n🔧 Test 2: Find tenant by ID');
    const foundTenant = await tenantsRepo.findById(tenant.id);
    if (foundTenant && foundTenant.id === tenant.id) {
      console.log('✅ Found tenant by ID successfully');
    } else {
      throw new Error('Failed to find tenant by ID');
    }
    
    // Test 3: Update tenant
    console.log('\n🔧 Test 3: Update tenant');
    const updatedTenant = await tenantsRepo.update(tenant.id, {
      name: 'Updated Wedding Agency',
      status: 'suspended' as const
    });
    
    if (updatedTenant && updatedTenant.name === 'Updated Wedding Agency' && updatedTenant.status === 'suspended') {
      console.log('✅ Updated tenant successfully');
    } else {
      throw new Error('Failed to update tenant');
    }
    
    // Test 4: List tenants
    console.log('\n🔧 Test 4: List all tenants');
    const tenants = await tenantsRepo.findAll({ limit: 10, offset: 0 });
    if (tenants.data.length > 0 && tenants.total > 0) {
      console.log('✅ Listed tenants successfully:', {
        count: tenants.data.length,
        total: tenants.total
      });
    } else {
      throw new Error('Failed to list tenants');
    }
    
    // Test 5: Delete tenant
    console.log('\n🔧 Test 5: Delete tenant');
    const deleted = await tenantsRepo.delete(tenant.id);
    if (deleted) {
      console.log('✅ Deleted tenant successfully');
    } else {
      throw new Error('Failed to delete tenant');
    }
    
    // Test 6: Verify deletion
    console.log('\n🔧 Test 6: Verify tenant deletion');
    const deletedTenant = await tenantsRepo.findById(tenant.id);
    if (deletedTenant === null) {
      console.log('✅ Verified tenant deletion');
    } else {
      throw new Error('Tenant still exists after deletion');
    }
    
    console.log('\n🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    if (db) {
      await db.close();
      console.log('🔚 Database connection closed');
    }
  }
}

// Run tests
runTests();
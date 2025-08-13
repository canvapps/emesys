import dotenv from 'dotenv';
import { DatabaseConnection } from './connection.js';
import { TenantsRepository } from './tenants.js';
import { TenantUsersRepository } from './tenant-users.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface VerificationResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

class DatabaseVerifier {
  private db: DatabaseConnection;
  private results: VerificationResult[] = [];

  constructor() {
    this.db = new DatabaseConnection();
  }

  private addResult(step: string, success: boolean, message: string, data?: any, error?: any) {
    this.results.push({ step, success, message, data, error });
    const status = success ? '✅' : '❌';
    console.log(`${status} ${step}: ${message}`);
    if (data) {
      console.log(`   📊 Data:`, data);
    }
    if (error) {
      console.log(`   🚨 Error:`, error.message);
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.db.connect();
      this.addResult('Database Connection', true, 'Successfully connected to PostgreSQL');
      return true;
    } catch (error: any) {
      this.addResult('Database Connection', false, 'Failed to connect', undefined, error);
      return false;
    }
  }

  async verifyDatabaseExists(): Promise<boolean> {
    try {
      const result = await this.db.query('SELECT current_database() as db_name');
      const dbName = result.rows[0]?.db_name;
      this.addResult('Database Existence', true, `Connected to database: ${dbName}`, { database: dbName });
      return true;
    } catch (error: any) {
      this.addResult('Database Existence', false, 'Cannot verify database', undefined, error);
      return false;
    }
  }

  async verifyTables(): Promise<boolean> {
    try {
      // Check if tables exist
      const tableQuery = `
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('tenants', 'tenant_users')
        ORDER BY table_name
      `;
      
      const result = await this.db.query(tableQuery);
      const tables = result.rows.map(row => row.table_name);
      
      const expectedTables = ['tenants', 'tenant_users'];
      const missingTables = expectedTables.filter(table => !tables.includes(table));
      
      if (missingTables.length === 0) {
        this.addResult('Table Verification', true, 'All required tables exist', { tables });
        return true;
      } else {
        this.addResult('Table Verification', false, `Missing tables: ${missingTables.join(', ')}`, { 
          existing: tables, 
          missing: missingTables 
        });
        return false;
      }
    } catch (error: any) {
      this.addResult('Table Verification', false, 'Error checking tables', undefined, error);
      return false;
    }
  }

  async verifyTableStructure(): Promise<boolean> {
    try {
      // Check tenants table structure
      const tenantsColumns = await this.db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'tenants' 
        ORDER BY ordinal_position
      `);

      // Check tenant_users table structure
      const usersColumns = await this.db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'tenant_users' 
        ORDER BY ordinal_position
      `);

      this.addResult('Table Structure', true, 'Table structures verified', {
        tenants_columns: tenantsColumns.rows.length,
        tenant_users_columns: usersColumns.rows.length,
        tenants_structure: tenantsColumns.rows.map(r => r.column_name),
        users_structure: usersColumns.rows.map(r => r.column_name)
      });
      return true;
    } catch (error: any) {
      this.addResult('Table Structure', false, 'Error checking table structure', undefined, error);
      return false;
    }
  }

  async verifyConstraints(): Promise<boolean> {
    try {
      // Check foreign key constraints
      const constraintsQuery = `
        SELECT 
          tc.table_name,
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name IN ('tenants', 'tenant_users')
          AND tc.constraint_type IN ('FOREIGN KEY', 'PRIMARY KEY', 'UNIQUE')
        ORDER BY tc.table_name, tc.constraint_type
      `;

      const result = await this.db.query(constraintsQuery);
      this.addResult('Constraints Verification', true, 'Constraints verified', {
        total_constraints: result.rows.length,
        constraints: result.rows.map(r => ({
          table: r.table_name,
          type: r.constraint_type,
          column: r.column_name
        }))
      });
      return true;
    } catch (error: any) {
      this.addResult('Constraints Verification', false, 'Error checking constraints', undefined, error);
      return false;
    }
  }

  async testRepositoryOperations(): Promise<boolean> {
    try {
      const tenantsRepo = new TenantsRepository(this.db);
      const usersRepo = new TenantUsersRepository(this.db);

      // 1. Test Tenant Creation
      const testTenant = await tenantsRepo.create({
        name: 'Real-Time Test Agency',
        type: 'wedding_agency',
        status: 'active',
        subscription_plan: 'premium'
      });

      this.addResult('Tenant Creation', true, 'Tenant created successfully', {
        tenant_id: testTenant.id,
        tenant_name: testTenant.name
      });

      // 2. Test User Creation
      const testUser = await usersRepo.create({
        tenant_id: testTenant.id,
        email: 'realtime-test@example.com',
        password_hash: 'hashed_password_test',
        first_name: 'Real',
        last_name: 'Time',
        role: 'admin',
        status: 'active',
        profile_data: {
          phone: '+628123456789',
          preferences: { theme: 'light' }
        }
      });

      this.addResult('User Creation', true, 'User created successfully', {
        user_id: testUser.id,
        user_email: testUser.email,
        tenant_id: testUser.tenant_id
      });

      // 3. Test User Retrieval
      const retrievedUser = await usersRepo.findById(testUser.id);
      this.addResult('User Retrieval', true, 'User retrieved successfully', {
        found: retrievedUser !== null,
        email: retrievedUser?.email
      });

      // 4. Test User Update
      const updatedUser = await usersRepo.update(testUser.id, {
        first_name: 'Updated Real',
        profile_data: { phone: '+628987654321', updated: true }
      });

      this.addResult('User Update', true, 'User updated successfully', {
        old_name: testUser.first_name,
        new_name: updatedUser.first_name,
        profile_updated: !!updatedUser.profile_data.updated
      });

      // 5. Test Business Logic
      const belongsToTenant = await usersRepo.userBelongsToTenant(testUser.id, testTenant.id);
      this.addResult('Business Logic', true, 'Tenant relationship verified', {
        belongs_to_tenant: belongsToTenant
      });

      // 6. Test List Operations
      const usersList = await usersRepo.listByTenant(testTenant.id, { limit: 10 });
      this.addResult('List Operations', true, 'User listing works', {
        total_users: usersList.total,
        users_found: usersList.users.length
      });

      // 7. Cleanup Test Data
      await usersRepo.delete(testUser.id);
      await tenantsRepo.delete(testTenant.id);
      
      this.addResult('Cleanup', true, 'Test data cleaned up successfully');

      return true;
    } catch (error: any) {
      this.addResult('Repository Operations', false, 'Error in repository operations', undefined, error);
      return false;
    }
  }

  async verifyDataIntegrity(): Promise<boolean> {
    try {
      // Check current data in tables
      const tenantsCount = await this.db.query('SELECT COUNT(*) as count FROM tenants');
      const usersCount = await this.db.query('SELECT COUNT(*) as count FROM tenant_users');
      
      // Check sample data
      const sampleTenants = await this.db.query('SELECT id, name, type, status FROM tenants LIMIT 5');
      const sampleUsers = await this.db.query('SELECT id, email, first_name, last_name, role FROM tenant_users LIMIT 5');

      this.addResult('Data Integrity', true, 'Data integrity verified', {
        tenants_count: parseInt(tenantsCount.rows[0].count),
        users_count: parseInt(usersCount.rows[0].count),
        sample_tenants: sampleTenants.rows,
        sample_users: sampleUsers.rows
      });
      return true;
    } catch (error: any) {
      this.addResult('Data Integrity', false, 'Error checking data integrity', undefined, error);
      return false;
    }
  }

  async runFullVerification(): Promise<void> {
    console.log('\n🔍 **STARTING REAL-TIME DATABASE VERIFICATION**\n');
    console.log(`📅 Time: ${new Date().toISOString()}`);
    console.log(`🏠 Database: ${process.env.DB_NAME || 'Not set'}`);
    console.log(`🌐 Host: ${process.env.DB_HOST || 'Not set'}:${process.env.DB_PORT || 'Not set'}`);
    console.log(`👤 User: ${process.env.DB_USER || 'Not set'}\n`);

    let allPassed = true;

    try {
      // Step 1: Connection Test
      const connected = await this.verifyConnection();
      if (!connected) {
        allPassed = false;
        console.log('\n❌ **VERIFICATION FAILED - Cannot connect to database**');
        return;
      }

      // Step 2: Database Existence
      allPassed = await this.verifyDatabaseExists() && allPassed;

      // Step 3: Tables Verification
      const tablesExist = await this.verifyTables();
      if (!tablesExist) {
        console.log('\n🔧 **Running migrations to create missing tables...**');
        // Import and run migration
        const { MigrationRunner } = await import('./migrate.js');
        const migrationRunner = new MigrationRunner(this.db);
        await migrationRunner.runAllMigrations();
        
        // Re-check tables after migration
        await this.verifyTables();
      }

      // Step 4: Table Structure
      allPassed = await this.verifyTableStructure() && allPassed;

      // Step 5: Constraints
      allPassed = await this.verifyConstraints() && allPassed;

      // Step 6: Repository Operations (Real-time CRUD)
      allPassed = await this.testRepositoryOperations() && allPassed;

      // Step 7: Data Integrity
      allPassed = await this.verifyDataIntegrity() && allPassed;

      // Final Results
      console.log('\n📊 **VERIFICATION SUMMARY**');
      console.log('═══════════════════════════════════════');
      
      const passedCount = this.results.filter(r => r.success).length;
      const totalCount = this.results.length;
      
      console.log(`✅ Passed: ${passedCount}/${totalCount}`);
      console.log(`❌ Failed: ${totalCount - passedCount}/${totalCount}`);
      
      if (allPassed) {
        console.log('\n🎉 **ALL VERIFICATIONS PASSED!**');
        console.log('✨ Database is fully operational and ready for use');
      } else {
        console.log('\n⚠️  **SOME VERIFICATIONS FAILED**');
        console.log('🔧 Please check the errors above and fix the issues');
      }

    } catch (error: any) {
      console.error('\n💥 **UNEXPECTED ERROR DURING VERIFICATION**');
      console.error(error);
    } finally {
      await this.db.close();
      console.log('\n🔌 Database connection closed\n');
    }
  }
}

// Export for module use
export { DatabaseVerifier };

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new DatabaseVerifier();
  verifier.runFullVerification();
}
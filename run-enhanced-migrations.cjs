#!/usr/bin/env node

/**
 * Enhanced Migration System CLI Runner
 * Supports migrations, seeders, dan advanced database management
 */

const { Client } = require('pg');
const { readFileSync, readdirSync, existsSync, mkdirSync } = require('fs');
const { join, basename } = require('path');
const { createHash } = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// CLI Arguments parsing
const args = process.argv.slice(2);
const command = args[0];
const environment = args[1] || 'development';

// Database connection
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'weddinvite_enterprise',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin'
});

class EnhancedMigrationCLI {
  constructor() {
    this.migrationsDir = join(__dirname, 'src', 'database', 'migrations');
    this.seedersDir = join(__dirname, 'src', 'database', 'seeders');
  }

  async connect() {
    console.log('⏳ Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');
  }

  async disconnect() {
    await client.end();
    console.log('🔌 Database connection closed');
  }

  async initializeTables() {
    console.log('⏳ Initializing enhanced migration system...');
    
    // Enhanced migrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        version VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64) NOT NULL,
        execution_time_ms INTEGER DEFAULT 0,
        rollback_sql TEXT,
        dependencies JSONB DEFAULT '[]'::JSONB,
        created_by VARCHAR(100) DEFAULT 'system',
        notes TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_migrations_version ON migrations(version);
      CREATE INDEX IF NOT EXISTS idx_migrations_executed_at ON migrations(executed_at);
      CREATE INDEX IF NOT EXISTS idx_migrations_checksum ON migrations(checksum);
    `);

    // Seeders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS seeders (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64) NOT NULL,
        execution_time_ms INTEGER DEFAULT 0,
        environment VARCHAR(50) DEFAULT 'development',
        created_by VARCHAR(100) DEFAULT 'system'
      );
      
      CREATE INDEX IF NOT EXISTS idx_seeders_executed_at ON seeders(executed_at);
      CREATE INDEX IF NOT EXISTS idx_seeders_environment ON seeders(environment);
    `);

    console.log('✅ Enhanced migration system initialized');
  }

  parseMigrationFile(filename) {
    const filePath = join(this.migrationsDir, filename);
    const content = readFileSync(filePath, 'utf8');
    
    // Extract version from filename
    const versionMatch = filename.match(/^(\d+)_(.+)\.sql$/);
    if (!versionMatch) {
      throw new Error(`Invalid migration filename format: ${filename}`);
    }
    
    const version = versionMatch[1];
    const name = versionMatch[2].replace(/_/g, ' ');
    
    // Calculate checksum
    const checksum = createHash('sha256').update(content).digest('hex');
    
    // Extract rollback SQL if exists
    let sql = content;
    let rollback_sql = null;
    
    const rollbackMatch = content.match(/-- ROLLBACK:(.*?)(?=-- |\Z)/s);
    if (rollbackMatch) {
      rollback_sql = rollbackMatch[1].trim();
      sql = content.replace(/-- ROLLBACK:.*$/s, '').trim();
    }
    
    return {
      filename,
      version,
      name,
      sql,
      checksum,
      rollback_sql
    };
  }

  async runMigrations() {
    const startTime = Date.now();
    
    try {
      await this.initializeTables();
      
      if (!existsSync(this.migrationsDir)) {
        console.log('📂 No migrations directory found');
        return;
      }

      const migrationFiles = readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      if (migrationFiles.length === 0) {
        console.log('📂 No migration files found');
        return;
      }

      console.log(`📋 Found ${migrationFiles.length} migration files`);

      // Get executed migrations
      const executedResult = await client.query('SELECT filename, checksum FROM migrations');
      const executedMigrations = executedResult.rows.reduce((acc, row) => {
        acc[row.filename] = row.checksum;
        return acc;
      }, {});

      let executed = 0;
      let skipped = 0;

      for (const filename of migrationFiles) {
        const migration = this.parseMigrationFile(filename);

        if (executedMigrations[filename]) {
          // Verify checksum
          if (executedMigrations[filename] !== migration.checksum) {
            throw new Error(`Migration ${filename} has been modified (checksum mismatch)`);
          }
          
          console.log(`⏩ Skipping ${filename} (already executed)`);
          skipped++;
          continue;
        }

        console.log(`⏳ Running migration: ${filename}`);
        const migrationStartTime = Date.now();

        try {
          // Begin transaction
          await client.query('BEGIN');
          
          // Execute migration
          await client.query(migration.sql);
          
          // Record migration
          await client.query(`
            INSERT INTO migrations (
              filename, version, name, checksum, execution_time_ms, rollback_sql
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            migration.filename,
            migration.version,
            migration.name,
            migration.checksum,
            Date.now() - migrationStartTime,
            migration.rollback_sql
          ]);
          
          // Commit transaction
          await client.query('COMMIT');
          
          executed++;
          console.log(`✅ Migration completed: ${filename} (${Date.now() - migrationStartTime}ms)`);
          
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Migration failed: ${filename}`);
          throw error;
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(`\n🎉 Migration completed in ${totalTime}ms`);
      console.log(`✅ Executed: ${executed} migrations`);
      console.log(`⏩ Skipped: ${skipped} migrations`);

    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`);
      throw error;
    }
  }

  async runSeeders(targetEnvironment = 'development') {
    try {
      if (!existsSync(this.seedersDir)) {
        console.log('📂 No seeders directory found, skipping seeders');
        return;
      }

      const seederFiles = readdirSync(this.seedersDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      if (seederFiles.length === 0) {
        console.log('📂 No seeder files found');
        return;
      }

      console.log(`🌱 Found ${seederFiles.length} seeder files for ${targetEnvironment}`);

      // Get executed seeders
      const executedResult = await client.query(
        'SELECT filename FROM seeders WHERE environment = $1',
        [targetEnvironment]
      );
      const executedSeeders = executedResult.rows.map(row => row.filename);

      let executed = 0;
      let skipped = 0;

      for (const filename of seederFiles) {
        if (executedSeeders.includes(filename)) {
          console.log(`⏩ Skipping ${filename} (already executed)`);
          skipped++;
          continue;
        }

        console.log(`⏳ Running seeder: ${filename}`);

        const filePath = join(this.seedersDir, filename);
        const content = readFileSync(filePath, 'utf8');
        const checksum = createHash('sha256').update(content).digest('hex');
        const seederStartTime = Date.now();

        try {
          // Begin transaction
          await client.query('BEGIN');
          
          // Execute seeder
          await client.query(content);
          
          // Record seeder execution
          await client.query(`
            INSERT INTO seeders (filename, checksum, execution_time_ms, environment) 
            VALUES ($1, $2, $3, $4)
          `, [filename, checksum, Date.now() - seederStartTime, targetEnvironment]);
          
          // Commit transaction
          await client.query('COMMIT');
          
          executed++;
          console.log(`✅ Seeder completed: ${filename} (${Date.now() - seederStartTime}ms)`);
          
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Seeder failed: ${filename}`);
          throw error;
        }
      }

      console.log(`\n🎉 Seeders completed successfully`);
      console.log(`✅ Executed: ${executed} seeders`);
      console.log(`⏩ Skipped: ${skipped} seeders`);

    } catch (error) {
      console.error(`❌ Seeder failed: ${error.message}`);
      throw error;
    }
  }

  async showStatus() {
    try {
      await this.initializeTables();

      console.log('\n📊 MIGRATION SYSTEM STATUS\n');

      // Migration status
      const migrationResult = await client.query(`
        SELECT 
          COUNT(*) as total_executed,
          AVG(execution_time_ms) as avg_execution_time,
          MAX(executed_at) as last_migration
        FROM migrations
      `);

      const migrationStats = migrationResult.rows[0];
      console.log('🔄 MIGRATIONS:');
      console.log(`  📋 Total executed: ${migrationStats.total_executed}`);
      console.log(`  ⏱️  Average time: ${Math.round(migrationStats.avg_execution_time || 0)}ms`);
      console.log(`  🕒 Last migration: ${migrationStats.last_migration || 'Never'}`);

      // Recent migrations
      const recentResult = await client.query(`
        SELECT filename, executed_at, execution_time_ms 
        FROM migrations 
        ORDER BY executed_at DESC 
        LIMIT 5
      `);

      if (recentResult.rows.length > 0) {
        console.log('\n📋 Recent migrations:');
        recentResult.rows.forEach(row => {
          console.log(`  ✅ ${row.filename} (${row.execution_time_ms}ms) - ${row.executed_at.toISOString().split('T')[0]}`);
        });
      }

      // Seeder status
      const seederResult = await client.query(`
        SELECT 
          environment,
          COUNT(*) as total_executed,
          MAX(executed_at) as last_seeder
        FROM seeders 
        GROUP BY environment
        ORDER BY environment
      `);

      console.log('\n🌱 SEEDERS:');
      if (seederResult.rows.length > 0) {
        seederResult.rows.forEach(row => {
          console.log(`  📦 ${row.environment}: ${row.total_executed} executed (last: ${row.last_seeder.toISOString().split('T')[0]})`);
        });
      } else {
        console.log('  📦 No seeders executed yet');
      }

      // Database tables
      const tablesResult = await client.query(`
        SELECT table_name, 
               (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      console.log('\n🗄️  DATABASE TABLES:');
      tablesResult.rows.forEach(table => {
        console.log(`  📋 ${table.table_name} (${table.column_count} columns)`);
      });

    } catch (error) {
      console.error(`❌ Status check failed: ${error.message}`);
      throw error;
    }
  }

  async rollback(filename) {
    try {
      console.log(`⏳ Rolling back migration: ${filename}`);

      // Get migration record
      const migrationResult = await client.query(
        'SELECT rollback_sql FROM migrations WHERE filename = $1',
        [filename]
      );

      if (migrationResult.rows.length === 0) {
        throw new Error(`Migration ${filename} not found in database`);
      }

      const rollbackSql = migrationResult.rows[0].rollback_sql;
      if (!rollbackSql) {
        throw new Error(`Migration ${filename} does not have rollback SQL`);
      }

      // Begin transaction
      await client.query('BEGIN');

      // Execute rollback
      await client.query(rollbackSql);

      // Remove migration record
      await client.query('DELETE FROM migrations WHERE filename = $1', [filename]);

      // Commit transaction
      await client.query('COMMIT');

      console.log(`✅ Migration rolled back: ${filename}`);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Rollback failed: ${error.message}`);
      throw error;
    }
  }

  showHelp() {
    console.log(`
🚀 Enhanced Database Migration System

USAGE:
  node run-enhanced-migrations.cjs <command> [options]

COMMANDS:
  migrate                Run all pending migrations
  seed [environment]     Run seeders for specific environment (default: development)
  status                 Show migration system status
  rollback <filename>    Rollback specific migration
  help                   Show this help message

EXAMPLES:
  node run-enhanced-migrations.cjs migrate
  node run-enhanced-migrations.cjs seed development
  node run-enhanced-migrations.cjs seed production
  node run-enhanced-migrations.cjs status
  node run-enhanced-migrations.cjs rollback 001_create_table.sql
  node run-enhanced-migrations.cjs help

ENVIRONMENTS:
  - development (default)
  - staging
  - production

NOTES:
  - Migrations run automatically with dependency checking
  - Seeders are environment-specific
  - All operations are transactional
  - Checksums prevent accidental modifications
    `);
  }
}

// Main execution
async function main() {
  const cli = new EnhancedMigrationCLI();

  try {
    await cli.connect();

    switch (command) {
      case 'migrate':
        await cli.runMigrations();
        break;
      
      case 'seed':
        await cli.runSeeders(environment);
        break;
      
      case 'status':
        await cli.showStatus();
        break;
      
      case 'rollback':
        if (!args[1]) {
          console.error('❌ Rollback requires filename argument');
          process.exit(1);
        }
        await cli.rollback(args[1]);
        break;
      
      case 'help':
      case '--help':
      case '-h':
        cli.showHelp();
        break;
      
      default:
        console.error(`❌ Unknown command: ${command || 'none'}`);
        cli.showHelp();
        process.exit(1);
    }

  } catch (error) {
    console.error(`💥 Operation failed: ${error.message}`);
    console.error(`📋 Code: ${error.code || 'N/A'}`);
    process.exit(1);
  } finally {
    await cli.disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { EnhancedMigrationCLI };
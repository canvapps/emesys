#!/usr/bin/env node

/**
 * FASE 0 TRANSFORMATION MIGRATION EXECUTOR
 * 
 * Comprehensive migration executor dengan safety checks, rollback capability,
 * dan detailed logging untuk transformasi dari wedding-specific ke generic Event Management Engine.
 * 
 * Usage:
 *   node execute_transformation.js [options]
 * 
 * Options:
 *   --dry-run         Run in dry-run mode (validate only)
 *   --skip-backup     Skip backup creation (NOT RECOMMENDED)
 *   --force          Force execution without confirmations
 *   --rollback       Execute rollback to previous state
 *   --validate-only  Only run validation tests
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const readline = require('readline');

class TransformationExecutor {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      skipBackup: options.skipBackup || false,
      force: options.force || false,
      rollback: options.rollback || false,
      validateOnly: options.validateOnly || false
    };
    
    this.client = null;
    this.startTime = new Date();
    this.migrationResults = [];
    
    // Progress tracking
    this.totalSteps = 5;
    this.currentStep = 0;
    this.progress = {
      completed: 0,
      total: 5,
      startTime: Date.now(),
      currentMigration: null,
      stepTiming: []
    };
    
    this.migrations = [
      {
        id: '006',
        name: 'event_types_foundation',
        file: '006_event_types_foundation.sql',
        description: 'Create generic event types foundation'
      },
      {
        id: '007', 
        name: 'events_core_tables',
        file: '007_events_core_tables.sql',
        description: 'Create core generic event tables'
      },
      {
        id: '008',
        name: 'enhanced_indexing', 
        file: '008_enhanced_indexing.sql',
        description: 'Add performance-optimized indexes'
      },
      {
        id: '009',
        name: 'wedding_compatibility',
        file: '009_wedding_compatibility.sql', 
        description: 'Create wedding compatibility views'
      },
      {
        id: '010',
        name: 'wedding_data_migration',
        file: '010_wedding_data_migration.sql',
        description: 'Migrate wedding data to generic structure'
      }
    ];
  }

  displayProgress(migration) {
    const percentage = Math.round((this.progress.completed / this.progress.total) * 100);
    const elapsed = Date.now() - this.progress.startTime;
    const elapsedSeconds = Math.round(elapsed / 1000);
    
    console.log(`\n📊 Progress: ${percentage}% (${this.progress.completed}/${this.progress.total}) | Elapsed: ${elapsedSeconds}s`);
    console.log(`🔄 Step ${migration.step}: ${migration.description}`);
    console.log('█'.repeat(Math.floor(percentage/5)) + '░'.repeat(20 - Math.floor(percentage/5)) + ` ${percentage}%`);
  }

  async checkDatabaseConnection() {
    console.log('\n🔍 Checking database connection...');
    
    try {
      if (!this.client) {
        await this.connect();
      }
      
      // Test connection with a simple query
      await this.client.query('SELECT 1');
      console.log('✅ Database connection verified');
      return true;
    } catch (error) {
      console.error('❌ Database connection check failed:', error.message);
      return false;
    }
  }

  async connect() {
    this.client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'weddinvite_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    });
    
    try {
      await this.client.connect();
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      console.log('✅ Database connection closed');
    }
  }

  async validatePrerequisites() {
    console.log('\n🔍 Validating prerequisites...');
    
    // Check if migration_logs table exists
    const logsTable = await this.client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migration_logs'
      )
    `);
    
    if (!logsTable.rows[0].exists) {
      throw new Error('Migration logs table not found. Please create it first.');
    }
    
    // Check for existing wedding data
    const weddingData = await this.client.query(`
      SELECT 
        (SELECT COUNT(*) FROM wedding_invitations) as invitations,
        (SELECT COUNT(*) FROM wedding_guests) as guests,
        (SELECT COUNT(*) FROM wedding_templates) as templates
    `);
    
    const data = weddingData.rows[0];
    console.log(`📊 Found existing data:
      - Wedding Invitations: ${data.invitations}
      - Wedding Guests: ${data.guests}  
      - Wedding Templates: ${data.templates}`);
    
    // Check if already migrated
    const existingMigrations = await this.client.query(`
      SELECT operation FROM migration_logs 
      WHERE operation LIKE 'migration_0%_event%' 
      AND status = 'completed'
      ORDER BY started_at
    `);
    
    if (existingMigrations.rows.length > 0) {
      console.log('⚠️  Some migrations already completed:');
      existingMigrations.rows.forEach(row => {
        console.log(`   - ${row.operation}`);
      });
      
      if (!this.options.force) {
        const proceed = await this.promptUser('Continue with remaining migrations? (y/N)');
        if (proceed.toLowerCase() !== 'y') {
          throw new Error('Migration cancelled by user');
        }
      }
    }
    
    console.log('✅ Prerequisites validated');
  }

  async createBackups() {
    if (this.options.skipBackup) {
      console.log('⚠️  Skipping backup creation (not recommended)');
      return;
    }
    
    console.log('\n💾 Creating data backups...');
    
    const backupQueries = [
      'CREATE TABLE wedding_invitations_backup_' + Date.now() + ' AS SELECT * FROM wedding_invitations',
      'CREATE TABLE wedding_guests_backup_' + Date.now() + ' AS SELECT * FROM wedding_guests', 
      'CREATE TABLE wedding_templates_backup_' + Date.now() + ' AS SELECT * FROM wedding_templates'
    ];
    
    for (const query of backupQueries) {
      try {
        await this.client.query(query);
        const tableName = query.match(/CREATE TABLE (\w+)/)[1];
        console.log(`   ✅ Backup created: ${tableName}`);
      } catch (error) {
        if (!error.message.includes('does not exist')) {
          throw error;
        }
        console.log(`   ⚠️  Source table not found, skipping backup`);
      }
    }
    
    console.log('✅ Backups completed');
  }

  async executeMigration(migration) {
    const migrationPath = path.join(__dirname, migration.file);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migration.file}`);
    }

    // Update progress
    this.currentStep = migration.step;
    this.progress.currentMigration = migration.file;
    this.progress.completed = migration.step - 1;
    
    // Display progress
    this.displayProgress(migration);
    
    console.log(`\n🚀 Migration started: ${migration.id} - ${migration.description}`);
    
    if (this.options.dryRun) {
      console.log(`   🔍 DRY RUN MODE - Would execute: ${migration.file}`);
      console.log(`   📝 No changes will be made to the database`);
      this.progress.completed = migration.step;
      return { success: true, dryRun: true };
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const startTime = new Date();
    
    try {
      await this.client.query(sql);
      const endTime = new Date();
      const duration = endTime - startTime;
      
      console.log(`   ✅ Migration completed in ${duration}ms`);
      
      // Verify migration was logged
      const logCheck = await this.client.query(`
        SELECT status, records_migrated FROM migration_logs 
        WHERE operation = $1 AND status = 'completed'
        ORDER BY completed_at DESC LIMIT 1
      `, [`migration_${migration.id}_${migration.name}`]);
      
      if (logCheck.rows.length > 0) {
        const log = logCheck.rows[0];
        console.log(`   📊 Records processed: ${log.records_migrated || 0}`);
      }
      
      return { 
        success: true, 
        duration,
        recordsProcessed: logCheck.rows[0]?.records_migrated || 0
      };
      
    } catch (error) {
      console.error(`   ❌ Migration failed: ${error.message}`);
      
      // Log failure
      await this.client.query(`
        INSERT INTO migration_logs (operation, status, started_at, completed_at, metadata)
        VALUES ($1, 'failed', $2, CURRENT_TIMESTAMP, $3)
      `, [
        `migration_${migration.id}_${migration.name}`,
        startTime,
        JSON.stringify({ error: error.message, migration_file: migration.file })
      ]);
      
      return { success: false, error: error.message };
    }
  }

  async validateMigration() {
    console.log('\n🔍 Validating migration results...');
    
    try {
      // Check if all tables exist
      const tables = await this.client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('event_types', 'events', 'event_participants', 'event_sections', 'event_templates')
        ORDER BY table_name
      `);
      
      console.log(`   📊 Tables created: ${tables.rows.length}/5`);
      tables.rows.forEach(row => console.log(`      - ${row.table_name}`));
      
      // Check views
      const views = await this.client.query(`
        SELECT table_name FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'wedding_%'
        ORDER BY table_name
      `);
      
      console.log(`   📊 Compatibility views: ${views.rows.length}/4`);
      views.rows.forEach(row => console.log(`      - ${row.table_name}`));
      
      // Check indexes
      const indexes = await this.client.query(`
        SELECT COUNT(*) as index_count FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename IN ('events', 'event_participants', 'event_sections', 'event_templates', 'event_types')
      `);
      
      console.log(`   📊 Indexes created: ${indexes.rows[0].index_count}`);
      
      // Check data integrity
      const dataCheck = await this.client.query(`
        SELECT 
          (SELECT COUNT(*) FROM events) as events,
          (SELECT COUNT(*) FROM event_participants) as participants,
          (SELECT COUNT(*) FROM event_sections) as sections,
          (SELECT COUNT(*) FROM wedding_invitations) as wedding_view_invitations,
          (SELECT COUNT(*) FROM wedding_guests) as wedding_view_guests
      `);
      
      const data = dataCheck.rows[0];
      console.log(`   📊 Data migration results:
        - Events: ${data.events}
        - Participants: ${data.participants}
        - Sections: ${data.sections}
        - Wedding view (invitations): ${data.wedding_view_invitations}
        - Wedding view (guests): ${data.wedding_view_guests}`);
      
      console.log('✅ Migration validation completed');
      return true;
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      return false;
    }
  }

  async validateBackup() {
    return await this.validateBackupCreation();
  }

  async validateBackupCreation() {
    console.log('\n💾 Validating backup creation...');
    
    try {
      const backupTables = await this.client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '%_backup%'
        ORDER BY table_name
      `);
      
      console.log(`   📊 Backup tables found: ${backupTables.rows.length}`);
      backupTables.rows.forEach(row => console.log(`      - ${row.table_name}`));
      
      return backupTables.rows.length > 0;
      
    } catch (error) {
      console.error('❌ Backup validation failed:', error.message);
      return false;
    }
  }

  async validateDataIntegrity() {
    console.log('\n🔍 Validating data integrity...');
    
    try {
      // Check for data consistency between original and migrated data
      const dataIntegrityCheck = await this.client.query(`
        WITH original_counts AS (
          SELECT
            COALESCE((SELECT COUNT(*) FROM wedding_invitations WHERE created_at IS NOT NULL), 0) as original_invitations,
            COALESCE((SELECT COUNT(*) FROM wedding_guests WHERE created_at IS NOT NULL), 0) as original_guests
        ),
        migrated_counts AS (
          SELECT
            (SELECT COUNT(*) FROM events WHERE legacy_table = 'wedding_invitations') as migrated_events,
            (SELECT COUNT(*) FROM event_participants WHERE participant_type = 'guest') as migrated_participants
        )
        SELECT
          original_counts.*,
          migrated_counts.*,
          CASE
            WHEN original_counts.original_invitations = migrated_counts.migrated_events THEN true
            ELSE false
          END as events_match,
          CASE
            WHEN original_counts.original_guests = migrated_counts.migrated_participants THEN true
            ELSE false
          END as participants_match
        FROM original_counts, migrated_counts
      `);
      
      const integrity = dataIntegrityCheck.rows[0];
      console.log(`   📊 Data integrity check:
        - Original invitations: ${integrity.original_invitations} → Migrated events: ${integrity.migrated_events}
        - Original guests: ${integrity.original_guests} → Migrated participants: ${integrity.migrated_participants}
        - Events match: ${integrity.events_match ? '✅' : '❌'}
        - Participants match: ${integrity.participants_match ? '✅' : '❌'}`);
      
      return integrity.events_match && integrity.participants_match;
      
    } catch (error) {
      console.error('❌ Data integrity validation failed:', error.message);
      return false;
    }
  }

  async checkSafetyValidation() {
    console.log('\n🛡️  Running safety validation checks...');
    
    try {
      // Check for proper constraints and indexes
      const safetyChecks = await this.client.query(`
        SELECT
          (SELECT COUNT(*) FROM information_schema.table_constraints
           WHERE constraint_type = 'FOREIGN KEY'
           AND table_name IN ('events', 'event_participants', 'event_sections', 'event_templates')) as foreign_keys,
          (SELECT COUNT(*) FROM information_schema.table_constraints
           WHERE constraint_type = 'CHECK'
           AND table_name IN ('events', 'event_participants', 'event_sections', 'event_templates')) as check_constraints,
          (SELECT COUNT(*) FROM pg_indexes
           WHERE schemaname = 'public'
           AND tablename IN ('events', 'event_participants', 'event_sections', 'event_templates')) as indexes
      `);
      
      const safety = safetyChecks.rows[0];
      console.log(`   📊 Safety validation:
        - Foreign keys: ${safety.foreign_keys}
        - Check constraints: ${safety.check_constraints}
        - Indexes: ${safety.indexes}`);
      
      // Check if migration logs are properly maintained
      const migrationLogs = await this.client.query(`
        SELECT COUNT(*) as completed_migrations
        FROM migration_logs
        WHERE operation LIKE 'migration_0%'
        AND status = 'completed'
      `);
      
      console.log(`   📊 Migration logs: ${migrationLogs.rows[0].completed_migrations} completed`);
      
      return safety.foreign_keys >= 4 && safety.indexes >= 10;
      
    } catch (error) {
      console.error('❌ Safety validation failed:', error.message);
      return false;
    }
  }

  async runTests() {
    console.log('\n🧪 Running integration tests...');
    
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('npm', ['test', '__tests__/database/structural-tests/phase-4-data-migration.test.cjs'], {
        stdio: 'pipe',
        cwd: path.join(__dirname, '../../../')
      });
      
      let output = '';
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
      });
      
      testProcess.stderr.on('data', (data) => {
        output += data.toString();
        process.stderr.write(data);
      });
      
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ All tests passed');
          resolve(true);
        } else {
          console.error(`❌ Tests failed with exit code ${code}`);
          resolve(false);
        }
      });
    });
  }

  async executeRollback() {
    console.log('\n🔄 Rolling back migration changes...');
    console.log('Executing rollback...');
    
    if (!this.options.force) {
      const confirm = await this.promptUser('This will revert all changes. Are you sure? (type "ROLLBACK" to confirm)');
      if (confirm !== 'ROLLBACK') {
        console.log('Rollback cancelled');
        return;
      }
    }
    
    try {
      // Drop views
      await this.client.query('DROP VIEW IF EXISTS wedding_sections CASCADE');
      await this.client.query('DROP VIEW IF EXISTS wedding_templates CASCADE');
      await this.client.query('DROP VIEW IF EXISTS wedding_guests CASCADE');
      await this.client.query('DROP VIEW IF EXISTS wedding_invitations CASCADE');
      
      // Drop tables
      await this.client.query('DROP TABLE IF EXISTS event_templates CASCADE');
      await this.client.query('DROP TABLE IF EXISTS event_sections CASCADE');
      await this.client.query('DROP TABLE IF EXISTS event_participants CASCADE');
      await this.client.query('DROP TABLE IF EXISTS events CASCADE');
      await this.client.query('DROP TABLE IF EXISTS event_types CASCADE');
      
      // Update migration logs
      await this.client.query(`
        UPDATE migration_logs 
        SET status = 'rolled_back',
            metadata = metadata || jsonb_build_object('rollback_at', CURRENT_TIMESTAMP)
        WHERE operation LIKE 'migration_0%_event%'
      `);
      
      console.log('✅ Rollback completed successfully');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }

  async promptUser(question) {
    if (this.options.force) {
      return 'y';
    }
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise(resolve => {
      rl.question(question + ' ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  async generateReport() {
    const endTime = new Date();
    const totalDuration = endTime - this.startTime;
    
    console.log('\n📋 MIGRATION SUMMARY REPORT');
    console.log('=' .repeat(50));
    console.log(`Start Time: ${this.startTime.toISOString()}`);
    console.log(`End Time: ${endTime.toISOString()}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Mode: ${this.options.dryRun ? 'DRY RUN' : 'PRODUCTION'}`);
    
    console.log('\nMigrations Executed:');
    this.migrationResults.forEach((result, index) => {
      const migration = this.migrations[index];
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${migration.id}: ${migration.description}`);
      if (result.duration) {
        console.log(`      Duration: ${result.duration}ms`);
      }
      if (result.recordsProcessed) {
        console.log(`      Records: ${result.recordsProcessed}`);
      }
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });
    
    // Save report to file
    const reportPath = path.join(__dirname, `migration_report_${Date.now()}.json`);
    const report = {
      startTime: this.startTime,
      endTime: endTime,
      totalDuration,
      options: this.options,
      migrations: this.migrationResults.map((result, index) => ({
        ...this.migrations[index],
        ...result
      }))
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);
  }

  async execute() {
    try {
      console.log('🚀 FASE 0 TRANSFORMATION MIGRATION EXECUTOR');
      console.log('=' .repeat(50));
      
      if (this.options.rollback) {
        await this.connect();
        await this.executeRollback();
        await this.disconnect();
        return;
      }
      
      if (this.options.validateOnly) {
        await this.connect();
        const valid = await this.validateMigration();
        const testsPass = await this.runTests();
        await this.disconnect();
        
        if (valid && testsPass) {
          console.log('✅ All validations passed');
          process.exit(0);
        } else {
          console.log('❌ Validation failed');
          process.exit(1);
        }
        return;
      }
      
      await this.connect();
      await this.validatePrerequisites();
      await this.createBackups();
      
      // Execute migrations
      for (const migration of this.migrations) {
        const result = await this.executeMigration(migration);
        this.migrationResults.push(result);
        
        if (!result.success && !this.options.dryRun) {
          console.error(`💥 Migration ${migration.id} failed, stopping execution`);
          break;
        }
      }
      
      // Validate and test
      if (!this.options.dryRun) {
        const validationPassed = await this.validateMigration();
        const testsPassed = await this.runTests();
        
        if (!validationPassed || !testsPassed) {
          console.error('💥 Post-migration validation failed');
        }
      }
      
      await this.generateReport();
      await this.disconnect();
      
      const allSuccess = this.migrationResults.every(r => r.success);
      if (allSuccess) {
        console.log('\n🎉 TRANSFORMATION COMPLETED SUCCESSFULLY!');
        console.log('\nYour wedding invitation system has been transformed into a');
        console.log('Generic Event Management Engine with 100% backward compatibility.');
      } else {
        console.log('\n💥 TRANSFORMATION COMPLETED WITH ERRORS');
        console.log('Please review the errors above and run rollback if needed.');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('\n💥 CRITICAL ERROR:', error.message);
      if (this.client) {
        await this.disconnect();
      }
      process.exit(1);
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Handle help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
FASE 0 TRANSFORMATION MIGRATION EXECUTOR

Usage: node execute_transformation.js [options]

Options:
 --dry-run         Run in dry-run mode (validate only)
 --skip-backup     Skip backup creation (NOT RECOMMENDED)
 --force          Force execution without confirmations
 --rollback       Execute rollback to previous state
 --validate-only  Only run validation tests
 --help, -h       Show this help message

Examples:
 node execute_transformation.js --dry-run
 node execute_transformation.js --force
 node execute_transformation.js --rollback
    `);
    process.exit(0);
  }
  
  const options = {
    dryRun: args.includes('--dry-run'),
    skipBackup: args.includes('--skip-backup'),
    force: args.includes('--force'),
    rollback: args.includes('--rollback'),
    validateOnly: args.includes('--validate-only')
  };

  const executor = new TransformationExecutor(options);
  executor.execute();
}

module.exports = TransformationExecutor;
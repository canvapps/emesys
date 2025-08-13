import { DatabaseConnection } from './connection';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export class MigrationRunner {
  constructor(private db: DatabaseConnection) {}

  async runMigration(migrationFile: string): Promise<void> {
    try {
      const migrationPath = join(process.cwd(), 'database/migrations', migrationFile);
      const migrationSQL = readFileSync(migrationPath, 'utf8');
      
      // Split migration by semicolon and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        if (statement.trim().length > 0) {
          await this.db.query(statement);
        }
      }

      console.log(`✅ Migration ${migrationFile} completed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${migrationFile} failed:`, error);
      throw error;
    }
  }

  async runAllMigrations(): Promise<void> {
    const migrations = [
      // Phase 2.2: Generic Event Management Database Transformation
      '202501_create_event_participants.sql',
      '202501_create_event_content.sql',
      '202501_create_event_sections.sql',
      '202501_create_event_stories.sql',
      '202501_migrate_wedding_to_event_data.sql',
      '202501_create_backward_compatibility_views.sql'
    ];

    console.log('🚀 Starting Generic Event Management Database Transformation...');
    console.log(`📋 Running ${migrations.length} migrations...`);

    for (const migration of migrations) {
      await this.runMigration(migration);
    }
  }

  async runGenericTransformation(): Promise<void> {
    console.log('🎯 PHASE 2.2: Database Table Transformation');
    console.log('🔄 Converting wedding-specific tables to generic event tables...');
    await this.runAllMigrations();
    console.log('✅ Generic Event Management Database ready!');
  }
}

// CLI runner for migrations
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const db = new DatabaseConnection();

    try {
      await db.connect();
      const runner = new MigrationRunner(db);
      
      // Run generic transformation
      await runner.runGenericTransformation();
      
      console.log('🎉 Generic Event Management Database transformation completed successfully!');
      console.log('🔥 Ready to handle: wedding, conference, birthday, corporate events and more!');
    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    } finally {
      await db.close();
    }
  }

  main();
}
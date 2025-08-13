/**
 * Enhanced Database Migration System
 * Enterprise-grade migration management dengan rollback, checksums, dan dependencies
 */

import { DatabaseConnection } from './connection';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { createHash } from 'crypto';

export interface MigrationRecord {
    id: number;
    filename: string;
    executed_at: Date;
    checksum: string;
    execution_time_ms: number;
    rollback_sql?: string;
    version: string;
}

export interface MigrationFile {
    filename: string;
    version: string;
    name: string;
    sql: string;
    checksum: string;
    rollback_sql?: string;
    dependencies?: string[];
}

export interface MigrationResult {
    success: boolean;
    executed: string[];
    skipped: string[];
    failed?: string;
    totalTime: number;
    error?: Error;
}

export interface SeederResult {
    success: boolean;
    executed: string[];
    skipped: string[];
    failed?: string;
    error?: Error;
}

export class EnhancedMigrationSystem {
    private db: DatabaseConnection;
    private migrationsDir: string;
    private seedersDir: string;

    constructor(db: DatabaseConnection) {
        this.db = db;
        this.migrationsDir = join(process.cwd(), 'src/database/migrations');
        this.seedersDir = join(process.cwd(), 'src/database/seeders');
    }

    /**
     * Initialize migration system dengan enhanced migrations table
     */
    async initializeMigrationSystem(): Promise<void> {
        await this.db.query(`
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

        // Create seeders tracking table
        await this.db.query(`
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

    /**
     * Parse migration file untuk extract metadata
     */
    parseMigrationFile(filename: string): MigrationFile {
        const filePath = join(this.migrationsDir, filename);
        const content = readFileSync(filePath, 'utf8');
        
        // Extract version dari filename (e.g., 001_create_table.sql -> 001)
        const versionMatch = filename.match(/^(\d+)_(.+)\.sql$/);
        if (!versionMatch) {
            throw new Error(`Invalid migration filename format: ${filename}`);
        }
        
        const version = versionMatch[1];
        const name = versionMatch[2].replace(/_/g, ' ');
        
        // Calculate checksum
        const checksum = createHash('sha256').update(content).digest('hex');
        
        // Extract rollback SQL jika ada
        let sql = content;
        let rollback_sql: string | undefined;
        
        const rollbackMatch = content.match(/-- ROLLBACK:(.*?)(?=-- |\Z)/s);
        if (rollbackMatch) {
            rollback_sql = rollbackMatch[1].trim();
            sql = content.replace(/-- ROLLBACK:.*$/s, '').trim();
        }
        
        // Extract dependencies jika ada
        const dependencyMatch = content.match(/-- DEPENDS ON: (.*)/);
        const dependencies = dependencyMatch 
            ? dependencyMatch[1].split(',').map(d => d.trim())
            : undefined;

        return {
            filename,
            version,
            name,
            sql,
            checksum,
            rollback_sql,
            dependencies
        };
    }

    /**
     * Get all available migration files
     */
    getAvailableMigrations(): MigrationFile[] {
        if (!existsSync(this.migrationsDir)) {
            return [];
        }

        const files = readdirSync(this.migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        return files.map(file => this.parseMigrationFile(file));
    }

    /**
     * Get executed migrations dari database
     */
    async getExecutedMigrations(): Promise<MigrationRecord[]> {
        try {
            const result = await this.db.query(`
                SELECT 
                    id, filename, version, executed_at, checksum, 
                    execution_time_ms, rollback_sql
                FROM migrations 
                ORDER BY version ASC, executed_at ASC
            `);
            
            return result.rows;
        } catch (error) {
            // Jika table belum exist, return empty array
            if (error.code === '42P01') {
                return [];
            }
            throw error;
        }
    }

    /**
     * Check migration dependencies
     */
    async validateDependencies(migration: MigrationFile, executed: MigrationRecord[]): Promise<boolean> {
        if (!migration.dependencies || migration.dependencies.length === 0) {
            return true;
        }

        const executedVersions = executed.map(m => m.version);
        
        for (const dep of migration.dependencies) {
            if (!executedVersions.includes(dep)) {
                throw new Error(`Migration ${migration.filename} depends on ${dep} which hasn't been executed`);
            }
        }
        
        return true;
    }

    /**
     * Execute single migration dengan transaction
     */
    async executeMigration(migration: MigrationFile): Promise<number> {
        const startTime = Date.now();
        
        try {
            // Begin transaction
            await this.db.query('BEGIN');
            
            // Execute migration SQL
            await this.db.query(migration.sql);
            
            // Record migration
            await this.db.query(`
                INSERT INTO migrations (
                    filename, version, name, checksum, execution_time_ms, rollback_sql
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                migration.filename,
                migration.version,
                migration.name,
                migration.checksum,
                Date.now() - startTime,
                migration.rollback_sql || null
            ]);
            
            // Commit transaction
            await this.db.query('COMMIT');
            
            return Date.now() - startTime;
            
        } catch (error) {
            await this.db.query('ROLLBACK');
            throw error;
        }
    }

    /**
     * Run all pending migrations
     */
    async runMigrations(): Promise<MigrationResult> {
        const startTime = Date.now();
        const result: MigrationResult = {
            success: false,
            executed: [],
            skipped: [],
            totalTime: 0
        };

        try {
            await this.initializeMigrationSystem();
            
            const available = this.getAvailableMigrations();
            const executed = await this.getExecutedMigrations();
            const executedFiles = executed.map(m => m.filename);
            
            console.log(`📋 Found ${available.length} migration files`);
            console.log(`📋 ${executed.length} migrations already executed`);

            for (const migration of available) {
                if (executedFiles.includes(migration.filename)) {
                    // Verify checksum
                    const existingMigration = executed.find(m => m.filename === migration.filename);
                    if (existingMigration && existingMigration.checksum !== migration.checksum) {
                        throw new Error(`Migration ${migration.filename} has been modified (checksum mismatch)`);
                    }
                    
                    result.skipped.push(migration.filename);
                    console.log(`⏩ Skipping ${migration.filename} (already executed)`);
                    continue;
                }

                // Validate dependencies
                await this.validateDependencies(migration, executed);
                
                console.log(`⏳ Running migration: ${migration.filename}`);
                
                const executionTime = await this.executeMigration(migration);
                result.executed.push(migration.filename);
                
                console.log(`✅ Migration completed: ${migration.filename} (${executionTime}ms)`);
            }

            result.success = true;
            result.totalTime = Date.now() - startTime;
            
            console.log(`🎉 All migrations completed in ${result.totalTime}ms`);
            
        } catch (error) {
            result.success = false;
            result.error = error;
            result.failed = result.executed[result.executed.length - 1] || 'unknown';
            result.totalTime = Date.now() - startTime;
            
            console.error(`❌ Migration failed: ${error.message}`);
        }

        return result;
    }

    /**
     * Rollback specific migration
     */
    async rollbackMigration(filename: string): Promise<boolean> {
        try {
            const executed = await this.getExecutedMigrations();
            const migration = executed.find(m => m.filename === filename);
            
            if (!migration) {
                throw new Error(`Migration ${filename} has not been executed`);
            }
            
            if (!migration.rollback_sql) {
                throw new Error(`Migration ${filename} does not have rollback SQL`);
            }

            console.log(`⏳ Rolling back migration: ${filename}`);
            
            // Begin transaction
            await this.db.query('BEGIN');
            
            // Execute rollback SQL
            await this.db.query(migration.rollback_sql);
            
            // Remove migration record
            await this.db.query('DELETE FROM migrations WHERE filename = $1', [filename]);
            
            // Commit transaction
            await this.db.query('COMMIT');
            
            console.log(`✅ Migration rolled back: ${filename}`);
            return true;
            
        } catch (error) {
            await this.db.query('ROLLBACK');
            console.error(`❌ Rollback failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get migration status dan statistics
     */
    async getMigrationStatus(): Promise<{
        total: number;
        executed: number;
        pending: number;
        migrations: Array<{
            filename: string;
            version: string;
            status: 'executed' | 'pending';
            executed_at?: Date;
            execution_time_ms?: number;
        }>;
    }> {
        const available = this.getAvailableMigrations();
        const executed = await this.getExecutedMigrations();
        const executedFiles = executed.map(m => m.filename);
        
        const migrations = available.map(migration => {
            const executedMigration = executed.find(m => m.filename === migration.filename);
            const isExecuted = executedFiles.includes(migration.filename);
            
            return {
                filename: migration.filename,
                version: migration.version,
                status: (isExecuted ? 'executed' : 'pending') as 'executed' | 'pending',
                executed_at: executedMigration?.executed_at,
                execution_time_ms: executedMigration?.execution_time_ms
            };
        });
        
        return {
            total: available.length,
            executed: executed.length,
            pending: available.length - executed.length,
            migrations
        };
    }

    /**
     * Run seeders untuk populate initial data
     */
    async runSeeders(environment: string = 'development'): Promise<SeederResult> {
        const result: SeederResult = {
            success: false,
            executed: [],
            skipped: []
        };

        try {
            if (!existsSync(this.seedersDir)) {
                console.log('📂 No seeders directory found, skipping seeders');
                result.success = true;
                return result;
            }

            const seederFiles = readdirSync(this.seedersDir)
                .filter(file => file.endsWith('.sql'))
                .sort();

            if (seederFiles.length === 0) {
                console.log('📂 No seeder files found');
                result.success = true;
                return result;
            }

            // Get executed seeders
            const executedResult = await this.db.query(
                'SELECT filename FROM seeders WHERE environment = $1',
                [environment]
            );
            const executedSeeders = executedResult.rows.map(row => row.filename);

            console.log(`🌱 Found ${seederFiles.length} seeder files for ${environment}`);

            for (const filename of seederFiles) {
                if (executedSeeders.includes(filename)) {
                    result.skipped.push(filename);
                    console.log(`⏩ Skipping ${filename} (already executed)`);
                    continue;
                }

                console.log(`⏳ Running seeder: ${filename}`);

                const filePath = join(this.seedersDir, filename);
                const content = readFileSync(filePath, 'utf8');
                const checksum = createHash('sha256').update(content).digest('hex');
                const startTime = Date.now();

                try {
                    // Begin transaction
                    await this.db.query('BEGIN');
                    
                    // Execute seeder
                    await this.db.query(content);
                    
                    // Record seeder execution
                    await this.db.query(`
                        INSERT INTO seeders (filename, checksum, execution_time_ms, environment) 
                        VALUES ($1, $2, $3, $4)
                    `, [filename, checksum, Date.now() - startTime, environment]);
                    
                    // Commit transaction
                    await this.db.query('COMMIT');
                    
                    result.executed.push(filename);
                    console.log(`✅ Seeder completed: ${filename}`);
                    
                } catch (error) {
                    await this.db.query('ROLLBACK');
                    throw error;
                }
            }

            result.success = true;
            console.log(`🎉 All seeders completed successfully`);
            
        } catch (error) {
            result.success = false;
            result.error = error;
            result.failed = result.executed[result.executed.length - 1] || 'unknown';
            
            console.error(`❌ Seeder failed: ${error.message}`);
        }

        return result;
    }

    /**
     * Create new migration file template
     */
    async createMigration(name: string, withRollback: boolean = true): Promise<string> {
        const version = String(Date.now()).slice(-6); // Use timestamp for version
        const filename = `${version}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
        const filePath = join(this.migrationsDir, filename);
        
        const template = `-- Migration: ${name}
-- Version: ${version}
-- Created: ${new Date().toISOString().split('T')[0]}

-- Add your migration SQL here
${withRollback ? `

-- ROLLBACK:
-- Add your rollback SQL here (optional)
-- DROP TABLE IF EXISTS example_table;
` : ''}`;

        // Ensure migrations directory exists
        const { mkdirSync } = await import('fs');
        mkdirSync(this.migrationsDir, { recursive: true });
        
        // Write template file
        const { writeFileSync } = await import('fs');
        writeFileSync(filePath, template);
        
        console.log(`✅ Migration template created: ${filename}`);
        return filename;
    }
}

// CLI utilities
export async function createMigrationCLI(name: string): Promise<void> {
    const db = new DatabaseConnection();
    const migrator = new EnhancedMigrationSystem(db);
    
    try {
        const filename = await migrator.createMigration(name);
        console.log(`📝 Created migration: ${filename}`);
    } catch (error) {
        console.error('❌ Failed to create migration:', error);
        process.exit(1);
    }
}

export async function runMigrationsCLI(): Promise<void> {
    const db = new DatabaseConnection();
    
    try {
        await db.connect();
        const migrator = new EnhancedMigrationSystem(db);
        const result = await migrator.runMigrations();
        
        if (!result.success) {
            console.error(`❌ Migration failed: ${result.error?.message}`);
            process.exit(1);
        }
        
        console.log(`✅ Executed ${result.executed.length} migrations`);
        console.log(`⏩ Skipped ${result.skipped.length} migrations`);
        
    } catch (error) {
        console.error('❌ Migration system failed:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

export async function runSeedersCLI(environment: string = 'development'): Promise<void> {
    const db = new DatabaseConnection();
    
    try {
        await db.connect();
        const migrator = new EnhancedMigrationSystem(db);
        const result = await migrator.runSeeders(environment);
        
        if (!result.success) {
            console.error(`❌ Seeders failed: ${result.error?.message}`);
            process.exit(1);
        }
        
        console.log(`✅ Executed ${result.executed.length} seeders`);
        console.log(`⏩ Skipped ${result.skipped.length} seeders`);
        
    } catch (error) {
        console.error('❌ Seeder system failed:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}